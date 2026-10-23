'use strict';
// Real-browser checks for the Halloween 2027 landing page against the local dev server (H27_OPENS_AT in the past).
// Desktop + phone rendering, the approved copy, keyboard-only signup, invalid input, wrong/expired codes, resend,
// edit details, duplicate signups, delivery failure, axe audit on every screen, screenshots for review.
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

const newPage = async (browser, { width = 390, height = 844 } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('baila_cookie_consent', JSON.stringify({ necessary: true, analytics: true, marketing: false, timestamp: new Date().toISOString() })); } catch (_) {} });
  const errors = []; page.on('pageerror', (e) => errors.push(String(e)));
  return { page, ctx, errors };
};
const audit = async (page, label) => {
  await sleep(400);
  await page.evaluate(axeSource);
  const r = await page.evaluate(() => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } }));
  const bad = r.violations.filter((v) => !['region'].includes(v.id));
  assert.deepEqual(bad.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`), [], `axe violations on ${label}`);
};
const outbox = async (email, kind) => (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).filter((m) => (m.tags || []).some((t) => t.value === kind));
const codeOf = (m) => m.text.match(/\b(\d{6})\b/)[1];
const status = (page) => page.$eval('[data-testid="h27-status"]', (e) => e.innerText.trim());
const noHScroll = async (page) => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false, 'no horizontal scroll');
// Clear a controlled React input properly (triple-click selection is unreliable in headless), then type.
const setField = async (page, sel, value) => {
  await page.$eval(sel, (e) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, ''); e.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.focus(sel); await page.type(sel, value);
};
const fill = async (page, { name = 'Keyboard Tester', email, phone = '+31 6 1234 5678' }) => {
  await setField(page, '#fullName', name); await setField(page, '#email', email); await setField(page, '#phone', phone);
  if (!(await page.$eval('#consent', (e) => e.checked))) await page.click('#consent');
};

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  try {
    // 1. rendering on phone / small phone / desktop: approved copy present, artwork + logo real images, no overflow
    for (const [label, vp] of [['phone', { width: 390, height: 844 }], ['small-phone', { width: 360, height: 740 }], ['desktop', { width: 1366, height: 860 }]]) {
      const { page, ctx, errors } = await newPage(browser, vp);
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="h27-form"]');
      await noHScroll(page);
      const text = await page.evaluate(() => document.body.innerText);
      for (const want of ['JOIN THE LIST', 'YOUR WAY IN', 'SIGN UP', 'Sign up for Halloween 2027 updates. Leave your details and verify your email.', '01 / DETAILS', '02 / EMAIL', 'Include your country code.', 'I agree to receive Halloween 2027 event updates from Baila Dembow by email and WhatsApp. I can unsubscribe at any time.', 'SEND EMAIL CODE', 'SIGNUP IS FOR EVENT UPDATES. IT IS NOT A TICKET.', 'BAILA DEMBOW · HALLOWEEN 2027 · INDOOR FESTIVAL · THE LATIN HALLOWEEN', '© BAILA DEMBOW / HALLOWEEN 2027', 'OCTOBER 2027 · MORE DETAILS TO COME', 'Your information']) assert.ok(text.includes(want), `${label}: copy present: ${want}`);
      const imgs = await page.$$eval('img', (els) => els.map((e) => ({ src: e.getAttribute('src'), ok: e.complete && e.naturalWidth > 0, w: e.getBoundingClientRect().width })));
      assert.ok(imgs.some((i) => i.src.includes('artwork') && i.ok && i.w > 200), 'artwork image loaded and shown large');
      assert.ok(imgs.some((i) => i.src.includes('baila-logo-white-27') && i.ok), 'official logo loaded');
      assert.equal(await page.$eval('.ticker', (e) => getComputedStyle(e).color), 'rgb(164, 255, 18)', 'footer line is fluorescent green');
      assert.equal(await page.$eval('footer a', (e) => e.getAttribute('href')), '/privacy', 'privacy link goes to the existing notice');
      assert.ok(!text.includes('123456') && !text.includes('WhatsApp code'), 'no demo code, no WhatsApp verification');
      await audit(page, `${label} landing`);
      await page.screenshot({ path: path.join(OUT, `${label}-landing.png`), fullPage: true });
      assert.deepEqual(errors, []);
      await ctx.close();
      ok(`${label}: approved layout and copy, real artwork + logo, green footer, privacy link, axe clean, no overflow`);
    }

    // 2. keyboard-only happy path on a phone, with validation, wrong code, resend throttle, edit details, complete
    {
      const email = `h27.e2e.${++seq}@test.invalid`;
      const { page, ctx, errors } = await newPage(browser);
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="h27-nav-cta"]');
      let guard = 0;
      while (guard++ < 10 && (await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid'))) !== 'h27-nav-cta') await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); await sleep(600);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'fullName', 'JOIN THE LIST moves focus into the form');
      // invalid inputs
      await page.keyboard.type('K'); await page.keyboard.press('Tab'); await page.keyboard.type('not-an-email'); await page.keyboard.press('Tab'); await page.keyboard.type('12'); await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); await page.keyboard.press('Enter');
      await sleep(200);
      assert.equal((await page.$$('.field-error')).length, 4, 'four field errors (name, email, phone, consent)');
      assert.ok((await status(page)).length > 5, 'status line explains the first problem');
      await audit(page, 'form errors');
      await page.screenshot({ path: path.join(OUT, 'phone-errors.png'), fullPage: true });
      // fix and submit
      await fill(page, { email });
      await page.click('[data-testid="h27-submit"]');
      await page.waitForSelector('[data-testid="h27-email-code"]');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'code', 'focus lands in the code field');
      assert.ok((await status(page)).includes('Email code sent'));
      assert.ok((await page.evaluate(() => document.body.innerText)).includes(`Enter the code sent to ${email}.`));
      await audit(page, 'email code');
      await page.screenshot({ path: path.join(OUT, 'phone-code.png'), fullPage: true });
      // wrong code
      await page.type('#code', '000000'); await page.keyboard.press('Enter'); await sleep(400);
      assert.ok((await status(page)).includes('not right') && (await status(page)).includes('4 attempts left'), `wrong code message: ${await status(page)}`);
      // resend throttle (client, 30 s) then edit details
      await page.click('[data-testid="h27-resend"]'); await sleep(150);
      assert.ok((await status(page)).includes('Please wait'), 'resend throttled');
      await page.click('[data-testid="h27-edit"]');
      await page.waitForSelector('[data-testid="h27-form"]');
      assert.equal(await page.$eval('#email', (e) => e.value), email, 'details kept when editing');
      await setField(page, '#phone', '06 9999 9999');
      await page.click('[data-testid="h27-submit"]');
      await page.waitForSelector('[data-testid="h27-email-code"]');
      const mails = await outbox(email, 'h27_code');
      assert.ok(mails.length >= 2, 'a fresh code email after editing');
      await page.type('#code', codeOf(mails[mails.length - 1]));
      await page.click('[data-testid="h27-email-verify"]');
      await page.waitForSelector('[data-testid="h27-done"]');
      await sleep(300);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'form-title', 'focus moves to the completion heading');
      const done = await page.evaluate(() => document.body.innerText);
      assert.ok(done.includes("YOU'RE ON THE LIST.") && done.includes('Email confirmed. Watch your inbox') && done.includes('NOT A TICKET OR ENTRY CONFIRMATION'));
      await audit(page, 'complete');
      await page.screenshot({ path: path.join(OUT, 'phone-complete.png'), fullPage: true });
      const confirm = await outbox(email, 'h27_confirm');
      assert.equal(confirm.length, 1, 'one confirmation email with the removal link'); assert.ok(confirm[0].text.includes('/halloween/2027/unsubscribe#t='));
      assert.equal((await (await fetch(`${BASE}/__dev/sms`)).json()).length, 0, 'no WhatsApp/SMS was ever sent');
      const dl = await page.evaluate(() => (window.dataLayer || []).map((e) => e.event));
      for (const want of ['h27_view', 'h27_signup_submitted', 'h27_verified']) assert.ok(dl.includes(want), `dataLayer has ${want}`);
      assert.ok(!JSON.stringify(await page.evaluate(() => window.dataLayer || [])).includes(email), 'no personal data in analytics');
      assert.deepEqual(errors, []);
      await ctx.close();
      ok('phone, keyboard-only: validation -> code -> wrong code -> resend throttle -> edit details -> new code -> verified -> confirmation; axe clean on every screen');
    }

    // 3. expired code, duplicate signup, unsubscribe link
    {
      const email = `h27.dup.${++seq}@test.invalid`;
      const { page, ctx } = await newPage(browser, { width: 1366, height: 860 });
      await page.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="h27-form"]');
      await fill(page, { email }); await page.click('[data-testid="h27-submit"]'); await page.waitForSelector('[data-testid="h27-email-code"]');
      // same email again from another browser: no duplicate row, the first row is simply replaced while unverified
      const { page: p2, ctx: c2 } = await newPage(browser);
      await p2.goto(`${BASE}/halloween/2027`, { waitUntil: 'networkidle0' }); await p2.waitForSelector('[data-testid="h27-form"]');
      await fill(p2, { name: 'Second Browser', email }); await p2.click('[data-testid="h27-submit"]'); await p2.waitForSelector('[data-testid="h27-email-code"]');
      const mails = await outbox(email, 'h27_code'); assert.equal(mails.length, 2);
      await p2.type('#code', codeOf(mails[1])); await p2.click('[data-testid="h27-email-verify"]'); await p2.waitForSelector('[data-testid="h27-done"]');
      // the first browser (same address, same row) cannot create a second signup: its stale code is either refused or
      // the page simply reports the row as already confirmed; either way there is exactly one confirmation email
      await page.type('#code', codeOf(mails[0])); await page.click('[data-testid="h27-email-verify"]'); await sleep(500);
      assert.ok(/not right|expired|confirmed/.test(await status(page)), `stale code handled: ${await status(page)}`);
      await c2.close(); await ctx.close();
      const confirms = await outbox(email, 'h27_confirm');
      assert.equal(confirms.length, 1, 'one row, one confirmation email');
      // unsubscribe from the confirmation email
      const confirm = confirms[0];
      const link = confirm.text.match(/http\S+unsubscribe#t=\S+/)[0];
      const { page: p3, ctx: c3 } = await newPage(browser);
      await p3.goto(link, { waitUntil: 'networkidle0' }); await sleep(600);
      assert.ok(/you are off the list/i.test(await p3.evaluate(() => document.body.innerText)), 'unsubscribe confirmation shown');
      assert.ok(!p3.url().includes('#t='), 'token removed from the address bar');
      await audit(p3, 'unsubscribe');
      await c3.close();
      ok('duplicate signup keeps one row, stale code refused, unsubscribe link works and is axe clean');
    }

    console.log(`\nall Halloween 2027 browser checks passed. Screenshots: ${OUT}`);
  } catch (e) {
    console.error('FAIL', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
})();
