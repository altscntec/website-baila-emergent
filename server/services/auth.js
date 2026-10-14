'use strict';
const { hmac, randomToken, randomCode, safeEqual } = require('../lib/crypto');
const { hitAll } = require('../lib/ratelimit');
const { HttpError } = require('../lib/http');
const { getSettings, campaignState } = require('../lib/settings');
const { track, raiseAlert } = require('./events');
const mailer = require('./mailer');
const rewards = require('./rewards');

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
const sessionHash = (ctx, raw) => hmac(ctx.cfg.appSecret, `tok:sess:${raw}`);

// ---------------------------------------------------------------- sessions
// A session is a browser. It starts anonymous (the quiz is played before any email is given) and is upgraded to a
// participant session when that browser verifies an email. The cookie only ever holds a random token.
const getSession = async (ctx, raw) => {
  if (!raw || typeof raw !== 'string' || raw.length > 100) return null;
  const r = await ctx.db.query(
    `SELECT s.id, s.anon_id, s.language, s.participant_id, p.email, p.email_norm, p.full_name, p.verified_at, p.language AS participant_language, p.attribution
       FROM quiz.sessions s LEFT JOIN quiz.participants p ON p.id = s.participant_id
      WHERE s.token_hash = $1 AND s.revoked_at IS NULL AND s.expires_at > $2`, [sessionHash(ctx, raw), ctx.now()]);
  return r.rows[0] || null;
};

const createSession = async (ctx, q, { participantId = null, language = null } = {}) => {
  const raw = randomToken(32);
  const r = await q.query(
    `INSERT INTO quiz.sessions (token_hash, participant_id, language, expires_at) VALUES ($1,$2,$3,$4) RETURNING id, anon_id, language, participant_id`,
    [sessionHash(ctx, raw), participantId, language, new Date(ctx.now().getTime() + ctx.cfg.sessionTtlDays * 86_400_000)]);
  return { raw, session: r.rows[0] };
};

// Returns the current session, creating an anonymous one when the browser has none. `raw` is set only when new.
const ensureSession = async (ctx, currentRaw, language) => {
  const existing = await getSession(ctx, currentRaw);
  if (existing) return { session: existing, raw: null };
  const { raw, session } = await createSession(ctx, ctx.db, { language });
  return { session: { ...session, verified_at: null }, raw };
};

const revokeSession = (ctx, rawSession) =>
  rawSession ? ctx.db.query('UPDATE quiz.sessions SET revoked_at = now() WHERE token_hash = $1', [sessionHash(ctx, rawSession)]) : null;

// ---------------------------------------------------------------- verification tokens
const issueToken = async (ctx, t, participantId) => {
  await t.query(`UPDATE quiz.verification_tokens SET consumed_at = now() WHERE participant_id=$1 AND consumed_at IS NULL`, [participantId]);
  const token = randomToken(32);
  const code = randomCode();
  const ins = await t.query(
    `INSERT INTO quiz.verification_tokens (participant_id, token_hash, code_hash, expires_at) VALUES ($1,$2,'pending',$3) RETURNING id`,
    [participantId, tokenHash(ctx, token), new Date(ctx.now().getTime() + ctx.cfg.verifyTtlMinutes * 60_000)]);
  const tokenId = ins.rows[0].id;
  await t.query('UPDATE quiz.verification_tokens SET code_hash=$2 WHERE id=$1', [tokenId, codeHash(ctx, tokenId, code)]);
  return { token, code, tokenId };
};

const sendSignin = (ctx, prepared, language) => mailer.deliverSignin(ctx, prepared.outboxId, {
  to: prepared.p.email, name: prepared.p.full_name, kind: prepared.kind, lang: language,
  link: `${ctx.cfg.siteOrigin}/halloween/quiz/verify#t=${prepared.issued.token}`, code: prepared.issued.code,
});

