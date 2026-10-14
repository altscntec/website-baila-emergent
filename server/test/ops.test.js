'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const H = require('./helpers');

let pg; let env;
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.mail.failures.length = 0; env.clock.offsetMs = 0; });
const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;
const rewardMails = (email) => env.mail.to(email).filter((m) => m.tags.some((t) => t.value === 'reward'));
const sign = (id, body, secret = H.TEST_ENV.RESEND_WEBHOOK_SECRET, ts = Math.floor(Date.now() / 1000)) => ({
  'svix-id': id, 'svix-timestamp': String(ts),
  'svix-signature': 'v1,' + crypto.createHmac('sha256', Buffer.from(secret.replace('whsec_', ''), 'base64')).update(`${id}.${ts}.${body}`).digest('base64'),
});
const hook = (id, type, messageId, opts = {}) => { const raw = JSON.stringify({ type, created_at: new Date().toISOString(), data: { email_id: messageId } }); return env.api('POST', '/api/webhooks/resend', { body: raw, headers: { ...sign(id, raw, opts.secret), 'Content-Type': 'application/json' } }); };

// Play + signup, then inject mail failures right before the verification (which sends the reward).
const claimWithRewardFailures = async (score, ...errs) => {
  const { cookie } = await H.playScore(env, score);
  const body = H.signupBody();
  await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  const tok = H.linkTokenFrom(env.mail.last(body.email, 'signin'));
  env.mail.failNext(...errs);
  const v = await env.api('POST', '/api/quiz/verify', { body: { token: tok }, cookie });
  assert.equal(v.status, 200);
  const state = (await env.api('GET', '/api/quiz/state', { cookie })).json;
  return { cookie, body, state };
};

