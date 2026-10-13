'use strict';
// Tiny helpers over Node's req/res so the same handlers run on Vercel and in tests.
class HttpError extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra || {}; }
}

const baseHeaders = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  const type = typeof body === 'string' ? headers['Content-Type'] || 'text/plain; charset=utf-8' : 'application/json; charset=utf-8';
  res.statusCode = status;
  for (const [k, v] of Object.entries({ ...baseHeaders, ...headers, 'Content-Type': type })) res.setHeader(k, v);
  res.end(payload);
};

const readBody = (req, limit = 32 * 1024) =>
  new Promise((resolve, reject) => {
    if (req.body !== undefined && req.body !== null) {            // Vercel pre-parses JSON
      if (typeof req.body === 'string') { try { return resolve(JSON.parse(req.body || '{}')); } catch { return reject(new HttpError(400, 'bad_json')); } }
      return resolve(req.body);
    }
    let size = 0; const chunks = [];
    let tooBig = false;
    req.on('data', (c) => { size += c.length; if (size > limit) { if (!tooBig) { tooBig = true; reject(new HttpError(413, 'too_large')); } } else chunks.push(c); });
    req.on('end', () => {
      if (tooBig) return;   // already rejected; the body was drained so the 413 response can be delivered
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { reject(new HttpError(400, 'bad_json')); }
    });
    req.on('error', reject);
  });

const readRaw = (req, limit = 256 * 1024) =>
  new Promise((resolve, reject) => {
    if (typeof req.rawBody === 'string' || Buffer.isBuffer(req.rawBody)) return resolve(String(req.rawBody));
    // If a platform body parser already consumed the stream (bodyParser not disabled), never hang: fall back to a
    // re-serialised body. Its signature will normally not match, so the webhook is refused (401) and the problem is visible.
    if (req.readableEnded && req.body !== undefined) return resolve(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > limit) { reject(new HttpError(413, 'too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });

const parseCookies = (header) => {
  const out = {};
  String(header || '').split(';').forEach((p) => {
    const i = p.indexOf('=');
    if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
  });
  return out;
};

const clientIp = (req) => {
  const h = req.headers || {};
  const raw = h['x-vercel-forwarded-for'] || h['x-real-ip'] || (h['x-forwarded-for'] || '').split(',')[0] || (req.socket && req.socket.remoteAddress) || 'unknown';
  return String(raw).trim();
};

const SESSION_COOKIE = 'bd_quiz_session';
const sessionCookie = (value, { maxAgeSec, secure }) =>
  `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure ? '; Secure' : ''}`;
const clearSessionCookie = ({ secure }) =>
  `${SESSION_COOKIE}=; Path=/api; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;

module.exports = { HttpError, send, readBody, readRaw, parseCookies, clientIp, SESSION_COOKIE, sessionCookie, clearSessionCookie };
