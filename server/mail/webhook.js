'use strict';
const crypto = require('crypto');

// Resend signs webhooks with Svix: HMAC-SHA256 over `${id}.${timestamp}.${body}`
// using the base64 part of the `whsec_...` secret; header carries "v1,<b64>" entries.
const verifySvix = ({ secret, headers, rawBody, toleranceSec = 300, now = Date.now() }) => {
  if (!secret) return { ok: false, reason: 'no_secret' };
  const id = headers['svix-id']; const ts = headers['svix-timestamp']; const sigHeader = headers['svix-signature'];
  if (!id || !ts || !sigHeader) return { ok: false, reason: 'missing_headers' };
  const tsNum = Number(ts);
  if (!Number.isFinite(tsNum) || Math.abs(now / 1000 - tsNum) > toleranceSec) return { ok: false, reason: 'stale' };
  const key = Buffer.from(String(secret).replace(/^whsec_/, ''), 'base64');
  const expected = crypto.createHmac('sha256', key).update(`${id}.${ts}.${rawBody}`).digest();
  const given = String(sigHeader).split(' ').map((p) => p.split(',')).filter((p) => p[0] === 'v1').map((p) => Buffer.from(p[1] || '', 'base64'));
  const ok = given.some((g) => g.length === expected.length && crypto.timingSafeEqual(g, expected));
  return ok ? { ok: true, id } : { ok: false, reason: 'bad_signature' };
};

// Provider event type -> our status. Order matters for "never go backwards".
const EVENT_STATUS = {
  'email.sent': 'accepted',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delayed',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
};
const RANK = { queued: 0, sending: 1, accepted: 2, delayed: 3, delivered: 4, failed: 5, bounced: 6, complained: 7 };

module.exports = { verifySvix, EVENT_STATUS, RANK };
