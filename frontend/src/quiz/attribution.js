// Campaign attribution: allowlisted URL parameters only. Nothing here can carry personal data.
// UTMs and platform ids are kept in sessionStorage (tab lifetime) so they survive a reload and the
// language switch. Click ids (fbclid / ttclid) are used ONLY when marketing consent has been granted.
import { CONSENT_KEY } from '../utils/constants';

const KEY = 'bdq_attr';
const UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const IDS = ['meta_campaign_id', 'meta_adset_id', 'meta_ad_id', 'tiktok_campaign_id', 'tiktok_adgroup_id', 'tiktok_ad_id'];
const CLICK = ['fbclid', 'ttclid'];

const marketingConsent = () => {
  try { const c = JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null'); return Boolean(c && c.marketing); } catch (_) { return false; }
};
const read = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || '{}'); } catch (_) { return {}; } };
const write = (o) => { try { sessionStorage.setItem(KEY, JSON.stringify(o)); } catch (_) { /* private mode */ } };

// Called once when the landing page loads. First touch wins within the tab.
export const captureAttribution = () => {
  const stored = read();
  const q = new URLSearchParams(window.location.search);
  const next = { ...stored };
  [...UTM, ...IDS].forEach((k) => { const v = q.get(k); if (v && !next[k]) next[k] = v.slice(0, 150); });
  if (!next.landing_path) next.landing_path = window.location.pathname;
  if (!next.referrer_host) {
    try { const h = document.referrer ? new URL(document.referrer).hostname : ''; if (h && h !== window.location.hostname) next.referrer_host = h; } catch (_) { /* ignore */ }
  }
  write(next);
};

export const getAttribution = () => {
  const out = { ...read() };
  if (marketingConsent()) {
    const q = new URLSearchParams(window.location.search);
    CLICK.forEach((k) => { const v = q.get(k); if (v) out[k] = v.slice(0, 120); });
  }
  return out;
};

// The UTM subset that analytics events may carry (campaign-level, no ids of any person).
export const analyticsAttribution = () => {
  const a = read();
  const o = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach((k) => { if (a[k]) o[k] = a[k]; });
  return o;
};
