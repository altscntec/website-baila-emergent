#!/usr/bin/env node
'use strict';
// Consent-aware tracking checks in a real browser against the LOCAL dev server started with DEV_STUB_PIXELS=1
// (Meta, TikTok and GTM are replaced by recording stubs, so nothing is ever sent to the real pixels).
//   node server/test/browser-tracking.js [http://localhost:3999]
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createRequire } = require('module');
const puppeteer = createRequire(path.join(__dirname, '..', '..', 'frontend', 'package.json'))('puppeteer');
const BASE = process.argv[2] || 'http://localhost:3999';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let seq = Date.now() % 100000;

// Unmistakable personal values: if any appears in an analytics payload, the test fails.
const PII = { name: 'Zelda Quixotic', first: 'Zelda', last: 'Quixotic', city: 'Quirkville', age: '37' };

const journey = async (browser, consent, label) => {
  const email = `track.${label}.${++seq}@test.invalid`;
  const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true });
  await page.setExtraHTTPHeaders({ 'x-real-ip': `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.9` });
  await page.evaluateOnNewDocument((c) => { localStorage.setItem('baila_cookie_consent', JSON.stringify({ ...c, timestamp: new Date().toISOString() })); localStorage.setItem('bd_quiz_lang', 'en'); }, consent);
  const urls = []; page.on('request', (r) => urls.push(r.url().split('#')[0]));   // browsers never transmit the fragment
  // Record analytics calls across full page loads (the emailed link opens a fresh page): dataLayer pushes and pixel stub calls.
  const rec = { dl: [], pix: [] };
  await page.exposeFunction('__record', (kind, v) => { rec[kind].push(v); });
  await page.evaluateOnNewDocument(() => { window.dataLayer = window.dataLayer || []; const p = window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push = (...a) => { try { window.__record('dl', JSON.parse(JSON.stringify(a[0]))); } catch (_) {} return p(...a); }; });
  await page.goto(`${BASE}/halloween/quiz?utm_source=meta&utm_medium=paid_social&utm_campaign=track_test&utm_content=ad1&meta_ad_id=987&fbclid=FBCLIDVALUE1&ttclid=TTCLIDVALUE1&name=${PII.first}&email=${encodeURIComponent(email)}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="quiz-start-cta"]'); await page.click('[data-testid="quiz-start-cta"]');
  for (let i = 0; i < 5; i++) { await page.waitForSelector('[data-testid="quiz-question"]'); await (await page.$$('[data-testid="quiz-option"]'))[0].click(); await page.click('[data-testid="quiz-lock"]'); await sleep(1000); }
  await page.waitForSelector('#fullName');
  await page.type('#fullName', PII.name); await page.type('#email', email); await page.type('#age', PII.age);
  await page.select('#gender', 'self_describe'); await page.type('#genderSelf', 'Zebra-kin'); await page.type('#city', PII.city); await page.select('#country', 'NL');
  await page.click('[data-testid="quiz-accept"]'); await page.click('[data-testid="quiz-form-submit"]');
  await page.waitForSelector('[data-testid="quiz-code"]');
  const mail = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).pop();
  const link = mail.text.match(/http\S+#t=\S+/)[0]; const token = link.split('#t=')[1];
  await page.goto(link, { waitUntil: 'networkidle0' });                        // verify through the emailed link (token in the fragment)
  assert.ok(!page.url().includes('#t='), 'token removed from the address bar'); assert.ok(!page.url().includes(token));
  await page.waitForSelector('[data-testid="quiz-mail-status"]');
  const reward = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).filter((m) => m.tags.some((t) => t.value === 'reward')).pop();
  const code = reward.text.match(/LOCALTEST\w+/)[0];
  await page.evaluate(() => document.querySelector('[data-testid="quiz-tickets"]').addEventListener('click', (e) => e.preventDefault(), true));
  await page.click('[data-testid="quiz-tickets"]'); await sleep(300);
  const captured = { dl: rec.dl.filter((e) => e && typeof e.event === 'string' && e.event.startsWith('quiz_')), pix: rec.pix, gtmScript: await page.evaluate(() => !!document.querySelector('script[src*="googletagmanager"]')) };
  await ctx.close();
  return { ...captured, email, code, token, urls };
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
  let failed = false;
  const check = (name, fn) => { try { fn(); console.log(`PASS  ${name}`); } catch (e) { failed = true; console.error(`FAIL  ${name}: ${e.message}`); } };
  try {
    const none = await journey(browser, { necessary: true, analytics: false, marketing: false }, 'none');
    const ana = await journey(browser, { necessary: true, analytics: true, marketing: false }, 'ana');
    const all = await journey(browser, { necessary: true, analytics: true, marketing: true }, 'all');

    check('reject all: no quiz events in dataLayer and no Meta/TikTok calls for a full journey', () => { assert.strictEqual(none.dl.length, 0); assert.strictEqual(none.pix.length, 0); });
    check('analytics only: events reach dataLayer/GTM, but no Meta/TikTok calls', () => { assert.ok(ana.dl.length >= 12, `events: ${ana.dl.length}`); assert.strictEqual(ana.pix.length, 0); });
    check('marketing consent: Meta + TikTok receive only the mapped events', () => {
      const names = all.pix.map((p) => `${p[0]}:${p[1][0] === 'trackCustom' || p[1][0] === 'track' ? p[1][1] : p[1][0]}`);
      for (const want of ['fbq:QuizStart', 'ttq:ClickButton', 'fbq:QuizSignup', 'fbq:Lead', 'ttq:SubmitForm', 'fbq:QuizCompleted', 'fbq:InitiateCheckout', 'ttq:InitiateCheckout']) assert.ok(names.includes(want), `${want} missing in ${names}`);
      assert.ok(!names.some((n) => /Purchase/i.test(n)), 'no Purchase event is ever sent from the browser');
    });
    check('dedupe: every pixel event carries the same event_id as its dataLayer event', () => {
      const dlIds = new Set(all.dl.map((e) => e.event_id));
      assert.strictEqual(dlIds.size, all.dl.length, 'event ids unique');
      for (const p of all.pix) { const id = (p[1].find((x) => x && (x.eventID || x.event_id)) || {}); assert.ok(dlIds.has(id.eventID || id.event_id), `pixel event ${JSON.stringify(p[1].slice(0, 2))} has no matching dataLayer event_id`); }
    });
    check('event schema: required quiz events present with theme/language/question/tier, in order', () => {
      const names = all.dl.map((e) => e.event);
      for (const want of ['quiz_landing_view', 'quiz_start_click', 'quiz_started', 'quiz_question_viewed', 'quiz_answer_submitted', 'quiz_completed', 'quiz_discount_earned', 'quiz_form_success', 'quiz_verification_requested', 'quiz_verification_completed', 'quiz_reward_email_status', 'quiz_ticket_click']) assert.ok(names.includes(want), `${want} missing`);
      assert.ok(names.indexOf('quiz_start_click') < names.indexOf('quiz_completed') && names.indexOf('quiz_completed') < names.indexOf('quiz_form_success') && names.indexOf('quiz_form_success') < names.indexOf('quiz_verification_completed'), 'play-first order');
      assert.strictEqual(all.dl.filter((e) => e.event === 'quiz_question_viewed').length, 5); assert.strictEqual(all.dl.filter((e) => e.event === 'quiz_answer_submitted').length, 5);
      const done = all.dl.find((e) => e.event === 'quiz_completed'); assert.ok(done.theme && done.tier && done.score_band && done.language);
      assert.ok(all.dl.find((e) => e.event === 'quiz_answer_submitted').question_id.match(/^[A-Z]{3}-\d{3}$/));
      assert.strictEqual(all.dl[0].utm_campaign, 'track_test'); assert.strictEqual(all.dl[0].campaign_id, 'halloween_quiz_2026');
    });
    check('no personal data, codes, tokens, click ids or emails in ANY analytics payload (dataLayer or pixel stubs)', () => {
      for (const j of [ana, all]) {
        const blob = JSON.stringify([j.dl, j.pix]);
        for (const bad of [PII.name, PII.first, PII.last, PII.city, 'Zebra', j.email, j.email.split('@')[0], j.code, j.token, 'FBCLIDVALUE1', 'TTCLIDVALUE1', '@']) assert.ok(!blob.includes(bad), `payload contains "${bad}"`);
        assert.ok(!/"age"|"gender"|"country"|"email"|"name"/.test(blob), 'no demographic keys');
      }
    });
    check('no request URL (page, API or third party) contains the verification token or discount code', () => {
      for (const j of [none, ana, all]) for (const u of j.urls) { assert.ok(!u.includes(j.token), `token in ${u}`); assert.ok(!u.includes(j.code), 'code in url'); assert.ok(!u.includes(j.token.slice(0, 12)), 'token in url'); }
    });
    check('GTM loader is not triggered by this page when consent is rejected (stubbed container never injected)', () => { assert.strictEqual(none.gtmScript, false); });
  } finally { await browser.close(); }
  console.log(failed ? '\nTRACKING CHECKS FAILED' : '\nall tracking checks passed'); process.exitCode = failed ? 1 : 0;
})().catch((e) => { console.error(e); process.exit(1); });
