'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { tierForScore } = require('../lib/tiers');
const { validateSignup } = require('../lib/validate');
const { normalizeEmail } = require('../lib/normalize');
const { shuffle, sample } = require('../lib/crypto');
const { sanitizeAttribution } = require('../lib/attribution');
const { parseCsv, toCsv, toCents } = require('../lib/csv');
const { verifySvix } = require('../mail/webhook');
const { validateSettingsPatch, DEFAULT_SETTINGS, campaignState } = require('../lib/settings');
const { signinEmail, rewardEmail, S } = require('../email/templates');
const { buildCheckoutUrl } = require('../services/mailer');
const { validateQuestion } = require('../services/admin');
const { syntheticBank, signupBody } = require('./helpers');

test('score boundaries: 0-2 -> 5%, 3-4 -> 10%, 5 -> 15%', () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(tierForScore), [5, 5, 5, 10, 10, 15]);
  for (const bad of [-1, 6, 2.5, NaN, '3']) assert.throws(() => tierForScore(bad), RangeError);
});

test('signup validation: required fields, age rules, Prefer-not-to-say, opt-in defaults to false', () => {
  assert.equal(validateSignup(signupBody()).ok, true);
  const v = validateSignup(signupBody({ gender: 'prefer_not_to_say' }));
  assert.equal(v.value.gender, 'prefer_not_to_say');
  assert.equal(v.value.marketingOptIn, false);
  // marketing consent only counts when it is literally `true`
  for (const x of ['true', 1, 'on', undefined, null]) assert.equal(validateSignup(signupBody({ marketingOptIn: x })).value.marketingOptIn, false);
  assert.equal(validateSignup(signupBody({ marketingOptIn: true })).value.marketingOptIn, true);
  // under 18 and boundaries
  assert.equal(validateSignup(signupBody({ age: 17 })).errors.age, 'under_18');
  assert.equal(validateSignup(signupBody({ age: '17' })).errors.age, 'under_18');
  assert.equal(validateSignup(signupBody({ age: 0 })).errors.age, 'under_18');
  assert.equal(validateSignup(signupBody({ age: 18 })).ok, true);
  assert.equal(validateSignup(signupBody({ age: '18' })).ok, true);
  for (const a of [18.5, '18.5', 'abc', '', null, -5, 121, '1e2', ' ', '0x20']) assert.ok(validateSignup(signupBody({ age: a })).errors.age, `age ${JSON.stringify(a)} must be rejected`);
  // each required field
  for (const f of ['fullName', 'email', 'age', 'gender', 'city', 'country', 'acceptTerms']) {
    const b = signupBody(); delete b[f];
    assert.ok(validateSignup(b).errors[f], `${f} is required`);
  }
  assert.equal(validateSignup(signupBody({ gender: 'self_describe' })).errors.genderSelf, 'required');
  assert.equal(validateSignup(signupBody({ gender: 'self_describe', genderSelf: 'Genderfluid' })).ok, true);
  assert.equal(validateSignup(signupBody({ country: 'XX' })).errors.country, 'invalid');
  assert.equal(validateSignup(signupBody({ language: 'fr' })).errors.language, 'invalid');
  assert.equal(validateSignup(signupBody({ acceptTerms: 'true' })).errors.acceptTerms, 'required');
});

test('email normalisation: consistent, no provider-specific rewriting', () => {
  assert.equal(normalizeEmail('  Ana.Diaz+Quiz@GMAIL.com '), 'ana.diaz+quiz@gmail.com');
  assert.notEqual(normalizeEmail('a.b@gmail.com'), normalizeEmail('ab@gmail.com'));      // dots preserved
  assert.notEqual(normalizeEmail('a+x@gmail.com'), normalizeEmail('a@gmail.com'));       // plus-tags preserved
  assert.equal(normalizeEmail('user@BÜCHER.example'), 'user@xn--bcher-kva.example');     // IDN -> punycode
  for (const bad of ['', 'a@b', 'no-at.com', 'a@@b.com', 'a b@c.com', '<x>@y.com', null, 5, 'a@b.c']) assert.equal(normalizeEmail(bad), null, String(bad));
});

