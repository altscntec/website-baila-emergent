'use strict';
// Halloween 2027 early-release list: hidden until the opening moment, then name + email + phone sign-ups with
// consent, one row per email, confirmation email with a signed removal link, owner CSV export.
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
const OPEN = '2020-01-01T00:00:00Z';
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg, { h27OpensAt: OPEN }); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.clock.offsetMs = 0; env.ctx.cfg.h27OpensAt = OPEN; });
const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;
const body = (over = {}) => ({ fullName: 'Lead Tester', email: `lead.${Date.now()}${Math.random().toString(16).slice(2, 6)}@test.invalid`, phone: '+31 6 1234 5678', consent: true, attribution: { utm_source: 'instagram' }, ...over });

test('hidden before the opening moment: status says hidden and sign-ups are refused', async () => {
  env.ctx.cfg.h27OpensAt = '2099-01-01T00:00:00+01:00';
  const st = await env.api('GET', '/api/h27/status');
  assert.equal(st.status, 200); assert.equal(st.json.state, 'hidden'); assert.equal(st.json.opensAt, '2099-01-01T00:00:00+01:00');
  const r = await env.api('POST', '/api/h27/signup', { body: body(), ip: H.nextIp() });
  assert.equal(r.status, 403); assert.equal(r.json.error, 'not_open');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
  assert.equal(env.mail.sent.length, 0);
});

test('open: valid sign-up is stored once per email, phone normalised, confirmation email sent with a working removal link', async () => {
  assert.equal((await env.api('GET', '/api/h27/status')).json.state, 'open');
  const b = body({ phone: '06 1234 5678' });
  const r = await env.api('POST', '/api/h27/signup', { body: b, ip: H.nextIp() });
  assert.equal(r.status, 200); assert.deepEqual(r.json, { status: 'ok', created: true, confirm: 'accepted' });
  const row = (await rows('SELECT * FROM quiz.h27_signups'))[0];
  assert.equal(row.full_name, 'Lead Tester'); assert.equal(row.email_norm, b.email.toLowerCase()); assert.equal(row.phone_norm, '+31612345678');
  assert.ok(row.consent_text.includes('Halloween Indoor Fest 2027')); assert.equal(row.attribution.utm_source, 'instagram'); assert.equal(row.confirm_status, 'accepted');
  const mail = env.mail.last(b.email, 'h27_confirm');
  assert.ok(mail && mail.subject.includes('Halloween 2027'));
  assert.ok(!mail.text.includes('+316'), 'phone is not echoed in the email');

  // same email again: updated, not duplicated; no second row
  const r2 = await env.api('POST', '/api/h27/signup', { body: { ...b, fullName: 'Lead Tester Updated', phone: '+31 6 9999 9999' }, ip: H.nextIp() });
  assert.equal(r2.status, 200); assert.equal(r2.json.created, false);
  const all = await rows('SELECT full_name, phone_norm FROM quiz.h27_signups');
  assert.equal(all.length, 1); assert.equal(all[0].full_name, 'Lead Tester Updated'); assert.equal(all[0].phone_norm, '+31699999999');

  // removal link from the email deletes the row; a tampered token is refused
  const token = decodeURIComponent(mail.text.match(/unsubscribe#t=(\S+)/)[1]);
  assert.equal((await env.api('POST', '/api/h27/unsubscribe', { body: { token: token.slice(0, -2) + 'zz' } })).status, 400);
  const u = await env.api('POST', '/api/h27/unsubscribe', { body: { token } });
  assert.equal(u.status, 200); assert.equal(u.json.removed, true);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
});

test('validation: name, email, phone and consent are all required; bad phones rejected; nothing stored', async () => {
  const cases = [
    [{ fullName: '' }, 'fullName', 'required'], [{ email: 'nope' }, 'email', 'invalid'], [{ phone: '12345' }, 'phone', 'invalid'],
    [{ phone: 'call me' }, 'phone', 'invalid'], [{ phone: '' }, 'phone', 'required'], [{ consent: false }, 'consent', 'required'], [{ consent: 'yes' }, 'consent', 'required'],
  ];
  for (const [over, field, code] of cases) {
    const r = await env.api('POST', '/api/h27/signup', { body: body(over), ip: H.nextIp() });
    assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(r.json.fields[field], code, JSON.stringify(over));
  }
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
  assert.equal(env.mail.sent.length, 0);
  // accepted phone formats
  for (const [input, want] of [['+31612345678', '+31612345678'], ['0031 6 12345678', '+31612345678'], ['06-12345678', '+31612345678'], ['+34 612 345 678', '+34612345678']]) {
    const r = await env.api('POST', '/api/h27/signup', { body: body({ phone: input }), ip: H.nextIp() });
    assert.equal(r.status, 200, input);
    assert.equal((await rows('SELECT phone_norm FROM quiz.h27_signups ORDER BY created_at DESC LIMIT 1'))[0].phone_norm, want, input);
  }
});

test('rate limits: 10 sign-ups per IP per hour, 3 per email per hour', async () => {
  const ip = H.nextIp();
  for (let i = 0; i < 10; i++) assert.equal((await env.api('POST', '/api/h27/signup', { body: body(), ip })).status, 200);
  const r = await env.api('POST', '/api/h27/signup', { body: body(), ip });
  assert.equal(r.status, 429); assert.ok(r.json.retryAfter > 0);
  const b = body();
  for (let i = 0; i < 3; i++) assert.equal((await env.api('POST', '/api/h27/signup', { body: b, ip: H.nextIp() })).status, 200);
  assert.equal((await env.api('POST', '/api/h27/signup', { body: b, ip: H.nextIp() })).status, 429);
});

test('a failing mail provider never loses the sign-up', async () => {
  env.mail.failNext(H.permanent());
  const b = body();
  const r = await env.api('POST', '/api/h27/signup', { body: b, ip: H.nextIp() });
  assert.equal(r.status, 200); assert.equal(r.json.confirm, 'failed');
  assert.equal((await rows('SELECT confirm_status FROM quiz.h27_signups'))[0].confirm_status, 'failed');
});

test('owner: summary and CSV need the admin key; CSV has the rows, the audit log records the export', async () => {
  const b = body();
  await env.api('POST', '/api/h27/signup', { body: b, ip: H.nextIp() });
  assert.equal((await env.api('GET', '/api/admin/h27/summary')).status, 401);
  assert.equal((await env.api('GET', '/api/admin/h27/leads.csv')).status, 401);
  const s = await env.admin('GET', '/api/admin/h27/summary');
  assert.equal(s.status, 200); const sj = JSON.parse(s.text); assert.equal(sj.total, 1); assert.equal(sj.confirmationEmailsAccepted, 1); assert.equal(sj.state, 'open');
  const csv = await env.admin('GET', '/api/admin/h27/leads.csv');
  assert.equal(csv.status, 200);
  const lines = csv.text.trim().split('\n');
  assert.equal(lines[0], 'full_name,email,phone,consent_at,signed_up_at,utm_source,utm_campaign,unsubscribe_url');
  assert.equal(lines.length, 2); assert.ok(lines[1].includes(b.email) && lines[1].includes('+31612345678') && lines[1].includes('instagram'));
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.audit_log WHERE action = 'h27.export'`))[0].n, 1);
});
