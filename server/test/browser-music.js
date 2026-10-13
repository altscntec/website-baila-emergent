#!/usr/bin/env node
'use strict';
// Music control checks. Needs a frontend build made WITH a track configured, served on a second port:
//   REACT_APP_QUIZ_MUSIC_URL=/__test_tone.wav BUILD_PATH=build-music PRERENDER_SHELL_ONLY=1 npm run build   (tone is a generated test fixture, not shipped)
//   node server/dev-server.js --build frontend/build-music --port 3998 &
//   node server/test/browser-music.js http://localhost:3998
const path = require('path');
const assert = require('assert');
const { createRequire } = require('module');
const puppeteer = createRequire(path.join(__dirname, '..', '..', 'frontend', 'package.json'))('puppeteer');
const BASE = process.argv[2] || 'http://localhost:3998';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });   // the flag proves WE never rely on autoplay: we assert play() is only called after a tap
  try {
    const ctx = await browser.createBrowserContext(); const page = await ctx.newPage();
    await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('baila_cookie_consent', JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: new Date().toISOString() }));
      localStorage.setItem('bd_quiz_lang', 'en');
      window.__audio = { created: 0, plays: 0, instances: [] };
      const Native = window.Audio;
      window.Audio = function (src) { const a = new Native(src); window.__audio.created++; window.__audio.instances.push(a); const p = a.play.bind(a); a.play = () => { window.__audio.plays++; return p(); }; return a; };
    });
    await page.goto(`${BASE}/halloween/quiz`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="quiz-start-cta"]');
    const before = await page.evaluate(() => ({ ...window.__audio, instances: undefined, playBtn: !!document.querySelector('[data-testid="quiz-music-play"]'), playLabel: document.querySelector('[data-testid="quiz-music-play"]')?.innerText, muteBtn: !!document.querySelector('[data-testid="quiz-music-mute"]') }));
    assert.strictEqual(before.plays, 0, 'nothing plays on page load');
    assert.strictEqual(before.playBtn, true, 'explicit Play control is visible'); assert.strictEqual(before.playLabel, 'Play music');
    // navigating through steps must not start audio either
    await page.click('[data-testid="quiz-start-cta"]'); await page.waitForSelector('#fullName'); await sleep(300);
    assert.strictEqual(await page.evaluate(() => window.__audio.plays), 0, 'no autoplay when moving between steps');
    await page.click('[data-testid="quiz-music-play"]'); await sleep(500);
    const playing = await page.evaluate(() => ({ plays: window.__audio.plays, paused: window.__audio.instances[0].paused, loop: window.__audio.instances[0].loop, muted: window.__audio.instances[0].muted, muteLabel: document.querySelector('[data-testid="quiz-music-mute"]')?.innerText, pressed: document.querySelector('[data-testid="quiz-music-mute"]')?.getAttribute('aria-pressed'), playBtn: !!document.querySelector('[data-testid="quiz-music-play"]') }));
    assert.strictEqual(playing.plays, 1); assert.strictEqual(playing.paused, false); assert.strictEqual(playing.loop, true);
    assert.strictEqual(playing.muteLabel, 'Mute music'); assert.strictEqual(playing.pressed, 'false'); assert.strictEqual(playing.playBtn, false);
    await page.click('[data-testid="quiz-music-mute"]'); await sleep(200);
    const muted = await page.evaluate(() => ({ muted: window.__audio.instances[0].muted, label: document.querySelector('[data-testid="quiz-music-mute"]').innerText, pressed: document.querySelector('[data-testid="quiz-music-mute"]').getAttribute('aria-pressed'), stored: localStorage.getItem('bdq_music_muted') }));
    assert.deepStrictEqual(muted, { muted: true, label: 'Unmute music', pressed: 'true', stored: '1' });
    // the mute control stays visible and available as the visitor moves through steps and switches language
    await page.click('[lang="es"][aria-label="Español"]'); await sleep(300);
    assert.strictEqual(await page.$eval('[data-testid="quiz-music-mute"]', (e) => e.innerText), 'Activar música');
    // the choice persists: a reload followed by an explicit Play starts muted
    await page.reload({ waitUntil: 'networkidle0' }); await page.waitForSelector('[data-testid="quiz-music-play"]');
    assert.strictEqual(await page.evaluate(() => window.__audio.plays), 0, 'reload does not resume playback');
    await page.click('[data-testid="quiz-music-play"]'); await sleep(300);
    assert.strictEqual(await page.evaluate(() => window.__audio.instances[0].muted), true, 'mute preference remembered');
    console.log('PASS  music: never autoplays (page load, step changes, reload), explicit Play button, visible labelled Mute/Unmute with aria-pressed, loops, mute preference persisted, label localised');
  } catch (e) { console.error('FAIL', e.message); process.exitCode = 1; } finally { await browser.close(); }
})();
