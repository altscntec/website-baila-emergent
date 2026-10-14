#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const migrate = async (db, dir = path.join(__dirname, 'migrations')) => {
  await db.query('CREATE SCHEMA IF NOT EXISTS quiz');
  await db.query(`CREATE TABLE IF NOT EXISTS quiz.schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  const applied = [];
  for (const f of files) {
    const done = await db.query('SELECT 1 FROM quiz.schema_migrations WHERE name = $1', [f]);
    if (done.rowCount) continue;
    await db.tx(async (t) => {
      await t.query(fs.readFileSync(path.join(dir, f), 'utf8'));
      await t.query('INSERT INTO quiz.schema_migrations (name) VALUES ($1)', [f]);
    });
    applied.push(f);
  }
  return applied;
};

module.exports = { migrate };

if (require.main === module) {
  const { createDb, poolFromUrl } = require('./db');
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('DATABASE_URL is not set'); process.exit(1); }
  const db = createDb(poolFromUrl(url));
  migrate(db)
    .then((a) => { console.log(a.length ? `Applied: ${a.join(', ')}` : 'Up to date.'); return db.end(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
