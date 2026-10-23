'use strict';
// Halloween 2027 early-release list. People leave name, email and phone on /halloween/2027 to be told first when
// the 2027 tickets are released. Hidden (and refusing sign-ups) until cfg.h27OpensAt. One row per email address;
// a repeat sign-up updates the row instead of duplicating it. The confirmation email is best effort and carries a
// signed "remove me" link. No personal data is ever logged.
const { HttpError } = require('../lib/http');
const { normalizeEmail } = require('../lib/normalize');
const { sanitizeAttribution } = require('../lib/attribution');
const { hitAll } = require('../lib/ratelimit');
const { hmac, safeEqual } = require('../lib/crypto');
const { toCsv } = require('../lib/csv');
const { h27ConfirmEmail } = require('../email/templates');
const { audit } = require('./events');

const CONSENT_TEXT = 'Yes, contact me by email, WhatsApp or SMS about the early ticket release for The Latin Halloween Indoor Fest 2027. I can unsubscribe at any time.';
const CONTROL = /[\u0000-\u001f\u007f<>]/;
const clean = (s) => (typeof s === 'string' ? s.normalize('NFC').replace(/\s+/g, ' ').trim() : '');

const state = (ctx) => (ctx.now().getTime() >= Date.parse(ctx.cfg.h27OpensAt) ? 'open' : 'hidden');
const status = (ctx) => ({ state: state(ctx), opensAt: ctx.cfg.h27OpensAt, timezone: 'Europe/Amsterdam', consentText: CONSENT_TEXT });

// Accepts +31 6 1234 5678, 0031..., 06 1234 5678 (Dutch national) or any +country number; stores +<digits>.
const normalizePhone = (raw) => {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[\s().-]/g, '');
  if (/^00\d+$/.test(s)) s = `+${s.slice(2)}`;
  else if (/^0[1-9]\d{8}$/.test(s)) s = `+31${s.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
};

const validate = (input) => {
  const i = input && typeof input === 'object' ? input : {};
  const errors = {};
  const fullName = clean(i.fullName);
  if (fullName.length < 2 || fullName.length > 100 || CONTROL.test(fullName)) errors.fullName = fullName ? 'invalid' : 'required';
  const emailNorm = normalizeEmail(i.email);
  if (!emailNorm) errors.email = i.email ? 'invalid' : 'required';
  const phoneRaw = clean(i.phone);
  const phoneNorm = normalizePhone(phoneRaw);
  if (!phoneNorm) errors.phone = phoneRaw ? 'invalid' : 'required';
  if (i.consent !== true) errors.consent = 'required';
  const ok = Object.keys(errors).length === 0;
  return { ok, errors, value: ok ? { fullName, email: String(i.email).trim(), emailNorm, phone: phoneRaw.slice(0, 40), phoneNorm, attribution: sanitizeAttribution(i.attribution) } : null };
};

const unsubToken = (ctx, id) => `${id}.${hmac(ctx.cfg.appSecret, `h27:unsub:${id}`)}`;
const unsubscribeUrl = (ctx, id) => `${ctx.cfg.siteOrigin}/halloween/2027/unsubscribe#t=${unsubToken(ctx, id)}`;

const signup = async (ctx, body, { ip }) => {
  if (state(ctx) !== 'open') throw new HttpError(403, 'not_open', { opensAt: ctx.cfg.h27OpensAt });
  const v = validate(body);
  if (!v.ok) throw new HttpError(400, 'validation', { fields: v.errors });
  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [[`h27:ip:${ip}`, 3600, 10], [`h27:email:${v.value.emailNorm}`, 3600, 3]], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });

  const r = await ctx.db.query(
    `INSERT INTO quiz.h27_signups (full_name, email, email_norm, phone, phone_norm, consent_text, attribution)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email_norm) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone,
       phone_norm = EXCLUDED.phone_norm, consent_text = EXCLUDED.consent_text, consent_at = now(), updated_at = now()
     RETURNING id, (xmax = 0) AS inserted`,
    [v.value.fullName, v.value.email, v.value.emailNorm, v.value.phone, v.value.phoneNorm, CONSENT_TEXT, JSON.stringify(v.value.attribution)]);
  const row = r.rows[0];

  // Confirmation: best effort, never blocks the sign-up. One per person per day (provider idempotency key).
  let confirm = 'failed';
  try {
    const m = h27ConfirmEmail({ name: v.value.fullName, unsubscribeUrl: unsubscribeUrl(ctx, row.id) });
    const { providerMessageId } = await ctx.mail.send({ to: v.value.email, ...m, idempotencyKey: `h27:confirm:${row.id}`, tags: [{ name: 'kind', value: 'h27_confirm' }] });
    await ctx.db.query(`UPDATE quiz.h27_signups SET confirm_status = 'accepted', confirm_message_id = $2, updated_at = now() WHERE id = $1`, [row.id, providerMessageId]);
    confirm = 'accepted';
  } catch (e) {
    await ctx.db.query(`UPDATE quiz.h27_signups SET confirm_status = 'failed', updated_at = now() WHERE id = $1`, [row.id]);
  }
  return { status: 'ok', created: Boolean(row.inserted), confirm };
};

// Signed link from the confirmation email: removes the row (erasure), regardless of state.
const unsubscribe = async (ctx, token) => {
  const [id, sig] = String(token || '').split('.');
  if (!/^[0-9a-f-]{36}$/.test(id || '') || !sig || !safeEqual(sig, hmac(ctx.cfg.appSecret, `h27:unsub:${id}`))) throw new HttpError(400, 'invalid_token');
  const r = await ctx.db.query('DELETE FROM quiz.h27_signups WHERE id = $1', [id]);
  return { status: 'ok', removed: r.rowCount > 0 };
};

// ---- owner ----
const summary = async (ctx) => {
  const r = (await ctx.db.query(`SELECT count(*)::int AS total, count(*) FILTER (WHERE confirm_status = 'accepted')::int AS confirmed, max(created_at) AS last_at FROM quiz.h27_signups`)).rows[0];
  return { state: state(ctx), opensAt: ctx.cfg.h27OpensAt, total: r.total, confirmationEmailsAccepted: r.confirmed, lastSignupAt: r.last_at };
};

const exportCsv = async (ctx, actor) => {
  const rows = (await ctx.db.query(`SELECT id, full_name, email, phone_norm, consent_at, created_at, attribution FROM quiz.h27_signups ORDER BY created_at`)).rows;
  const out = rows.map((r) => ({
    full_name: r.full_name, email: r.email, phone: r.phone_norm, consent_at: new Date(r.consent_at).toISOString(), signed_up_at: new Date(r.created_at).toISOString(),
    utm_source: (r.attribution || {}).utm_source || '', utm_campaign: (r.attribution || {}).utm_campaign || '', unsubscribe_url: unsubscribeUrl(ctx, r.id),
  }));
  await audit(ctx.db, actor, 'h27.export', { rows: out.length });
  return toCsv(['full_name', 'email', 'phone', 'consent_at', 'signed_up_at', 'utm_source', 'utm_campaign', 'unsubscribe_url'], out);
};

module.exports = { status, signup, unsubscribe, summary, exportCsv, validate, normalizePhone, CONSENT_TEXT, unsubToken };
