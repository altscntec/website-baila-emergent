'use strict';
// Single Vercel function for the whole quiz API (keeps us far below function-count limits).
// Everything interesting lives in ../server so it can be tested without Vercel.
const { loadConfig } = require('../server/config');
const { createDb, poolFromUrl } = require('../server/db');
const { createResendAdapter } = require('../server/mail/resend');
const { createHandler } = require('../server/router');

let handler;
const get = () => {
  if (handler) return handler;
  const cfg = loadConfig();
  const db = cfg.databaseUrl ? createDb(poolFromUrl(cfg.databaseUrl)) : null;
  const mail = createResendAdapter({ apiKey: cfg.resendApiKey, from: cfg.mailFrom, replyTo: cfg.mailReplyTo });
  handler = createHandler({ cfg, db: db || { query: async () => { throw new Error('no database'); } }, mail, now: () => new Date() });
  return handler;
};

module.exports = (req, res) => get()(req, res);
// Webhook signature checks need the exact bytes, so skip Vercel's body parsing for that path only.
module.exports.config = { api: { bodyParser: false } };