// ---------------------------------------------------------------- signup (after the quiz)
// The browser has a COMPLETED anonymous attempt; the visitor now gives their details to receive the code.
// Response is identical whether the address is new, unverified, or has already played, so the endpoint cannot
// be used to learn whether an arbitrary email took part.
const requestSignin = async (ctx, { signup, ip, session }) => {
  const settings = await getSettings(ctx.db);
  const state = campaignState(settings, ctx.now());
  if (state === 'disabled') throw new HttpError(403, 'campaign_unavailable', { state });

  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [
    [`signup:ip:${ip}`, 3600, 10],
    [`signup:email:${signup.emailNorm}`, 3600, 5],
    [`signup:cool:${signup.emailNorm}`, 60, 1],
  ], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });

  const prepared = await ctx.db.tx(async (t) => {
    const attempt = session
      ? (await t.query(`SELECT * FROM quiz.attempts WHERE session_id = $1 FOR UPDATE`, [session.id])).rows[0]
      : null;
    if (!attempt || attempt.status !== 'completed') throw new HttpError(409, 'no_completed_attempt');

    let p = (await t.query('SELECT * FROM quiz.participants WHERE email_norm = $1 FOR UPDATE', [signup.emailNorm])).rows[0];
    let kind;
    if (!p) {
      if (state !== 'open') throw new HttpError(403, 'campaign_unavailable', { state });
      // Keep the analytics id the browser already had, so the funnel stays one line from landing to reward.
      const anonTaken = (await t.query('SELECT 1 FROM quiz.participants WHERE anon_id = $1', [session.anon_id])).rowCount > 0;
      p = (await t.query(
        `INSERT INTO quiz.participants (email_norm, email, full_name, age, gender, gender_self, city, country, language, attribution, terms_version, anon_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, COALESCE($12, gen_random_uuid())) RETURNING *`,
        [signup.emailNorm, signup.email, signup.fullName, signup.age, signup.gender, signup.genderSelf, signup.city, signup.country, signup.language,
          JSON.stringify(signup.attribution), TERMS_VERSION, anonTaken ? null : session.anon_id])).rows[0];
      await t.query(
        `INSERT INTO quiz.marketing_consents (participant_id, opted_in, wording_version, wording_text, language, source) VALUES ($1,$2,$3,$4,$5,'signup')`,
        [p.id, signup.marketingOptIn, WORDING_VERSION, MARKETING_WORDING[signup.language], signup.language]);
      await track(t, { anonId: p.anon_id, name: 'form_success', language: signup.language, attribution: signup.attribution });
      kind = 'verify_new';
    } else if (!p.verified_at) {
      // Unverified: the same person may be correcting a typo or trying again. Refresh the profile, re-point the
      // attempt to this browser's result. Nothing has been issued, so nothing is lost.
      p = (await t.query(
        `UPDATE quiz.participants SET full_name=$2, age=$3, gender=$4, gender_self=$5, city=$6, country=$7, language=$8, updated_at=now() WHERE id=$1 RETURNING *`,
        [p.id, signup.fullName, signup.age, signup.gender, signup.genderSelf, signup.city, signup.country, signup.language])).rows[0];
      const last = (await t.query('SELECT opted_in FROM quiz.marketing_consents WHERE participant_id=$1 ORDER BY id DESC LIMIT 1', [p.id])).rows[0];
      if (!last || last.opted_in !== signup.marketingOptIn) {
        await t.query(
          `INSERT INTO quiz.marketing_consents (participant_id, opted_in, wording_version, wording_text, language, source) VALUES ($1,$2,$3,$4,$5,'signup')`,
          [p.id, signup.marketingOptIn, WORDING_VERSION, MARKETING_WORDING[signup.language], signup.language]);
      }
      await t.query(`UPDATE quiz.attempts SET participant_id = NULL WHERE participant_id = $1 AND id <> $2`, [p.id, attempt.id]);
      kind = 'verify_new';
    } else {
      // Verified already: never overwrite a verified profile from an unauthenticated form. If they already hold a
      // reward, this browser's attempt is left unclaimed and the email tells them so.
      const has = (await t.query('SELECT 1 FROM quiz.rewards WHERE participant_id = $1', [p.id])).rowCount > 0
        || (await t.query('SELECT 1 FROM quiz.attempts WHERE participant_id = $1 AND id <> $2', [p.id, attempt.id])).rowCount > 0;
      kind = has ? 'completed' : 'verify_new';
    }

    if (kind !== 'completed') {
      if (attempt.participant_id && attempt.participant_id !== p.id) {
        // The result is attached to another address from this browser. If that address never verified (a typo),
        // release it; if it did verify, the result is taken and this address must play its own game.
        const owner = (await t.query('SELECT verified_at FROM quiz.participants WHERE id = $1', [attempt.participant_id])).rows[0];
        if (owner && owner.verified_at) throw new HttpError(409, 'attempt_already_claimed');
      }
      await t.query(`UPDATE quiz.attempts SET participant_id = $2 WHERE id = $1`, [attempt.id, p.id]);
    }
    const issued = await issueToken(ctx, t, p.id);
    const outboxId = await mailer.queue(t, { participantId: p.id, kind: 'signin', language: signup.language, key: `signin:${issued.tokenId}` });
    await track(t, { anonId: p.anon_id, name: 'verification_requested', language: signup.language, props: { kind } });
    return { p, kind, issued, outboxId };
  });

  const status = await sendSignin(ctx, prepared, signup.language);
  if (status === 'failed') throw new HttpError(503, 'email_unavailable');
  return { status: 'check_email', ttlMinutes: ctx.cfg.verifyTtlMinutes };
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
    const has = (await t.query('SELECT 1 FROM quiz.rewards WHERE participant_id = $1', [p.id])).rowCount > 0;
    const kind = has ? 'completed' : 'verify_new';
    const issued = await issueToken(ctx, t, p.id);
    const outboxId = await mailer.queue(t, { participantId: p.id, kind: 'signin', language, key: `signin:${issued.tokenId}` });
    return { p, kind, issued, outboxId };
  });
  if (prepared) await sendSignin(ctx, prepared, language);
  return { status: 'check_email', ttlMinutes: ctx.cfg.verifyTtlMinutes };
};

