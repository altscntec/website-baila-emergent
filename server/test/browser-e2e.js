#!/usr/bin/env node
'use strict';
// Real-browser end-to-end checks against the LOCAL dev server (started with DEV_STUB_PIXELS=1).
//   DEV_STUB_PIXELS=1 node server/dev-server.js --build frontend/build &
//   node server/test/browser-e2e.js [http://localhost:3999]
// Uses puppeteer from frontend/node_modules (already a dev dependency of the site's prerender step).
// Test data only: *.test.invalid addresses and synthetic codes.
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createRequire } = require('module');
const req = createRequire(path.join(__dirname, '..', '..', 'frontend', 'package.json'));
const puppeteer = req('puppeteer');

const BASE = process.argv[2] || 'http://localhost:3999';
const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'quiz-private', 'question-bank.json'), 'utf8'));
const byId = Object.fromEntries(bank.map((q) => [q.id, q]));
const OPENING = {
  en: 'Five questions. One Halloween reward. Unlock 5%, 10%, or 15% off your ticket.',
  es: 'Cinco preguntas. Una recompensa de Halloween. Desbloquea un 5 %, 10 % o 15 % de descuento en tu entrada.',
  nl: 'Vijf vragen. Eén Halloween-beloning. Ontgrendel 5%, 10% of 15% korting op je ticket.',
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];
const ok = (name, detail = '') => { results.push([name, 'PASS', detail]); console.log(`PASS  ${name}${detail ? '  ' + detail : ''}`); };

