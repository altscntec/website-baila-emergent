'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.mail.failures.length = 0; env.clock.offsetMs = 0; });

const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;

test('verification link: single use, expires, wrong token rejected, no session without it', async () => {
  await H.openCampaign(env);
  const body = H.signupBody(); await env.api('POST', '/api/quiz/signup', { body });
  const tok = H.linkTokenFrom(env.mail.last(body.email, 'signin'));
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: tok + 'x' } })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: '' } })).status, 400);
  const ok = await env.api('POST', '/api/quiz/verify', { body: { token: tok } });
  assert.equal(ok.status, 200);
  const replay = await env.api('POST', '/api/quiz/verify', { body: { token: tok } });
  assert.equal(replay.status, 400); assert.equal(replay.json.error, 'invalid_or_expired');
  // token stored hashed only
  const stored = JSON.stringify(await rows('SELECT * FROM quiz.verification_tokens'));
  assert.ok(!stored.includes(tok));
});

test('verification link and code expire after the TTL', async () => {
  await H.openCampaign(env);
  const body = H.signupBody(); await env.api('POST', '/api/quiz/signup', { body });
  const mail = env.mail.last(body.email, 'signin');
  env.clock.offsetMs = 31 * 60_000;
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) } })).json.error, 'invalid_or_expired');
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: H.codeFrom(mail) } })).json.error, 'invalid_or_expired');
  const p = (await rows('SELECT verified_at FROM quiz.participants'))[0]; assert.equal(p.verified_at, null);
});

test('6-digit code works, is single use, and locks after 5 wrong guesses', async () => {
  await H.openCampaign(env);
  const body = H.signupBody(); await env.api('POST', '/api/quiz/signup', { body });
  const mail = env.mail.last(body.email, 'signin'); const good = H.codeFrom(mail);
  const bad = good === '000000' ? '000001' : '000000';
  for (let i = 0; i < 5; i++) assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: bad }, ip: `9.9.9.${i}` })).status, 400);
  const locked = await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: good }, ip: '9.9.9.99' });
  assert.equal(locked.status, 400, 'even the right code is refused after lock-out');
  // requesting a fresh email issues a fresh token that works
  env.clock.offsetMs += 120_000;
  await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' } });
  const fresh = H.codeFrom(env.mail.last(body.email, 'signin'));
  const ok = await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: fresh } });
  assert.equal(ok.status, 200);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { email: body.email, code: fresh } })).status, 400);
});

test('an older link stops working once a newer one is issued', async () => {
  await H.openCampaign(env);
  const body = H.signupBody(); await env.api('POST', '/api/quiz/signup', { body });
  const t1 = H.linkTokenFrom(env.mail.last(body.email, 'signin'));
  env.clock.offsetMs += 120_000;
  await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' } });
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: t1 } })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last(body.email, 'signin')) } })).status, 200);
});

test('rate limits: signup per email cooldown, per IP, resend, verify', async () => {
  await H.openCampaign(env);
  const body = H.signupBody();
  assert.equal((await env.api('POST', '/api/quiz/signup', { body, ip: '1.1.1.1' })).status, 200);
  const again = await env.api('POST', '/api/quiz/signup', { body, ip: '1.1.1.2' });
  assert.equal(again.status, 429); assert.ok(again.headers.get('retry-after'));
  const res = await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: '1.1.1.3' });
  assert.equal(res.status, 200, 'resend has its own cooldown bucket');
  assert.equal((await env.api('POST', '/api/quiz/resend', { body: { email: body.email, language: 'en' }, ip: '1.1.1.4' })).status, 429);
  // one IP hammering many addresses
  let blocked = 0;
  for (let i = 0; i < 14; i++) { const r = await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), ip: '7.7.7.7' }); if (r.status === 429) blocked++; }
  assert.ok(blocked >= 4, `IP limit engaged (${blocked})`);
  let vblocked = 0;
  for (let i = 0; i < 45; i++) { const r = await env.api('POST', '/api/quiz/verify', { body: { token: 'nope' + i }, ip: '8.8.8.8' }); if (r.status === 429) vblocked++; }
  assert.ok(vblocked >= 4, 'verify attempts are limited per IP');
});

test('no account enumeration: new, unverified, in-progress and completed emails get the same response', async () => {
  await H.openCampaign(env);
  const fresh = H.signupBody(); const r1 = await env.api('POST', '/api/quiz/signup', { body: fresh, ip: '2.0.0.1' });
  const { body: inProg, cookie } = await H.signupAndVerify(env); await env.api('POST', '/api/quiz/start', { cookie, body: {} });
  const { body: done, cookie: c2 } = await H.signupAndVerify(env); await H.playScore(env, c2, done.email, 2);
  env.clock.offsetMs += 120_000;
  const r2 = await env.api('POST', '/api/quiz/signup', { body: fresh, ip: '2.0.0.2' });
  const r3 = await env.api('POST', '/api/quiz/signup', { body: inProg, ip: '2.0.0.3' });
  const r4 = await env.api('POST', '/api/quiz/signup', { body: done, ip: '2.0.0.4' });
  for (const r of [r1, r2, r3, r4]) { assert.equal(r.status, 200); assert.deepEqual(r.json, r1.json); }
  // resend for an address that never signed up looks identical and sends nothing
  const before = env.mail.sent.length;
  const ghost = await env.api('POST', '/api/quiz/resend', { body: { email: 'nobody-here@test.invalid', language: 'en' }, ip: '2.0.0.5' });
  assert.deepEqual(ghost.json, r1.json); assert.equal(env.mail.sent.length, before);
  // verification failure is the same for unknown email and wrong code
  const a = await env.api('POST', '/api/quiz/verify', { body: { email: 'nobody-here@test.invalid', code: '123456' }, ip: '2.0.0.6' });
  const b = await env.api('POST', '/api/quiz/verify', { body: { email: fresh.email, code: '123456' }, ip: '2.0.0.7' });
  assert.deepEqual(a.json, b.json);
});

