'use strict';
const { MailError } = require('../mail/resend');
const { signinEmail, rewardEmail } = require('../email/templates');
const { getSettings } = require('../lib/settings');
const { CHECKOUT_PARAMS } = require('../lib/attribution');
const { raiseAlert, track } = require('./events');

const MAX_ATTEMPTS = 6;
const BACKOFF_MIN = [1, 5, 30, 120, 360, 720];

// Checkout link for the reward email. Only allowlisted UTM params travel with it
// (never click ids, never personal data). The coupon is the discount code.
const buildCheckoutUrl = (settings, code, attribution = {}) => {
  const u = new URL(settings.checkout_url);
  u.searchParams.set(settings.coupon_param || 'coupon', code);
  let hasUtm = false;
  for (const k of CHECKOUT_PARAMS) if (attribution[k]) { u.searchParams.set(k, attribution[k]); hasUtm = true; }
  if (!hasUtm) { u.searchParams.set('utm_source', 'halloween_quiz'); u.searchParams.set('utm_medium', 'email'); u.searchParams.set('utm_campaign', 'halloween_quiz'); }
  u.searchParams.set('bd_ref', 'quiz_reward');
  return u.toString();
};

const buildRewardMessage = async (ctx, row) => {
  const r = await ctx.db.query(
    `SELECT p.email, p.full_name, p.attribution, rw.tier, rw.status, rw.expires_at, at.score, dc.code
       FROM quiz.rewards rw
       JOIN quiz.participants p ON p.id = rw.participant_id
       JOIN quiz.attempts at ON at.id = rw.attempt_id
       LEFT JOIN quiz.discount_codes dc ON dc.id = rw.code_id
      WHERE rw.participant_id = $1`, [row.participant_id]);
  const x = r.rows[0];
  if (!x || x.status !== 'issued' || !x.code) throw new MailError('reward_not_issued', { permanent: true });
  const s = await getSettings(ctx.db);
  const lang = row.language;
  const m = rewardEmail({
    lang, name: x.full_name, tier: x.tier, score: x.score, code: x.code,
    link: buildCheckoutUrl(s, x.code, x.attribution),
    codeExpiresAt: x.expires_at || s.code_expires_at, personalExpiry: Boolean(x.expires_at), eligibleTickets: s.eligible_ticket_types,
    notes: [s.excluded_note[lang], s.stacking_note[lang], s.redemption_note[lang]],
  });
  return { to: x.email, ...m, tags: [{ name: 'kind', value: 'reward' }] };
};

const queue = async (q, { participantId, kind, language, key }) => {
  const r = await q.query(
    `INSERT INTO quiz.email_outbox (participant_id, kind, language, idempotency_key)
     VALUES ($1,$2,$3,$4) ON CONFLICT (idempotency_key) DO NOTHING RETURNING id`,
    [participantId, kind, language, key]);
  if (r.rowCount) return r.rows[0].id;
  return (await q.query('SELECT id FROM quiz.email_outbox WHERE idempotency_key = $1', [key])).rows[0].id;
};

