'use strict';
const { Pool } = require('pg');

// Thin wrapper so services depend on { query, tx } and tests can inject their own pool.
// Only transaction-scoped advisory locks are used, so this also works behind a
// transaction-mode pooler (e.g. Supabase's pooler on port 6543).
const createDb = (pool) => ({
  pool,
  query: (text, params) => pool.query(text, params),
  async tx(fn) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({ query: (t, p) => client.query(t, p) });
      await client.query('COMMIT');
      return result;
    } catch (e) {
      try { await client.query('ROLLBACK'); } catch (_) { /* connection already broken */ }
      throw e;
    } finally {
      client.release();
    }
  },
  end: () => pool.end(),
});

const poolFromUrl = (url, opts = {}) => {
  const local = /@(localhost|127\.0\.0\.1)/.test(url);
  return new Pool({
    connectionString: url,
    max: opts.max || 3,                       // serverless: keep per-instance connections low
    idleTimeoutMillis: 10_000,
    ssl: local ? false : { rejectUnauthorized: false },
  });
};

module.exports = { createDb, poolFromUrl };