test('email retry reuses the SAME reward: transient provider failures then success', async () => {
  await H.openCampaign(env);
  const { body, cookie, state } = await claimWithRewardFailures(4, H.transient(), H.transient());
  assert.equal(state.result.tier, 10); assert.equal(state.result.claim, 'claimed'); assert.equal(state.result.email, 'queued', 'reward preserved while the email is retried');
  assert.equal((await rows('SELECT status FROM quiz.rewards'))[0].status, 'issued'); assert.equal(rewardMails(body.email).length, 0);
  assert.equal((await env.api('GET', '/api/cron/retry', { key: 'cron-secret' })).json.mail.attempted, 0, 'not due yet');
  for (let i = 0; i < 2; i++) { await pg.db.query(`UPDATE quiz.email_outbox SET next_attempt_at = now() WHERE kind='reward'`); assert.equal((await env.api('GET', '/api/cron/retry', { key: 'cron-secret' })).status, 200); }
  assert.equal(rewardMails(body.email).length, 1);
  const ob = (await rows(`SELECT * FROM quiz.email_outbox WHERE kind='reward'`))[0]; assert.equal(ob.status, 'accepted'); assert.equal(ob.attempts, 3);
  const code = (await rows('SELECT code FROM quiz.discount_codes WHERE participant_id IS NOT NULL'))[0].code;
  assert.ok(rewardMails(body.email)[0].text.includes(code));
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1); assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`))[0].n, 1);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'accepted');
});

test('permanent email failure: reward kept, outbox failed, owner alerted (no personal data), admin retry sends the same reward', async () => {
  await H.openCampaign(env);
  const { body, cookie, state } = await claimWithRewardFailures(5, H.permanent());
  assert.equal(state.result.email, 'failed'); assert.equal(state.result.tier, 15);
  assert.ok((await rows('SELECT kind FROM quiz.owner_alerts')).some((a) => a.kind === 'reward_email_failed'));
  assert.ok(env.mail.to('owner@test.invalid').length >= 1); assert.ok(!JSON.stringify(env.mail.to('owner@test.invalid')).includes(body.email));
  const id = (await rows(`SELECT id FROM quiz.email_outbox WHERE kind='reward'`))[0].id;
  assert.equal((await env.admin('POST', '/api/admin/emails/retry', { id })).json.status, 'accepted');
  assert.equal(rewardMails(body.email).length, 1); assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'accepted');
});

test('provider-level idempotency: a crash between send and record cannot double-send', async () => {
  await H.openCampaign(env);
  const { body } = await H.fullJourney(env, 3);
  assert.equal(rewardMails(body.email).length, 1);
  await pg.db.query(`UPDATE quiz.email_outbox SET status='sending', updated_at = now() - interval '10 minutes' WHERE kind='reward'`);
  await env.api('GET', '/api/cron/retry', { key: 'cron-secret' });
  assert.equal(rewardMails(body.email).length, 1);
});

test('depleted inventory: earned reward preserved at claim, user told, owner alerted, fulfilled automatically on import', async () => {
  await H.openCampaign(env, { codesPerTier: 1 });
  await H.fullJourney(env, 5);
  const b = await H.fullJourney(env, 5);
  assert.equal(b.state.result.tier, 15); assert.equal(b.state.result.claim, 'claimed'); assert.equal(b.state.result.reward, 'pending_inventory'); assert.equal(b.state.result.email, 'waiting_for_inventory');
  assert.equal(rewardMails(b.body.email).length, 0);
  assert.ok((await rows('SELECT kind FROM quiz.owner_alerts')).map((x) => x.kind).includes('inventory_depleted_15'));
  assert.equal((await env.api('POST', '/api/quiz/resend-reward', { cookie: b.cookie, body: {} })).json.status, 'pending_inventory');
  const imp = await env.admin('POST', '/api/admin/codes/import', { tier: 15, batch: 'refill', codes: ['REFILL15A', 'REFILL15B'] });
  assert.equal(imp.json.inserted, 2); assert.equal(imp.json.pendingRewardsFulfilled, 1);
  assert.equal(rewardMails(b.body.email).length, 1); assert.ok(rewardMails(b.body.email)[0].text.includes('REFILL15A'));
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie: b.cookie })).json.result.reward, 'issued');
  const dup = await env.admin('POST', '/api/admin/codes/import', { tier: 15, codes: ['REFILL15A'] }); assert.equal(dup.json.inserted, 0); assert.equal(dup.json.duplicates, 1);
});

test('low inventory raises a warning alert; reward still issued', async () => {
  await H.openCampaign(env, { codesPerTier: 5 });
  await H.fullJourney(env, 0);
  assert.ok((await rows('SELECT kind FROM quiz.owner_alerts')).some((a) => a.kind === 'inventory_low_5'));
});

test('code import validates format, tier and size', async () => {
  assert.equal((await env.admin('POST', '/api/admin/codes/import', { tier: 7, codes: ['ABCD1234'] })).status, 400);
  assert.equal((await env.admin('POST', '/api/admin/codes/import', { tier: 5, codes: [] })).status, 400);
  assert.equal((await env.admin('POST', '/api/admin/codes/import', { tier: 5, codes: ['has space'] })).json.error, 'invalid_code_format');
});

test('webhooks: accepted is not delivered; delivered/bounced update status; duplicates and replays ignored; bad signature rejected', async () => {
  await H.openCampaign(env);
  const { body, cookie, state } = await H.fullJourney(env, 3);
  assert.equal(state.result.email, 'accepted');
  const mid = (await rows(`SELECT provider_message_id FROM quiz.email_outbox WHERE kind='reward'`))[0].provider_message_id;
  assert.equal((await hook('evt_bad', 'email.delivered', mid, { secret: 'whsec_' + Buffer.from('wrong').toString('base64') })).status, 401);
  assert.equal((await env.api('POST', '/api/webhooks/resend', { body: '{}', headers: { 'Content-Type': 'application/json' } })).status, 401);
  assert.equal((await hook('evt_1', 'email.delivered', mid)).status, 200);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'delivered');
  assert.equal((await hook('evt_1', 'email.delivered', mid)).json.duplicate, true);
  await hook('evt_2', 'email.sent', mid);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'delivered', 'never moves backwards');
  await hook('evt_3', 'email.bounced', mid);
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'bounced');
  assert.ok((await rows('SELECT kind FROM quiz.owner_alerts')).some((a) => a.kind === 'email_bounced'));
  assert.ok((await rows(`SELECT props FROM quiz.funnel_events WHERE name='reward_email_status'`)).map((r) => r.props.status).includes('delivered'));
  const raw = '{"type":"email.delivered","data":{"email_id":"x"}}';
  assert.equal((await env.api('POST', '/api/webhooks/resend', { body: raw, headers: { ...sign('evt_stale', raw, undefined, Math.floor(Date.now() / 1000) - 3600), 'Content-Type': 'application/json' } })).status, 401, 'stale replay rejected');
  void body;
});

test('promotional consent: unchecked by default, never required, recorded with wording/version/language/time; export + unsubscribe', async () => {
  await H.openCampaign(env);
  const no = await H.fullJourney(env, 3, { language: 'nl' });
  const yes = await H.fullJourney(env, 3, { language: 'es', marketingOptIn: true, fullName: '=CMD|calc Evil' });
  assert.equal(rewardMails(no.body.email).length, 1, 'discount delivered without promotional consent');
  const cons = await rows(`SELECT p.email_norm, mc.* FROM quiz.marketing_consents mc JOIN quiz.participants p ON p.id=mc.participant_id ORDER BY mc.id`);
  const cNo = cons.find((c) => c.email_norm === no.body.email); const cYes = cons.find((c) => c.email_norm === yes.body.email);
  assert.equal(cNo.opted_in, false); assert.equal(cYes.opted_in, true); assert.equal(cYes.language, 'es'); assert.match(cYes.wording_text, /Sí, quiero recibir/); assert.ok(cYes.wording_version && cYes.recorded_at);
  const csv = await env.api('GET', '/api/admin/leads.csv', { key: H.TEST_ENV.ADMIN_API_KEY });
  assert.equal(csv.status, 200); assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.ok(csv.text.includes(yes.body.email) && !csv.text.includes(no.body.email)); assert.ok(csv.text.includes("'=CMD")); assert.ok(!/\bage\b|gender/i.test(csv.text.split('\n')[0]));
  const tok = csv.text.match(/unsubscribe#t=([^\s,]+)/)[1];
  assert.equal((await env.api('POST', '/api/quiz/unsubscribe', { body: { token: tok + 'x' } })).status, 400);
  assert.equal((await env.api('POST', '/api/quiz/unsubscribe', { body: { token: tok } })).json.status, 'unsubscribed');
  assert.ok(!(await env.api('GET', '/api/admin/leads.csv', { key: H.TEST_ENV.ADMIN_API_KEY })).text.includes(yes.body.email));
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.suppressions'))[0].n, 1);
});

test('owner endpoints require authentication; analytics key is read-only metrics; brute force is throttled', async () => {
  const paths = [['GET', '/api/admin/overview'], ['PUT', '/api/admin/settings'], ['POST', '/api/admin/codes/import'], ['GET', '/api/admin/questions'], ['POST', '/api/admin/questions/import'],
    ['GET', '/api/admin/emails'], ['POST', '/api/admin/emails/retry'], ['GET', '/api/admin/leads.csv'], ['POST', '/api/admin/participants/delete'], ['POST', '/api/admin/retention/run'],
    ['POST', '/api/admin/redemptions/import'], ['POST', '/api/admin/alerts/resolve'], ['GET', '/api/admin/metrics'], ['GET', '/api/cron/retry']];
  let n = 0;
  for (const [m, p] of paths) { const r = await env.api(m, p, { body: m === 'GET' ? undefined : {}, ip: `4.4.${++n}.4` }); assert.equal(r.status, 401, `${m} ${p}`); }
  assert.equal((await env.api('GET', '/api/admin/overview', { key: 'wrong', ip: '4.4.4.5' })).status, 401);
  assert.equal((await env.api('GET', '/api/admin/metrics', { key: H.TEST_ENV.ANALYTICS_API_KEY })).status, 200);
  for (const [m, p] of paths.filter((x) => !x[1].endsWith('metrics'))) { const r = await env.api(m, p, { key: H.TEST_ENV.ANALYTICS_API_KEY, body: m === 'GET' ? undefined : {}, ip: `4.5.${++n}.6` }); assert.equal(r.status, 401, `analytics key must not open ${p}`); }
  let last; for (let i = 0; i < 12; i++) last = await env.api('GET', '/api/admin/overview', { key: 'guess' + i, ip: '6.6.6.6' });
  assert.equal(last.status, 429);
  assert.equal((await env.api('GET', '/api/admin/overview', { key: H.TEST_ENV.ADMIN_API_KEY, ip: '6.6.6.6' })).status, 429);
  assert.equal((await env.api('GET', '/api/admin/overview', { key: H.TEST_ENV.ADMIN_API_KEY, ip: '6.6.6.7' })).status, 200);
});

test('redemption import links orders to codes; metrics report revenue only from imported data, never from issuance', async () => {
  await H.openCampaign(env);
  const p1 = await H.fullJourney(env, 5, { attribution: { utm_source: 'meta', utm_campaign: 'camp_A', utm_content: 'creative_1' }, language: 'es' });
  const p2 = await H.fullJourney(env, 1, { attribution: { utm_source: 'tiktok', utm_campaign: 'camp_B' }, language: 'en' });
  let m = (await env.api('GET', '/api/admin/metrics', { key: H.TEST_ENV.ANALYTICS_API_KEY })).json;
  assert.deepEqual(m.redemptions, []); assert.equal(m.freshness.lastRedemptionImport, null); assert.equal(m.leads.purchasers, 0);
  const codeOf = async (email) => (await rows(`SELECT code FROM quiz.discount_codes d JOIN quiz.participants p ON p.id=d.participant_id WHERE p.email_norm=$1`, [email]))[0].code;
  const c1 = await codeOf(p1.body.email); const c2 = await codeOf(p2.body.email);
  const csv = `code,order_id,ordered_at,gross,net,status\n${c1},ORD-1,2026-10-20T12:00:00+02:00,"85,00","72,25",paid\n${c2},ORD-2,2026-10-21T12:00:00+02:00,"85,00","80,75",paid\nNOTOURS,ORD-3,2026-10-21T12:00:00+02:00,"85,00","85,00",paid\n`;
  const imp = await env.admin('POST', '/api/admin/redemptions/import', { csv });
  assert.deepEqual([imp.json.matched, imp.json.unmatched, imp.json.inserted], [2, 1, 2]);
  assert.equal((await env.admin('POST', '/api/admin/redemptions/import', { csv: csv.replace('"80,75",paid', '"80,75",refunded') })).json.updated, 2);
  m = (await env.api('GET', '/api/admin/metrics?from=2020-01-01&to=2100-01-01', { key: H.TEST_ENV.ANALYTICS_API_KEY })).json;
  assert.deepEqual(m.redemptionsToDate.map((r) => [r.status, Number(r.net_cents)]).sort(), [['paid', 7225], ['refunded', 8075]]);
  assert.equal(m.leads.purchasers, 1);
  const seg = m.redemptionsBySegment.find((r) => r.campaign === 'camp_A'); assert.equal(seg.purchasers, 1); assert.equal(seg.tier, 15);
  assert.equal((await env.admin('POST', '/api/admin/redemptions/import', { csv: 'foo,bar\n1,2' })).json.error, 'missing_columns');
  assert.equal((await env.admin('POST', '/api/admin/redemptions/import', { csv: `Coupon;Order number;Total\n${c1};ORD-9;"85,00"`, mapping: { code: 'Coupon', order_ref: 'Order number', gross: 'Total' } })).json.matched, 1);
});

test('metrics: funnel stages in play-first order, question-level abandonment, email statuses, inventory, freshness', async () => {
  await H.openCampaign(env);
  await H.fullJourney(env, 4, { attribution: { utm_source: 'meta', utm_campaign: 'camp_A' } });
  const { cookie, state: st } = await H.startAnon(env);      // plays one question and leaves
  await env.api('POST', '/api/quiz/answer', { cookie, body: { questionId: st.question.id, optionId: st.question.options[0].id } });
  await H.playScore(env, 2);                                   // finished but never gave an email
  const m = (await env.api('GET', '/api/admin/metrics?from=' + encodeURIComponent(new Date(Date.now() - 3600_000).toISOString()), { key: H.TEST_ENV.ANALYTICS_API_KEY })).json;
  const stage = (n) => (m.stages.find((s) => s.name === n) || { people: 0 }).people;
  assert.equal(stage('quiz_started'), 3); assert.equal(stage('quiz_completed'), 2); assert.equal(stage('form_success'), 1); assert.equal(stage('verification_completed'), 1); assert.equal(stage('reward_issued'), 1);
  const pos = Object.fromEntries(m.positions.map((p) => [p.position, p])); assert.equal(pos[0].viewed, 3); assert.equal(pos[1].viewed, 3); assert.equal(pos[4].answered, 2);
  assert.equal(m.emails.find((e) => e.kind === 'reward' && e.status === 'accepted').n, 1);
  assert.equal(m.inventory.find((i) => i.tier === 10 && i.status === 'issued').n, 1);
  assert.ok(m.freshness.lastFunnelEvent); assert.equal(m.freshness.lastEmailWebhook, null);
  assert.ok(m.segments.find((s) => s.dimension === 'utm_campaign').rows.some((r) => r.key === 'camp_A'));
  assert.ok(!JSON.stringify(m).includes('@'));
});

test('cookieless landing/start counters: attributed by campaign, bots ignored, no identifiers stored', async () => {
  const ua = { 'user-agent': 'Mozilla/5.0 (iPhone)' };
  for (let i = 0; i < 3; i++) await env.api('POST', '/api/quiz/ping', { body: { metric: 'landing_view', language: 'nl', attribution: { utm_source: 'tiktok', utm_campaign: 'c', email: 'x@y.com' } }, headers: ua });
  await env.api('POST', '/api/quiz/ping', { body: { metric: 'start_click', language: 'nl', attribution: { utm_source: 'tiktok', utm_campaign: 'c' } }, headers: ua });
  await env.api('POST', '/api/quiz/ping', { body: { metric: 'landing_view', language: 'en' }, headers: { 'user-agent': 'facebookexternalhit/1.1' } });
  await env.api('POST', '/api/quiz/ping', { body: { metric: 'bogus' }, headers: ua });
  const c = await rows('SELECT metric, dims, count FROM quiz.daily_counters ORDER BY metric');
  assert.deepEqual(c.map((x) => [x.metric, x.count]), [['landing_view', 3], ['start_click', 1]]);
  assert.ok(!JSON.stringify(c).includes('x@y.com'));
});

test('retention + erasure: removes participant data (their attempts too), keeps opted-in until they leave, inventory integrity kept', async () => {
  await H.openCampaign(env);
  await H.fullJourney(env, 2); const b = await H.fullJourney(env, 2, { marketingOptIn: true });
  await H.playScore(env, 1);   // anonymous, never claimed: stays (no personal data)
  assert.match((await env.admin('POST', '/api/admin/retention/run', { dryRun: false })).json.note, /not elapsed/);
  await env.admin('PUT', '/api/admin/settings', { opens_at: '2020-01-01T00:00:00+01:00', closes_at: '2020-02-01T00:00:00+01:00', enabled: false, retention_days: 30 });
  const dry = await env.admin('POST', '/api/admin/retention/run', {}); assert.equal(dry.json.dryRun, true); assert.equal(dry.json.eligible, 1);
  assert.equal((await env.admin('POST', '/api/admin/retention/run', { dryRun: false })).json.deleted, 1);
  assert.equal((await rows('SELECT email_norm FROM quiz.participants')).map((r) => r.email_norm).join(), b.body.email);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 2, 'deleted participant takes their attempt; the anonymous one stays');
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.discount_codes WHERE status='issued'`))[0].n, 2, 'issued codes stay consumed');
  assert.equal((await env.admin('POST', '/api/admin/participants/delete', { email: b.body.email.toUpperCase() })).json.deleted, 1);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.participants'))[0].n, 0);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.verification_tokens'))[0].n, 0);
});

