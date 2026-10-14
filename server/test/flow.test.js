'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.clock.offsetMs = 0; });

test('campaign defaults to disabled: signup and API refuse, nothing is created', async () => {
  const cfg = await env.api('GET', '/api/quiz/config');
  assert.equal(cfg.json.state, 'disabled');
  const r = await env.api('POST', '/api/quiz/signup', { body: H.signupBody() });
  assert.equal(r.status, 403); assert.equal(r.json.error, 'campaign_unavailable');
  assert.equal((await pg.db.query('SELECT count(*)::int n FROM quiz.participants')).rows[0].n, 0);
  assert.equal(env.mail.sent.length, 0);
});

test('cannot enable the campaign until the launch gates are met', async () => {
  const r = await env.admin('PUT', '/api/admin/settings', { enabled: true });
  assert.equal(r.status, 400);
  const r2 = await env.admin('PUT', '/api/admin/settings', { enabled: true, offer_confirmed: true, retention_days: 30, ...H.FUTURE });
  assert.equal(r2.status, 409); assert.equal(r2.json.error, 'launch_blocked');          // no codes, no questions yet
  assert.ok(r2.json.blocking.includes('inventory_tier_15') && r2.json.blocking.includes('bank_movies'));
});

test('full journey: form -> verify email -> five questions -> score + tier -> code only by email', async () => {
  await H.openCampaign(env);
  const body = H.signupBody({ language: 'es', marketingOptIn: false });
  const s = await env.api('POST', '/api/quiz/signup', { body });
  assert.equal(s.status, 200); assert.equal(s.json.status, 'check_email');
  assert.equal((await env.api('GET', '/api/quiz/state')).status, 401, 'no session before verification');
  const mail = env.mail.last(body.email, 'signin');
  assert.ok(mail.subject.includes('Confirma'), 'verification email follows the chosen language');
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) } });
  assert.equal(v.status, 200);
  assert.match(v.headers.get('set-cookie'), /HttpOnly/); assert.match(v.headers.get('set-cookie'), /SameSite=Lax/);
  const out = await H.playScore(env, v.cookie, body.email, 4, 'es');
  assert.equal(out.status, 'completed'); assert.equal(out.result.score, 4); assert.equal(out.result.tier, 10);
  const row = (await pg.db.query(`SELECT d.code FROM quiz.discount_codes d JOIN quiz.participants p ON p.id=d.participant_id WHERE p.email_norm=$1`, [body.email])).rows[0];
  assert.ok(row, 'a real inventory code was assigned');
  const reward = env.mail.last(body.email, 'reward');
  assert.ok(reward.text.includes(row.code) && reward.html.includes(row.code), 'code is in the email');
  assert.ok(reward.subject.includes('10%') && reward.subject.includes('descuento'));
  const u = new URL(reward.text.match(/https:\/\/\S+coupon=\S+/)[0]);
  assert.equal(u.searchParams.get('coupon'), row.code); assert.equal(u.searchParams.get('utm_campaign'), 'quiz_test');
  // the code must never be exposed by any browser-facing response
  const everything = JSON.stringify([out, (await env.api('GET', '/api/quiz/state', { cookie: v.cookie })).json, (await env.api('GET', '/api/quiz/config')).json]);
  assert.ok(!everything.includes(row.code));
  assert.equal(out.result.email, 'accepted');
});

test('score boundaries issue the right tier: 0,2 -> 5%  3,4 -> 10%  5 -> 15%', async () => {
  await H.openCampaign(env);
  const expected = { 0: 5, 1: 5, 2: 5, 3: 10, 4: 10, 5: 15 };
  for (const [score, tier] of Object.entries(expected)) {
    const { body, cookie } = await H.signupAndVerify(env);
    const out = await H.playScore(env, cookie, body.email, Number(score));
    assert.equal(out.result.score, Number(score)); assert.equal(out.result.tier, tier, `score ${score}`);
    const d = (await pg.db.query(`SELECT d.tier FROM quiz.discount_codes d JOIN quiz.participants p ON p.id=d.participant_id WHERE p.email_norm=$1`, [body.email])).rows[0];
    assert.equal(d.tier, tier, 'issued code belongs to the earned tier');
  }
});

