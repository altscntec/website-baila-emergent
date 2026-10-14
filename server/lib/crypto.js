'use strict';
const crypto = require('crypto');

const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

// HMAC with the app secret: stored token/code hashes are useless without it.
const hmac = (secret, s) => crypto.createHmac('sha256', secret).update(String(s)).digest('hex');

const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');

// 6-digit numeric code, uniform (randomInt is rejection-sampled, no modulo bias).
const randomCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

const safeEqual = (a, b) => {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
};

// Unbiased Fisher-Yates using CSPRNG. `rng(n)` returns an int in [0, n).
const defaultRng = (n) => crypto.randomInt(0, n);
const shuffle = (arr, rng = defaultRng) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// k distinct items, uniformly, without replacement.
const sample = (arr, k, rng = defaultRng) => shuffle(arr, rng).slice(0, k);

module.exports = { sha256, hmac, randomToken, randomCode, safeEqual, shuffle, sample, defaultRng };
