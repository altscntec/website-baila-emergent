'use strict';
const { HttpError, send, readBody, readRaw, parseCookies, clientIp, SESSION_COOKIE, sessionCookie, clearSessionCookie } = require('./lib/http');
const { validateSignup, LANGS } = require('./lib/validate');
const { normalizeEmail } = require('./lib/normalize');
const { sha256, safeEqual } = require('./lib/crypto');
const { hit, peek, hitAll } = require('./lib/ratelimit');
const { getSettings, campaignState } = require('./lib/settings');
const { verifySvix } = require('./mail/webhook');
const auth = require('./services/auth');
const quiz = require('./services/quiz');
const rewards = require('./services/rewards');
const mailer = require('./services/mailer');
const admin = require('./services/admin');
const metricsSvc = require('./services/metrics');
const counters = require('./services/counters');
const webhooks = require('./services/webhooks');
const h27 = require('./services/h27');
const { track } = require('./services/events');
const { configProblems } = require('./config');

const lang = (v) => (LANGS.includes(v) ? v : 'en');
const keyMatches = (given, expected) => Boolean(expected) && Boolean(given) && safeEqual(sha256(given), sha256(expected));
const bearer = (req) => (String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i) || [])[1] || '';

const checkOrigin = (ctx, req) => {
  const o = req.headers.origin;
  if (o && !ctx.cfg.allowedOrigins.includes(o)) throw new HttpError(403, 'bad_origin');
};

const requireAdmin = async (ctx, req, { allowAnalytics = false } = {}) => {
  const ip = clientIp(req);
  if ((await peek(ctx.db, ctx.cfg.appSecret, `adminfail:${ip}`, 900, ctx.now())) >= 10) throw new HttpError(429, 'rate_limited', { retryAfter: 900 });
  const k = bearer(req);
  if (keyMatches(k, ctx.cfg.adminKey)) return 'admin';
  if (allowAnalytics && keyMatches(k, ctx.cfg.analyticsKey)) return 'analytics';
  await hit(ctx.db, ctx.cfg.appSecret, `adminfail:${ip}`, 900, 10, ctx.now());
  throw new HttpError(401, 'unauthorized');
};

const rawSession = (req) => parseCookies(req.headers.cookie)[SESSION_COOKIE];
const sessionOf = async (ctx, req) => ({ raw: rawSession(req), session: await auth.getSession(ctx, rawSession(req)) });
const needSession = async (ctx, req) => {
  const s = await sessionOf(ctx, req);
  if (!s.session) throw new HttpError(401, 'no_session');
  return s;
};
const needParticipant = async (ctx, req) => {
  const s = await sessionOf(ctx, req);
  if (!s.session || !s.session.participant_id || !s.session.verified_at) throw new HttpError(401, 'no_session');
  const participant = (await ctx.db.query('SELECT * FROM quiz.participants WHERE id = $1', [s.session.participant_id])).rows[0];
  if (!participant) throw new HttpError(401, 'no_session');
  return { ...s, participant };
};
const cookieFor = (ctx, raw) => (raw ? { 'Set-Cookie': sessionCookie(raw, { maxAgeSec: ctx.cfg.sessionTtlDays * 86400, secure: ctx.cfg.cookieSecure }) } : {});