test('question bank admin: validated import, version bump, inactive questions unused, readiness reports bank size', async () => {
  const bank = H.syntheticBank();
  const bad = await env.admin('POST', '/api/admin/questions/import', { questions: [{ ...bank[0], correct: 'q' }] });
  assert.equal(bad.status, 400); assert.ok(bad.json.problems['MOV-001']);
  assert.equal((await env.admin('POST', '/api/admin/questions/import', { questions: bank })).json.created, 40);
  assert.equal((await env.admin('POST', '/api/admin/questions/import', { questions: bank })).json.unchanged, 40);
  for (let i = 1; i <= 6; i++) await env.admin('POST', '/api/admin/questions/active', { id: `MOV-${String(i).padStart(3, '0')}`, active: false });
  const ov = (await env.admin('GET', '/api/admin/overview')).json;
  assert.equal(ov.questionBank.find((b) => b.theme === 'movies').active, 4);
  assert.equal(ov.readiness.checks.find((c) => c.key === 'bank_movies').ok, false); assert.equal(ov.readiness.ready, false);
});

test('bank too small to serve five questions fails safely instead of half-starting', async () => {
  await H.openCampaign(env, { bank: H.syntheticBank(10) });
  await pg.db.query(`UPDATE quiz.questions SET active=false WHERE theme <> 'facts' OR id > 'FAC-003'`);
  const r = await env.api('POST', '/api/quiz/start', { body: {}, ip: H.nextIp() });
  assert.equal(r.status, 503); assert.equal((await rows('SELECT count(*)::int n FROM quiz.attempts'))[0].n, 0);
});

