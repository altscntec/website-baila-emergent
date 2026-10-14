'use strict';
// Allowlist for campaign attribution. Anything not listed is dropped, values are
// length-limited and charset-limited. Never add anything that could identify a
// person (email, name, user ids) to this list.
const SAFE_VALUE = /^[A-Za-z0-9_\-.~:+%|/ ]{1,150}$/;
const ID_VALUE = /^[A-Za-z0-9_\-.]{1,120}$/;

const FIELDS = {
  utm_source: SAFE_VALUE,
  utm_medium: SAFE_VALUE,
  utm_campaign: SAFE_VALUE,
  utm_content: SAFE_VALUE,
  utm_term: SAFE_VALUE,
  // Platform click ids: only ever sent by the browser when marketing consent is granted.
  fbclid: ID_VALUE,
  ttclid: ID_VALUE,
  // Numeric platform ids from ad URL macros.
  meta_campaign_id: /^\d{1,24}$/,
  meta_adset_id: /^\d{1,24}$/,
  meta_ad_id: /^\d{1,24}$/,
  tiktok_campaign_id: /^\d{1,24}$/,
  tiktok_adgroup_id: /^\d{1,24}$/,
  tiktok_ad_id: /^\d{1,24}$/,
  // Path of the landing page (query string removed) and referrer HOST only.
  landing_path: /^\/[A-Za-z0-9_\-./]{0,120}$/,
  referrer_host: /^[a-z0-9.\-]{1,120}$/,
};

const sanitizeAttribution = (input) => {
  const out = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const [key, re] of Object.entries(FIELDS)) {
    const v = input[key];
    if (typeof v === 'string' && re.test(v)) out[key] = v;
  }
  return out;
};

// The subset that is safe to put on an outbound checkout URL (no click ids).
const CHECKOUT_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

module.exports = { sanitizeAttribution, CHECKOUT_PARAMS, FIELDS };
