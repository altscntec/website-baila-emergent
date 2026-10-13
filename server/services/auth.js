'use strict';
const { hmac, randomToken, randomCode, safeEqual } = require('../lib/crypto');
const { hitAll } = require('../lib/ratelimit');
const { HttpError } = require('../lib/http');
const { getSettings, campaignState } = require('../lib/settings');
const { track } = require('./events');
const mailer = require('./mailer');

const MAX_CODE_ATTEMPTS = 5;
const WORDING_VERSION = 'promo-2026-10-v1';
// The exact sentence shown next to the (unchecked) checkbox, per language. Stored with each consent record.
const MARKETING_WORDING = {
  en: 'Yes, email me about future Baila Dembow events and offers. (Optional. You can unsubscribe at any time. Not needed to take part or to receive your discount.)',
  es: 'Sí, quiero recibir emails sobre futuros eventos y ofertas de Baila Dembow. (Opcional. Puedes darte de baja cuando quieras. No es necesario para participar ni para recibir tu descuento.)',
  nl: 'Ja, mail mij over toekomstige Baila Dembow-events en aanbiedingen. (Optioneel. Je kunt je altijd uitschrijven. Niet nodig om mee te doen of je korting te ontvangen.)',
};
const TERMS_VERSION = 'quiz-terms-2026-10-v1';

const tokenHash = (ctx, token) => hmac(ctx.cfg.appSecret, `tok:${token}`);
const codeHash = (ctx, tokenId, code) => hmac(ctx.cfg.appSecret, `code:${tokenId}:${code}`);
const ipKey = (req) => req.ip;

const emailKey = (emailNorm) => `email:${emailNorm}`;

