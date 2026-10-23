'use strict';
// Halloween 2027 early-release list (The Latin Halloween Indoor Fest 2027). People leave name, email and phone on
// /halloween/2027; the email is confirmed with a 6-digit code we send, the phone with a one-time code the
// verification provider (Twilio Verify) sends over WhatsApp (fallback SMS). Only fully verified rows count.
//
//  signup -> email code -> verifyEmail -> startPhone (whatsapp|sms) -> verifyPhone -> confirmation email
//
// Hidden (and refusing sign-ups) until cfg.h27OpensAt. One row per email: an UNVERIFIED row is overwritten by a
// new sign-up; a VERIFIED row is never changed by someone who merely types the same address. The browser holds a
// signed token for its own row; every code attempt is rate limited. No personal data is ever logged.
const { HttpError } = require('../lib/http');
const { normalizeEmail } = require('../lib/normalize');
const { sanitizeAttribution } = require('../lib/attribution');
const { hitAll } = require('../lib/ratelimit');
const { hmac, safeEqual, randomCode } = require('../lib/crypto');
const { toCsv } = require('../lib/csv');
const { h27CodeEmail, h27ConfirmEmail } = require('../email/templates');
const { audit } = require('./events');

const CONSENT_TEXT = 'Yes, contact me by email, WhatsApp or SMS about the early ticket release for The Latin Halloween Indoor Fest 2027. I can unsubscribe at any time.';
const EMAIL_CODE_TTL_MIN = 30;
const MAX_CODE_ATTEMPTS = 5;
const CONTROL = /[\u0000-\u001f\u007f<>]/;
const clean = (s) => (typeof s === 'string' ? s.normalize('NFC').replace(/\s+/g, ' ').trim() : '');

const state = (ctx) => (ctx.now().getTime() >= Date.parse(ctx.cfg.h27OpensAt) ? 'open' : 'hidden');
const phoneOn = (ctx) => Boolean(ctx.sms && ctx.sms.configured);
const status = (ctx) => ({ state: state(ctx), opensAt: ctx.cfg.h27OpensAt, timezone: 'Europe/Amsterdam', consentText: CONSENT_TEXT, phoneVerification: phoneOn(ctx) ? 'whatsapp' : 'off' });

// Accepts +31 6 1234 5678, 0031..., 06 1234 5678 (Dutch national) or any +country number; stores +<digits>.
const normalizePhone = (raw) => {
  if (typeof raw !== 'string') return null;
  let s = raw.trim().replace(/[\s().-]/g, '');
  if (/^00\d+$/.test(s)) s = `+${s.slice(2)}`;
  else if (/^0[1-9]\d{8}$/.test(s)) s = `+31${s.slice(1)}`;
  return /^\+[1-9]\d{7,14}$/.test(s) ? s : null;
};
const maskPhone = (p) => (p ? `${p.slice(0, 3)}${'•'.repeat(Math.max(2, p.length - 6))}${p.slice(-3)}` : null);
const maskEmail = (e) => e.replace(/^(.)(.*)(@.*)$/, (m, a, b, c) => a + '*'.repeat(Math.min(b.length, 6)) + c);

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

// ---- tokens (HMAC with the app secret; nothing random stored) ----
const sign = (ctx, kind, id) => `${id}.${hmac(ctx.cfg.appSecret, `h27:${kind}:${id}`)}`;
const open = (ctx, kind, token) => {
  const [id, sig] = String(token || '').split('.');
  if (!/^[0-9a-f-]{36}$/.test(id || '') || !sig || !safeEqual(sig, hmac(ctx.cfg.appSecret, `h27:${kind}:${id}`))) throw new HttpError(401, 'invalid_token');
  return id;
};
const codeHash = (ctx, id, code) => hmac(ctx.cfg.appSecret, `h27:code:${id}:${code}`);
const unsubscribeUrl = (ctx, id) => `${ctx.cfg.siteOrigin}/halloween/2027/unsubscribe#t=${sign(ctx, 'unsub', id)}`;

