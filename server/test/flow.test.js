'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.clock.offsetMs = 0; });
const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;

test('campaign defaults to disabled: nothing can start, nothing is created', async () => {
  assert.equal((await env.api('GET', '/api/quiz/config')).json.state, 'disabled');
  const r = await env.api('POST', '/api/quiz/start', { body: { language: 'en' } });
  assert.equal(r.status, 403); assert.equal(r.json.error, 'campaign_unavailable');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 0);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody() })).status, 403);
  assert.equal(env.mail.sent.length, 0);
});

test('cannot enable the campaign until the launch gates are met', async () => {
  assert.equal((await env.admin('PUT', '/api/admin/settings', { enabled: true })).status, 400);
  const r2 = await env.admin('PUT', '/api/admin/settings', { enabled: true, offer_confirmed: true, retention_days: 30, ...H.FUTURE });
  assert.equal(r2.status, 409); assert.equal(r2.json.error, 'launch_blocked');
  assert.ok(r2.json.blocking.includes('inventory_tier_15') && r2.json.blocking.includes('bank_movies'));
});

test('play first: five questions -> score + tier shown -> details -> verify -> code only by email', async () => {
  await H.openCampaign(env);
  const first = await env.api('GET', '/api/quiz/state');
  assert.equal(first.json.status, 'idle', 'no cookie, nothing started');
  const { cookie, state } = await H.playScore(env, 4, { lang: 'es' });
  assert.equal(state.status, 'completed'); assert.equal(state.result.score, 4); assert.equal(state.result.tier, 10);
  assert.equal(state.result.claim, 'unclaimed', 'score and tier are known before any email is given');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 0, 'no reward before verification');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.participants'))[0].n, 0);

  const body = H.signupBody({ language: 'es' });
  const s = await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  assert.equal(s.status, 200); assert.equal(s.json.status, 'check_email');
  const mid = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  assert.equal(mid.result.claim, 'pending_verification'); assert.match(mid.result.maskedEmail, /^p\*+@test\.invalid$/);
  const mail = env.mail.last(body.email, 'signin');
  assert.ok(mail.subject.includes('código de descuento'), 'verification email in the chosen language, about receiving the code');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 0, 'still nothing issued until verified');

  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) }, cookie });
  assert.equal(v.status, 200); assert.equal(v.json.claim, 'claimed');
  const done = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  assert.equal(done.result.claim, 'claimed'); assert.equal(done.result.reward, 'issued'); assert.equal(done.result.email, 'accepted');
  const code = (await rows(`SELECT d.code FROM quiz.discount_codes d JOIN quiz.participants p ON p.id=d.participant_id WHERE p.email_norm=$1`, [body.email]))[0].code;
  const reward = env.mail.last(body.email, 'reward');
  assert.ok(reward.text.includes(code) && reward.subject.includes('10%'));
  assert.ok(!JSON.stringify([state, mid, done, v.json]).includes(code), 'the code never reaches the browser');
});

test('score boundaries issue the right tier: 0,2 -> 5%  3,4 -> 10%  5 -> 15%', async () => {
  await H.openCampaign(env);
  for (const [score, tier] of Object.entries({ 0: 5, 1: 5, 2: 5, 3: 10, 4: 10, 5: 15 })) {
    const { body, state } = await H.fullJourney(env, Number(score));
    assert.equal(state.result.score, Number(score)); assert.equal(state.result.tier, tier, `score ${score}`);
    const d = (await rows(`SELECT d.tier FROM quiz.discount_codes d JOIN quiz.participants p ON p.id=d.participant_id WHERE p.email_norm=$1`, [body.email]))[0];
    assert.equal(d.tier, tier, 'issued code belongs to the earned tier');
  }
});

