'use strict';
// Single Vercel function for the whole quiz API (keeps us far below function-count limits).
// Everything interesting lives in ../server so it can be tested without Vercel.
//
// Vercel's file-based catch-all only matched ONE path segment in a plain (non-Next) project, so vercel.json rewrites
// /api/:path* to /api/index?__p=<path> and this entry restores the real path before routing.
const { loadConfig } = require('../server/config');
const { createDb, poolFromUrl } = require('../server/db');
const { createResendAdapter } = require('../server/mail/resend');
const { createTwilioVerify } = require('../server/sms/twilioVerify');
const { createHandler } = require('../server/router');

let handler;
const get = () => {
  if (handler) return handler;
  const cfg = loadConfig();
  const db = cfg.databaseUrl ? createDb(poolFromUrl(cfg.databaseUrl)) : null;
  const mail = createResendAdapter({ apiKey: cfg.resendApiKey, from: cfg.mailFrom, replyTo: cfg.mailReplyTo });
  const sms = createTwilioVerify({ accountSid: cfg.twilioAccountSid, authToken: cfg.twilioAuthToken, serviceSid: cfg.twilioVerifyServiceSid });
  handler = createHandler({ cfg, db: db || { query: async () => { throw new Error('no database'); } }, mail, sms, now: () => new Date() });
  return handler;
};

const restoreUrl = (rawUrl) => {
  const u = new URL(rawUrl, 'http://local');
  const p = u.searchParams.get('__p');
  if (p === null) return rawUrl;
  u.searchParams.delete('__p');
  return `/api/${String(p).replace(/^\/+/, '')}${u.search}`;
};

module.exports = (req, res) => { req.url = restoreUrl(req.url); return get()(req, res); };
module.exports.restoreUrl = restoreUrl;
// Webhook signature checks need the exact bytes, so skip Vercel's body parsing.
module.exports.config = { api: { bodyParser: false } };
