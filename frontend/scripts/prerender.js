#!/usr/bin/env node
/**
 * Prerender the CRA build so crawlers (and AI engines, which mostly do not
 * execute JavaScript) receive fully rendered HTML.
 *
 * For each route we boot a static server over build/, load the route in
 * headless Chrome, wait for React to paint, then write the resulting DOM to
 * build/<route>/index.html. Vercel serves that file directly for the URL and
 * React hydrates on top of it, so behaviour is unchanged for real users.
 *
 * Failure is non-fatal: if Chrome cannot start (e.g. a sandbox without a
 * browser binary) we log and exit 0, leaving the normal SPA build in place.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const BUILD = path.join(__dirname, '..', 'build');
const PORT = 45678;

// Static routes to snapshot. Keep in sync with App.js and public/sitemap.xml.
const STATIC_ROUTES = [
  '/',
  '/events',
  '/halloween',
  '/about',
  '/press',
  '/terms',
  '/latin-event-amsterdam',
  '/latin-event-rotterdam',
  '/experiences/live-tribute',
  '/experiences/casita',
];

// Event pages are read straight from EVENTS in src/utils/constants.js, so a
// new event gets its /events/<slug> snapshot the moment it is added to the
// agenda (a hand-kept list here once missed the Leiden page). Every event in
// EVENTS carries a customSlug; one without it would fall back to the SPA shell.
const eventRoutes = () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'utils', 'constants.js'), 'utf8');
  const start = src.indexOf('export const EVENTS');
  const end = src.indexOf('];', start);
  const block = start >= 0 && end > start ? src.slice(start, end) : '';
  const slugs = [...block.matchAll(/customSlug:\s*["']([^"']+)["']/g)].map((m) => m[1]);
  if (!slugs.length) console.warn('[prerender] no event slugs found in constants.js');
  return slugs.map((s) => `/events/${s}`);
};

const ROUTES = [...STATIC_ROUTES, ...eventRoutes()];

// Routes App.js still serves but that are not snapshotted (legacy standalone
// landing pages that manage their own head, and an alias of /halloween).
// They get the SPA shell so they keep working without a catch-all rewrite.
const SHELL_ROUTES = [
  '/experiences/halloween',
  '/events/kingsday-weekender-2026',
  '/events/PadelXReggaeton',
  '/events/padel-x-reggaeton',
];

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

// Marker stamped into every snapshot so a re-run can tell it is looking at
// already-prerendered output rather than the original SPA shell.
const MARKER = '<!-- prerendered -->';

// The pristine SPA shell. `npm run build` always regenerates build/index.html,
// so this is clean in CI and locally. If prerender is invoked twice without a
// rebuild we bail out instead of rendering on top of a previous snapshot
// (which would compound injected <style> tags on every pass).
const SHELL = (() => {
  const raw = fs.readFileSync(path.join(BUILD, 'index.html'), 'utf8');
  if (raw.includes(MARKER)) {
    console.warn('[prerender] build/index.html is already prerendered — run a full build first. Skipping.');
    process.exit(0);
  }
  return Buffer.from(raw);
})();

// Without a snapshot a route would 404 (vercel.json has no catch-all rewrite,
// so unknown URLs return a real 404). If a route cannot be prerendered, write
// the plain SPA shell in its place: the page still works for visitors and
// renders client-side, it just loses the crawler-friendly HTML.
const writeShell = (route) => {
  if (route === '/') return; // build/index.html already is the shell
  const outDir = path.join(BUILD, route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), SHELL);
};

const serve = () =>
  http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const filePath = path.join(BUILD, urlPath);
    if (!filePath.startsWith(BUILD)) return res.writeHead(403).end();
    const isRealAsset =
      fs.existsSync(filePath) &&
      fs.statSync(filePath).isFile() &&
      path.extname(filePath) !== '.html';
    if (isRealAsset) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
      return res.end(fs.readFileSync(filePath));
    }
    // Any route (or .html request) gets the clean shell; React does the routing
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(SHELL);
  });

(async () => {
  if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
    console.error('[prerender] build/index.html not found — run the build first.');
    process.exit(0);
  }

  const server = serve();
  await new Promise((resolve) => server.listen(PORT, resolve));

  // On Vercel the build image lacks Chrome's shared libraries, so use the
  // serverless Chromium build. Locally, use the full puppeteer download.
  const onVercel = !!process.env.VERCEL;
  let browser;
  try {
    if (onVercel) {
      const chromium = require('@sparticuz/chromium');
      const puppeteerCore = require('puppeteer-core');
      browser = await puppeteerCore.launch({
        args: [...chromium.args, '--no-sandbox', '--disable-dev-shm-usage', '--mute-audio'],
        executablePath: await chromium.executablePath(),
        headless: true,
      });
      console.log('[prerender] using @sparticuz/chromium');
    } else {
      const puppeteer = require('puppeteer');
      browser = await puppeteer.launch({
        headless: 'shell',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--mute-audio'],
      });
      console.log('[prerender] using local puppeteer');
    }
  } catch (e) {
    console.warn('[prerender] could not launch Chrome — skipping prerender:', e.message);
    [...ROUTES, ...SHELL_ROUTES].forEach(writeShell);
    console.warn('[prerender] wrote SPA shells for all routes instead.');
    server.close();
    process.exit(0);
  }

  let ok = 0;
  for (const route of ROUTES) {
    try {
      const page = await browser.newPage();
      // Pre-accept cookies so the consent banner is not baked into the HTML
      await page.evaluateOnNewDocument(() => {
        try {
          localStorage.setItem(
            'baila_cookie_consent',
            JSON.stringify({ necessary: true, analytics: false, marketing: false, timestamp: '2026-01-01T00:00:00Z' })
          );
        } catch (_) {}
      });
      // Block third-party requests so snapshots are fast and deterministic
      await page.setRequestInterception(true);
      page.on('request', (r) => {
        const u = r.url();
        if (u.startsWith(`http://localhost:${PORT}`) || u.startsWith('data:')) r.continue();
        else r.abort();
      });

      await page.goto(`http://localhost:${PORT}${route}`, { waitUntil: 'networkidle0', timeout: 45000 });
      await page.waitForSelector('#root > *', { timeout: 20000 });
      await new Promise((r) => setTimeout(r, 900)); // let effects settle (Seo tags, countdowns)

      const html = await page.evaluate(() => {
        // Drop the noscript fallback — real content is now in the HTML
        document.querySelectorAll('noscript').forEach((n) => n.remove());
        return '<!doctype html>\n<!-- prerendered -->\n' + document.documentElement.outerHTML;
      });
      await page.close();

      const outDir = route === '/' ? BUILD : path.join(BUILD, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      const kb = (Buffer.byteLength(html) / 1024).toFixed(0);
      console.log(`[prerender] ${route.padEnd(42)} ${kb} KB`);
      ok++;
    } catch (e) {
      console.warn(`[prerender] failed ${route}: ${e.message} — writing SPA shell`);
      writeShell(route);
    }
  }

  SHELL_ROUTES.forEach(writeShell);

  await browser.close();
  server.close();
  console.log(`[prerender] done — ${ok}/${ROUTES.length} routes prerendered.`);
})();
