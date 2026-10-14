'use strict';
// Resend adapter (the provider the legacy backend already used). Plain fetch, no SDK.
// Throws MailError with .permanent=true for failures that retrying cannot fix.
class MailError extends Error {
  constructor(message, { permanent = false, status = null } = {}) { super(message); this.permanent = permanent; this.status = status; }
}

const createResendAdapter = ({ apiKey, from, replyTo, fetchImpl = fetch }) => ({
  name: 'resend',
  configured: Boolean(apiKey && from),
  async send({ to, subject, html, text, idempotencyKey, tags = [], headers = {} }) {
    if (!apiKey || !from) throw new MailError('mail_not_configured', { permanent: false });
    let res;
    try {
      res = await fetchImpl('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from, to: [to], subject, html, text,
          ...(replyTo ? { reply_to: replyTo } : {}),
          tags: tags.map((t) => ({ name: t.name, value: String(t.value).replace(/[^A-Za-z0-9_-]/g, '_') })),
          ...(Object.keys(headers).length ? { headers } : {}),
        }),
      });
    } catch (e) {
      throw new MailError(`network_error: ${e.message}`, { permanent: false });
    }
    let body = null;
    try { body = await res.json(); } catch (_) { /* non-JSON error page */ }
    if (res.ok && body && body.id) return { providerMessageId: body.id };
    const permanent = res.status >= 400 && res.status < 500 && res.status !== 429 && res.status !== 409 && res.status !== 408;
    throw new MailError(`provider_${res.status}: ${(body && (body.message || body.name)) || 'error'}`, { permanent, status: res.status });
  },
});

module.exports = { createResendAdapter, MailError };
