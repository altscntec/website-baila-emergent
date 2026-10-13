'use strict';
const { domainToASCII } = require('url');

// One normalisation, used everywhere (uniqueness, lookup, suppression):
//   trim -> Unicode NFC -> lowercase -> domain to ASCII (punycode).
// Deliberately NO provider-specific rules: dots and "+tags" in the local part
// are preserved, because they are significant for most providers and removing
// them would merge distinct mailboxes or leak provider assumptions.
const EMAIL_RE = /^[^\s@"<>()\[\]\\,;:]+@[^\s@"<>()\[\]\\,;:]+\.[^\s@"<>()\[\]\\,;:]{2,}$/;

const normalizeEmail = (raw) => {
  if (typeof raw !== 'string') return null;
  const s = raw.trim().normalize('NFC').toLowerCase();
  if (s.length < 6 || s.length > 254) return null;
  const at = s.lastIndexOf('@');
  if (at < 1 || at !== s.indexOf('@')) return null;
  const local = s.slice(0, at);
  const domain = domainToASCII(s.slice(at + 1));
  if (!domain || local.length > 64) return null;
  const out = `${local}@${domain}`;
  return EMAIL_RE.test(out) ? out : null;
};

module.exports = { normalizeEmail };