test('themes are balanced across participants and persisted; 3 languages x 4 themes all render localised', async () => {
  await H.openCampaign(env);
  const seenCombos = new Set(); const themes = [];
  const langs = ['en', 'es', 'nl'];
  for (let i = 0; i < 12; i++) {
    const lang = langs[i % 3];
    const { body, cookie } = await H.signupAndVerify(env, { language: lang });
    const start = (await env.api('POST', '/api/quiz/start', { cookie, body: { language: lang } })).json;
    themes.push(start.theme);
    assert.ok(start.question.prompt.endsWith(lang.toUpperCase()), `prompt is ${lang}: ${start.question.prompt}`);
    for (const o of start.question.options) assert.ok(o.text.endsWith(lang.toUpperCase()));
    seenCombos.add(`${start.theme}/${lang}`);
    // refresh must not reroll theme or question
    const again = (await env.api('POST', '/api/quiz/start', { cookie, body: { language: lang } })).json;
    assert.equal(again.theme, start.theme); assert.equal(again.question.id, start.question.id);
    assert.deepEqual(again.question.options.map((o) => o.id), start.question.options.map((o) => o.id));
  }
  const counts = themes.reduce((m, t) => ({ ...m, [t]: (m[t] || 0) + 1 }), {});
  assert.deepEqual(Object.keys(counts).sort(), ['facts', 'movies', 'music', 'spells']);
  Object.values(counts).forEach((c) => assert.equal(c, 3, 'perfectly balanced blocks of four'));
});

test('five distinct questions from one theme; options carry stable ids; the key is never sent', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const { state, questions } = await H.play(env, cookie, () => 0);
  assert.equal(questions.length, 5);
  assert.equal(new Set(questions.map((q) => q.id)).size, 5, 'without replacement');
  assert.equal(new Set(questions.map((q) => q.id.slice(0, 3))).size, 1, 'one theme per attempt');
  for (const q of questions) { assert.equal(q.total, 5); assert.deepEqual(Object.keys(q).sort(), ['id', 'options', 'position', 'prompt', 'total']); q.options.forEach((o) => assert.deepEqual(Object.keys(o).sort(), ['id', 'text'])); }
  assert.ok(!JSON.stringify(state).includes('correct'));
  assert.equal(state.result.review, undefined, 'no answer reveal by default');
});

test('no correctness is revealed while answering; answers are locked', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: {} })).json;
  const q = st.question;
  const r = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[0].id } });
  assert.ok(!/correct|wrong|right|score/i.test(JSON.stringify(r.json)), 'response has no correctness/score signal');
  assert.equal(r.json.progress.answered, 1);
  const same = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[0].id } });
  assert.equal(same.status, 200, 'idempotent replay of the same answer');
  assert.equal(same.json.progress.answered, 1);
  const change = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: q.id, optionId: q.options[1].id } });
  assert.equal(change.status, 409); assert.equal(change.json.error, 'already_answered');
  const skip = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: 'MOV-999', optionId: 'a' } });
  assert.equal(skip.status, 400);
  const bogus = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: r.json.question.id, optionId: 'zz' } });
  assert.equal(bogus.status, 400); assert.equal(bogus.json.error, 'invalid_option');
});

