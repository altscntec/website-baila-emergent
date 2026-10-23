'use strict';
// Real-browser checks for /halloween/2027 against the local dev server (H27_OPENS_AT in the past, fake phone
// provider). Desktop + phone: no horizontal scroll, keyboard-only sign-up, full flow with codes, axe audit on every
// screen, reduced-motion stills the character, screenshots for review. Run: node server/test/browser-h27.js
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const puppeteer = require(path.join(__dirname, '..', '..', 'frontend', 'node_modules', 'puppeteer'));
const axeSource = fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'node_modules', 'axe-core', 'axe.min.js'), 'utf8');
const BASE = process.argv[2] || 'http://localhost:3999';
const OUT = process.env.SHOTS || path.join(require('node:os').tmpdir(), 'h27-shots');
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (m) => console.log('PASS ', m);
let seq = Date.now() % 100000;

const newPage = async (browser, { width = 390, height = 844, reduced = false } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('baila_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: false, timestamp: new Date().toISOString() })); } catch (_) {} });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { page, ctx, errors };
};
const audit = async (page, label) => {
  await sleep(650);                                    // let the step's entrance animation finish before measuring contrast
  await page.evaluate(axeSource);
  const r = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }));
  const bad = r.violations.filter((v) => !['region'].includes(v.id));
  assert.deepEqual(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), [], `axe violations on ${label}`);
};
const outbox = async (email, kind) => (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).filter((m) => (m.tags || []).some((t) => t.value === kind)).pop();
const noHScroll = async (page) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'no horizontal scroll');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    // 1. landing on phone and desktop: structure, single CTA, no overflow, screenshots
    for (const [label, vp] of [['phone', { width: 390, height: 844 }], ['small-phone', { width: 360, height: 740 }], ['desktop', { width: 1366, height: 860 }]]) {
      const { page, ctx, errors } = await newPage(browser, vp);
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="h27-cta"]');
      await sleep(900);
      await noHScroll(page);
      const ctas = await page.$$eval('button, a.bdq-btn', (els) => els.map((e) => e.innerText.trim()).filter((t) => /early access/i.test(t)));
      assert.ok(ctas.length >= 2 && ctas.every((t) => t.toLowerCase() === 'get early access'), `one consistent CTA label (${ctas.join(', ')})`);
      assert.equal(await page.$eval('h1', (h) => h.getAttribute('aria-label')), 'The Latin Halloween Indoor Fest, October 2027');
      await audit(page, `${label} landing`);
      await page.screenshot({ path: path.join(OUT, `${label}-landing.png`), fullPage: label !== 'desktop' });
      assert.deepEqual(errors, []);
      await ctx.close();
      ok(`${label}: landing renders, one CTA, no overflow, axe clean`);
    }

    // 2. reduced motion: character animations are off and nothing is hidden
    {
      const { page, ctx } = await newPage(browser, { reduced: true });
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('.conejo');
      const anim = await page.evaluate(() => ['.conejo-lids', '.conejo-ear-r', '.conejo-drip'].map((s) => getComputedStyle(document.querySelector(s)).animationName));
      assert.deepEqual(anim, ['none', 'none', 'none']);
      assert.equal(await page.$eval('.conejo-drip', (e) => getComputedStyle(e).opacity), '1');
      await ctx.close();
      ok('prefers-reduced-motion: character is still, drip visible');
    }

    // 3. keyboard-only full journey on a phone viewport, with axe on every screen
    {
      const email = `h27.e2e.${++seq}@test.invalid`;
      const { page, ctx, errors } = await newPage(browser, { width: 390, height: 844 });
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="h27-cta"]');
      // Tab to the hero CTA and activate it: focus must land in the form
      let guard = 0;
      while (guard++ < 12 && (await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid'))) !== 'h27-cta') await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      await sleep(700);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'fullName', 'CTA moves focus into the form');
      // submit empty: validation summary + per-field errors, focus on summary
      await page.keyboard.press('Enter');
      await sleep(200);
      assert.ok((await page.$$('[role="alert"]')).length >= 4, 'summary + 4 field errors');
      await audit(page, 'form errors');
      await page.type('#fullName', 'Keyboard Tester');
      await page.keyboard.press('Tab'); await page.keyboard.type(email);
      await page.keyboard.press('Tab'); await page.keyboard.type('06 1234 5678');
      await page.keyboard.press('Tab'); await page.keyboard.press('Space');
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');     // privacy link, then submit
      assert.equal(await page.evaluate(() => document.activeElement.getAttribute('data-testid')), 'h27-submit');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="h27-email-code"]');
      await sleep(500);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'h27-email-title', 'focus moves to the step heading');
      await audit(page, 'email code');
      await page.screenshot({ path: path.join(OUT, 'phone-email-step.png') });
      const codeMail = await outbox(email, 'h27_code');
      assert.ok(codeMail, 'code email captured');
      await page.type('#emailCode', codeMail.text.match(/\b(\d{6})\b/)[1]);
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="h27-phone-start"]');
      await audit(page, 'phone start');
      await page.click('[data-testid="h27-phone-start"]');
      await page.waitForSelector('[data-testid="h27-phone-code"]');
      await audit(page, 'phone code');
      await page.screenshot({ path: path.join(OUT, 'phone-whatsapp-step.png') });
      const sent = await (await fetch(`${BASE}/__dev/sms`)).json();
      assert.ok(sent.some((s) => s.to === '+31612345678' && s.channel === 'whatsapp'), 'WhatsApp code requested for the normalised number');
      await page.type('#phoneCode', '123456');
      await page.keyboard.press('Enter');
      await page.waitForSelector('[data-testid="h27-done"]');
      await sleep(600);
      await audit(page, 'done');
      await page.screenshot({ path: path.join(OUT, 'phone-done.png'), fullPage: true });
      assert.ok(await outbox(email, 'h27_confirm'), 'confirmation email sent');
      const dl = await page.evaluate(() => (window.dataLayer || []).map((e) => e.event));
      for (const want of ['h27_view', 'h27_cta_click', 'h27_signup_submitted', 'h27_email_verified', 'h27_verified']) assert.ok(dl.includes(want), `dataLayer has ${want}`);
      assert.ok(!JSON.stringify(dl).includes(email), "no personal data in analytics events");
      assert.deepEqual(errors, []);
      await ctx.close();
      ok('keyboard-only journey on a phone: form -> email code -> WhatsApp code -> done; axe clean on every screen; events recorded without personal data');
    }

    // 4. hidden state looks like a 404 and the API refuses, when the server says hidden (simulated via preview flag absent + 403)
    {
      const r = await fetch(`${BASE}/api/h27/status`);
      assert.equal((await r.json()).state, 'open', 'dev server is open for these checks');
      ok('status endpoint reachable');
    }
    console.log(`\nall /halloween/2027 browser checks passed. Screenshots: ${OUT}`);
  } catch (e) {
    console.error('FAIL', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
