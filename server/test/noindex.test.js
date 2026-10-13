'use strict';
// The quiz must be reachable only by its link: not in navigation, sitemaps or prerendered pages, and it must carry
// noindex in BOTH the response headers (vercel.json) and the HTML shell. robots.txt is deliberately NOT used to hide
// it (a Disallow line would publish the URL and does not stop indexing of linked pages).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('vercel.json: quiz routes use the noindex shell and send X-Robots-Tag; API is never cached or indexed; SPA fallback excludes /api', () => {
  const v = JSON.parse(read('vercel.json'));
  const rw = Object.fromEntries(v.rewrites.map((r) => [r.source, r.destination]));
  assert.equal(rw['/halloween/quiz'], '/spa-shell.html'); assert.equal(rw['/halloween/quiz/:path*'], '/spa-shell.html');
  assert.ok(v.rewrites.every((r) => r.source === '/halloween/quiz' || r.source.startsWith('/halloween/quiz/') || r.source.includes('(?!api/)')), 'no rewrite can swallow /api');
  const hdr = (src) => (v.headers.find((h) => h.source === src) || { headers: [] }).headers;
  for (const src of ['/halloween/quiz', '/halloween/quiz/:path*', '/spa-shell.html', '/api/(.*)']) assert.ok(hdr(src).some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value)), `${src} has X-Robots-Tag noindex`);
  assert.ok(hdr('/api/(.*)').some((h) => h.key === 'Cache-Control' && /no-store/.test(h.value)));
  assert.ok(v.installCommand.includes('--omit=dev') && v.installCommand.includes('frontend'), 'installs the API dependency and the frontend');
  assert.ok(v.crons.some((c) => c.path === '/api/cron/retry'));
});

test('not in sitemap, robots.txt, llms.txt or any navigation/section/page source', () => {
  for (const f of ['frontend/public/sitemap.xml', 'frontend/public/robots.txt', 'frontend/public/llms.txt', 'frontend/public/index.html']) assert.ok(!/quiz/i.test(read(f)), `${f} must not mention the quiz`);
  for (const dir of ['frontend/src/components', 'frontend/src/utils']) for (const f of walk(path.join(ROOT, dir)).filter((x) => /\.(jsx?|css)$/.test(x))) assert.ok(!/halloween\/quiz/i.test(fs.readFileSync(f, 'utf8')), `${f} links to the quiz`);
  const pre = read('frontend/scripts/prerender.js'); const routes = pre.slice(pre.indexOf('const ROUTES'), pre.indexOf('];', pre.indexOf('const ROUTES')));
  assert.ok(!/quiz/.test(routes), 'the quiz is not in the prerender route list');
});

test('Seo component adds noindex and drops the canonical for unlisted pages; App marks every /halloween/quiz route noindex', () => {
  const seo = read('frontend/src/components/common/Seo.jsx'); assert.match(seo, /noindex, nofollow, noarchive/); assert.match(seo, /canonical\.remove\(\)/);
  const app = read('frontend/src/App.js'); assert.match(app, /isQuizRoute[\s\S]{0,400}<Seo[\s\S]{0,80}noindex/);
});

const BUILD = process.env.BUILD_DIR || path.join(ROOT, 'frontend', 'build');
test('built output: spa-shell.html is a clean noindex shell and no prerendered page links to the quiz', { skip: !fs.existsSync(path.join(BUILD, 'spa-shell.html')) && 'no build present (set BUILD_DIR)' }, () => {
  const shell = fs.readFileSync(path.join(BUILD, 'spa-shell.html'), 'utf8');
  assert.match(shell, /<meta name="robots" content="noindex, nofollow, noarchive">/); assert.ok(!/rel="canonical"/.test(shell));
  assert.match(shell, /<title>Halloween Quiz \| Baila Dembow<\/title>/); assert.ok(!shell.includes('<!-- prerendered -->'), 'shell is not a prerendered page');
  assert.match(shell, /og:url" content="https:\/\/bailadembow\.com\/halloween\/quiz"/);
  for (const f of walk(BUILD).filter((x) => x.endsWith('.html') && !x.endsWith('spa-shell.html'))) assert.ok(!/halloween\/quiz/.test(fs.readFileSync(f, 'utf8')), `${path.relative(BUILD, f)} links to the quiz`);
  assert.ok(!fs.existsSync(path.join(BUILD, 'halloween', 'quiz')), 'no prerendered quiz page exists');
});

test('LIVE (local dev server): quiz routes answer with X-Robots-Tag noindex and the noindex shell', { skip: !process.env.QUIZ_BASE && 'set QUIZ_BASE=http://localhost:3999' }, async () => {
  for (const p of ['/halloween/quiz', '/halloween/quiz/verify', '/halloween/quiz/admin', '/halloween/quiz/unsubscribe']) {
    const r = await fetch(process.env.QUIZ_BASE + p); const html = await r.text();
    assert.equal(r.status, 200, p); assert.match(r.headers.get('x-robots-tag') || '', /noindex/, p); assert.match(html, /name="robots" content="noindex/, p);
  }
  const api = await fetch(process.env.QUIZ_BASE + '/api/quiz/config'); assert.match(api.headers.get('x-robots-tag'), /noindex/); assert.equal(api.headers.get('cache-control'), 'no-store');
});
