'use strict';
const { sample, shuffle, defaultRng } = require('../lib/crypto');
const { THEMES, QUESTIONS_PER_ATTEMPT, tierForScore } = require('../lib/tiers');
const { HttpError } = require('../lib/http');
const { getSettings, campaignState } = require('../lib/settings');
const { track, raiseAlert } = require('./events');
const rewards = require('./rewards');
const mailer = require('./mailer');

const pickText = (obj, lang) => (obj && (obj[lang] || obj.en)) || '';

// Balanced random assignment: pick uniformly among the themes with the fewest attempts so far.
// A transaction-scoped advisory lock serialises concurrent starts so the counts stay accurate.
const assignTheme = async (t, rng = defaultRng) => {
  await t.query(`SELECT pg_advisory_xact_lock(hashtext('quiz_theme_assignment'))`);
  const r = await t.query('SELECT theme, count(*)::int AS n FROM quiz.attempts GROUP BY theme');
  const counts = Object.fromEntries(THEMES.map((th) => [th, 0]));
  r.rows.forEach((x) => { counts[x.theme] = x.n; });
  const min = Math.min(...Object.values(counts));
  const candidates = THEMES.filter((th) => counts[th] === min);
  return candidates[rng(candidates.length)];
};

const requireWritable = async (ctx, { allowAfterClose }) => {
  const s = await getSettings(ctx.db);
  const state = campaignState(s, ctx.now());
  if (state === 'disabled') throw new HttpError(403, 'campaign_unavailable', { state });
  if (!allowAfterClose && state !== 'open') throw new HttpError(403, 'campaign_unavailable', { state });
  return s;
};