test('optional answer review is off by default and only shown to a claimed participant when the owner enables it', async () => {
  await H.openCampaign(env);
  const { cookie: anon, state: mid } = await H.startAnon(env);
  assert.ok(!JSON.stringify(mid).includes('explanation'));
  const done = await H.play(env, anon); assert.equal(done.state.result.review, undefined);
  await env.admin('PUT', '/api/admin/settings', { show_review_after_completion: true });
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie: anon })).json.result.review, undefined, 'not before claiming');
  const { cookie } = await H.fullJourney(env, 2);
  const rv = (await env.api('GET', '/api/quiz/state?lang=es', { cookie })).json.result.review;
  assert.equal(rv.length, 5); assert.ok(rv[0].explanation.includes('pregunta')); assert.equal(rv.filter((x) => x.wasCorrect).length, 2);
});

test('mail provider not configured: nothing is sent, nothing is lost, the owner is alerted', async () => {
  await H.openCampaign(env);
  const { cookie } = await H.playScore(env, 3);
  const body = H.signupBody();
  await env.api('POST', '/api/quiz/signup', { body, cookie, ip: H.nextIp() });
  const tok = H.linkTokenFrom(env.mail.last(body.email, 'signin'));
  env.mail.configured = false; env.mail.failNext(Object.assign(new Error('mail_not_configured'), { permanent: false }));
  await env.api('POST', '/api/quiz/verify', { body: { token: tok }, cookie });
  assert.equal((await env.api('GET', '/api/quiz/state', { cookie })).json.result.email, 'queued'); env.mail.configured = true;
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.rewards'))[0].n, 1);
});

test('request size limits: public endpoints cap at 32KB (clean 413); authenticated bulk imports accept large payloads; unauthenticated bulk refused', async () => {
  const big = await env.api('POST', '/api/quiz/signup', { body: JSON.stringify({ fullName: 'x'.repeat(40 * 1024) }), headers: { 'Content-Type': 'application/json' }, ip: '11.1.1.1' });
  assert.equal(big.status, 413);
  const codes = Array.from({ length: 3000 }, (_, i) => `BULKCODE${String(i).padStart(5, '0')}`);
  const ok = await env.admin('POST', '/api/admin/codes/import', { tier: 5, codes }); assert.equal(ok.status, 200); assert.equal(ok.json.inserted, 3000);
  assert.equal((await env.api('POST', '/api/admin/codes/import', { body: { tier: 5, codes }, ip: '11.1.1.2' })).status, 401);
});
