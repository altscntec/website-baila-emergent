'use strict';
const mailer = require('./mailer');
const { track, raiseAlert } = require('./events');
const { getSettings } = require('../lib/settings');

// Atomic reservation: concurrent completions can never receive the same code.
const reserveCode = async (t, participantId, tier) => {
  const r = await t.query(
    `SELECT id FROM quiz.discount_codes WHERE tier = $1 AND status = 'available' ORDER BY id LIMIT 1 FOR UPDATE SKIP LOCKED`, [tier]);
  if (!r.rowCount) return null;
  await t.query(`UPDATE quiz.discount_codes SET status='issued', participant_id=$2, issued_at=now() WHERE id=$1`, [r.rows[0].id, participantId]);
  return r.rows[0].id;
};

// Idempotent: a participant can only ever have one reward row (PK) and one code (UNIQUE).
const issueReward = async (t, { participantId, attemptId, tier }) => {
  const existing = await t.query('SELECT * FROM quiz.rewards WHERE participant_id = $1', [participantId]);
  if (existing.rowCount) return { reward: existing.rows[0], created: false };
  const codeId = await reserveCode(t, participantId, tier);
  const status = codeId ? 'issued' : 'pending_inventory';
  const r = await t.query(
    `INSERT INTO quiz.rewards (participant_id, attempt_id, tier, code_id, status, issued_at)
     VALUES ($1,$2,$3,$4,$5, CASE WHEN $4::bigint IS NULL THEN NULL ELSE now() END) RETURNING *`,
    [participantId, attemptId, tier, codeId, status]);
  return { reward: r.rows[0], created: true };
};

const checkInventory = async (ctx) => {
  const s = await getSettings(ctx.db);
  const r = await ctx.db.query(`SELECT tier, count(*)::int AS n FROM quiz.discount_codes WHERE status='available' GROUP BY tier`);
  const have = Object.fromEntries(r.rows.map((x) => [x.tier, x.n]));
  for (const tier of [5, 10, 15]) {
    const n = have[tier] || 0;
    if (n === 0) await raiseAlert(ctx, `inventory_depleted_${tier}`, { tier });
    else if (n <= s.low_inventory_threshold) await raiseAlert(ctx, `inventory_low_${tier}`, { tier, available: n });
  }
};

// Called after codes are imported (and by the retry cron): give pending rewards a code, in order.
const fulfilPending = async (ctx) => {
  const pending = await ctx.db.query(`SELECT participant_id, tier FROM quiz.rewards WHERE status='pending_inventory' ORDER BY created_at`);
  let fulfilled = 0;
  for (const p of pending.rows) {
    const outboxId = await ctx.db.tx(async (t) => {
      const lock = await t.query(`SELECT * FROM quiz.rewards WHERE participant_id=$1 AND status='pending_inventory' FOR UPDATE SKIP LOCKED`, [p.participant_id]);
      if (!lock.rowCount) return null;
      const codeId = await reserveCode(t, p.participant_id, p.tier);
      if (!codeId) return null;
      await t.query(`UPDATE quiz.rewards SET code_id=$2, status='issued', issued_at=now() WHERE participant_id=$1`, [p.participant_id, codeId]);
      const lang = (await t.query('SELECT language FROM quiz.participants WHERE id=$1', [p.participant_id])).rows[0].language;
      return mailer.queue(t, { participantId: p.participant_id, kind: 'reward', language: lang, key: `reward:${p.participant_id}` });
    });
    if (outboxId) { fulfilled++; await mailer.deliverReward(ctx, outboxId); }
  }
  return fulfilled;
};

// Completed participants may ask for their EXISTING reward email again. No new code, no new attempt.
const resendReward = async (ctx, participant, { language }) => {
  const rw = (await ctx.db.query('SELECT status FROM quiz.rewards WHERE participant_id=$1', [participant.id])).rows[0];
  if (!rw) return { status: 'no_reward' };
  if (rw.status !== 'issued') return { status: 'pending_inventory' };
  const last = (await ctx.db.query(
    `SELECT id, status FROM quiz.email_outbox WHERE participant_id=$1 AND kind='reward' ORDER BY created_at DESC LIMIT 1`, [participant.id])).rows[0];
  let outboxId;
  if (last && (last.status === 'queued' || last.status === 'failed')) {
    // Same row, same reward: just try again.
    await ctx.db.query(`UPDATE quiz.email_outbox SET status='queued', next_attempt_at=now(), attempts=LEAST(attempts, 3), language=$2 WHERE id=$1`, [last.id, language]);
    outboxId = last.id;
  } else {
    const n = (await ctx.db.query(`SELECT count(*)::int AS n FROM quiz.email_outbox WHERE participant_id=$1 AND kind='reward'`, [participant.id])).rows[0].n;
    outboxId = await mailer.queue(ctx.db, { participantId: participant.id, kind: 'reward', language, key: `reward:${participant.id}:resend:${n}` });
  }
  const status = await mailer.deliverReward(ctx, outboxId);
  await track(ctx.db, { anonId: participant.anon_id, name: 'reward_resend', language, attribution: participant.attribution, props: { status } });
  return { status };
};

// Play-first flow: once a participant is verified, issue the reward for the completed attempt attached to them.
// Idempotent: a participant can only ever hold one reward (primary key) for one attempt (unique index).
const claim = async (ctx, t, participantId, language) => {
  const a = (await t.query('SELECT * FROM quiz.attempts WHERE participant_id = $1 FOR UPDATE', [participantId])).rows[0];
  if (!a || a.status !== 'completed') return { status: 'no_attempt' };
  const existing = (await t.query('SELECT tier FROM quiz.rewards WHERE participant_id = $1', [participantId])).rows[0];
  if (existing) return { status: 'already', tier: existing.tier };
  const p = (await t.query('SELECT anon_id, attribution, language FROM quiz.participants WHERE id = $1', [participantId])).rows[0];
  const lang = p.language || language || 'en';
  const { reward } = await issueReward(t, { participantId, attemptId: a.id, tier: a.tier });
  await t.query('UPDATE quiz.attempts SET claimed_at = now() WHERE id = $1', [a.id]);
  await track(t, { anonId: p.anon_id, name: 'discount_earned', theme: a.theme, language: lang, tier: a.tier, attribution: p.attribution });
  let outboxId = null;
  if (reward.status === 'issued') {
    outboxId = await mailer.queue(t, { participantId, kind: 'reward', language: lang, key: `reward:${participantId}` });
    await track(t, { anonId: p.anon_id, name: 'reward_issued', theme: a.theme, language: lang, tier: a.tier, attribution: p.attribution });
  } else {
    await track(t, { anonId: p.anon_id, name: 'reward_pending_inventory', theme: a.theme, language: lang, tier: a.tier, attribution: p.attribution });
  }
  return { status: 'claimed', tier: a.tier, outboxId, pending: reward.status !== 'issued' };
};

module.exports = { reserveCode, issueReward, checkInventory, fulfilPending, resendReward, claim };
