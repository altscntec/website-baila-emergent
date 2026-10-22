#!/usr/bin/env node
'use strict';
// LOCAL DEVELOPMENT ONLY. Serves the built frontend and the real API handler on one origin, backed by a real
// (embedded) Postgres, with a capturing fake mailbox instead of Resend. It refuses to run on Vercel/production.
// Everything it seeds is synthetic test data: never use it with real participants or real discount codes.
//   node server/dev-server.js [--build ../frontend/build] [--port 3999]
if (process.env.VERCEL || process.env.NODE_ENV === 'production') { console.error('dev-server is local-only'); process.exit(1); }
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const H = require('./test/helpers');
const { loadConfig } = require('./config');
const { createHandler } = require('./router');

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > -1 ? process.argv[i + 1] : d; };
const BUILD = path.resolve(arg('build', path.join(__dirname, '..', 'frontend', 'build')));
const PORT = Number(arg('port', 3999));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml', '.wav': 'audio/wav', '.mp3': 'audio/mpeg' };
const NOINDEX = 'noindex, nofollow, noarchive';

(async () => {
  const pg = await H.startPostgres();
  const mail = new H.TestMail();
  const cfg = { ...loadConfig({ ...H.TEST_ENV, SITE_ORIGIN: `http://localhost:${PORT}`, ...(process.env.H27_OPENS_AT ? { H27_OPENS_AT: process.env.H27_OPENS_AT } : {}) }), allowedOrigins: [`http://localhost:${PORT}`, `http://127.0.0.1:${PORT}`] };
  const ctx = { cfg, db: pg.db, mail, now: () => new Date() };
  const api = createHandler(ctx);

  // Seed (through the same admin API the owner would use).
  const seedEnv = { admin: (m, p, b) => fetch(`http://localhost:${PORT}${p}`, { method: m, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${H.TEST_ENV.ADMIN_API_KEY}` }, body: JSON.stringify(b) }).then(async (r) => ({ status: r.status, text: await r.text() })) };

  // DEV_STUB_PIXELS=1 replaces the Meta/TikTok pixels and GTM with recording stubs, so consent behaviour can be
  // tested without ever sending a test event to the real pixels or the real GTM container.
  const STUBS = `<script>window.__pix=[];var rec=function(k,a){var v=[k,[].slice.call(a)];window.__pix.push(v);if(window.__record)try{window.__record('pix',v)}catch(e){}};window.fbq=function(){rec('fbq',arguments)};window.ttq={_i:{'C189G8RC77UBJAEBRS80':1},track:function(){rec('ttq',arguments)},page:function(){}};window.google_tag_manager={'GTM-M3Z7P43H':{}};</script>`;
  const sendFile = (res, file, extra = {}) => {
    if (process.env.DEV_STUB_PIXELS && file.endsWith('.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...extra });
      return res.end(fs.readFileSync(file, 'utf8').replace('<head>', `<head>${STUBS}`));
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', ...extra });
    fs.createReadStream(file).pipe(res);
  };

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const p = decodeURIComponent(url.pathname);
    if (p.startsWith('/api/')) return api(req, res);
    if (p.startsWith('/_vercel/')) { res.writeHead(404); return res.end(); }   // Vercel-hosted scripts do not exist locally; do not answer with HTML

    if (p === '/__dev/outbox') {
      const to = (url.searchParams.get('to') || '').toLowerCase();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(mail.sent.filter((m) => !to || m.to.toLowerCase() === to).map((m) => ({ to: m.to, subject: m.subject, text: m.text, providerMessageId: m.providerMessageId, tags: m.tags }))));
    }
    if (p === '/__dev/mail-event') {            // simulate the provider's webhook (signed with the TEST secret)
      const id = url.searchParams.get('message'); const type = url.searchParams.get('type') || 'email.delivered';
      const raw = JSON.stringify({ type, created_at: new Date().toISOString(), data: { email_id: id } });
      const ts = Math.floor(Date.now() / 1000); const sid = `dev_${crypto.randomUUID()}`;
      const sig = 'v1,' + crypto.createHmac('sha256', Buffer.from(H.TEST_ENV.RESEND_WEBHOOK_SECRET.replace('whsec_', ''), 'base64')).update(`${sid}.${ts}.${raw}`).digest('base64');
      const r = await fetch(`http://localhost:${PORT}/api/webhooks/resend`, { method: 'POST', headers: { 'svix-id': sid, 'svix-timestamp': String(ts), 'svix-signature': sig, 'Content-Type': 'application/json' }, body: raw });
      res.writeHead(r.status, { 'Content-Type': 'application/json' }); return res.end(await r.text());
    }
    if (p === '/__dev/state') {                 // test inspection of the stored key (browser can never do this)
      const rows = (await pg.db.query(`SELECT a.id AS attempt_id, aq.position, aq.question_id, aq.correct_option_id, aq.selected_option_id FROM quiz.attempt_questions aq JOIN quiz.attempts a ON a.id=aq.attempt_id ORDER BY a.started_at DESC, aq.position`)).rows;
      res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify(rows));
    }

    // static files, then the same rewrites as vercel.json
    const abs = path.join(BUILD, p);
    if (abs.startsWith(BUILD) && fs.existsSync(abs) && fs.statSync(abs).isFile()) return sendFile(res, abs);
    const dirIndex = path.join(abs, 'index.html');
    if (abs.startsWith(BUILD) && fs.existsSync(dirIndex) && !p.startsWith('/halloween/quiz')) return sendFile(res, dirIndex);
    if (p === '/halloween/quiz' || p.startsWith('/halloween/quiz/')) { const shell = path.join(BUILD, 'spa-shell.html'); return sendFile(res, fs.existsSync(shell) ? shell : path.join(BUILD, 'index.html'), { 'X-Robots-Tag': NOINDEX }); }
    return sendFile(res, path.join(BUILD, 'index.html'));
  });
  await new Promise((r) => server.listen(PORT, r));

  const bankFile = path.join(__dirname, '..', 'quiz-private', 'question-bank.json');
  const bank = fs.existsSync(bankFile) ? JSON.parse(fs.readFileSync(bankFile, 'utf8')) : H.syntheticBank();
  let r = await seedEnv.admin('POST', '/api/admin/questions/import', { questions: bank });
  console.log('questions', r.status, r.text.slice(0, 80));
  for (const tier of [5, 10, 15]) {
    const codes = Array.from({ length: 30 }, (_, i) => `LOCALTEST${tier}X${String(i).padStart(3, '0')}`);
    r = await seedEnv.admin('POST', '/api/admin/codes/import', { tier, batch: 'local-synthetic', codes });
    console.log(`codes ${tier}`, r.status);
  }
  r = await seedEnv.admin('PUT', '/api/admin/settings', {
    offer_confirmed: true, code_valid_hours: 72, retention_days: 30, enabled: process.env.QUIZ_DEV_DISABLED ? false : true, ...H.FUTURE,
    code_expires_at: '2026-10-31T16:00:00+01:00', closes_at: '2026-10-31T12:00:00+01:00', opens_at: '2026-10-01T00:00:00+02:00',
    eligible_ticket_types: ['General admission (test)'],
  });
  console.log('settings', r.status, r.text.slice(0, 120));
  console.log(`LOCAL quiz dev server: http://localhost:${PORT}/halloween/quiz   (admin key for /halloween/quiz/admin: ${H.TEST_ENV.ADMIN_API_KEY})`);
  process.on('SIGINT', async () => { server.close(); await pg.stop(); process.exit(0); });
  process.on('SIGTERM', async () => { server.close(); await pg.stop(); process.exit(0); });
})().catch((e) => { console.error(e); process.exit(1); });
