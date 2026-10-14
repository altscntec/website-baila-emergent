'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.mail.failures.length = 0; env.clock.offsetMs = 0; });
const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;

// Play + signup in a fresh browser; returns what is needed to verify.
const signedUp = async (over = {}) => {
  const { cookie } = await H.playScore(env, 3);
  const body = H.signupBody(over);
  const s = await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  assert.equal(s.status, 200);
  return { cookie, body, mail: env.mail.last(body.email, 'signin') };
};

test('verification link: single use, wrong token rejected, nothing claimable without it; token stored hashed', async () => {
  await H.openCampaign(env);
  const { cookie, body, mail } = await signedUp();
  const tok = H.linkTokenFrom(mail);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: tok + 'x' }, cookie })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: '' }, cookie })).status, 400);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.claim, 'pending_verification');
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: tok }, cookie })).status, 200);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: tok }, cookie })).json.error, 'invalid_or_expired', 'single use');
  assert.ok(!JSON.stringify(await rows('SELECT * FROM quiz.verification_tokens')).includes(tok));
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.rewards`))[0].n, 1);
  void body;
});

test('verification link and code expire after the TTL; nothing is issued', async () => {
  await H.openCampaign(env);
  const { cookie, body, mail } = await signedUp();
  env.clock.offsetMs = 31 * 60_000;
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) }, cookie })).json.error, 'invalid_or_expired');
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: H.codeFrom(mail) }, cookie })).json.error, 'invalid_or_expired');
  assert.equal((await rows('SELECT verified_at FROM quiz.participants'))[0].verified_at, null);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 0);
});

test('6-digit code works, is single use, locks after 5 wrong guesses, and a fresh email unlocks again', async () => {
  await H.openCampaign(env);
  const { cookie, body, mail } = await signedUp();
  const good = H.codeFrom(mail); const bad = good === '000000' ? '000001' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: bad }, cookie, ip: `9.9.9.${i}` })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: good }, cookie, ip: '9.9.9.99' })).status, 400, 'locked out');
  env.clock.offsetMs += 120_000;
  await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: H.nextIp() });
  const fresh = H.codeFrom(env.mail.last(body.email, 'signin'));
  const ok = await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: fresh }, cookie });
  assert.equal(ok.status, 200); assert.equal(ok.json.claim, 'claimed');
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: fresh }, cookie })).status, 400);
});

test('an older link stops working once a newer one is issued', async () => {
  await H.openCampaign(env);
  const { cookie, body, mail } = await signedUp();
  env.clock.offsetMs += 120_000;
  await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: H.nextIp() });
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) }, cookie })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last(body.email, 'signin')) }, cookie })).status, 200);
});

test('rate limits: anonymous starts per IP, signup per email cooldown and per IP, resend, verify', async () => {
  await H.openCampaign(env);
  let blockedStarts = 0;
  for (let i = 0; i < 24; i++) { const r = await env.api('POST', '/api/quiz/start', { body: {}, ip: '7.7.7.1' }); if (r.status === 429) blockedStarts++; }
  assert.ok(blockedStarts >= 3, `anonymous plays per IP are limited (${blockedStarts})`);
  const { cookie } = await H.playScore(env, 1);
  const body = H.signupBody();
  assert.equal((await env.api('POST', '/api/quiz/signup', { body, cookie, ip: '1.1.1.1' })).status, 200);
  const again = await env.api('POST', '/api/quiz/signup', { body, cookie, ip: '1.1.1.2' });
  assert.equal(again.status, 429); assert.ok(again.headers.get('retry-after'));
  assert.equal((await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: '1.1.1.3' })).status, 200);
  assert.equal((await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: '1.1.1.4' })).status, 429);
  let blocked = 0;
  for (let i = 0; i < 14; i++) { const { cookie: c } = await H.playScore(env, 0); const r = await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), cookie: c, ip: '7.7.7.7' }); if (r.status === 429) blocked++; }
  assert.ok(blocked >= 4, `signup per IP (${blocked})`);
  let vblocked = 0;
  for (let i = 0; i < 45; i++) { const r = await env.api('POST', '/api/quiz/verify', { body: { token: 'nope' + i }, ip: '8.8.8.8' }); if (r.status === 429) vblocked++; }
  assert.ok(vblocked >= 4, 'verify attempts are limited per IP');
});

test('no account enumeration: new, unverified, already-played emails and unknown resends all look the same', async () => {
  await H.openCampaign(env);
  const fresh = await signedUp();
  const done = await H.fullJourney(env, 2);
  env.clock.offsetMs += 120_000;
  const { cookie: c1 } = await H.playScore(env, 1); const r1 = await env.api('POST', '/api/quiz/signup', { body: fresh.body, cookie: c1, ip: H.nextIp() });
  const { cookie: c2 } = await H.playScore(env, 1); const r2 = await env.api('POST', '/api/quiz/signup', { body: done.body, cookie: c2, ip: H.nextIp() });
  const { cookie: c3 } = await H.playScore(env, 1); const r3 = await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), cookie: c3, ip: H.nextIp() });
  for (const r of [r1, r2, r3]) { assert.equal(r.status, 200); assert.deepEqual(r.json, r3.json); }
  const before = env.mail.sent.length;
  const ghost = await env.api('POST', '/api/quiz/resend', { body: { email: 'nobody-here@test.invalid', language: 'en' }, ip: H.nextIp() });
  assert.deepEqual(ghost.json, r3.json); assert.equal(env.mail.sent.length, before);
  const a = await env.api('POST', '/api/quiz/verify', { body: { email: 'nobody-here@test.invalid', code: '123456' }, ip: H.nextIp() });
  const b = await env.api('POST', '/api/quiz/verify', { body: { email: fresh.body.email, code: '123456' }, ip: H.nextIp() });
  assert.deepEqual(a.json, b.json);
});

test('one participant per normalised email (DB uniqueness); casing/whitespace collapse, gmail dots do not; DB refuses under-18', async () => {
  await H.openCampaign(env);
  const base = H.signupBody({ email: 'Mixed.Case@Test.Invalid' });
  const { cookie: c1 } = await H.playScore(env, 0); await env.api('POST', '/api/quiz/signup', { body: base, cookie: c1, ip: H.nextIp() });
  env.clock.offsetMs += 120_000;
  const { cookie: c2 } = await H.playScore(env, 0); await env.api('POST', '/api/quiz/signup', { body: { ...base, email: '  mixed.case@test.invalid ' }, cookie: c2, ip: H.nextIp() });
  const { cookie: c3 } = await H.playScore(env, 0); await env.api('POST', '/api/quiz/signup', { body: { ...base, email: 'mixedcase@test.invalid' }, cookie: c3, ip: H.nextIp() });
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.participants'))[0].n, 2);
  await assert.rejects(pg.db.query(`INSERT INTO quiz.participants (email_norm,email,full_name,age,gender,city,country,language,terms_version) VALUES ('mixed.case@test.invalid','x','x',20,'man','x','NL','en','v')`), /participants_email_norm_key/);
  await assert.rejects(pg.db.query(`UPDATE quiz.participants SET age = 17`), /check/i);
});

test('concurrency: parallel starts in one browser create exactly one attempt', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.startAnon(env);
  const rs = await Promise.all(Array.from({ length: 12 }, () => env.api('POST', '/api/quiz/start', { cookie, body: {} })));
  assert.ok(rs.every((r) => r.status === 200));
  assert.equal(new Set(rs.map((r) => r.json.question.id)).size, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempt_questions'))[0].n, 5);
});

test('concurrency: duplicate verifications and duplicate final answers never produce two rewards, codes or emails', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.startAnon(env);
  const key = await H.keyFor(env, cookie);
  for (let i = 0; i < 4; i++) await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: key[i].question_id, optionId: key[i].correct_option_id } });
  const last = key[4];
  const rs = await Promise.all(Array.from({ length: 10 }, () => env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: last.question_id, optionId: last.correct_option_id } })));
  assert.ok(rs.every((r) => r.status === 200 && r.json.result.tier === 15));
  const body = H.signupBody();
  await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  const tok = H.linkTokenFrom(env.mail.last(body.email, 'signin'));
  const vs = await Promise.all(Array.from({ length: 8 }, () => env.api('POST', '/api/quiz/verify', { body: { token: tok }, cookie })));
  assert.equal(vs.filter((v) => v.status === 200).length, 1, 'only one verification wins');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`))[0].n, 1);
  assert.equal(env.mail.to(body.email).filter((m) => m.tags.some((t) => t.value === 'reward')).length, 1);
});

