'use strict';
// TEST-ONLY harness. Real Postgres (embedded), real HTTP, real router and services.
// The mail adapter below is a capturing fake used ONLY in tests; production uses mail/resend.js.
const http = require('http');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { createDb, poolFromUrl } = require('../db');
const { migrate } = require('../migrate');
const { loadConfig } = require('../config');
const { createHandler } = require('../router');
const { MailError } = require('../mail/resend');
const { hmac } = require('../lib/crypto');

const startPostgres = async () => {
  const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bdq-pg-'));
  const port = 54000 + Math.floor(Math.random() * 1000);
  const pg = new EmbeddedPostgres({ databaseDir: dir, user: 'postgres', password: 'pw', port, persistent: false, onLog: () => {}, onError: () => {} });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase('quiztest');
  const url = `postgres://postgres:pw@localhost:${port}/quiztest`;
  const db = createDb(poolFromUrl(url, { max: 12 }));
  await migrate(db);
  return { db, url, stop: async () => { await db.end(); await pg.stop(); fs.rmSync(dir, { recursive: true, force: true }); } };
};

class TestMail {
  constructor() { this.sent = []; this.failures = []; this.name = 'test-capture'; this.configured = true; }
  failNext(...errs) { this.failures.push(...errs); }
  async send(msg) {
    const f = this.failures.shift();
    if (f) throw f;
    const dup = this.sent.find((m) => m.idempotencyKey && m.idempotencyKey === msg.idempotencyKey);
    if (dup) return { providerMessageId: dup.providerMessageId };   // provider-side idempotency
    const providerMessageId = `msg_${crypto.randomUUID()}`;
    this.sent.push({ ...msg, providerMessageId });
    return { providerMessageId };
  }
  to(email) { return this.sent.filter((m) => m.to === email); }
  last(email, kindTag) { return this.to(email).filter((m) => !kindTag || (m.tags || []).some((t) => t.value === kindTag)).slice(-1)[0]; }
}
const transient = (m = 'provider_503') => new MailError(m, { permanent: false, status: 503 });
const permanent = (m = 'provider_422') => new MailError(m, { permanent: true, status: 422 });

const TEST_ENV = {
  DATABASE_URL: 'x', APP_SECRET: 'test-secret-test-secret-test-secret-123', ADMIN_API_KEY: 'admin-key-test', ANALYTICS_API_KEY: 'analytics-key-test',
  CRON_SECRET: 'cron-secret', RESEND_WEBHOOK_SECRET: 'whsec_' + Buffer.from('webhook-test-secret').toString('base64'),
  OWNER_ALERT_EMAIL: 'owner@test.invalid', SITE_ORIGIN: 'http://localhost:3999', NODE_ENV: 'test', MAIL_FROM: 'Test <t@test.invalid>',
};