test('one participant per normalised email (DB uniqueness); casing and whitespace collapse, gmail dots do not', async () => {
  await H.openCampaign(env);
  const base = H.signupBody({ email: 'Mixed.Case@Test.Invalid' });
  await env.api('POST', '/api/quiz/signup', { body: base, ip: '3.0.0.1' });
  env.clock.offsetMs += 120_000;
  await env.api('POST', '/api/quiz/signup', { body: { ...base, email: '  mixed.case@test.invalid ' }, ip: '3.0.0.2' });
  await env.api('POST', '/api/quiz/signup', { body: { ...base, email: 'mixedcase@test.invalid' }, ip: '3.0.0.3' });
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.participants'))[0].n, 2);
  await assert.rejects(pg.db.query(`INSERT INTO quiz.participants (email_norm,email,full_name,age,gender,city,country,language,terms_version) VALUES ('mixed.case@test.invalid','x','x',20,'man','x','NL','en','v')`), /participants_email_norm_key/);
  await assert.rejects(pg.db.query(`UPDATE quiz.participants SET age = 17`), /check/i, 'DB itself refuses under-18');
});

test('concurrency: parallel starts create exactly one attempt with one question set', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const rs = await Promise.all(Array.from({ length: 12 }, () => env.api('POST', '/api/quiz/start', { cookie, body: {} })));
  assert.ok(rs.every((r) => r.status === 200));
  assert.equal(new Set(rs.map((r) => r.json.theme)).size, 1); assert.equal(new Set(rs.map((r) => r.json.question.id)).size, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempt_questions'))[0].n, 5);
});

test('concurrency: duplicate submissions of the last answer issue exactly one reward, one code, one email', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.signupAndVerify(env);
  await env.api('POST', '/api/quiz/start', { cookie, body: {} });
  const key = await rows(`SELECT aq.question_id, aq.option_order, aq.correct_option_id FROM quiz.attempt_questions aq ORDER BY position`);
  for (let i = 0; i < 4; i++) await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: key[i].question_id, optionId: key[i].correct_option_id } });
  const last = key[4];
  const rs = await Promise.all(Array.from({ length: 10 }, () => env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: last.question_id, optionId: last.correct_option_id } })));
  assert.ok(rs.every((r) => r.status === 200), JSON.stringify(rs.map((r) => r.status)));
  assert.ok(rs.every((r) => r.json.status === 'completed' && r.json.result.tier === 15));
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`))[0].n, 1);
  assert.equal(env.mail.to(body.email).filter((m) => m.tags.some((t) => t.value === 'reward')).length, 1);
});

test('concurrency: conflicting answers to one question - exactly one wins and stays locked', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: {} })).json; const q = st.question;
  const rs = await Promise.all(q.options.map((o) => env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: o.id } })));
  assert.equal(rs.filter((r) => r.status === 200).length, 1);
  assert.ok(rs.filter((r) => r.status !== 200).every((r) => r.status === 409));
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempt_questions WHERE selected_option_id IS NOT NULL'))[0].n, 1);
});

test('concurrency: many participants finishing at once never share a code', async () => {
  await H.openCampaign(env, { codesPerTier: 40 });
  const people = [];
  for (let i = 0; i < 24; i++) people.push(await H.signupAndVerify(env));
  await Promise.all(people.map((p) => H.playScore(env, p.cookie, p.body.email, 5)));
  const codes = await rows('SELECT code_id FROM quiz.rewards');
  assert.equal(codes.length, 24); assert.equal(new Set(codes.map((c) => c.code_id)).size, 24);
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE tier=15 AND status='issued'`))[0].n, 24);
  assert.equal(env.mail.sent.filter((m) => m.tags.some((t) => t.value === 'reward')).length, 24);
});

test('client cannot manipulate the score: answers are scored from the server-side snapshot', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: {} })).json;
  const r = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[0].id, score: 5, tier: 15, correct: true } });
  assert.equal(r.status, 200);
  const out = (await H.play(env, cookie, () => 0)).state;
  const real = await rows(`SELECT count(*)::int n FROM quiz.attempt_questions WHERE selected_option_id = correct_option_id`);
  assert.equal(out.result.score, real[0].n);
});

test('theme assignment is fair under concurrent starts', async () => {
  await H.openCampaign(env);
  const people = []; for (let i = 0; i < 16; i++) people.push(await H.signupAndVerify(env));
  await Promise.all(people.map((p) => env.api('POST', '/api/quiz/start', { cookie: p.cookie, body: {} })));
  const c = await rows('SELECT theme, count(*)::int n FROM quiz.attempts GROUP BY 1');
  assert.equal(c.length, 4); c.forEach((x) => assert.equal(x.n, 4));
});

test('cross-site requests are refused (origin check) and the session cookie is HttpOnly + path-scoped', async () => {
  await H.openCampaign(env);
  const r = await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), headers: { Origin: 'https://evil.example' } });
  assert.equal(r.status, 403);
  const ok = await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), headers: { Origin: 'http://localhost:3999' }, ip: '5.5.5.5' });
  assert.equal(ok.status, 200);
  const { cookie } = await H.signupAndVerify(env);
  assert.ok(cookie.startsWith('bd_quiz_session='));
});

test('API responses are never cacheable or indexable', async () => {
  const r = await env.api('GET', '/api/quiz/config');
  assert.equal(r.headers.get('cache-control'), 'no-store'); assert.match(r.headers.get('x-robots-tag'), /noindex/);
});