// Claim -> build -> send -> record. Safe to call concurrently: only one caller wins the claim.
const deliver = async (ctx, outboxId, build) => {
  const claim = await ctx.db.query(
    `UPDATE quiz.email_outbox SET status = 'sending', attempts = attempts + 1, updated_at = now()
      WHERE id = $1 AND status = 'queued' AND next_attempt_at <= now() RETURNING *`, [outboxId]);
  if (!claim.rowCount) {
    return (await ctx.db.query('SELECT status FROM quiz.email_outbox WHERE id = $1', [outboxId])).rows[0].status;
  }
  const row = claim.rows[0];
  const fail = async (err, permanent) => {
    const terminal = permanent || row.attempts >= MAX_ATTEMPTS;
    if (terminal) {
      await ctx.db.query(`UPDATE quiz.email_outbox SET status='failed', last_error=$2, updated_at=now() WHERE id=$1`, [row.id, String(err.message).slice(0, 300)]);
      await raiseAlert(ctx, row.kind === 'reward' ? 'reward_email_failed' : 'signin_email_failed', { status: err.status || null, reason: String(err.message).slice(0, 80) });
      return 'failed';
    }
    const mins = BACKOFF_MIN[Math.min(row.attempts - 1, BACKOFF_MIN.length - 1)];
    await ctx.db.query(
      `UPDATE quiz.email_outbox SET status='queued', last_error=$2, next_attempt_at = now() + ($3 || ' minutes')::interval, updated_at=now() WHERE id=$1`,
      [row.id, String(err.message).slice(0, 300), String(mins)]);
    if (err.message === 'mail_not_configured') await raiseAlert(ctx, 'mail_not_configured', {});
    return 'queued';
  };
  let msg;
  try { msg = await build(row); } catch (e) { return fail(e instanceof MailError ? e : new MailError(e.message, { permanent: true }), true); }
  try {
    const { providerMessageId } = await ctx.mail.send({ ...msg, idempotencyKey: row.idempotency_key });
    await ctx.db.query(
      `UPDATE quiz.email_outbox SET status='accepted', provider_message_id=$2, accepted_at=now(), last_error=NULL, updated_at=now() WHERE id=$1`,
      [row.id, providerMessageId]);
    return 'accepted';
  } catch (e) {
    return fail(e instanceof MailError ? e : new MailError(e.message), e instanceof MailError && e.permanent);
  }
};

const deliverReward = (ctx, outboxId) => deliver(ctx, outboxId, (row) => buildRewardMessage(ctx, row));

// Sign-in emails carry one-time secrets that are never stored, so they cannot be retried
// from the outbox; a failure is surfaced to the user, who can request a new one.
const deliverSignin = async (ctx, outboxId, { to, name, kind, lang, link, code }) => {
  const status = await deliver(ctx, outboxId, async () => ({
    to, ...signinEmail({ lang, kind, name, link, code, ttlMinutes: ctx.cfg.verifyTtlMinutes }), tags: [{ name: 'kind', value: 'signin' }],
  }));
  if (status === 'queued') {
    await ctx.db.query(`UPDATE quiz.email_outbox SET status='failed', updated_at=now() WHERE id=$1 AND status='queued'`, [outboxId]);
    return 'failed';
  }
  return status;
};

// Retry job: rewards that are queued and due, plus rows stuck in 'sending' after a crash.
const retryDueRewards = async (ctx) => {
  await ctx.db.query(`UPDATE quiz.email_outbox SET status='queued' WHERE status='sending' AND updated_at < now() - interval '5 minutes'`);
  const due = await ctx.db.query(
    `SELECT id FROM quiz.email_outbox WHERE kind='reward' AND status='queued' AND next_attempt_at <= now() ORDER BY created_at LIMIT 50`);
  const out = { attempted: 0, accepted: 0, failed: 0, requeued: 0 };
  for (const { id } of due.rows) {
    const s = await deliverReward(ctx, id);
    out.attempted++; if (s === 'accepted') out.accepted++; else if (s === 'failed') out.failed++; else out.requeued++;
  }
  return out;
};

const recordEmailStatusEvent = async (ctx, row, status) => {
  const p = await ctx.db.query('SELECT anon_id, language, attribution FROM quiz.participants WHERE id = $1', [row.participant_id]);
  if (!p.rowCount) return;
  await track(ctx.db, { anonId: p.rows[0].anon_id, name: 'reward_email_status', language: p.rows[0].language, attribution: p.rows[0].attribution, props: { status, kind: row.kind } });
};

module.exports = { queue, deliver, deliverReward, deliverSignin, retryDueRewards, buildCheckoutUrl, buildRewardMessage, recordEmailStatusEvent, MAX_ATTEMPTS };