const makeEnv = async (pgState, overrides = {}) => {
  const clock = { offsetMs: 0 };
  const mail = new TestMail();
  const cfg = { ...loadConfig(TEST_ENV), ...overrides };
  const ctx = { cfg, db: pgState.db, mail, now: () => new Date(Date.now() + clock.offsetMs), rng: undefined };
  const server = http.createServer(createHandler(ctx));
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}`;
  const api = async (method, p, { body, cookie, headers = {}, key, ip } = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...(key ? { Authorization: `Bearer ${key}` } : {}), ...(ip ? { 'x-real-ip': ip } : {}), ...headers },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    });
    const text = await res.text();
    let json = null; try { json = JSON.parse(text); } catch (_) { /* csv or empty */ }
    const setCookie = res.headers.get('set-cookie');
    return { status: res.status, json, text, headers: res.headers, cookie: setCookie ? setCookie.split(';')[0] : null };
  };
  const admin = (method, p, body) => api(method, p, { body, key: TEST_ENV.ADMIN_API_KEY });
  return { ctx, mail, clock, api, admin, base, close: () => new Promise((r) => server.close(r)) };
};

// ---- Synthetic question bank (test data only; real questions live in quiz-private/) ----
const PREFIX = { movies: 'MOV', facts: 'FAC', spells: 'SPL', music: 'MUS' };
const syntheticBank = (perTheme = 10) => {
  const out = [];
  for (const [theme, pre] of Object.entries(PREFIX)) {
    for (let n = 1; n <= perTheme; n++) {
      const t = (l) => ({ en: `${pre} ${n} question (${l})`, es: `${pre} ${n} pregunta (${l})`, nl: `${pre} ${n} vraag (${l})` });
      const opt = (id) => ({ id, text: { en: `${pre}${n} option ${id} EN`, es: `${pre}${n} opcion ${id} ES`, nl: `${pre}${n} optie ${id} NL` } });
      out.push({
        id: `${pre}-${String(n).padStart(3, '0')}`, theme, correct: ['a', 'b', 'c', 'd'][n % 4],
        prompt: { en: `${pre} ${n} question EN`, es: `${pre} ${n} pregunta ES`, nl: `${pre} ${n} vraag NL` },
        options: ['a', 'b', 'c', 'd'].map(opt), explanation: t('why'), source_notes: 'synthetic test data',
      });
    }
  }
  return out;
};

const FUTURE = { opens_at: '2020-01-01T00:00:00+01:00', closes_at: '2099-01-01T00:00:00+01:00', code_expires_at: '2099-01-01T00:00:00+01:00' };
// Opens the campaign the same way the owner would: settings + inventory + question bank, through the admin API.
const openCampaign = async (env, { codesPerTier = 30, bank = syntheticBank(), settings = {} } = {}) => {
  const q = await env.admin('POST', '/api/admin/questions/import', { questions: bank });
  if (q.status !== 200) throw new Error('question import failed ' + q.text);
  for (const tier of [5, 10, 15]) {
    if (codesPerTier > 0) {
      const codes = Array.from({ length: codesPerTier }, (_, i) => `TEST${tier}X${String(i).padStart(3, '0')}${crypto.randomBytes(2).toString('hex').toUpperCase()}`);
      const r = await env.admin('POST', '/api/admin/codes/import', { tier, batch: 'test', codes });
      if (r.status !== 200) throw new Error('code import failed ' + r.text);
    }
  }
  const s = await env.admin('PUT', '/api/admin/settings', { offer_confirmed: true, retention_days: 30, enabled: true, ...FUTURE, eligible_ticket_types: ['General admission'], ...settings });
  if (s.status !== 200) throw new Error('settings failed ' + s.text);
};

const resetDb = async (db) => {
  await db.query(`TRUNCATE quiz.participants, quiz.sessions, quiz.attempts, quiz.questions, quiz.discount_codes, quiz.rate_limits, quiz.funnel_events, quiz.daily_counters,
    quiz.owner_alerts, quiz.audit_log, quiz.email_events, quiz.email_outbox, quiz.settings, quiz.suppressions, quiz.redemptions RESTART IDENTITY CASCADE`);
};

let seq = 0;
const nextIp = () => { seq++; return `10.${Math.floor(seq / 250) % 250}.${seq % 250}.7`; };
const signupBody = (over = {}) => ({
  fullName: 'Test Person', email: `person${++seq}@test.invalid`, age: 27, gender: 'prefer_not_to_say', city: 'Amsterdam', country: 'NL',
  language: 'en', acceptTerms: true, marketingOptIn: false, attribution: { utm_source: 'meta', utm_campaign: 'quiz_test' }, ...over,
});

const linkTokenFrom = (msg) => (msg.text.match(/#t=([A-Za-z0-9_-]+)/) || [])[1];
const codeFrom = (msg) => (msg.text.match(/: (\d{6})\b/) || [])[1];

// ---- Play-first journey helpers ----
// Start an anonymous attempt in a fresh browser; returns the session cookie and the first state.
const startAnon = async (env, { lang = 'en', ip } = {}) => {
  const r = await env.api('POST', '/api/quiz/start', { body: { language: lang }, ip: ip || nextIp() });
  if (r.status !== 200) throw new Error('start failed ' + r.text);
  return { cookie: r.cookie, state: r.json };
};

// Test-only: peek at the stored key (the browser can never do this) to play an attempt with an exact score.
const keyFor = async (env, cookie) => {
  const raw = decodeURIComponent(cookie.split('=')[1]);
  const h = hmac(env.ctx.cfg.appSecret, `tok:sess:${raw}`);
  return (await env.ctx.db.query(
    `SELECT aq.question_id, aq.correct_option_id, aq.option_order, aq.selected_option_id FROM quiz.attempt_questions aq
       JOIN quiz.attempts a ON a.id = aq.attempt_id
       JOIN quiz.sessions s ON (s.id = a.session_id OR s.participant_id = a.participant_id)
      WHERE s.token_hash = $1 ORDER BY aq.position`, [h])).rows;
};

// Plays the whole attempt in an existing session; picks answers by the supplied strategy (default: first option).
const play = async (env, cookie, pick = () => 0, lang = 'en') => {
  let st = (await env.api('GET', `/api/quiz/state?lang=${lang}`, { cookie })).json;
  const seen = [];
  while (st.question) {
    seen.push(st.question);
    const o = st.question.options[pick(st.question, seen.length - 1)];
    const r = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: o.id, language: lang } });
    if (r.status !== 200) throw new Error('answer failed ' + r.text);
    st = r.json;
  }
  return { state: st, questions: seen };
};

// Starts and plays an anonymous attempt to an exact score. Returns the cookie and final state.
const playScore = async (env, correctCount, { lang = 'en', ip } = {}) => {
  const { cookie } = await startAnon(env, { lang, ip });
  const key = await keyFor(env, cookie);
  let last;
  for (let i = 0; i < key.length; i++) {
    const wrong = key[i].option_order.find((o) => o !== key[i].correct_option_id);
    const optionId = i < correctCount ? key[i].correct_option_id : wrong;
    last = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: key[i].question_id, optionId, language: lang } });
    if (last.status !== 200) throw new Error('answer failed ' + last.text);
  }
  return { cookie, state: last.json };
};

// Signup (after playing) + verify via the emailed link, in the same browser. Returns everything useful.
const claim = async (env, cookie, over = {}) => {
  const body = signupBody(over);
  const ip = over.__ip || nextIp();
  delete body.__ip;
  const s = await env.api('POST', '/api/quiz/signup', { body, cookie, ip });
  if (s.status !== 200) throw new Error('signup failed ' + s.text);
  const mail = env.mail.last(body.email.trim(), 'signin');
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: linkTokenFrom(mail) }, cookie, ip });
  if (v.status !== 200) throw new Error('verify failed ' + v.text);
  const state = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  return { body, cookie, verify: v.json, state };
};

// Whole journey with an exact score: play -> signup -> verify. Backwards-compatible name used across the suites.
const fullJourney = async (env, correctCount, over = {}) => {
  const { cookie } = await playScore(env, correctCount, { lang: over.language || 'en' });
  return claim(env, cookie, over);
};

module.exports = { startPostgres, makeEnv, TestMail, transient, permanent, TEST_ENV, syntheticBank, openCampaign, resetDb, signupBody, linkTokenFrom, codeFrom, FUTURE, startAnon, keyFor, play, playScore, claim, fullJourney, nextIp };