test('themes are balanced and persisted; 3 languages x 4 themes render localised; refresh never rerolls', async () => {
  await H.openCampaign(env);
  const themes = []; const combos = new Set();
  for (let i = 0; i < 12; i++) {
    const lang = ['en', 'es', 'nl'][i % 3];
    const { cookie, state: start } = await H.startAnon(env, { lang });
    themes.push(start.theme); combos.add(`${start.theme}/${lang}`);
    assert.ok(start.question.prompt.endsWith(lang.toUpperCase()), `prompt is ${lang}`);
    start.question.options.forEach((o) => assert.ok(o.text.endsWith(lang.toUpperCase())));
    const again = (await env.api('POST', '/api/quiz/start', { cookie, body: { language: lang } })).json;
    assert.equal(again.theme, start.theme); assert.equal(again.question.id, start.question.id);
    assert.deepEqual(again.question.options.map((o) => o.id), start.question.options.map((o) => o.id));
  }
  // themes are assigned at random among the least used, so keep playing until every language x theme pair was rendered
  for (let i = 0; combos.size < 12 && i < 60; i++) { const lang = ['en', 'es', 'nl'][i % 3]; const { state } = await H.startAnon(env, { lang }); combos.add(`${state.theme}/${lang}`); assert.ok(state.question.prompt.endsWith(lang.toUpperCase())); }
  const counts = themes.reduce((m, t) => ({ ...m, [t]: (m[t] || 0) + 1 }), {});
  assert.deepEqual(Object.keys(counts).sort(), ['facts', 'movies', 'music', 'spells']);
  Object.values(counts).forEach((c) => assert.equal(c, 3));
  assert.equal(combos.size, 12);
});

test('five distinct questions from one theme; stable option ids; the key is never sent; no correctness mid-quiz', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.startAnon(env);
  const st0 = (await env.api('GET', '/api/quiz/state', { cookie })).json; const q = st0.question;
  const r = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[0].id } });
  assert.ok(!/correct|wrong|right|score/i.test(JSON.stringify(r.json)));
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[0].id } })).status, 200, 'idempotent replay');
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[1].id } })).json.error, 'already_answered');
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: 'MOV-999', optionId: 'a' } })).status, 400);
  const { state, questions } = await H.play(env, cookie, () => 0);
  assert.equal(questions.length + 1, 5); assert.equal(new Set([q.id, ...questions.map((x) => x.id)]).size, 5);
  assert.equal(new Set([q, ...questions].map((x) => x.id.slice(0, 3))).size, 1);
  for (const x of questions) { assert.deepEqual(Object.keys(x).sort(), ['id', 'options', 'position', 'prompt', 'total']); x.options.forEach((o) => assert.deepEqual(Object.keys(o).sort(), ['id', 'text'])); }
  assert.ok(!JSON.stringify(state).includes('correct')); assert.equal(state.result.review, undefined);
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[0].id } })).status, 200, 'replaying a locked answer after completion is harmless');
  assert.equal((await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[1].id } })).json.error, 'already_completed');
});

test('resume: refresh keeps theme, questions, order and submitted answers; language switch changes wording only', async () => {
  await H.openCampaign(env);
  const { cookie, state: st } = await H.startAnon(env, { lang: 'nl' });
  const a1 = (await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[2].id, language: 'nl' } })).json;
  const back = (await env.api('GET', '/api/quiz/state?lang=nl', { cookie })).json;
  assert.equal(back.theme, st.theme); assert.equal(back.progress.answered, 1); assert.equal(back.question.id, a1.question.id);
  assert.deepEqual(back.question.options.map((o) => o.id), a1.question.options.map((o) => o.id));
  for (const l of ['es', 'en', 'nl']) {
    const sw = (await env.api('POST', '/api/quiz/language', { cookie, body: { language: l } })).json;
    assert.equal(sw.theme, st.theme); assert.equal(sw.progress.answered, 1); assert.equal(sw.question.id, a1.question.id);
    assert.ok(sw.question.prompt.endsWith(l.toUpperCase()));
  }
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 1);
});

