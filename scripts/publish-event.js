#!/usr/bin/env node
'use strict';
// Publish a scheduled event (one with publish_at in frontend/src/utils/constants.js): remove publish_at, add the
// sitemap entry, the FAQ mention (page + JSON-LD mirror) and a history line, as described in scripts/scheduled/<id>.json.
// Idempotent: running it again changes nothing. GitHub Actions (.github/workflows/publish-event.yml) runs it at the
// scheduled minute and pushes; it can also be run by hand:  node scripts/publish-event.js <event-id>
const fs = require('fs');
const path = require('path');

const id = process.argv[2];
if (!id) { console.error('usage: node scripts/publish-event.js <event-id>'); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'scheduled', `${id}.json`), 'utf8'));

let changed = false;
const edit = (rel, fn) => {
  const p = path.join(ROOT, rel); const before = fs.readFileSync(p, 'utf8'); const after = fn(before);
  if (after !== before) { fs.writeFileSync(p, after); console.log(`updated ${rel}`); changed = true; }
};

edit('frontend/src/utils/constants.js', (s) => {
  const start = s.indexOf(`id: "${id}"`); if (start < 0) throw new Error(`event ${id} not found`);
  const end = s.indexOf('\n  },', start);
  const entry = s.slice(start, end).replace(/\n\s*publish_at: "[^"]*",[^\n]*/, '');
  s = s.slice(0, start) + entry + s.slice(end);
  if (cfg.faq && s.includes(cfg.faq.old)) s = s.replace(cfg.faq.old, cfg.faq.new);
  if (cfg.history && !s.includes(cfg.history)) s = s.replace('//   Keep EVENTS in date order', `${cfg.history}\n//   Keep EVENTS in date order`);
  return s;
});
edit('frontend/public/index.html', (s) => (cfg.faq && s.includes(cfg.faq.old) ? s.replace(cfg.faq.old, cfg.faq.new) : s));
edit('frontend/public/sitemap.xml', (s) => (cfg.sitemap && !s.includes(cfg.sitemap.marker) && s.includes(cfg.sitemap.anchor) ? s.replace(cfg.sitemap.anchor, cfg.sitemap.block + cfg.sitemap.anchor) : s));

console.log(changed ? `PUBLISHED ${id}` : `nothing to do for ${id} (already published)`);
