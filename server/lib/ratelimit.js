'use strict';
const { hmac } = require('./crypto');

// Fixed-window counters in Postgres: shared across serverless instances, no extra
// infrastructure. Keys are HMACed so no raw IP or email is stored here.
const hit = async (db, secret, key, windowSec, max, now = new Date()) => {
  const bucket = Math.floor(now.getTime() / 1000 / windowSec) * windowSec;
  const windowStart = new Date(bucket * 1000);
  const r = await db.query(
    `INSERT INTO quiz.rate_limits (key, window_start, count) VALUES ($1, $2, 1)
     ON CONFLICT (key, window_start) DO UPDATE SET count = quiz.rate_limits.count + 1
     RETURNING count`,
    [hmac(secret, key), windowStart]
  );
  const count = r.rows[0].count;
  return { allowed: count <= max, count, retryAfter: Math.max(1, bucket + windowSec - Math.floor(now.getTime() / 1000)) };
};

// All limits must pass; the first failing one wins. Every limit is counted
// (so hammering one dimension cannot be used to probe another).
const hitAll = async (db, secret, checks, now) => {
  let worst = null;
  for (const [key, windowSec, max] of checks) {
    const r = await hit(db, secret, key, windowSec, max, now);
    if (!r.allowed && !worst) worst = r;
  }
  return worst ? { allowed: false, retryAfter: worst.retryAfter } : { allowed: true };
};

const purge = (db, olderThanHours = 48) =>
  db.query(`DELETE FROM quiz.rate_limits WHERE window_start < now() - ($1 || ' hours')::interval`, [String(olderThanHours)]);

module.exports = { hit, hitAll, purge };

// Read the current window's count without incrementing (used to refuse blocked callers cheaply).
const peek = async (db, secret, key, windowSec, now = new Date()) => {
  const bucket = Math.floor(now.getTime() / 1000 / windowSec) * windowSec;
  const r = await db.query('SELECT count FROM quiz.rate_limits WHERE key = $1 AND window_start = $2', [hmac(secret, key), new Date(bucket * 1000)]);
  return r.rowCount ? r.rows[0].count : 0;
};
module.exports.peek = peek;