test('shuffle/sample: permutation, no replacement, roughly uniform', () => {
  const a = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.deepEqual(shuffle(a).sort((x, y) => x - y), a);
  const s = sample(a, 5); assert.equal(new Set(s).size, 5);
  const counts = Array(4).fill(0); for (let i = 0; i < 8000; i++) counts[shuffle([0, 1, 2, 3])[0]]++;
  counts.forEach((c) => assert.ok(c > 1700 && c < 2300, `first-position frequency ${c}`));
});

test('attribution allowlist drops unknown keys and unsafe values', () => {
  const out = sanitizeAttribution({ utm_source: 'meta', utm_campaign: 'x y', email: 'a@b.com', name: 'Ana', utm_content: '<script>', fbclid: 'AbC_123', meta_ad_id: '123', meta_adset_id: 'abc', landing_path: '/halloween/quiz', referrer_host: 'l.facebook.com' });
  assert.deepEqual(out, { utm_source: 'meta', utm_campaign: 'x y', fbclid: 'AbC_123', meta_ad_id: '123', landing_path: '/halloween/quiz', referrer_host: 'l.facebook.com' });
  assert.deepEqual(sanitizeAttribution('x'), {}); assert.deepEqual(sanitizeAttribution(null), {});
});

test('csv: parse quotes/semicolons, export neutralises formula injection, amounts', () => {
  assert.deepEqual(parseCsv('code,order_id\r\n"AB,1",o1\n'), [{ code: 'AB,1', order_id: 'o1' }]);
  assert.equal(parseCsv('a;b\n1;2')[0].b, '2');
  assert.match(toCsv(['n'], [{ n: '=HYPERLINK("x")' }]), /'=HYPERLINK/);
  assert.match(toCsv(['n'], [{ n: '+1' }, { n: '-1' }, { n: '@x' }]), /'\+1[\s\S]*'-1[\s\S]*'@x/);
  assert.deepEqual(['12,50', '12.50', '1.234,56', '1,234.56', '€ 9', '', 'x'].map(toCents), [1250, 1250, 123456, 123456, 900, null, null]);
});

test('svix webhook signature: valid, tampered, stale, wrong secret', () => {
  const secret = 'whsec_' + Buffer.from('k').toString('base64');
  const body = '{"type":"email.delivered"}'; const id = 'msg_1'; const ts = String(Math.floor(Date.now() / 1000));
  const sig = 'v1,' + crypto.createHmac('sha256', Buffer.from('k')).update(`${id}.${ts}.${body}`).digest('base64');
  const h = { 'svix-id': id, 'svix-timestamp': ts, 'svix-signature': sig };
  assert.equal(verifySvix({ secret, headers: h, rawBody: body }).ok, true);
  assert.equal(verifySvix({ secret, headers: h, rawBody: body + ' ' }).ok, false);
  assert.equal(verifySvix({ secret: 'whsec_' + Buffer.from('other').toString('base64'), headers: h, rawBody: body }).ok, false);
  assert.equal(verifySvix({ secret, headers: { ...h, 'svix-timestamp': String(Math.floor(Date.now() / 1000) - 3600) }, rawBody: body }).reason, 'stale');
  assert.equal(verifySvix({ secret: null, headers: h, rawBody: body }).ok, false);
  assert.equal(verifySvix({ secret, headers: {}, rawBody: body }).ok, false);
});

test('settings: unsafe defaults, enable guard, date ordering, localized notes', () => {
  assert.equal(DEFAULT_SETTINGS.enabled, false);
  assert.equal(DEFAULT_SETTINGS.offer_confirmed, false);
  assert.equal(campaignState(DEFAULT_SETTINGS), 'disabled');
  assert.equal(validateSettingsPatch({ enabled: true }, DEFAULT_SETTINGS).ok, false);
  const base = { ...DEFAULT_SETTINGS, offer_confirmed: true, retention_days: 30, opens_at: '2026-10-01T00:00:00+02:00', closes_at: '2026-10-31T12:00:00+01:00', code_expires_at: '2026-10-31T16:00:00+01:00' };
  assert.equal(validateSettingsPatch({ enabled: true }, base).ok, true);
  assert.equal(validateSettingsPatch({ closes_at: '2026-09-01T00:00:00+02:00' }, base).errors.closes_at, 'must_be_after_opens_at');
  assert.equal(validateSettingsPatch({ opens_at: '2026-10-01' }, base).errors.opens_at, 'must_be_iso_with_offset');
  assert.equal(validateSettingsPatch({ checkout_url: 'http://insecure.example' }, base).ok, false);
  assert.equal(validateSettingsPatch({ nope: 1 }, base).errors.nope, 'unknown_setting');
  assert.equal(validateSettingsPatch({ stacking_note: { en: 'x' } }, base).ok, false);
  const open = { ...base, enabled: true };
  assert.equal(campaignState(open, new Date('2026-09-30T00:00:00Z')), 'not_open');
  assert.equal(campaignState(open, new Date('2026-10-15T00:00:00Z')), 'open');
  assert.equal(campaignState(open, new Date('2026-10-31T11:00:00Z')), 'closed');
});

test('emails: all three languages render, differ, include required reward content; code only in reward', () => {
  const subjects = new Set();
  for (const lang of ['en', 'es', 'nl']) {
    const r = rewardEmail({ lang, name: 'Ana Diaz', tier: 15, score: 5, code: 'CODE1234', link: 'https://shop.example/?coupon=CODE1234', codeExpiresAt: '2026-10-31T16:00:00+01:00', eligibleTickets: ['General admission'], notes: ['No stacking.'] });
    subjects.add(r.subject);
    for (const part of [r.html, r.text]) { assert.ok(part.includes('CODE1234')); assert.ok(part.includes('15')); assert.ok(part.includes('General admission')); assert.ok(part.includes('No stacking.')); assert.ok(part.includes('shop.example')); }
    assert.ok(/31/.test(r.text) && /2026/.test(r.text), 'expiry date present');
    assert.ok(r.html.includes(`lang="${lang}"`));
    const s = signinEmail({ lang, kind: 'verify_new', name: 'Ana', link: 'https://x/verify#t=abc', code: '123456', ttlMinutes: 30 });
    assert.ok(s.text.includes('123456') && s.text.includes('#t=abc') && s.text.includes('30'));
    assert.ok(!s.text.includes('CODE1234'));
  }
  assert.equal(subjects.size, 3);
  const xss = rewardEmail({ lang: 'en', name: '<script>alert(1)</script> Bob', tier: 5, score: 1, code: 'C0DE9999', link: 'https://x/?a=1&b="2"', codeExpiresAt: null, eligibleTickets: [], notes: [] });
  assert.ok(!xss.html.includes('<script>')); assert.ok(xss.html.includes('&amp;b=&quot;2&quot;'));
  for (const l of ['en', 'es', 'nl']) assert.ok(Object.keys(S[l].reward).length === Object.keys(S.en.reward).length);
});

test('checkout url: coupon param, allowlisted utm only, never click ids', () => {
  const s = { ...DEFAULT_SETTINGS };
  const u = new URL(buildCheckoutUrl(s, 'ABC123', { utm_source: 'meta', utm_campaign: 'c1', fbclid: 'SECRET', ttclid: 'SECRET2' }));
  assert.equal(u.searchParams.get('coupon'), 'ABC123'); assert.equal(u.searchParams.get('utm_source'), 'meta');
  assert.equal(u.searchParams.get('fbclid'), null); assert.equal(u.searchParams.get('ttclid'), null);
  assert.equal(new URL(buildCheckoutUrl(s, 'X1X1', {})).searchParams.get('utm_medium'), 'email');
});

test('question validation: structure, translations, correct option, duplicate options', () => {
  const ok = syntheticBank(1)[0];
  assert.deepEqual(validateQuestion(ok), []);
  assert.ok(validateQuestion({ ...ok, correct: 'z' }).length);
  assert.ok(validateQuestion({ ...ok, prompt: { en: 'x', es: 'y' } }).length);
  assert.ok(validateQuestion({ ...ok, options: ok.options.slice(0, 2) }).length);
  assert.ok(validateQuestion({ ...ok, id: 'bad' }).length);
  const dup = { ...ok, options: ok.options.map((o, i) => (i === 1 ? { ...o, text: ok.options[0].text } : o)) };
  assert.ok(validateQuestion(dup).some((e) => /duplicate/.test(e)));
});