// Common "sign-in" path for: new signup, unverified re-submit, verified resume, completed re-entry.
// The HTTP response is identical in all cases, so the endpoint cannot be used to learn
// whether an arbitrary email address has already taken part.
const requestSignin = async (ctx, { signup, ip }) => {
  const settings = await getSettings(ctx.db);
  const state = campaignState(settings, ctx.now());

  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [
    [`signup:ip:${ip}`, 3600, 10],
    [`signup:email:${signup.emailNorm}`, 3600, 5],
    [`signup:cool:${signup.emailNorm}`, 60, 1],
  ], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });

  const existing = await ctx.db.query('SELECT id, verified_at FROM quiz.participants WHERE email_norm = $1', [signup.emailNorm]);
  // New participants can only join while the campaign is open; existing ones may always sign back in
  // (resume or see their result), unless the campaign is disabled outright.
  if (state === 'disabled') throw new HttpError(403, 'campaign_unavailable', { state });
  if (!existing.rowCount && state !== 'open') throw new HttpError(403, 'campaign_unavailable', { state });

  const prepared = await ctx.db.tx(async (t) => {
    let p = (await t.query('SELECT * FROM quiz.participants WHERE email_norm = $1 FOR UPDATE', [signup.emailNorm])).rows[0];
    let kind; let isNew = false;
    if (!p) {
      p = (await t.query(
        `INSERT INTO quiz.participants (email_norm, email, full_name, age, gender, gender_self, city, country, language, attribution, terms_version)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [signup.emailNorm, signup.email, signup.fullName, signup.age, signup.gender, signup.genderSelf, signup.city, signup.country, signup.language, JSON.stringify(signup.attribution), TERMS_VERSION])).rows[0];
      await t.query(
        `INSERT INTO quiz.marketing_consents (participant_id, opted_in, wording_version, wording_text, language, source) VALUES ($1,$2,$3,$4,$5,'signup')`,
        [p.id, signup.marketingOptIn, WORDING_VERSION, MARKETING_WORDING[signup.language], signup.language]);
      kind = 'verify_new'; isNew = true;
      await track(t, { anonId: p.anon_id, name: 'form_success', language: signup.language, attribution: signup.attribution });
    } else if (!p.verified_at) {
      // Unverified: the same person may be correcting a typo. Profile data can be refreshed.
      p = (await t.query(
        `UPDATE quiz.participants SET full_name=$2, age=$3, gender=$4, gender_self=$5, city=$6, country=$7, language=$8, updated_at=now() WHERE id=$1 RETURNING *`,
        [p.id, signup.fullName, signup.age, signup.gender, signup.genderSelf, signup.city, signup.country, signup.language])).rows[0];
      const last = (await t.query('SELECT opted_in FROM quiz.marketing_consents WHERE participant_id=$1 ORDER BY id DESC LIMIT 1', [p.id])).rows[0];
      if (!last || last.opted_in !== signup.marketingOptIn) {
        await t.query(
          `INSERT INTO quiz.marketing_consents (participant_id, opted_in, wording_version, wording_text, language, source) VALUES ($1,$2,$3,$4,$5,'signup')`,
          [p.id, signup.marketingOptIn, WORDING_VERSION, MARKETING_WORDING[signup.language], signup.language]);
      }
      kind = 'verify_new';
    } else {
      // Verified already: never overwrite profile or consent from an unauthenticated form post.
      const a = (await t.query('SELECT status FROM quiz.attempts WHERE participant_id=$1', [p.id])).rows[0];
      kind = a && a.status === 'completed' ? 'completed' : 'resume';
    }
    const issued = await issueToken(ctx, t, p.id);
    const outboxId = await mailer.queue(t, { participantId: p.id, kind: 'signin', language: signup.language, key: `signin:${issued.tokenId}` });
    await track(t, { anonId: p.anon_id, name: 'verification_requested', language: signup.language, props: { kind } });
    return { p, kind, isNew, issued, outboxId };
  });

  const status = await mailer.deliverSignin(ctx, prepared.outboxId, {
    to: prepared.p.email, name: prepared.p.full_name, kind: prepared.kind, lang: signup.language,
    link: `${ctx.cfg.siteOrigin}/halloween/quiz/verify#t=${prepared.issued.token}`, code: prepared.issued.code,
  });
  if (status === 'failed') throw new HttpError(503, 'email_unavailable');
  return { status: 'check_email', ttlMinutes: ctx.cfg.verifyTtlMinutes };
};

const issueToken = async (ctx, t, participantId) => {
  await t.query(`UPDATE quiz.verification_tokens SET consumed_at = now() WHERE participant_id=$1 AND consumed_at IS NULL`, [participantId]);
  const token = randomToken(32);
  const code = randomCode();
  const ins = await t.query(
    `INSERT INTO quiz.verification_tokens (participant_id, token_hash, code_hash, expires_at)
     VALUES ($1,$2,'pending', $3) RETURNING id`,
    [participantId, tokenHash(ctx, token), new Date(ctx.now().getTime() + ctx.cfg.verifyTtlMinutes * 60_000)]);
  const tokenId = ins.rows[0].id;
  await t.query('UPDATE quiz.verification_tokens SET code_hash=$2 WHERE id=$1', [tokenId, codeHash(ctx, tokenId, code)]);
  return { token, code, tokenId };
};

// "I did not get the email": generic response whether or not the address is known.
const resendSignin = async (ctx, { emailNorm, language, ip }) => {
  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [
    [`resend:ip:${ip}`, 3600, 10],
    [`resend:email:${emailNorm}`, 3600, 3],
    [`resend:cool:${emailNorm}`, 60, 1],
  ], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
  const settings = await getSettings(ctx.db);
  if (campaignState(settings, ctx.now()) === 'disabled') throw new HttpError(403, 'campaign_unavailable', { state: 'disabled' });
  const prepared = await ctx.db.tx(async (t) => {
    const p = (await t.query('SELECT * FROM quiz.participants WHERE email_norm=$1 FOR UPDATE', [emailNorm])).rows[0];
    if (!p) return null;
    const a = (await t.query('SELECT status FROM quiz.attempts WHERE participant_id=$1', [p.id])).rows[0];
    const kind = !p.verified_at ? 'verify_new' : a && a.status === 'completed' ? 'completed' : 'resume';
    const issued = await issueToken(ctx, t, p.id);
    const outboxId = await mailer.queue(t, { participantId: p.id, kind: 'signin', language, key: `signin:${issued.tokenId}` });
    return { p, kind, issued, outboxId };
  });
  if (prepared) {
    await mailer.deliverSignin(ctx, prepared.outboxId, {
      to: prepared.p.email, name: prepared.p.full_name, kind: prepared.kind, lang: language,
      link: `${ctx.cfg.siteOrigin}/halloween/quiz/verify#t=${prepared.issued.token}`, code: prepared.issued.code,
    });
  }
  return { status: 'check_email', ttlMinutes: ctx.cfg.verifyTtlMinutes };
};

const newSession = async (ctx, t, participantId) => {
  const raw = randomToken(32);
  await t.query(
    `INSERT INTO quiz.sessions (token_hash, participant_id, expires_at) VALUES ($1,$2,$3)`,
    [tokenHash(ctx, `sess:${raw}`), participantId, new Date(ctx.now().getTime() + ctx.cfg.sessionTtlDays * 86_400_000)]);
  return raw;
};

// Verify by link token OR by email+code. All failures look the same to the caller.
const verify = async (ctx, { token, email, code, ip }) => {
  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [
    [`verify:ip:${ip}`, 3600, 40],
    ...(email ? [[`verify:email:${email}`, 3600, 12]] : []),
  ], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
  const invalid = () => new HttpError(400, 'invalid_or_expired');

  return ctx.db.tx(async (t) => {
    let row;
    if (token) {
      if (typeof token !== 'string' || token.length > 100) throw invalid();
      row = (await t.query(
        `SELECT vt.*, p.verified_at, p.anon_id, p.language, p.attribution FROM quiz.verification_tokens vt
           JOIN quiz.participants p ON p.id = vt.participant_id WHERE vt.token_hash = $1 FOR UPDATE OF vt`, [tokenHash(ctx, token)])).rows[0];
      if (!row || row.consumed_at || row.expires_at <= ctx.now() || row.failed_attempts >= MAX_CODE_ATTEMPTS) throw invalid();
    } else {
      if (typeof email !== 'string' || !/^\d{6}$/.test(String(code || ''))) throw invalid();
      row = (await t.query(
        `SELECT vt.*, p.verified_at, p.anon_id, p.language, p.attribution FROM quiz.verification_tokens vt
           JOIN quiz.participants p ON p.id = vt.participant_id
          WHERE p.email_norm = $1 AND vt.consumed_at IS NULL ORDER BY vt.created_at DESC LIMIT 1 FOR UPDATE OF vt`, [email])).rows[0];
      if (!row || row.expires_at <= ctx.now() || row.failed_attempts >= MAX_CODE_ATTEMPTS) throw invalid();
      if (!safeEqual(row.code_hash, codeHash(ctx, row.id, code))) {
        await t.query('UPDATE quiz.verification_tokens SET failed_attempts = failed_attempts + 1 WHERE id=$1', [row.id]);
        // Commit the counter even though we are rejecting: signal via a marker, not by throwing inside the tx.
        return { __invalid: true };
      }
    }
    const used = await t.query('UPDATE quiz.verification_tokens SET consumed_at = now() WHERE id=$1 AND consumed_at IS NULL RETURNING id', [row.id]);
    if (!used.rowCount) throw invalid();
    const firstTime = !row.verified_at;
    if (firstTime) {
      await t.query('UPDATE quiz.participants SET verified_at = now(), updated_at = now() WHERE id=$1', [row.participant_id]);
      await track(t, { anonId: row.anon_id, name: 'verification_completed', language: row.language, attribution: row.attribution });
    }
    const session = await newSession(ctx, t, row.participant_id);
    return { session, participantId: row.participant_id, firstTime };
  }).then((r) => { if (r && r.__invalid) throw invalid(); return r; });
};

const getSessionParticipant = async (ctx, rawSession) => {
  if (!rawSession || typeof rawSession !== 'string' || rawSession.length > 100) return null;
  const r = await ctx.db.query(
    `SELECT p.* FROM quiz.sessions s JOIN quiz.participants p ON p.id = s.participant_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2 AND p.verified_at IS NOT NULL`,
    [tokenHash(ctx, `sess:${rawSession}`), ctx.now()]);
  return r.rows[0] || null;
};

const revokeSession = (ctx, rawSession) =>
  rawSession ? ctx.db.query('UPDATE quiz.sessions SET revoked_at = now() WHERE token_hash = $1', [tokenHash(ctx, `sess:${rawSession}`)]) : null;

module.exports = { requestSignin, resendSignin, verify, getSessionParticipant, revokeSession, MARKETING_WORDING, WORDING_VERSION, TERMS_VERSION, MAX_CODE_ATTEMPTS };
