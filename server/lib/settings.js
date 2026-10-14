'use strict';
// Campaign settings live in the database so the owner can change them without a
// deploy. Defaults are deliberately SAFE: disabled, unconfirmed, no dates.
const DEFAULT_SETTINGS = {
  enabled: false,                 // master switch; cannot be turned on until offer_confirmed
  offer_confirmed: false,         // owner confirms Weeztix coupon config + a real test redemption
  opens_at: null,                 // ISO-8601 with offset; interpreted/displayed in Europe/Amsterdam
  closes_at: null,
  code_expires_at: null,          // when issued codes stop working (must match the Weeztix coupon validity)
  code_valid_hours: null,         // optional per-person window: a code expires this many hours after it is sent (capped by code_expires_at)
  checkout_url: 'https://weeztix.shop/nxaqrkdz',
  coupon_param: 'coupon',         // verified: the Weeztix shop link forwards ?coupon=CODE
  eligible_ticket_types: [],      // shown in the reward email; the real restriction is set in Weeztix
  excluded_note: { en: '', es: '', nl: '' },   // e.g. booking fees, table packages
  stacking_note: { en: 'Cannot be combined with other discounts.', es: 'No se puede combinar con otros descuentos.', nl: 'Niet te combineren met andere kortingen.' },
  redemption_note: { en: 'Single use.', es: 'Un solo uso.', nl: 'Eenmalig te gebruiken.' },
  low_inventory_threshold: 10,
  retention_days: null,           // owner MUST set before launch: days to keep non-opted-in data after close
  show_review_after_completion: false,   // reveals correct answers + explanations after completion
  alert_email_enabled: true,
};

const validateSettingsPatch = (patch, current) => {
  const errors = {};
  const out = {};
  const isIso = (v) => v === null || (typeof v === 'string' && !Number.isNaN(Date.parse(v)) && /[zZ]|[+-]\d{2}:\d{2}$/.test(v));
  for (const [k, v] of Object.entries(patch || {})) {
    if (!(k in DEFAULT_SETTINGS)) { errors[k] = 'unknown_setting'; continue; }
    switch (k) {
      case 'enabled': case 'offer_confirmed': case 'show_review_after_completion': case 'alert_email_enabled':
        if (typeof v !== 'boolean') errors[k] = 'must_be_boolean'; else out[k] = v; break;
      case 'opens_at': case 'closes_at': case 'code_expires_at':
        if (!isIso(v)) errors[k] = 'must_be_iso_with_offset'; else out[k] = v; break;
      case 'checkout_url':
        try { const u = new URL(v); if (u.protocol !== 'https:') throw new Error('x'); out[k] = u.toString(); } catch { errors[k] = 'must_be_https_url'; } break;
      case 'coupon_param':
        if (typeof v !== 'string' || !/^[a-z_]{1,20}$/i.test(v)) errors[k] = 'invalid'; else out[k] = v; break;
      case 'eligible_ticket_types':
        if (!Array.isArray(v) || v.some((x) => typeof x !== 'string' || x.length > 80)) errors[k] = 'invalid'; else out[k] = v; break;
      case 'excluded_note': case 'stacking_note': case 'redemption_note':
        if (!v || typeof v !== 'object' || ['en', 'es', 'nl'].some((l) => typeof v[l] !== 'string' || v[l].length > 400)) errors[k] = 'needs_en_es_nl_strings'; else out[k] = { en: v.en, es: v.es, nl: v.nl }; break;
      case 'low_inventory_threshold':
        if (!Number.isInteger(v) || v < 0 || v > 10000) errors[k] = 'invalid'; else out[k] = v; break;
      case 'retention_days':
        if (v !== null && (!Number.isInteger(v) || v < 1 || v > 3650)) errors[k] = 'invalid'; else out[k] = v; break;
      case 'code_valid_hours':
        if (v !== null && (!Number.isInteger(v) || v < 1 || v > 720)) errors[k] = 'invalid'; else out[k] = v; break;
      default: break;
    }
  }
  const next = { ...current, ...out };
  if (Object.keys(errors).length === 0) {
    if (next.opens_at && next.closes_at && Date.parse(next.closes_at) <= Date.parse(next.opens_at)) errors.closes_at = 'must_be_after_opens_at';
    if (next.enabled) {
      for (const need of ['offer_confirmed', 'opens_at', 'closes_at', 'code_expires_at', 'retention_days']) {
        if (!next[need]) errors.enabled = `cannot_enable_missing_${need}`;
      }
    }
  }
  return { ok: Object.keys(errors).length === 0, errors, next };
};

const getSettings = async (db) => {
  const r = await db.query(`SELECT value FROM quiz.settings WHERE key = 'campaign'`);
  return { ...DEFAULT_SETTINGS, ...(r.rows[0] ? r.rows[0].value : {}) };
};

const saveSettings = async (db, next) => {
  await db.query(
    `INSERT INTO quiz.settings (key, value) VALUES ('campaign', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(next)]
  );
};

// 'open' only when switched on AND inside the date window.
const campaignState = (s, now = new Date()) => {
  if (!s.enabled) return 'disabled';
  const t = now.getTime();
  if (s.opens_at && t < Date.parse(s.opens_at)) return 'not_open';
  if (s.closes_at && t >= Date.parse(s.closes_at)) return 'closed';
  return 'open';
};

module.exports = { DEFAULT_SETTINGS, validateSettingsPatch, getSettings, saveSettings, campaignState };
