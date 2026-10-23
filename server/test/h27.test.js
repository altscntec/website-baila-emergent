'use strict';
// Halloween 2027 early-release list: hidden until the opening moment; then form -> email code -> WhatsApp/SMS code
// -> confirmation. One row per email, verified rows are never overwritten, codes are rate limited, owner export.
const test = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let pg; let env;
const OPEN = '2020-01-01T00:00:00Z';
test.before(async () => { pg = await H.startPostgres(); env = await H.makeEnv(pg, { h27OpensAt: OPEN, h27PhoneVerification: 'on' }); });
test.after(async () => { await env.close(); await pg.stop(); });
test.beforeEach(async () => { await H.resetDb(pg.db); env.mail.sent.length = 0; env.sms.started.length = 0; env.sms.checks.length = 0; env.sms.configured = true; env.clock.offsetMs = 0; env.ctx.cfg.h27OpensAt = OPEN; });
const rows = async (sql, p) => (await pg.db.query(sql, p)).rows;
const body = (over = {}) => ({ fullName: 'Lead Tester', email: `lead.${Date.now()}${Math.random().toString(16).slice(2, 6)}@test.invalid`, phone: '+31 6 1234 5678', consent: true, attribution: { utm_source: 'instagram' }, ...over });
const codeFrom = (mail) => mail.text.match(/\b(\d{6})\b/)[1];
const post = (p, b, ip) => env.api('POST', p, { body: b, ip: ip || H.nextIp() });

// Whole happy path; returns everything useful.
const complete = async (over = {}) => {
  const b = body(over);
  const s = await post('/api/h27/signup', b);
  assert.equal(s.status, 200, s.text);
  const e = await post('/api/h27/email/verify', { token: s.json.token, code: codeFrom(env.mail.last(b.email, 'h27_code')) });
  assert.equal(e.status, 200, e.text);
  const st = await post('/api/h27/phone/start', { token: s.json.token, channel: 'whatsapp' });
  assert.equal(st.status, 200, st.text);
  const v = await post('/api/h27/phone/verify', { token: s.json.token, code: env.sms.code });
  assert.equal(v.status, 200, v.text);
  return { b, token: s.json.token, signup: s.json, email: e.json, start: st.json, done: v.json };
};

test('phone verification is off by default (approved page verifies email only), even with a provider configured', async () => {
  const prev = env.ctx.cfg.h27PhoneVerification; env.ctx.cfg.h27PhoneVerification = 'off';
  try {
    assert.equal((await env.api('GET', '/api/h27/status')).json.phoneVerification, 'off');
    const b = body(); const s = await post('/api/h27/signup', b);
    assert.equal(s.json.next, 'email');
    const e = await post('/api/h27/email/verify', { token: s.json.token, code: codeFrom(env.mail.last(b.email, 'h27_code')) });
    assert.equal(e.json.next, 'done'); assert.equal(e.json.confirm, 'accepted');
    assert.equal(env.sms.started.length, 0, 'no WhatsApp message is ever triggered');
    assert.ok((await rows('SELECT consent_text FROM quiz.h27_signups'))[0].consent_text.startsWith('I agree to receive Halloween 2027 event updates'));
  } finally { env.ctx.cfg.h27PhoneVerification = prev; }
});

test('hidden before the opening moment: status says hidden and sign-ups are refused', async () => {
  env.ctx.cfg.h27OpensAt = '2099-01-01T00:00:00+01:00';
  const st = await env.api('GET', '/api/h27/status');
  assert.equal(st.status, 200); assert.equal(st.json.state, 'hidden'); assert.equal(st.json.phoneVerification, 'whatsapp');
  const r = await post('/api/h27/signup', body());
  assert.equal(r.status, 403); assert.equal(r.json.error, 'not_open');
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
  assert.equal(env.mail.sent.length, 0); assert.equal(env.sms.started.length, 0);
});