const rowFor = async (ctx, token) => {
  const id = open(ctx, 'sess', token);
  const r = (await ctx.db.query('SELECT * FROM quiz.h27_signups WHERE id = $1', [id])).rows[0];
  if (!r) throw new HttpError(401, 'invalid_token');
  return r;
};
const limit = async (ctx, checks) => {
  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, checks, ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
};
const isComplete = (ctx, r) => Boolean(r.email_verified_at && (r.phone_verified_at || !phoneOn(ctx)));

// ---- email code ----
const sendEmailCode = async (ctx, row) => {
  const code = randomCode();
  const sentAt = ctx.now();
  await ctx.db.query(
    `UPDATE quiz.h27_signups SET email_code_hash = $2, email_code_expires_at = $3, email_code_attempts = 0, email_code_sent_at = $4, updated_at = now() WHERE id = $1`,
    [row.id, codeHash(ctx, row.id, code), new Date(sentAt.getTime() + EMAIL_CODE_TTL_MIN * 60000).toISOString(), sentAt.toISOString()]);
  try {
    await ctx.mail.send({ to: row.email, ...h27CodeEmail({ name: row.full_name, code, ttlMinutes: EMAIL_CODE_TTL_MIN }), idempotencyKey: `h27:code:${row.id}:${sentAt.getTime()}`, tags: [{ name: 'kind', value: 'h27_code' }] });
    return 'accepted';
  } catch (e) { return 'failed'; }
};

// Confirmation once everything that can be verified is verified. Best effort; one per person per day.
const finalize = async (ctx, row) => {
  try {
    const { providerMessageId } = await ctx.mail.send({ to: row.email, ...h27ConfirmEmail({ name: row.full_name, unsubscribeUrl: unsubscribeUrl(ctx, row.id) }), idempotencyKey: `h27:confirm:${row.id}`, tags: [{ name: 'kind', value: 'h27_confirm' }] });
    await ctx.db.query(`UPDATE quiz.h27_signups SET confirm_status = 'accepted', confirm_message_id = $2, updated_at = now() WHERE id = $1`, [row.id, providerMessageId]);
    return 'accepted';
  } catch (e) {
    await ctx.db.query(`UPDATE quiz.h27_signups SET confirm_status = 'failed', updated_at = now() WHERE id = $1`, [row.id]);
    return 'failed';
  }
};

const nextStep = (ctx, r) => (!r.email_verified_at ? 'email' : (phoneOn(ctx) && !r.phone_verified_at ? 'phone' : 'done'));
const view = (ctx, r, extra = {}) => ({ next: nextStep(ctx, r), email: maskEmail(r.email), phone: maskPhone(r.phone_norm), phoneVerification: phoneOn(ctx) ? 'whatsapp' : 'off', ...extra });

// ---- step 0: the form ----
const signup = async (ctx, body, { ip }) => {
  if (state(ctx) !== 'open') throw new HttpError(403, 'not_open', { opensAt: ctx.cfg.h27OpensAt });
  const v = validate(body);
  if (!v.ok) throw new HttpError(400, 'validation', { fields: v.errors });
  await limit(ctx, [[`h27:ip:${ip}`, 3600, 10], [`h27:email:${v.value.emailNorm}`, 3600, 3]]);

  // New or unverified address: write it. Verified address: leave the verified data alone and just re-issue a code.
  const r = await ctx.db.query(
    `INSERT INTO quiz.h27_signups (full_name, email, email_norm, phone, phone_norm, consent_text, attribution)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (email_norm) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email, phone = EXCLUDED.phone, phone_norm = EXCLUDED.phone_norm,
       consent_text = EXCLUDED.consent_text, consent_at = now(), attribution = EXCLUDED.attribution, updated_at = now()
       WHERE quiz.h27_signups.email_verified_at IS NULL
     RETURNING *, (xmax = 0) AS inserted`,
    [v.value.fullName, v.value.email, v.value.emailNorm, v.value.phone, v.value.phoneNorm, CONSENT_TEXT, JSON.stringify(v.value.attribution)]);
  const row = r.rows[0] || (await ctx.db.query('SELECT *, false AS inserted FROM quiz.h27_signups WHERE email_norm = $1', [v.value.emailNorm])).rows[0];

  const emailCode = await sendEmailCode(ctx, row);
  return { status: 'pending', token: sign(ctx, 'sess', row.id), created: Boolean(row.inserted), emailCode, ...view(ctx, row) };
};