test('the emailed link works on another device: that browser becomes the participant and sees the claimed result', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.playScore(env, 5);
  const body = H.signupBody();
  await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  const mail = env.mail.last(body.email, 'signin');
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) } });   // no cookie: a phone's mail browser
  assert.equal(v.status, 200); assert.equal(v.json.claim, 'claimed'); assert.ok(v.cookie, 'new device gets its own session');
  const phone = (await env.api('GET', '/api/quiz/state', { cookie: v.cookie })).json;
  assert.equal(phone.result.claim, 'claimed'); assert.equal(phone.result.tier, 15);
  const laptop = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  assert.equal(laptop.result.claim, 'claimed', 'the original browser sees it too');
  assert.equal(env.mail.to(body.email).filter((m) => m.tags.some((t) => t.value === 'reward')).length, 1);
});

test('question edits never change an attempt already in progress (content snapshot)', async () => {
  await H.openCampaign(env);
  const { cookie, state: st } = await H.startAnon(env);
  const bank = H.syntheticBank().map((q) => ({ ...q, prompt: { en: 'EDITED EN', es: 'EDITED ES', nl: 'EDITED NL' } }));
  assert.equal((await env.admin('POST', '/api/admin/questions/import', { questions: bank })).json.updated, 40);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.question.prompt, st.question.prompt);
});

test('one reward per verified email: a second play with the same email gets "already played" and the SAME reward', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.fullJourney(env, 5);
  const code1 = (await rows('SELECT code_id FROM quiz.rewards'))[0].code_id;
  // new browser, plays again, tries the same email
  const { cookie: c2 } = await H.playScore(env, 5);
  env.clock.offsetMs += 120_000; env.mail.sent.length = 0;
  const s = await env.api('POST', '/api/quiz/signup', { body, cookie: c2, ip: H.nextIp() });
  assert.equal(s.status, 200, 'same generic response');
  const mail = env.mail.last(body.email, 'signin');
  assert.ok(/already|ya has|al gespeeld/i.test(mail.text), 'the email says they already played');
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) }, cookie: c2 });
  assert.equal(v.json.claim, 'already');
  const st = (await env.api('GET', '/api/quiz/state', { cookie: c2 })).json;
  assert.equal(st.result.claim, 'already_played');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
  assert.equal((await rows('SELECT code_id FROM quiz.rewards'))[0].code_id, code1);
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`))[0].n, 1, 'no second code');
  // they can request the same reward email again, rate limited
  const rs = await env.api('POST', '/api/quiz/resend-reward', { cookie: c2, body: {} });
  assert.equal(rs.json.status, 'accepted'); assert.equal((await env.api('POST', '/api/quiz/resend-reward', { cookie: c2, body: {} })).status, 429);
  assert.equal((await env.api('POST', '/api/quiz/resend-reward', { cookie, body: {} })).status, 429, 'same participant, same limit');
});

test('signup needs a completed attempt in this browser; an attempt cannot be claimed by two emails', async () => {
  await H.openCampaign(env);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), ip: H.nextIp() })).json.error, 'no_completed_attempt');
  const { cookie } = await H.startAnon(env);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), cookie, ip: H.nextIp() })).json.error, 'no_completed_attempt', 'unfinished');
  await H.play(env, cookie);
  const a = H.signupBody();
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: a, cookie, ip: H.nextIp() })).status, 200);
  await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last(a.email, 'signin')) }, cookie });
  const b = H.signupBody();
  const r = await env.api('POST', '/api/quiz/signup', { body: b, cookie, ip: H.nextIp() });
  assert.equal(r.status, 409); assert.equal(r.json.error, 'attempt_already_claimed');
});

test('an unverified typo email can be corrected: the result moves to the new address, nothing is issued twice', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.playScore(env, 3);
  const typo = H.signupBody({ email: 'typo@test.invalid' });
  await env.api('POST', '/api/quiz/signup', { body: typo, cookie, ip: H.nextIp() });
  env.clock.offsetMs += 120_000;
  const good = { ...typo, email: 'good@test.invalid' };
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: good, cookie, ip: H.nextIp() })).status, 200, 'unverified owner releases the result');
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last('good@test.invalid', 'signin')) }, cookie });
  assert.equal(v.json.claim, 'claimed');
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.rewards r JOIN quiz.participants p ON p.id=r.participant_id WHERE p.email_norm='good@test.invalid'`))[0].n, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
  // the stale typo link can no longer claim anything
  const old = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(env.mail.last('typo@test.invalid', 'signin')) } });
  assert.equal(old.status, 200); assert.equal(old.json.claim, 'no_attempt');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1, 'still one reward');
});