test('happy path: form -> 6-digit email code -> WhatsApp code -> verified + confirmation email with a working removal link', async () => {
  const { b, signup, email, start, done } = await complete({ phone: '06 1234 5678' });
  assert.equal(signup.status, 'pending'); assert.equal(signup.next, 'email'); assert.equal(signup.emailCode, 'accepted'); assert.equal(signup.created, true);
  assert.match(signup.email, /^l\*+@test\.invalid$/); assert.equal(signup.phone, '+31••••••678', 'phone is masked for the browser');
  assert.ok(!JSON.stringify(signup).match(/\b\d{6}\b/), 'no code in the signup response');
  const codeMail = env.mail.last(b.email, 'h27_code');
  assert.ok(codeMail.subject.includes('code')); assert.ok(!codeMail.text.includes('+316'), 'phone is not in the email');
  assert.equal(email.status, 'email_verified'); assert.equal(email.next, 'phone'); assert.equal(email.confirm, null, 'no confirmation before the phone is verified');
  assert.equal(start.status, 'sent'); assert.equal(start.channel, 'whatsapp');
  assert.deepEqual(env.sms.started.map((s) => [s.to, s.channel]), [['+31612345678', 'whatsapp']], 'provider asked to send a WhatsApp code to the normalised number');
  assert.equal(done.status, 'done'); assert.equal(done.next, 'done'); assert.equal(done.confirm, 'accepted');
  const row = (await rows('SELECT * FROM quiz.h27_signups'))[0];
  assert.ok(row.email_verified_at && row.phone_verified_at); assert.equal(row.phone_channel, 'whatsapp'); assert.equal(row.phone_verify_status, 'verified');
  assert.equal(row.email_code_hash, null, 'used code is gone'); assert.equal(row.confirm_status, 'accepted');
  const confirm = env.mail.last(b.email, 'h27_confirm');
  assert.ok(confirm.subject.includes('Halloween 2027'));
  const token = decodeURIComponent(confirm.text.match(/unsubscribe#t=(\S+)/)[1]);
  assert.equal((await post('/api/h27/unsubscribe', { token: token.slice(0, -2) + 'zz' })).status, 401);
  const u = await post('/api/h27/unsubscribe', { token });
  assert.equal(u.status, 200); assert.equal(u.json.removed, true);
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
});

test('email code: wrong code counts attempts, locks after 5, expires after 30 minutes, resend issues a fresh one', async () => {
  const b = body();
  const s = await post('/api/h27/signup', b); const token = s.json.token;
  for (let i = 1; i <= 5; i++) {
    const r = await post('/api/h27/email/verify', { token, code: '000000' });
    assert.equal(r.status, 400); assert.equal(r.json.error, 'code_invalid'); assert.equal(r.json.attemptsLeft, 5 - i);
  }
  const locked = await post('/api/h27/email/verify', { token, code: codeFrom(env.mail.last(b.email, 'h27_code')) });
  assert.equal(locked.status, 429); assert.equal(locked.json.error, 'too_many_attempts');
  const rs = await post('/api/h27/email/resend', { token });
  assert.equal(rs.status, 200); assert.equal(rs.json.status, 'sent');
  const fresh = codeFrom(env.mail.last(b.email, 'h27_code'));
  env.clock.offsetMs = 31 * 60 * 1000;
  const exp = await post('/api/h27/email/verify', { token, code: fresh });
  assert.equal(exp.status, 400); assert.equal(exp.json.error, 'code_expired');
  env.clock.offsetMs = 0;
  await post('/api/h27/email/resend', { token });
  const ok = await post('/api/h27/email/verify', { token, code: codeFrom(env.mail.last(b.email, 'h27_code')) });
  assert.equal(ok.status, 200);
  assert.equal((await post('/api/h27/email/resend', { token })).status, 200, 'already verified: harmless');
  assert.equal((await post('/api/h27/email/verify', { token: token.slice(0, -1) + 'x', code: '123456' })).status, 401, 'tampered token');
});

test('phone step needs a verified email first; WhatsApp failure offers SMS; wrong phone code rejected; provider off skips the step', async () => {
  const b = body();
  const s = await post('/api/h27/signup', b); const token = s.json.token;
  assert.equal((await post('/api/h27/phone/start', { token, channel: 'whatsapp' })).status, 409, 'no WhatsApp message without owning the email');
  assert.equal(env.sms.started.length, 0);
  await post('/api/h27/email/verify', { token, code: codeFrom(env.mail.last(b.email, 'h27_code')) });
  assert.equal((await post('/api/h27/phone/verify', { token, code: '123456' })).status, 409, 'nothing to check before a code was sent');
  const { SmsError } = require('../sms/twilioVerify');
  env.sms.failNext(new SmsError('channel_unavailable'));
  const wa = await post('/api/h27/phone/start', { token, channel: 'whatsapp' });
  assert.equal(wa.status, 400); assert.equal(wa.json.error, 'channel_unavailable');
  const sms = await post('/api/h27/phone/start', { token, channel: 'sms' });
  assert.equal(sms.status, 200); assert.equal(sms.json.channel, 'sms');
  const bad = await post('/api/h27/phone/verify', { token, code: '999999' });
  assert.equal(bad.status, 400); assert.equal(bad.json.error, 'code_invalid');
  assert.ok(!(await rows('SELECT phone_verified_at FROM quiz.h27_signups'))[0].phone_verified_at);
  const good = await post('/api/h27/phone/verify', { token, code: env.sms.code });
  assert.equal(good.status, 200); assert.equal(good.json.status, 'done');
  assert.equal((await rows('SELECT phone_channel FROM quiz.h27_signups'))[0].phone_channel, 'sms');

  // provider not configured: email verification completes the sign-up and the confirmation goes out
  env.sms.configured = false;
  const b2 = body();
  const s2 = await post('/api/h27/signup', b2);
  assert.equal(s2.json.phoneVerification, 'off');
  const e2 = await post('/api/h27/email/verify', { token: s2.json.token, code: codeFrom(env.mail.last(b2.email, 'h27_code')) });
  assert.equal(e2.json.next, 'done'); assert.equal(e2.json.confirm, 'accepted');
  assert.ok(env.mail.last(b2.email, 'h27_confirm'));
});

test('one row per email: an unverified row is replaced, a verified row is never overwritten by a stranger', async () => {
  const b = body();
  await post('/api/h27/signup', b);
  const again = await post('/api/h27/signup', { ...b, fullName: 'Second Try', phone: '+31 6 9999 9999' });
  assert.equal(again.json.created, false);
  let all = await rows('SELECT full_name, phone_norm FROM quiz.h27_signups');
  assert.equal(all.length, 1); assert.equal(all[0].full_name, 'Second Try'); assert.equal(all[0].phone_norm, '+31699999999');

  const { b: owner } = await complete({ fullName: 'Owner', phone: '+31 6 1111 1111' });
  const stranger = await post('/api/h27/signup', { ...owner, fullName: 'Stranger', phone: '+31 6 2222 2222' });
  assert.equal(stranger.status, 200, 'same answer as any other sign-up (no enumeration)');
  assert.equal(stranger.json.created, false);
  const kept = (await rows('SELECT full_name, phone_norm, email_verified_at FROM quiz.h27_signups WHERE email_norm = $1', [owner.email.toLowerCase()]))[0];
  assert.equal(kept.full_name, 'Owner'); assert.equal(kept.phone_norm, '+31611111111'); assert.ok(kept.email_verified_at);
  assert.equal(env.sms.started.filter((x) => x.to === '+31622222222').length, 0, 'the stranger cannot make us message their number');
});

test('validation: name, email, phone and consent required; phone formats; nothing stored or sent on rejection', async () => {
  const cases = [
    [{ fullName: '' }, 'fullName', 'required'], [{ email: 'nope' }, 'email', 'invalid'], [{ phone: '12345' }, 'phone', 'invalid'],
    [{ phone: 'call me' }, 'phone', 'invalid'], [{ phone: '' }, 'phone', 'required'], [{ consent: false }, 'consent', 'required'], [{ consent: 'yes' }, 'consent', 'required'],
  ];
  for (const [over, field, code] of cases) {
    const r = await post('/api/h27/signup', body(over));
    assert.equal(r.status, 400, JSON.stringify(over)); assert.equal(r.json.fields[field], code, JSON.stringify(over));
  }
  assert.equal((await rows('SELECT count(*)::int n FROM quiz.h27_signups'))[0].n, 0);
  assert.equal(env.mail.sent.length, 0);
  for (const [input, want] of [['+31612345678', '+31612345678'], ['0031 6 12345678', '+31612345678'], ['06-12345678', '+31612345678'], ['+34 612 345 678', '+34612345678']]) {
    const r = await post('/api/h27/signup', body({ phone: input }));
    assert.equal(r.status, 200, input);
    assert.equal((await rows('SELECT phone_norm FROM quiz.h27_signups ORDER BY created_at DESC LIMIT 1'))[0].phone_norm, want, input);
  }
});

test('rate limits: 10 sign-ups per IP per hour, 3 per email per hour, 3 code resends per sign-up', async () => {
  const ip = H.nextIp();
  for (let i = 0; i < 10; i++) assert.equal((await post('/api/h27/signup', body(), ip)).status, 200);
  const r = await post('/api/h27/signup', body(), ip);
  assert.equal(r.status, 429); assert.ok(r.json.retryAfter > 0);
  const b = body(); let token;
  for (let i = 0; i < 3; i++) { const s = await post('/api/h27/signup', b); assert.equal(s.status, 200); token = s.json.token; }
  assert.equal((await post('/api/h27/signup', b)).status, 429);
  for (let i = 0; i < 3; i++) assert.equal((await post('/api/h27/email/resend', { token })).status, 200);
  assert.equal((await post('/api/h27/email/resend', { token })).status, 429);
});

test('a failing mail provider never loses the sign-up; the person can ask for the code again', async () => {
  env.mail.failNext(H.permanent());
  const b = body();
  const r = await post('/api/h27/signup', b);
  assert.equal(r.status, 200); assert.equal(r.json.emailCode, 'failed');
  const rs = await post('/api/h27/email/resend', { token: r.json.token });
  assert.equal(rs.json.emailCode, 'accepted');
  assert.equal((await post('/api/h27/email/verify', { token: r.json.token, code: codeFrom(env.mail.last(b.email, 'h27_code')) })).status, 200);
});

test('owner: summary and CSV need the admin key; CSV shows verification per row; export is audited', async () => {
  const { b } = await complete();
  await post('/api/h27/signup', body());   // one unverified row
  assert.equal((await env.api('GET', '/api/admin/h27/summary')).status, 401);
  assert.equal((await env.api('GET', '/api/admin/h27/leads.csv')).status, 401);
  const sj = JSON.parse((await env.admin('GET', '/api/admin/h27/summary')).text);
  assert.equal(sj.total, 2); assert.equal(sj.emailVerified, 1); assert.equal(sj.phoneVerified, 1); assert.equal(sj.confirmationEmailsAccepted, 1);
  const csv = await env.admin('GET', '/api/admin/h27/leads.csv');
  const lines = csv.text.trim().split('\n');
  assert.equal(lines[0], 'full_name,email,phone,email_verified,phone_verified,phone_channel,consent_at,signed_up_at,utm_source,utm_campaign,unsubscribe_url');
  assert.equal(lines.length, 3);
  const mine = lines.find((l) => l.includes(b.email));
  assert.ok(mine.includes(',yes,yes,whatsapp,') && mine.includes('+31612345678') && mine.includes('instagram'));
  assert.equal((await rows(`SELECT count(*)::int n FROM quiz.audit_log WHERE action = 'h27.export'`))[0].n, 1);
});