const resendEmailCode = async (ctx, { token }) => {
  const row = await rowFor(ctx, token);
  if (row.email_verified_at) return { status: 'already_verified', ...view(ctx, row) };
  await limit(ctx, [[`h27:resend:${row.id}`, 3600, 3]]);
  const emailCode = await sendEmailCode(ctx, row);
  return { status: 'sent', emailCode, ...view(ctx, row) };
};

// ---- step 1: email code ----
const verifyEmail = async (ctx, { token, code }) => {
  const row = await rowFor(ctx, token);
  if (row.email_verified_at) return { status: 'email_verified', ...view(ctx, row) };
  const c = String(code || '').replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) throw new HttpError(400, 'code_invalid', { attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - row.email_code_attempts) });
  if (!row.email_code_hash || !row.email_code_expires_at || new Date(row.email_code_expires_at) < ctx.now()) throw new HttpError(400, 'code_expired');
  if (row.email_code_attempts >= MAX_CODE_ATTEMPTS) throw new HttpError(429, 'too_many_attempts');
  if (!safeEqual(codeHash(ctx, row.id, c), row.email_code_hash)) {
    const u = await ctx.db.query('UPDATE quiz.h27_signups SET email_code_attempts = email_code_attempts + 1 WHERE id = $1 RETURNING email_code_attempts', [row.id]);
    throw new HttpError(400, 'code_invalid', { attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - u.rows[0].email_code_attempts) });
  }
  const upd = (await ctx.db.query(`UPDATE quiz.h27_signups SET email_verified_at = now(), email_code_hash = NULL, email_code_expires_at = NULL, updated_at = now() WHERE id = $1 RETURNING *`, [row.id])).rows[0];
  let confirm = null;
  if (isComplete(ctx, upd)) confirm = await finalize(ctx, upd);
  return { status: 'email_verified', confirm, ...view(ctx, upd) };
};

// ---- step 2: phone code over WhatsApp (or SMS) ----
const mapSms = (e) => {
  const code = e && e.code;
  if (code === 'invalid_number') return new HttpError(400, 'phone_invalid');
  if (code === 'channel_unavailable') return new HttpError(400, 'channel_unavailable');
  if (code === 'rate_limited') return new HttpError(429, 'rate_limited', { retryAfter: 600 });
  if (code === 'not_found') return new HttpError(400, 'code_expired');
  return new HttpError(502, 'phone_provider_error');
};

const startPhone = async (ctx, { token, channel }) => {
  const row = await rowFor(ctx, token);
  if (!row.email_verified_at) throw new HttpError(409, 'email_not_verified');      // nobody can trigger WhatsApp messages without owning the email
  if (!phoneOn(ctx)) throw new HttpError(400, 'phone_verification_off');
  if (row.phone_verified_at) return { status: 'already_verified', ...view(ctx, row) };
  const ch = channel === 'sms' ? 'sms' : 'whatsapp';
  await limit(ctx, [[`h27:phone:${row.id}`, 3600, 4], [`h27:phoneno:${row.phone_norm}`, 86400, 8]]);
  try {
    await ctx.sms.start({ to: row.phone_norm, channel: ch });
  } catch (e) {
    await ctx.db.query(`UPDATE quiz.h27_signups SET phone_verify_status = 'failed', phone_channel = $2, updated_at = now() WHERE id = $1`, [row.id, ch]);
    throw mapSms(e);
  }
  const upd = (await ctx.db.query(`UPDATE quiz.h27_signups SET phone_verify_status = 'sent', phone_channel = $2, phone_code_sent_at = now(), updated_at = now() WHERE id = $1 RETURNING *`, [row.id, ch])).rows[0];
  return { status: 'sent', channel: ch, ...view(ctx, upd) };
};