let seq = Date.now() % 100000;
const newPage = async (browser, { width = 375, height = 812, lang, consent = { necessary: true, analytics: false, marketing: false }, reduced = false } = {}) => {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  // each simulated visitor gets its own source IP, otherwise the per-IP rate limit (10 sign-ups/hour) rightly stops the test
  await page.setExtraHTTPHeaders({ 'x-real-ip': `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}` });
  await page.setViewport({ width, height, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.evaluateOnNewDocument((l, c) => { try { localStorage.setItem('baila_cookie_consent', JSON.stringify({ ...c, timestamp: new Date().toISOString() })); if (l) localStorage.setItem('bd_quiz_lang', l); } catch (_) {} }, lang, consent);
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  return { page, ctx, errors };
};
const text = (page, sel) => page.$eval(sel, (e) => e.innerText);
const waitFor = (page, sel, t = 8000) => page.waitForSelector(sel, { timeout: t, visible: true });

(async () => {
  const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    // 1. opening message, per language, and no horizontal overflow at common phone widths
    for (const lang of ['en', 'es', 'nl']) {
      for (const width of [320, 375, 414, 768]) {
        const { page, ctx, errors } = await newPage(browser, { width, lang });
        await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
        await waitFor(page, '[data-testid="quiz-headline"]');
        assert.strictEqual(await text(page, '[data-testid="quiz-headline"]'), OPENING[lang].toUpperCase().replace('É', 'É'), `${lang} headline`);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 0, `${lang}@${width}: horizontal overflow ${overflow}px`);
        assert.deepStrictEqual(errors, [], 'page errors');
        await ctx.close();
      }
      ok(`opening message + no horizontal scroll (320/375/414/768) [${lang}]`);
    }

    // 2. reduced motion
    {
      const { page, ctx } = await newPage(browser, { lang: 'en', reduced: true });
      await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await waitFor(page, '[data-testid="quiz-headline"]');
      const anim = await page.evaluate(() => ({ smoke: getComputedStyle(document.querySelector('.bdq-smoke')).animationName, windows: getComputedStyle(document.querySelector('.bdq-windows')).animationName, btn: getComputedStyle(document.querySelector('.bdq-btn')).transitionDuration }));
      assert.strictEqual(anim.smoke, 'none'); assert.strictEqual(anim.windows, 'none');
      await ctx.close();
      const { page: p2, ctx: c2 } = await newPage(browser, { lang: 'en', reduced: false });
      await p2.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await waitFor(p2, '[data-testid="quiz-headline"]');
      const anim2 = await p2.evaluate(() => getComputedStyle(document.querySelector('.bdq-smoke')).animationName);
      assert.notStrictEqual(anim2, 'none', 'animation is on when motion is allowed');
      await c2.close();
      ok('prefers-reduced-motion disables decorative animation (and it is on otherwise)');
    }

    // 3. keyboard-only: tab to the start button and activate it with Enter, then reach the first form field
    {
      const { page, ctx } = await newPage(browser, { lang: 'en' });
      await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await waitFor(page, '[data-testid="quiz-start-cta"]');
      let reached = false;
      for (let i = 0; i < 20 && !reached; i++) { await page.keyboard.press('Tab'); reached = await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-testid') === 'quiz-start-cta'); }
      assert.ok(reached, 'start button reachable by keyboard');
      const outline = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle);
      assert.notStrictEqual(outline, 'none', 'visible focus indicator');
      await page.keyboard.press('Enter');
      await waitFor(page, '[data-testid="quiz-question"]');
      const focused = await page.evaluate(() => document.activeElement && document.activeElement.tagName);
      assert.strictEqual(focused, 'LEGEND', 'focus moves to the question');
      // pick an answer with the keyboard only: Tab to the radio group, arrow to choose, Tab to the button, Enter
      await page.keyboard.press('Tab'); await page.keyboard.press('ArrowDown');
      const chosen = await page.$eval('input[name=answer]:checked', (e) => e.value);
      assert.ok(chosen, 'arrow keys choose an option');
      await ctx.close();
      ok('keyboard-only: reach and activate Start, focus moves to the first question, arrow keys choose an answer, focus ring visible');
    }

    // 4. full journeys (play first): 3 languages x 4 themes, shown text must equal the reviewed bank in that language
    const combos = new Set();
    const tiersSeen = new Set();
    let journeys = 0;
    while (combos.size < 12 && journeys < 60) {
      const lang = ['en', 'es', 'nl'][journeys % 3]; const n = Math.floor(journeys / 3); journeys++;
      const email = `e2e.${lang}.${++seq}@test.invalid`;
      const { page, ctx, errors } = await newPage(browser, { lang, width: 390 });
      await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await waitFor(page, '[data-testid="quiz-start-cta"]'); await page.click('[data-testid="quiz-start-cta"]');
      await waitFor(page, '[data-testid="quiz-question"]');
      const targetCorrect = (journeys * 5 + n) % 6;
      let themeSeen = null;
      for (let i = 0; i < 5; i++) {
        await waitFor(page, '[data-testid="quiz-question"]');
        const prompt = (await text(page, '[data-testid="quiz-question"]')).trim();
        const optTexts = await page.$$eval('[data-testid="quiz-option"]', (els) => els.map((e) => e.innerText.trim()));
        const key = (await (await fetch(`${BASE}/__dev/state`)).json());
        // the dev endpoint lists all attempts; find ours by the prompt shown
        const mine = key.find((r) => byId[r.question_id] && byId[r.question_id].prompt[lang].trim() === prompt && r.selected_option_id === null);
        assert.ok(mine, 'attempt row found for the prompt on screen');
        const q = byId[mine.question_id]; themeSeen = q.theme;
        const want = q.options.find((o) => o.id === mine.correct_option_id).text[lang].trim();
        assert.deepStrictEqual([...optTexts].sort(), q.options.map((o) => o.text[lang].trim()).sort(), 'all four options are shown in this language');
        const pick = i < targetCorrect ? optTexts.indexOf(want) : optTexts.findIndex((t) => t !== want);
        const labels = await page.$$('[data-testid="quiz-option"]'); await labels[pick].click();
        await page.click('[data-testid="quiz-lock"]');
        await sleep(900);
      }
      await waitFor(page, '[data-testid="quiz-earned"]');
      const earned = await text(page, '[data-testid="quiz-earned"]');
      const expectedTier = targetCorrect <= 2 ? 5 : targetCorrect <= 4 ? 10 : 15;
      assert.ok(earned.includes(String(expectedTier)), `${lang}: expected ${expectedTier}% got "${earned}"`);
      tiersSeen.add(expectedTier); combos.add(`${lang}/${themeSeen}`);
      // claim: form after the score, then code
      await waitFor(page, '#fullName');
      await page.type('#fullName', 'E2E Tester'); await page.type('#email', email); await page.type('#age', '29');
      await page.select('#gender', 'prefer_not_to_say'); await page.type('#city', 'Amsterdam'); await page.select('#country', 'NL');
      await page.click('[data-testid="quiz-accept"]');
      assert.strictEqual(await page.$eval('[data-testid="quiz-marketing"]', (e) => e.checked), false, 'promotional box is unchecked by default');
      await page.click('[data-testid="quiz-form-submit"]');
      await waitFor(page, '[data-testid="quiz-code"]');
      const mail = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).pop();
      await page.type('[data-testid="quiz-code"]', mail.text.match(/: (\d{6})\b/)[1]);
      await page.click('[data-testid="quiz-verify-submit"]');
      await waitFor(page, '[data-testid="quiz-mail-status"]');
      const reward = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).filter((m) => m.tags.some((t) => t.value === 'reward')).pop();
      assert.ok(reward, 'reward email captured');
      const realCode = reward.text.match(/LOCALTEST\w+/)[0];
      assert.ok(!(await page.content()).includes(realCode), 'discount code is not in the page');
      assert.deepStrictEqual(errors, [], 'no page errors');
      await ctx.close();
    }
    assert.strictEqual(combos.size, 12, `covered ${combos.size}/12: ${[...combos].sort().join(' ')}`);
    assert.deepStrictEqual([...tiersSeen].sort((a, b) => a - b), [5, 10, 15]);
    ok(`${journeys} play-first journeys covering 3 languages x 4 themes: questions and options shown in the chosen language exactly as reviewed; tiers 5/10/15 issued after verification; code never in the page`, [...combos].sort().join(' '));

    // 5. automated accessibility audit (axe-core, WCAG 2.1 A/AA + best practice) on every screen; optional screenshots
    {
      const shots = process.env.SHOTS;
      if (shots) fs.mkdirSync(shots, { recursive: true });
      const email = `e2e.axe.${++seq}@test.invalid`;
      const { page, ctx } = await newPage(browser, { lang: 'es', width: 375 });
      await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await page.addScriptTag({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.10.2/axe.min.js' });
      const bad = [];
      const audit = async (name) => {
        await sleep(500);
        if (shots) await page.screenshot({ path: path.join(shots, `${name}.png`) });
        const v = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] } })).violations.map((x) => `${x.id}(${x.nodes.length}): ${x.nodes[0].html.slice(0, 90)}`));
        if (v.length) bad.push(`${name}: ${v.join(' | ')}`);
      };
      await waitFor(page, '[data-testid="quiz-start-cta"]'); await audit('1-rules-es');
      await page.click('[data-testid="quiz-start-cta"]'); await waitFor(page, '[data-testid="quiz-question"]');
      await (await page.$$('[data-testid="quiz-option"]'))[1].click(); await audit('2-question-es');
      for (let i = 0; i < 5; i++) { await waitFor(page, '[data-testid="quiz-question"]'); await (await page.$$('[data-testid="quiz-option"]'))[0].click(); await page.click('[data-testid="quiz-lock"]'); await sleep(900); }
      await waitFor(page, '#fullName'); await audit('3-score-and-form-es');
      await page.click('[data-testid="quiz-form-submit"]'); await sleep(300); await audit('4-form-errors-es');
      await page.type('#fullName', 'Axe Tester'); await page.type('#email', email); await page.type('#age', '41');
      await page.select('#gender', 'woman'); await page.type('#city', 'Madrid'); await page.select('#country', 'ES'); await page.click('[data-testid="quiz-accept"]');
      await page.click('[data-testid="quiz-form-submit"]'); await waitFor(page, '[data-testid="quiz-code"]'); await audit('5-code-entry-es');
      const mail = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).pop();
      await page.type('[data-testid="quiz-code"]', mail.text.match(/: (\d{6})\b/)[1]); await page.click('[data-testid="quiz-verify-submit"]');
      await waitFor(page, '[data-testid="quiz-mail-status"]'); await audit('6-claimed-es');
      await ctx.close();
      assert.deepStrictEqual(bad, [], `axe violations:\n${bad.join('\n')}`);
      ok('axe-core WCAG 2.1 A/AA + best-practice audit: 0 violations on rules, question, score+form, form errors, code entry and claimed screens');
    }

    // 6. privacy notice in three languages; promotional opt-in + one-click unsubscribe round trip
    {
      const { page, ctx } = await newPage(browser, { lang: 'nl', width: 390 });
      await page.goto(`${BASE}/privacy`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="privacy-page"]');
      assert.match(await text(page, 'h1'), /PRIVACYVERKLARING/);
      for (const [label, re] of [['English', /PRIVACY NOTICE/], ['Español', /AVISO DE PRIVACIDAD/]]) {
        const btn = (await page.$$('button')).find(async () => true);
        await page.evaluate((l) => [...document.querySelectorAll('button')].find((b) => b.textContent === l).click(), label); await sleep(200);
        assert.match(await text(page, 'h1'), re);
      }
      assert.match(await text(page, 'body'), /ask@housedecoded\.com/); assert.match(await text(page, 'body'), /House Decoded Events \(KVK 67994725\)|KVK 67994725/);
      await ctx.close();

      const email = `e2e.optin.${++seq}@test.invalid`;
      const { page: p2, ctx: c2 } = await newPage(browser, { lang: 'en', width: 390 });
      await p2.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
      await waitFor(p2, '[data-testid="quiz-start-cta"]'); await p2.click('[data-testid="quiz-start-cta"]');
      for (let i = 0; i < 5; i++) { await waitFor(p2, '[data-testid="quiz-question"]'); await (await p2.$$('[data-testid="quiz-option"]'))[0].click(); await p2.click('[data-testid="quiz-lock"]'); await sleep(900); }
      await waitFor(p2, '#fullName');
      await p2.type('#fullName', 'Opt In'); await p2.type('#email', email); await p2.type('#age', '35'); await p2.select('#gender', 'man'); await p2.type('#city', 'Rotterdam'); await p2.select('#country', 'NL');
      await p2.click('[data-testid="quiz-accept"]'); await p2.click('[data-testid="quiz-marketing"]'); await p2.click('[data-testid="quiz-form-submit"]'); await waitFor(p2, '[data-testid="quiz-code"]');
      const mail = (await (await fetch(`${BASE}/__dev/outbox?to=${encodeURIComponent(email)}`)).json()).pop();
      await p2.type('[data-testid="quiz-code"]', mail.text.match(/: (\d{6})\b/)[1]); await p2.click('[data-testid="quiz-verify-submit"]'); await waitFor(p2, '[data-testid="quiz-mail-status"]'); await c2.close();
      const leads = async () => (await fetch(`${BASE}/api/admin/leads.csv`, { headers: { Authorization: 'Bearer admin-key-test' } })).text();
      let csv = await leads(); assert.ok(csv.includes(email), 'opted-in participant is in the consent-filtered export');
      const token = csv.split('\n').find((l) => l.includes(email)).match(/unsubscribe#t=([^\s,"]+)/)[1];
      const { page: p3, ctx: c3 } = await newPage(browser, { lang: 'es', width: 390 });
      await p3.goto(`${BASE}/halloween/quiz/unsubscribe#t=${token}`, { waitUntil: 'networkidle0' });
      assert.ok(!p3.url().includes(token), 'token removed from the URL');
      await p3.waitForSelector('main button, .bdq button.bdq-btn'); await sleep(200);
      await p3.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Darme de baja/.test(b.textContent)).click()); await sleep(800);
      assert.match(await text(p3, 'body'), /Te has dado de baja/); await c3.close();
      csv = await leads(); assert.ok(!csv.includes(email), 'unsubscribed address is excluded from the export');
      ok('privacy notice in EN/ES/NL with controller details; promotional opt-in appears in the consent-filtered export; one-click unsubscribe removes it');
    }
  } catch (e) {
    console.error('FAIL', e.message); process.exitCode = 1;
  } finally { await browser.close(); }
  console.log(`\n${results.length} browser checks passed${process.exitCode ? ' (then a failure above)' : ''}`);
})();