// Starts the participant's single attempt. Idempotent: repeated/concurrent calls return the same attempt.
const startAttempt = async (ctx, participant) => {
  await requireWritable(ctx, { allowAfterClose: false });
  const rng = ctx.rng || defaultRng;
  const created = await ctx.db.tx(async (t) => {
    await t.query('SELECT id FROM quiz.participants WHERE id=$1 FOR UPDATE', [participant.id]);
    const ex = await t.query('SELECT id FROM quiz.attempts WHERE participant_id=$1', [participant.id]);
    if (ex.rowCount) return false;
    const theme = await assignTheme(t, rng);
    const qs = (await t.query(`SELECT * FROM quiz.questions WHERE theme=$1 AND active ORDER BY id`, [theme])).rows;
    if (qs.length < QUESTIONS_PER_ATTEMPT) throw new HttpError(503, 'question_bank_incomplete');
    const chosen = sample(qs, QUESTIONS_PER_ATTEMPT, rng);   // without replacement
    const a = (await t.query(`INSERT INTO quiz.attempts (participant_id, theme) VALUES ($1,$2) RETURNING id`, [participant.id, theme])).rows[0];
    for (let i = 0; i < chosen.length; i++) {
      const q = chosen[i];
      const ids = q.content.options.map((o) => o.id);
      const order = q.shuffle_options ? shuffle(ids, rng) : ids;
      await t.query(
        `INSERT INTO quiz.attempt_questions (attempt_id, position, question_id, question_version, content_snapshot, option_order, correct_option_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [a.id, i, q.id, q.version, JSON.stringify(q.content), JSON.stringify(order), q.correct_option_id]);
    }
    await track(t, { anonId: participant.anon_id, name: 'quiz_started', theme, language: participant.language, attribution: participant.attribution });
    return true;
  });
  return created;
};

// What the browser may see. Never includes correct_option_id, never includes any code.
const getState = async (ctx, participant, lang) => {
  const settings = await getSettings(ctx.db);
  const campaign = {
    state: campaignState(settings, ctx.now()), opensAt: settings.opens_at, closesAt: settings.closes_at, codeExpiresAt: settings.code_expires_at,
  };
  const attempt = (await ctx.db.query('SELECT * FROM quiz.attempts WHERE participant_id=$1', [participant.id])).rows[0];
  const base = { campaign, participant: { language: participant.language }, status: 'verified', theme: null, progress: { answered: 0, total: QUESTIONS_PER_ATTEMPT }, question: null, result: null };
  if (!attempt) return base;

  const qrows = (await ctx.db.query('SELECT * FROM quiz.attempt_questions WHERE attempt_id=$1 ORDER BY position', [attempt.id])).rows;
  const answered = qrows.filter((q) => q.selected_option_id).length;
  const out = { ...base, status: attempt.status === 'completed' ? 'completed' : 'in_progress', theme: attempt.theme, progress: { answered, total: QUESTIONS_PER_ATTEMPT } };

  if (attempt.status === 'in_progress') {
    const cur = qrows.find((q) => !q.selected_option_id);
    if (cur) {
      const first = await ctx.db.query(
        'UPDATE quiz.attempt_questions SET shown_at = now() WHERE attempt_id=$1 AND position=$2 AND shown_at IS NULL RETURNING position', [attempt.id, cur.position]);
      if (first.rowCount) {
        await track(ctx.db, { anonId: participant.anon_id, name: 'question_viewed', theme: attempt.theme, language: lang, questionId: cur.question_id, props: { position: cur.position }, attribution: participant.attribution });
      }
      const byId = Object.fromEntries(cur.content_snapshot.options.map((o) => [o.id, o]));
      out.question = {
        id: cur.question_id, position: cur.position, total: QUESTIONS_PER_ATTEMPT,
        prompt: pickText(cur.content_snapshot.prompt, lang),
        options: cur.option_order.map((id) => ({ id, text: pickText(byId[id].text, lang) })),
      };
    }
    return out;
  }

  const rw = (await ctx.db.query('SELECT status, tier FROM quiz.rewards WHERE participant_id=$1', [participant.id])).rows[0];
  const em = (await ctx.db.query(`SELECT status FROM quiz.email_outbox WHERE participant_id=$1 AND kind='reward' ORDER BY created_at DESC LIMIT 1`, [participant.id])).rows[0];
  out.result = {
    score: attempt.score, total: QUESTIONS_PER_ATTEMPT, tier: attempt.tier,
    reward: rw ? rw.status : null,                           // 'issued' | 'pending_inventory'  (never the code)
    email: em ? em.status : (rw && rw.status === 'pending_inventory' ? 'waiting_for_inventory' : 'none'),
  };
  if (settings.show_review_after_completion) {
    out.result.review = qrows.map((q) => ({
      questionId: q.question_id, prompt: pickText(q.content_snapshot.prompt, lang),
      selected: q.selected_option_id, correct: q.correct_option_id, wasCorrect: q.selected_option_id === q.correct_option_id,
      explanation: pickText(q.content_snapshot.explanation, lang),
      options: q.content_snapshot.options.map((o) => ({ id: o.id, text: pickText(o.text, lang) })),
    }));
  }
  return out;
};

// Locks the answer server-side. Responds with next-question/completion only - never with correctness.
const submitAnswer = async (ctx, participant, { questionId, optionId, lang }) => {
  await requireWritable(ctx, { allowAfterClose: true });
  const done = await ctx.db.tx(async (t) => {
    const a = (await t.query('SELECT * FROM quiz.attempts WHERE participant_id=$1 FOR UPDATE', [participant.id])).rows[0];
    if (!a) throw new HttpError(409, 'not_started');
    const qrows = (await t.query('SELECT * FROM quiz.attempt_questions WHERE attempt_id=$1 ORDER BY position', [a.id])).rows;
    const target = qrows.find((q) => q.question_id === questionId);
    if (!target) throw new HttpError(400, 'unknown_question');
    if (target.selected_option_id) {
      // Replay of an already-locked answer (double click, retry): same answer is a no-op; a different one is refused.
      if (target.selected_option_id === optionId) return { replay: true };
      throw new HttpError(409, 'already_answered');
    }
    const current = qrows.find((q) => !q.selected_option_id);
    if (current.question_id !== questionId) throw new HttpError(409, 'out_of_order');
    if (!target.option_order.includes(optionId)) throw new HttpError(400, 'invalid_option');

    const duration = target.shown_at ? Math.min(Math.max(Date.now() - new Date(target.shown_at).getTime(), 0), 600_000) : null;
    await t.query(
      `UPDATE quiz.attempt_questions SET selected_option_id=$3, answered_at=now(), duration_ms=$4 WHERE attempt_id=$1 AND position=$2`,
      [a.id, target.position, optionId, duration]);
    await track(t, { anonId: participant.anon_id, name: 'answer_submitted', theme: a.theme, language: lang, questionId, props: { position: target.position, duration_ms: duration }, attribution: participant.attribution });

    const isLast = qrows.filter((q) => !q.selected_option_id).length === 1;
    if (!isLast) return { completed: false };

    // Final answer: score on the server from the snapshotted key, then issue the reward - all in this transaction.
    const score = qrows.reduce((n, q) => n + ((q.position === target.position ? optionId : q.selected_option_id) === q.correct_option_id ? 1 : 0), 0);
    const tier = tierForScore(score);
    await t.query(`UPDATE quiz.attempts SET status='completed', completed_at=now(), score=$2, tier=$3 WHERE id=$1`, [a.id, score, tier]);
    await track(t, { anonId: participant.anon_id, name: 'quiz_completed', theme: a.theme, language: lang, tier, attribution: participant.attribution });
    await track(t, { anonId: participant.anon_id, name: 'discount_earned', theme: a.theme, language: lang, tier, attribution: participant.attribution });
    const { reward, created } = await rewards.issueReward(t, { participantId: participant.id, attemptId: a.id, tier });
    let outboxId = null;
    if (reward.status === 'issued') {
      outboxId = await mailer.queue(t, { participantId: participant.id, kind: 'reward', language: participant.language, key: `reward:${participant.id}` });
      if (created) await track(t, { anonId: participant.anon_id, name: 'reward_issued', theme: a.theme, language: lang, tier, attribution: participant.attribution });
    } else if (created) {
      await track(t, { anonId: participant.anon_id, name: 'reward_pending_inventory', theme: a.theme, language: lang, tier, attribution: participant.attribution });
    }
    return { completed: true, outboxId, pending: reward.status !== 'issued', tier };
  });

  if (done.completed) {
    if (done.pending) await raiseAlert(ctx, `inventory_depleted_${done.tier}`, { tier: done.tier, note: 'earned reward preserved; will be issued on import' });
    if (done.outboxId) await mailer.deliverReward(ctx, done.outboxId);
    await rewards.checkInventory(ctx);
  }
  return getState(ctx, participant, lang);
};

module.exports = { startAttempt, getState, submitAnswer, assignTheme, requireWritable };