const routes = [
  ['GET', '/api/quiz/config', async (ctx) => {
    const s = await getSettings(ctx.db);
    return { body: {
      state: campaignState(s, ctx.now()), opensAt: s.opens_at, closesAt: s.closes_at, codeExpiresAt: s.code_expires_at, codeValidHours: s.code_valid_hours,
      timezone: 'Europe/Amsterdam', retentionDays: s.retention_days, marketing: { version: auth.WORDING_VERSION, wording: auth.MARKETING_WORDING }, termsVersion: auth.TERMS_VERSION,
    } };
  }],

  ['POST', '/api/quiz/ping', async (ctx, req, body) => {
    const ok = await counters.bump(ctx.db, { metric: body.metric, attribution: body.attribution, language: body.language, userAgent: req.headers['user-agent'], now: ctx.now() });
    return { status: 204, body: null, counted: ok };
  }],

  // ---- play first (anonymous browser session), then give details, then verify ----
  ['GET', '/api/quiz/state', async (ctx, req, body, url) => {
    const { session } = await sessionOf(ctx, req);
    return { body: await quiz.getState(ctx, session, lang(url.searchParams.get('lang') || (session && (session.participant_language || session.language)))) };
  }],

  ['POST', '/api/quiz/start', async (ctx, req, body) => {
    const l = lang(body.language);
    const { session, raw } = await auth.ensureSession(ctx, rawSession(req), l);
    if (raw) {
      const rl = await hit(ctx.db, ctx.cfg.appSecret, `start:ip:${clientIp(req)}`, 3600, 20, ctx.now());
      if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
    }
    await quiz.startAttempt(ctx, session, l);
    return { headers: cookieFor(ctx, raw), body: await quiz.getState(ctx, session, l) };
  }],

  ['POST', '/api/quiz/answer', async (ctx, req, body) => {
    const { session } = await needSession(ctx, req);
    const rl = await hit(ctx.db, ctx.cfg.appSecret, `answer:${session.id}`, 3600, 200, ctx.now());
    if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
    if (typeof body.questionId !== 'string' || typeof body.optionId !== 'string' || body.questionId.length > 20 || body.optionId.length > 10) throw new HttpError(400, 'validation');
    return { body: await quiz.submitAnswer(ctx, session, { questionId: body.questionId, optionId: body.optionId, lang: lang(body.language || session.language) }) };
  }],

  ['POST', '/api/quiz/signup', async (ctx, req, body) => {
    const v = validateSignup(body);
    if (!v.ok) {
      const fields = Object.entries(v.errors).map(([f, c]) => `${f}:${c}`);
      await track(ctx.db, { name: 'form_rejected', language: LANGS.includes(body && body.language) ? body.language : null, props: { fields } });
      throw new HttpError(400, 'validation', { fields: v.errors });
    }
    const { session } = await sessionOf(ctx, req);
    return { body: await auth.requestSignin(ctx, { signup: v.value, ip: clientIp(req), session }) };
  }],

  ['POST', '/api/quiz/resend', async (ctx, req, body) => {
    const emailNorm = normalizeEmail(body.email);
    if (!emailNorm) throw new HttpError(400, 'validation', { fields: { email: 'invalid' } });
    return { body: await auth.resendSignin(ctx, { emailNorm, language: lang(body.language), ip: clientIp(req) }) };
  }],

  ['POST', '/api/quiz/verify', async (ctx, req, body) => {
    const r = await auth.verify(ctx, { token: body.token, email: body.token ? undefined : normalizeEmail(body.email), code: body.code, ip: clientIp(req), currentRaw: rawSession(req) });
    return { headers: cookieFor(ctx, r.session), body: { status: 'verified', claim: r.claim } };
  }],

  ['POST', '/api/quiz/logout', async (ctx, req) => {
    await auth.revokeSession(ctx, rawSession(req));
    return { headers: { 'Set-Cookie': clearSessionCookie({ secure: ctx.cfg.cookieSecure }) }, body: { status: 'ok' } };
  }],

  ['POST', '/api/quiz/language', async (ctx, req, body) => {
    // Switching language only changes how the SAME attempt is displayed; it never touches theme, questions or answers.
    const { session } = await needSession(ctx, req);
    const l = lang(body.language);
    await ctx.db.query('UPDATE quiz.sessions SET language=$2 WHERE id=$1', [session.id, l]);
    if (session.participant_id) await ctx.db.query('UPDATE quiz.participants SET language=$2, updated_at=now() WHERE id=$1', [session.participant_id, l]);
    return { body: await quiz.getState(ctx, { ...session, language: l, participant_language: l }, l) };
  }],

  ['POST', '/api/quiz/resend-reward', async (ctx, req, body) => {
    const { participant } = await needParticipant(ctx, req);
    const rl = await hitAll(ctx.db, ctx.cfg.appSecret, [[`rwresend:${participant.id}`, 86400, 4], [`rwresend:cool:${participant.id}`, 300, 1]], ctx.now());
    if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
    const s = await getSettings(ctx.db);
    if (campaignState(s, ctx.now()) === 'disabled') throw new HttpError(403, 'campaign_unavailable', { state: 'disabled' });
    const r = await rewards.resendReward(ctx, participant, { language: lang(body.language || participant.language) });
    return { body: { status: r.status } };
  }],

  ['POST', '/api/quiz/unsubscribe', async (ctx, req, body) => {
    const rl = await hit(ctx.db, ctx.cfg.appSecret, `unsub:${clientIp(req)}`, 3600, 30, ctx.now());
    if (!rl.allowed) throw new HttpError(429, 'rate_limited', { retryAfter: rl.retryAfter });
    return { body: await admin.unsubscribe(ctx, body.token) };
  }],

  // Provider webhook: authenticated by signature, not by origin.
  ['POST', '/api/webhooks/resend', async (ctx, req, _b, _u, raw) => {
    const v = verifySvix({ secret: ctx.cfg.resendWebhookSecret, headers: req.headers, rawBody: raw, now: ctx.now().getTime() });
    if (!v.ok) throw new HttpError(401, 'bad_signature');
    let event; try { event = JSON.parse(raw); } catch { throw new HttpError(400, 'bad_json'); }
    return { body: await webhooks.handleResendEvent(ctx, v.id, event) };
  }, { raw: true, noOrigin: true }],

  ['GET', '/api/cron/retry', async (ctx, req) => {
    if (!keyMatches(bearer(req), ctx.cfg.cronSecret)) throw new HttpError(401, 'unauthorized');
    const mail = await mailer.retryDueRewards(ctx);
    const fulfilled = await rewards.fulfilPending(ctx);
    await rewards.checkInventory(ctx);
    await require('./lib/ratelimit').purge(ctx.db);
    return { body: { mail, pendingRewardsFulfilled: fulfilled } };
  }, { noOrigin: true }],

  // ---- Halloween 2027 early-release list (/halloween/2027): hidden until cfg.h27OpensAt ----
  ['GET', '/api/h27/status', async (ctx) => ({ body: h27.status(ctx) })],
  ['POST', '/api/h27/signup', async (ctx, req, body) => ({ body: await h27.signup(ctx, body, { ip: clientIp(req) }) })],
  ['POST', '/api/h27/email/verify', async (ctx, req, body) => ({ body: await h27.verifyEmail(ctx, { token: body.token, code: body.code }) })],
  ['POST', '/api/h27/email/resend', async (ctx, req, body) => ({ body: await h27.resendEmailCode(ctx, { token: body.token }) })],
  ['POST', '/api/h27/phone/start', async (ctx, req, body) => ({ body: await h27.startPhone(ctx, { token: body.token, channel: body.channel }) })],
  ['POST', '/api/h27/phone/verify', async (ctx, req, body) => ({ body: await h27.verifyPhone(ctx, { token: body.token, code: body.code }) })],
  ['POST', '/api/h27/unsubscribe', async (ctx, req, body) => ({ body: await h27.unsubscribe(ctx, body.token) })],
  ['GET', '/api/admin/h27/summary', async (ctx, req) => { await requireAdmin(ctx, req); return { body: await h27.summary(ctx) }; }, { noOrigin: true }],
  ['GET', '/api/admin/h27/leads.csv', async (ctx, req) => { const a = await requireAdmin(ctx, req); return { text: await h27.exportCsv(ctx, a), headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="halloween-2027-early-release.csv"' } }; }, { noOrigin: true }],

  // ---- Owner controls (Bearer ADMIN_API_KEY) ----
  ['GET', '/api/admin/overview', async (ctx, req) => { await requireAdmin(ctx, req); return { body: await admin.overview(ctx) }; }, { noOrigin: true }],
  ['PUT', '/api/admin/settings', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.updateSettings(ctx, body, a) }; }],
  ['POST', '/api/admin/codes/import', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.importCodes(ctx, body, a) }; }, { maxBody: 4 * 1024 * 1024 }],
  ['GET', '/api/admin/questions', async (ctx, req) => { await requireAdmin(ctx, req); return { body: { questions: await admin.listQuestions(ctx) } }; }, { noOrigin: true }],
  ['POST', '/api/admin/questions/import', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.importQuestions(ctx, body.questions, a) }; }, { maxBody: 4 * 1024 * 1024 }],
  ['POST', '/api/admin/questions/active', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.setQuestionActive(ctx, body.id, body.active, a) }; }],
  ['GET', '/api/admin/emails', async (ctx, req, _b, url) => { await requireAdmin(ctx, req); return { body: { emails: await admin.listEmails(ctx, url.searchParams.get('status')) } }; }, { noOrigin: true }],
  ['POST', '/api/admin/emails/retry', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.retryEmail(ctx, body.id, a) }; }],
  ['GET', '/api/admin/leads.csv', async (ctx, req) => { const a = await requireAdmin(ctx, req); return { text: await admin.exportLeads(ctx, a), headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="optin-leads.csv"' } }; }, { noOrigin: true }],
  ['POST', '/api/admin/participants/delete', async (ctx, req, body) => {
    const a = await requireAdmin(ctx, req); const e = normalizeEmail(body.email); if (!e) throw new HttpError(400, 'validation');
    return { body: await admin.deleteParticipant(ctx, e, a) };
  }],
  ['POST', '/api/admin/retention/run', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.runRetention(ctx, a, { dryRun: body.dryRun !== false }) }; }],
  ['POST', '/api/admin/redemptions/import', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.importRedemptions(ctx, body, a) }; }, { maxBody: 4 * 1024 * 1024 }],
  ['POST', '/api/admin/alerts/resolve', async (ctx, req, body) => { const a = await requireAdmin(ctx, req); return { body: await admin.resolveAlert(ctx, body.id, a) }; }],
  // Read-only aggregate metrics: also available to the separate ANALYTICS_API_KEY used by the daily agent.
  ['GET', '/api/admin/metrics', async (ctx, req, _b, url) => {
    await requireAdmin(ctx, req, { allowAnalytics: true });
    const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')) : ctx.now();
    const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')) : new Date(to.getTime() - 86_400_000);
    if (Number.isNaN(+from) || Number.isNaN(+to) || to <= from) throw new HttpError(400, 'invalid_window');
    return { body: await metricsSvc.metrics(ctx.db, { from, to }) };
  }, { noOrigin: true }],
];