test('concurrency: conflicting answers to one question - exactly one wins and stays locked', async () => {
  await H.openCampaign(env);
  const { cookie, state: st } = await H.startAnon(env); const q = st.question;
  const rs = await Promise.all(q.options.map((o) => env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: o.id } })));
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
  assert.ok(rs.filter((r) => r.status !== 200).every((r) => r.status === 409));
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempt_questions WHERE selected_option_id IS NOT NULL'))[0].n, 1);
});

test('concurrency: many participants claiming at once never share a code', async () => {
  await H.openCampaign(env, { codesPerTier: 40 });
  const pending = [];
  for (let i = 0; i < 24; i++) {
    const { cookie } = await H.playScore(env, 5); const body = H.signupBody();
    await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
    pending.push({ cookie, body, tok: H.linkTokenFrom(env.mail.last(body.email, 'signin')) });
  }
  await Promise.all(pending.map((p) => env.api('POST', '/api/quiz/verify', { body: { token: p.tok }, cookie: p.cookie })));
  const codes = await rows('SELECT code_id FROM quiz.rewards');
  assert.equal(codes.length, 24); assert.equal(new Set(codes.map((c) => c.code_id)).size, 24);
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE tier=15 AND status='issued'`))[0].n, 24);
});

test('client cannot manipulate the score: scored from the server-side snapshot, extra fields ignored', async () => {
  await H.openCampaign(env);
  const { cookie, state: st } = await H.startAnon(env);
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[0].id, score: 5, tier: 15, correct: true } })).status, 200);
  const out = (await H.play(env, cookie, () => 0)).state;
  const real = await rows(`SELECT count(*)::int n FROM quiz.attempt_questions WHERE selected_option_id = correct_option_id`);
  assert.equal(out.result.score, real[0].n);
  // and the tier at claim time is the stored one, not anything the client sent
  const body = H.signupBody();
  await env.api('POST', '/api/quiz/signup', { body: { ...body, tier: 15, score: 5 }, cookie, ip: H.nextIp() });
  await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last(body.email, 'signin')), tier: 15 }, cookie });
  assert.equal((await rows('SELECT tier FROM quiz.rewards'))[0].tier, out.result.tier);
});

test('theme assignment is fair under concurrent anonymous starts', async () => {
  await H.openCampaign(env);
  await Promise.all(Array.from({ length: 16 }, () => env.api('POST', '/api/quiz/start', { body: {}, ip: H.nextIp() })));
  const c = await rows('SELECT theme, count(*)::int n FROM quiz.attempts GROUP BY 1');
  assert.equal(c.length, 4); c.forEach((x) => assert.equal(x.n, 4));
});

test('cross-site requests are refused (origin check); session cookie is HttpOnly, path-scoped, SameSite', async () => {
  await H.openCampaign(env);
  assert.equal((await env.api('POST', '/api/quiz/start', { body: {}, headers: { Origin: 'https://evil.example' }, ip: H.nextIp() })).status, 403);
  const ok = await env.api('POST', '/api/quiz/start', { body: {}, headers: { Origin: 'http://localhost:3999' }, ip: H.nextIp() });
  assert.equal(ok.status, 200);
  const sc = ok.headers.get('set-cookie');
  assert.match(sc, /^bd_quiz_session=/); assert.match(sc, /HttpOnly/); assert.match(sc, /SameSite=Lax/); assert.match(sc, /Path=\/api/);
});

test('API responses are never cacheable or indexable', async () => {
  const r = await env.api('GET', '/api/quiz/config');
  assert.equal(r.headers.get('cache-control'), 'no-store'); assert.match(r.headers.get('x-robots-tag'), /noindex/);
});
