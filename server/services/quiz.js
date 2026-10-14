'use strict';
const { sample, shuffle, defaultRng } = require('../lib/crypto');
const { THEMES, QUESTIONS_PER_ATTEMPT, tierForScore } = require('../lib/tiers');
const { HttpError } = require('../lib/http');
const { getSettings, campaignState } = require('../lib/settings');
const { track } = require('./events');

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

// The attempt this browser is playing or has played: its own session's attempt, or (after verification) the
// participant's attached attempt.
const attemptFor = async (q, session) => {
  const bySession = (await q.query('SELECT * FROM quiz.attempts WHERE session_id = $1', [session.id])).rows[0];
  if (bySession) return bySession;
  if (session.participant_id) return (await q.query('SELECT * FROM quiz.attempts WHERE participant_id = $1', [session.participant_id])).rows[0] || null;
  return null;
};

// Starts this browser's single attempt. Idempotent: repeated/concurrent calls return the same attempt.
const startAttempt = async (ctx, session, lang) => {
  await requireWritable(ctx, { allowAfterClose: false });
  const rng = ctx.rng || defaultRng;
  return ctx.db.tx(async (t) => {
    await t.query('SELECT id FROM quiz.sessions WHERE id = $1 FOR UPDATE', [session.id]);
    if (await attemptFor(t, session)) return false;
    const theme = await assignTheme(t, rng);
    const qs = (await t.query(`SELECT * FROM quiz.questions WHERE theme=$1 AND active ORDER BY id`, [theme])).rows;
    if (qs.length < QUESTIONS_PER_ATTEMPT) throw new HttpError(503, 'question_bank_incomplete');
    const chosen = sample(qs, QUESTIONS_PER_ATTEMPT, rng);   // without replacement
    const a = (await t.query(
      `INSERT INTO quiz.attempts (session_id, participant_id, anon_id, theme) VALUES ($1,$2,$3,$4) RETURNING id`,
      [session.id, session.participant_id || null, session.anon_id, theme])).rows[0];
    for (let i = 0; i < chosen.length; i++) {
      const q = chosen[i];
      const ids = q.content.options.map((o) => o.id);
      const order = q.shuffle_options ? shuffle(ids, rng) : ids;
      await t.query(
        `INSERT INTO quiz.attempt_questions (attempt_id, position, question_id, question_version, content_snapshot, option_order, correct_option_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [a.id, i, q.id, q.version, JSON.stringify(q.content), JSON.stringify(order), q.correct_option_id]);
    }
    await track(t, { anonId: session.anon_id, name: 'quiz_started', theme, language: lang, attribution: session.attribution || {} });
    return true;
  });
};

// What the browser may see. Never includes correct_option_id, never includes any code.
const getState = async (ctx, session, lang) => {
  const settings = await getSettings(ctx.db);
  const campaign = { state: campaignState(settings, ctx.now()), opensAt: settings.opens_at, closesAt: settings.closes_at, codeExpiresAt: settings.code_expires_at, codeValidHours: settings.code_valid_hours };
  const base = { campaign, status: 'idle', theme: null, progress: { answered: 0, total: QUESTIONS_PER_ATTEMPT }, question: null, result: null, participant: null };
  if (!session) return base;
  const attempt = await attemptFor(ctx.db, session);
  if (session.participant_id) base.participant = { language: session.participant_language || session.language, verified: Boolean(session.verified_at) };
  if (!attempt) return base;

  const qrows = (await ctx.db.query('SELECT * FROM quiz.attempt_questions WHERE attempt_id=$1 ORDER BY position', [attempt.id])).rows;
  const answered = qrows.filter((q) => q.selected_option_id).length;
  const out = { ...base, status: attempt.status === 'completed' ? 'completed' : 'in_progress', theme: attempt.theme, progress: { answered, total: QUESTIONS_PER_ATTEMPT } };

  if (attempt.status === 'in_progress') {
    const cur = qrows.find((q) => !q.selected_option_id);
    if (cur) {
      const first = await ctx.db.query(
        'UPDATE quiz.attempt_questions SET shown_at = now() WHERE attempt_id=$1 AND position=$2 AND shown_at IS NULL RETURNING position', [attempt.id, cur.position]);
      if (first.rowCount) await track(ctx.db, { anonId: attempt.anon_id, name: 'question_viewed', theme: attempt.theme, language: lang, questionId: cur.question_id, props: { position: cur.position } });
      const byId = Object.fromEntries(cur.content_snapshot.options.map((o) => [o.id, o]));
      out.question = {
        id: cur.question_id, position: cur.position, total: QUESTIONS_PER_ATTEMPT,
        prompt: pickText(cur.content_snapshot.prompt, lang),
        options: cur.option_order.map((id) => ({ id, text: pickText(byId[id].text, lang) })),
      };
    }
    return out;
  }

  // Completed. The claim state tells the UI which screen to show after the score.
  let claim = 'unclaimed';
  let rw = null; let em = null; let maskedEmail = null;
  if (attempt.participant_id) {
    const p = (await ctx.db.query('SELECT id, email, verified_at FROM quiz.participants WHERE id = $1', [attempt.participant_id])).rows[0];
    if (p) {
      maskedEmail = p.email.replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c);
      rw = (await ctx.db.query('SELECT status, tier, attempt_id, expires_at FROM quiz.rewards WHERE participant_id=$1', [p.id])).rows[0] || null;
      if (!p.verified_at) claim = 'pending_verification';
      else if (rw && rw.attempt_id === attempt.id) claim = 'claimed';
      else if (rw) claim = 'already_played';
      else claim = 'verified_unclaimed';   // transient: verified but claim not yet processed
      if (rw) em = (await ctx.db.query(`SELECT status FROM quiz.email_outbox WHERE participant_id=$1 AND kind='reward' ORDER BY created_at DESC LIMIT 1`, [p.id])).rows[0] || null;
    }
  } else if (session.participant_id && session.verified_at) {
    // This browser belongs to a verified participant whose reward came from another attempt.
    const rw2 = (await ctx.db.query('SELECT 1 FROM quiz.rewards WHERE participant_id=$1', [session.participant_id])).rowCount;
    if (rw2) claim = 'already_played';
  }
  out.result = {
    score: attempt.score, total: QUESTIONS_PER_ATTEMPT, tier: attempt.tier, claim, maskedEmail,
    reward: rw ? rw.status : null,                                            // 'issued' | 'pending_inventory' (never the code)
    codeExpiresAt: rw && rw.expires_at ? new Date(rw.expires_at).toISOString() : null,   // this person's window, if one is set
    email: em ? em.status : (rw && rw.status === 'pending_inventory' ? 'waiting_for_inventory' : 'none'),
  };
  if (settings.show_review_after_completion && claim === 'claimed') {
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
const submitAnswer = async (ctx, session, { questionId, optionId, lang }) => {
  await requireWritable(ctx, { allowAfterClose: true });
  await ctx.db.tx(async (t) => {
    const a = (await t.query('SELECT * FROM quiz.attempts WHERE session_id = $1 FOR UPDATE', [session.id])).rows[0]
      || (session.participant_id ? (await t.query('SELECT * FROM quiz.attempts WHERE participant_id = $1 FOR UPDATE', [session.participant_id])).rows[0] : null);
    if (!a) throw new HttpError(409, 'not_started');
    const qrows = (await t.query('SELECT * FROM quiz.attempt_questions WHERE attempt_id=$1 ORDER BY position', [a.id])).rows;
    const target = qrows.find((q) => q.question_id === questionId);
    if (!target) throw new HttpError(400, 'unknown_question');
    if (target.selected_option_id === optionId) return;        // replay of an already-locked answer (double tap, retry): no-op
    if (a.status === 'completed') throw new HttpError(409, 'already_completed');
    if (target.selected_option_id) throw new HttpError(409, 'already_answered');
    const current = qrows.find((q) => !q.selected_option_id);
    if (current.question_id !== questionId) throw new HttpError(409, 'out_of_order');
    if (!target.option_order.includes(optionId)) throw new HttpError(400, 'invalid_option');

    const duration = target.shown_at ? Math.min(Math.max(Date.now() - new Date(target.shown_at).getTime(), 0), 600_000) : null;
    await t.query(`UPDATE quiz.attempt_questions SET selected_option_id=$3, answered_at=now(), duration_ms=$4 WHERE attempt_id=$1 AND position=$2`,
      [a.id, target.position, optionId, duration]);
    await track(t, { anonId: a.anon_id, name: 'answer_submitted', theme: a.theme, language: lang, questionId, props: { position: target.position, duration_ms: duration } });

    const isLast = qrows.filter((q) => !q.selected_option_id).length === 1;
    if (!isLast) return;
    // Final answer: score on the server from the snapshotted key. The reward is issued later, when an email is verified.
    const score = qrows.reduce((n, q) => n + ((q.position === target.position ? optionId : q.selected_option_id) === q.correct_option_id ? 1 : 0), 0);
    const tier = tierForScore(score);
    await t.query(`UPDATE quiz.attempts SET status='completed', completed_at=now(), score=$2, tier=$3 WHERE id=$1`, [a.id, score, tier]);
    await track(t, { anonId: a.anon_id, name: 'quiz_completed', theme: a.theme, language: lang, tier });
  });
  return getState(ctx, session, lang);
};

module.exports = { startAttempt, getState, submitAnswer, assignTheme, requireWritable, attemptFor };