const verifyPhone = async (ctx, { token, code }) => {
  const row = await rowFor(ctx, token);
  if (row.phone_verified_at) return { status: 'done', ...view(ctx, row) };
  if (!row.email_verified_at) throw new HttpError(409, 'email_not_verified');
  if (row.phone_verify_status !== 'sent') throw new HttpError(409, 'phone_code_not_sent');
  const c = String(code || '').replace(/\s/g, '');
  if (!/^\d{4,10}$/.test(c)) throw new HttpError(400, 'code_invalid');
  await limit(ctx, [[`h27:phonecheck:${row.id}`, 3600, 10]]);
  let res;
  try { res = await ctx.sms.check({ to: row.phone_norm, code: c }); } catch (e) { throw mapSms(e); }
  if (!res.approved) throw new HttpError(400, 'code_invalid');
  const upd = (await ctx.db.query(`UPDATE quiz.h27_signups SET phone_verified_at = now(), phone_verify_status = 'verified', updated_at = now() WHERE id = $1 RETURNING *`, [row.id])).rows[0];
  const confirm = await finalize(ctx, upd);
  return { status: 'done', confirm, ...view(ctx, upd) };
};

// Signed link from the confirmation email: removes the row (erasure), regardless of state.
const unsubscribe = async (ctx, token) => {
  const id = open(ctx, 'unsub', token);
  const r = await ctx.db.query('DELETE FROM quiz.h27_signups WHERE id = $1', [id]);
  return { status: 'ok', removed: r.rowCount > 0 };
};

// ---- owner ----
const summary = async (ctx) => {
  const r = (await ctx.db.query(
    `SELECT count(*)::int AS total, count(*) FILTER (WHERE email_verified_at IS NOT NULL)::int AS email_verified,
            count(*) FILTER (WHERE phone_verified_at IS NOT NULL)::int AS phone_verified,
            count(*) FILTER (WHERE confirm_status = 'accepted')::int AS confirmed, max(created_at) AS last_at FROM quiz.h27_signups`)).rows[0];
  return { state: state(ctx), opensAt: ctx.cfg.h27OpensAt, phoneVerification: phoneOn(ctx) ? 'whatsapp' : 'off', total: r.total, emailVerified: r.email_verified, phoneVerified: r.phone_verified, confirmationEmailsAccepted: r.confirmed, lastSignupAt: r.last_at };
};

const exportCsv = async (ctx, actor) => {
  const rows = (await ctx.db.query(`SELECT id, full_name, email, phone_norm, email_verified_at, phone_verified_at, phone_channel, consent_at, created_at, attribution FROM quiz.h27_signups ORDER BY created_at`)).rows;
  const iso = (d) => (d ? new Date(d).toISOString() : '');
  const out = rows.map((r) => ({
    full_name: r.full_name, email: r.email, phone: r.phone_norm, email_verified: r.email_verified_at ? 'yes' : 'no', phone_verified: r.phone_verified_at ? 'yes' : 'no', phone_channel: r.phone_channel || '',
    consent_at: iso(r.consent_at), signed_up_at: iso(r.created_at), utm_source: (r.attribution || {}).utm_source || '', utm_campaign: (r.attribution || {}).utm_campaign || '', unsubscribe_url: unsubscribeUrl(ctx, r.id),
  }));
  await audit(ctx.db, actor, 'h27.export', { rows: out.length });
  return toCsv(['full_name', 'email', 'phone', 'email_verified', 'phone_verified', 'phone_channel', 'consent_at', 'signed_up_at', 'utm_source', 'utm_campaign', 'unsubscribe_url'], out);
};

module.exports = { status, signup, resendEmailCode, verifyEmail, startPhone, verifyPhone, unsubscribe, summary, exportCsv, validate, normalizePhone, CONSENT_TEXT, EMAIL_CODE_TTL_MIN, MAX_CODE_ATTEMPTS };
