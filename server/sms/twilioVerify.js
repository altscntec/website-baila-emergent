'use strict';
// Twilio Verify adapter for the phone step of the Halloween 2027 list: one-time codes over WhatsApp (fallback SMS).
// Twilio generates, delivers and checks the code; we never see or store it. Errors are mapped to stable codes the
// API can act on. Nothing here logs phone numbers.
class SmsError extends Error {
  constructor(code, detail) { super(code); this.code = code; this.detail = detail || {}; }
}

const MAP = { 60200: 'invalid_number', 60202: 'rate_limited', 60203: 'rate_limited', 60212: 'rate_limited', 60205: 'channel_unavailable', 60223: 'channel_unavailable', 60410: 'channel_unavailable', 20404: 'not_found', 20429: 'rate_limited' };

const createTwilioVerify = ({ accountSid, authToken, serviceSid, fetchImpl = fetch }) => {
  const configured = Boolean(accountSid && authToken && serviceSid);
  const call = async (path, params) => {
    if (!configured) throw new SmsError('not_configured');
    let res;
    try {
      res = await fetchImpl(`https://verify.twilio.com/v2/Services/${serviceSid}/${path}`, {
        method: 'POST',
        headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(params).toString(),
      });
    } catch (e) { throw new SmsError('network_error'); }
    let body = null; try { body = await res.json(); } catch (_) { /* non-JSON */ }
    if (res.ok && body) return body;
    throw new SmsError(MAP[body && body.code] || 'provider_error', { status: res.status, code: body && body.code });
  };
  return {
    name: 'twilio-verify', configured,
    async start({ to, channel }) { const b = await call('Verifications', { To: to, Channel: channel }); return { sid: b.sid, status: b.status }; },
    async check({ to, code }) { const b = await call('VerificationCheck', { To: to, Code: code }); return { approved: b.status === 'approved', status: b.status }; },
  };
};

module.exports = { createTwilioVerify, SmsError };