const createHandler = (ctx) => async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname.replace(/\/$/, '') || '/';
  const route = routes.find((r) => r[0] === req.method && r[1] === pathname);
  try {
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (!route) {
      const known = routes.some((r) => r[1] === pathname);
      throw new HttpError(known ? 405 : 404, known ? 'method_not_allowed' : 'not_found');
    }
    const problems = configProblems(ctx.cfg);
    if (problems.length) throw new HttpError(503, 'not_configured', { missing: ctx.cfg.isProd ? undefined : problems });
    const opts = route[3] || {};
    if (req.method !== 'GET' && !opts.noOrigin) checkOrigin(ctx, req);
    if (opts.maxBody) await requireAdmin(ctx, req);   // big bodies are only read for authenticated callers
    let raw = null; let body = {};
    if (opts.raw) raw = await readRaw(req);
    else if (req.method !== 'GET') body = await readBody(req, opts.maxBody || 32 * 1024);
    if (body === null || typeof body !== 'object') body = {};
    const out = await route[2](ctx, req, body, url, raw);
    if (out.text !== undefined) return send(res, 200, out.text, out.headers);
    if (out.status === 204) return send(res, 204, '', out.headers);
    return send(res, out.status || 200, out.body, out.headers);
  } catch (e) {
    if (e instanceof HttpError) {
      const headers = e.extra && e.extra.retryAfter ? { 'Retry-After': String(e.extra.retryAfter) } : {};
      return send(res, e.status, { error: e.code, ...e.extra }, headers);
    }
    // Never log request data: pg errors can embed values. Log only stable identifiers.
    console.error('[quiz-api]', req.method, pathname, e && (e.code || e.name), e && e.constraint ? e.constraint : '');
    return send(res, 500, { error: 'server_error' });
  }
};

module.exports = { createHandler, routes };