test('resume: refresh/new device keeps theme, questions, order and submitted answers', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.signupAndVerify(env, { language: 'nl' });
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: { language: 'nl' } })).json;
  const first = st.question;
  const a1 = (await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: first.id, optionId: first.options[2].id, language: 'nl' } })).json;
  // "close the browser", then come back via the sign-in email on another device
  await env.api('POST', '/api/quiz/logout', { cookie });
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).status, 401);
  env.clock.offsetMs += 10 * 60_000; env.mail.sent.length = 0;
  const re = await env.api('POST', '/api/quiz/signup', { body: { ...body, email: body.email, fullName: 'Someone Else', age: 40 }, ip: '10.0.0.9' });
  assert.equal(re.status, 200);
  const mail = env.mail.last(body.email, 'signin');
  assert.ok(mail.subject.startsWith('Ga verder'), 'resume email, in Dutch: ' + mail.subject);
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: H.linkTokenFrom(mail) } });
  const back = (await env.api('GET', '/api/quiz/state?lang=nl', { cookie: v.cookie })).json;
  assert.equal(back.theme, st.theme); assert.equal(back.progress.answered, 1);
  assert.equal(back.question.id, a1.question.id);
  assert.deepEqual(back.question.options.map((o) => o.id), a1.question.options.map((o) => o.id), 'same shuffled order');
  const p = (await pg.db.query('SELECT full_name, age FROM quiz.participants WHERE email_norm=$1', [body.email])).rows[0];
  assert.equal(p.full_name, 'Test Person'); assert.equal(p.age, 27, 'an unauthenticated re-submit cannot overwrite a verified profile');
});

test('language switch mid-quiz keeps attempt, theme, questions and answers; only wording changes', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env, { language: 'en' });
  const en = (await env.api('POST', '/api/quiz/start', { cookie, body: { language: 'en' } })).json;
  await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: en.question.id, optionId: en.question.options[0].id, language: 'en' } });
  const cur = (await env.api('GET', '/api/quiz/state?lang=en', { cookie })).json;
  for (const l of ['es', 'nl', 'en']) {
    const sw = (await env.api('POST', '/api/quiz/language', { cookie, body: { language: l } })).json;
    assert.equal(sw.theme, en.theme); assert.equal(sw.progress.answered, 1); assert.equal(sw.question.id, cur.question.id);
    assert.deepEqual(sw.question.options.map((o) => o.id), cur.question.options.map((o) => o.id));
    assert.ok(sw.question.prompt.endsWith(l.toUpperCase()));
  }
  assert.equal((await pg.db.query('SELECT count(*)::int n FROM quiz.attempts')).rows[0].n, 1);
});

test('question edits never change an attempt already in progress (content snapshot)', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.signupAndVerify(env);
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: {} })).json;
  const bank = H.syntheticBank().map((q) => ({ ...q, prompt: { en: 'EDITED EN', es: 'EDITED ES', nl: 'EDITED NL' } }));
  const imp = await env.admin('POST', '/api/admin/questions/import', { questions: bank });
  assert.equal(imp.json.updated, 40);
  const after = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  assert.equal(after.question.prompt, st.question.prompt);
  assert.equal((await pg.db.query(`SELECT max(version) v FROM quiz.questions`)).rows[0].v, 2);
});