// ---------------------------------------------------------------- verify + claim
// Verify by link token OR by email+code. All failures look the same to the caller. On success the browser's session
// becomes this participant's session and, if their attempt has no reward yet, the reward is issued and emailed.
const verify = async (ctx, { token, email, code, ip, currentRaw }) => {
  const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [
    [`verify:ip:${ip}`, 3600, 40],
    ...(email ? [[`verify:email:${email}`, 3600, 12]] : []),
  ], ctx.now());
  if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
  const invalid = () => new HttpError(400, 'invalid_or_expired');
  const current = await getSession(ctx, currentRaw);

  const out = await ctx.db.tx(async (t) => {
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
        return { __invalid: true };   // commit the counter even though we reject
      }
    }
    const used = await t.query('UPDATE quiz.verification_tokens SET consumed_at = now() WHERE id=$1 AND consumed_at IS NULL RETURNING id', [row.id]);
    if (!used.rowCount) throw invalid();
    const pid = row.participant_id;
    if (!row.verified_at) {
      await t.query('UPDATE quiz.participants SET verified_at = now(), updated_at = now() WHERE id=$1', [pid]);
      await track(t, { anonId: row.anon_id, name: 'verification_completed', language: row.language, attribution: row.attribution });
    }
    // Session: upgrade the browser's current session when it is anonymous or already this participant's; else start one.
    let raw = null;
    if (current && (!current.participant_id || current.participant_id === pid)) {
      await t.query('UPDATE quiz.sessions SET participant_id = $2, expires_at = $3 WHERE id = $1', [current.id, pid, new Date(ctx.now().getTime() + ctx.cfg.sessionTtlDays * 86_400_000)]);
    } else {
      raw = (await createSession(ctx, t, { participantId: pid, language: row.language })).raw;
    }
    const claim = await rewards.claim(ctx, t, pid, row.language);
    return { session: raw, participantId: pid, claim: claim.status, outboxId: claim.outboxId, tier: claim.tier, pending: claim.pending };
  });
  if (out && out.__invalid) throw invalid();
  if (out.pending) await raiseAlert(ctx, `inventory_depleted_${out.tier}`, { tier: out.tier, note: 'earned reward preserved; will be issued on import' });
  if (out.outboxId) await mailer.deliverReward(ctx, out.outboxId);
  if (out.claim === 'claimed') await rewards.checkInventory(ctx);
  return out;
};

// Verified participant of the current session, or null.
const getSessionParticipant = async (ctx, rawSession) => {
  const s = await getSession(ctx, rawSession);
  if (!s || !s.participant_id || !s.verified_at) return null;
  return (await ctx.db.query('SELECT * FROM quiz.participants WHERE id = $1', [s.participant_id])).rows[0] || null;
};

module.exports = { getSession, ensureSession, createSession, requestSignin, resendSignin, verify, getSessionParticipant, revokeSession, MARKETING_WORDING, WORDING_VERSION, TERMS_VERSION, MAX_CODE_ATTEMPTS };