test('server rejects under-18, missing fields and bad input before anything is stored', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.playScore(env, 2);
  const u = await env.api('POST', '/api/quiz/signup', { body: H.signupBody({ age: 17 }), cookie, ip: H.nextIp() });
  assert.equal(u.status, 400); assert.equal(u.json.fields.age, 'under_18');
  const m = await env.api('POST', '/api/quiz/signup', { body: { language: 'en' }, cookie, ip: H.nextIp() });
  assert.equal(m.status, 400); for (const f of ['fullName', 'email', 'age', 'gender', 'city', 'country', 'acceptTerms']) assert.ok(m.json.fields[f], f);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.participants'))[0].n, 0); assert.equal(env.mail.sent.length, 0);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody({ gender: 'prefer_not_to_say' }), cookie, ip: H.nextIp() })).status, 200, '"Prefer not to say" is valid');
});

test('closed campaign: no new plays or new participants; a browser mid-quiz may finish and claim; kill switch blocks all', async () => {
  await H.openCampaign(env);
  const { cookie, state: st } = await H.startAnon(env);
  await env.admin('PUT', '/api/admin/settings', { closes_at: '2020-06-01T00:00:00+02:00', opens_at: '2020-01-01T00:00:00+01:00' });
  assert.equal((await env.api('GET', '/api/quiz/config')).json.state, 'closed');
  assert.equal((await env.api('POST', '/api/quiz/start', { body: {}, ip: H.nextIp() })).status, 403);
  const a = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[0].id } });
  assert.equal(a.status, 200, 'a person mid-quiz is not cut off');
  await H.play(env, cookie);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody(), cookie, ip: H.nextIp() })).status, 403, 'but a new email cannot be registered after close');
  await env.admin('PUT', '/api/admin/settings', { enabled: false });
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.campaign.state, 'disabled');
});

test('server-side funnel events contain no personal data, codes or tokens, and run as one line from play to reward', async () => {
  await H.openCampaign(env);
  const { body } = await H.fullJourney(env, 3, { fullName: 'Zelda Uniqueperson', city: 'Uniquetown' });
  const ev = await rows('SELECT * FROM quiz.funnel_events ORDER BY id');
  const dump = JSON.stringify(ev);
  const code = (await rows('SELECT code FROM quiz.discount_codes WHERE participant_id IS NOT NULL'))[0].code;
  for (const secret of [body.email, 'Zelda', 'Uniqueperson', 'Uniquetown', code, H.linkTokenFrom(env.mail.last(body.email, 'signin'))]) assert.ok(!dump.includes(secret), `leaked ${secret}`);
  const names = ev.map((e) => e.name);
  for (const n of ['quiz_started', 'question_viewed', 'answer_submitted', 'quiz_completed', 'form_success', 'verification_requested', 'verification_completed', 'discount_earned', 'reward_issued']) assert.ok(names.includes(n), n);
  assert.ok(names.indexOf('quiz_completed') < names.indexOf('form_success'), 'play happens before the form');
  assert.equal(new Set(ev.filter((e) => e.anon_id).map((e) => e.anon_id)).size, 1, 'same anonymous id from first question to reward');
});