test('completed participants cannot retake; they can only request the same reward again', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.signupAndVerify(env);
  await H.playScore(env, cookie, body.email, 5);
  const code1 = (await pg.db.query(`SELECT code_id FROM quiz.rewards`)).rows[0].code_id;
  const again = await env.api('POST', '/api/quiz/start', { cookie, body: {} });
  assert.equal(again.json.status, 'completed'); assert.equal(again.json.question, null);
  assert.equal((await pg.db.query('SELECT count(*)::int n FROM quiz.attempts')).rows[0].n, 1);
  const extraAnswer = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: 'MOV-001', optionId: 'a' } });
  assert.ok([400, 409].includes(extraAnswer.status));
  env.mail.sent.length = 0;
  const rs = await env.api('POST', '/api/quiz/resend-reward', { cookie, body: {} });
  assert.equal(rs.status, 200); assert.equal(rs.json.status, 'accepted');
  assert.equal(env.mail.to(body.email).length, 1);
  assert.equal((await pg.db.query(`SELECT code_id FROM quiz.rewards`)).rows[0].code_id, code1, 'same reward');
  assert.equal((await pg.db.query(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`)).rows[0].n, 1, 'no second code');
  const cool = await env.api('POST', '/api/quiz/resend-reward', { cookie, body: {} });
  assert.equal(cool.status, 429, 'resend is rate limited');
  // signing in again via the form tells the same person they already played
  env.clock.offsetMs += 120_000;
  const re = await env.api('POST', '/api/quiz/signup', { body, ip: '10.1.1.1' });
  assert.equal(re.status, 200);
  assert.ok(/already|ya has|al gespeeld/i.test(env.mail.last(body.email, 'signin').text));
});

test('server rejects under-18, missing fields and bad input before anything is stored', async () => {
  await H.openCampaign(env);
  const u = await env.api('POST', '/api/quiz/signup', { body: H.signupBody({ age: 17 }) });
  assert.equal(u.status, 400); assert.equal(u.json.fields.age, 'under_18');
  const m = await env.api('POST', '/api/quiz/signup', { body: { language: 'en' } });
  assert.equal(m.status, 400); for (const f of ['fullName', 'email', 'age', 'gender', 'city', 'country', 'acceptTerms']) assert.ok(m.json.fields[f], f);
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: '{bad json', headers: { 'Content-Type': 'application/json' } })).status, 400);
  assert.equal((await pg.db.query('SELECT count(*)::int n FROM quiz.participants')).rows[0].n, 0);
  assert.equal(env.mail.sent.length, 0);
  const ok = await env.api('POST', '/api/quiz/signup', { body: H.signupBody({ gender: 'prefer_not_to_say' }) });
  assert.equal(ok.status, 200, '"Prefer not to say" is a valid answer');
});

test('closed campaign: no new participants; unfinished attempts may still finish; kill switch blocks everything', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.signupAndVerify(env);
  const st = (await env.api('POST', '/api/quiz/start', { cookie, body: {} })).json;
  await env.admin('PUT', '/api/admin/settings', { closes_at: '2020-06-01T00:00:00+02:00', opens_at: '2020-01-01T00:00:00+01:00' });
  assert.equal((await env.api('GET', '/api/quiz/config')).json.state, 'closed');
  assert.equal((await env.api('POST', '/api/quiz/signup', { body: H.signupBody() })).status, 403);
  const a = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[0].id } });
  assert.equal(a.status, 200, 'a person mid-quiz is not cut off');
  await env.admin('PUT', '/api/admin/settings', { enabled: false });
  const b = await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: a.json.question.id, optionId: a.json.question.options[0].id } });
  assert.equal(b.status, 403);
});

test('server-side funnel events contain no personal data, codes or tokens', async () => {
  await H.openCampaign(env);
  const { body, cookie } = await H.signupAndVerify(env, { fullName: 'Zelda Uniqueperson', city: 'Uniquetown' });
  await H.playScore(env, cookie, body.email, 3);
  const dump = JSON.stringify((await pg.db.query('SELECT * FROM quiz.funnel_events')).rows);
  const code = (await pg.db.query('SELECT code FROM quiz.discount_codes WHERE participant_id IS NOT NULL')).rows[0].code;
  for (const secret of [body.email, 'Zelda', 'Uniqueperson', 'Uniquetown', code, H.linkTokenFrom(env.mail.last(body.email, 'signin'))]) assert.ok(!dump.includes(secret), `leaked ${secret}`);
  const names = new Set((await pg.db.query('SELECT DISTINCT name FROM quiz.funnel_events')).rows.map((r) => r.name));
  for (const n of ['form_success', 'verification_requested', 'verification_completed', 'quiz_started', 'question_viewed', 'answer_submitted', 'quiz_completed', 'discount_earned', 'reward_issued']) assert.ok(names.has(n), n);
});
