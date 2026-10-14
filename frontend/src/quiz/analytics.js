// Consent-aware measurement for the quiz. See docs/quiz/tracking.md for the full event schema.
//
// Rules enforced here:
//  * dataLayer (GTM) is only written when the visitor accepted analytics or marketing cookies.
//  * Meta / TikTok events are only sent when marketing consent loaded those pixels (window.fbq / window.ttq),
//    via the pixels the site already loads. GTM must NOT also carry Meta/TikTok base tags (that would double count).
//  * Payloads are built from an allowlist. Names, emails, ages, genders, cities, tokens and discount codes can
//    never appear: callers pass only the keys below, anything else is dropped.
//  * Every event has a random event_id (also passed to the pixels) so a future server-side event can be deduplicated.
//  * No purchase event exists in the browser: tickets are sold on the Weeztix shop, so purchases are only known from
//    the imported order export (server side). Ticket clicks and issued codes are NOT purchases.
import { CONSENT_KEY } from '../utils/constants';
import { analyticsAttribution } from './attribution';

const ALLOWED = new Set(['theme', 'language', 'question_id', 'position', 'tier', 'score_band', 'status', 'step', 'error_code', 'duration_ms', 'fields', 'kind']);

const consent = () => {
  try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') || {}; } catch (_) { return {}; }
};
const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Which ad-platform event (if any) mirrors each quiz event. Everything else goes to GTM/GA4 only.
const PIXEL_MAP = {
  quiz_start_click: { meta: ['trackCustom', 'QuizStart'], tiktok: 'ClickButton' },
  quiz_form_success: { meta: ['trackCustom', 'QuizSignup'], tiktok: null },
  quiz_verification_completed: { meta: ['track', 'Lead'], tiktok: 'SubmitForm' },
  quiz_completed: { meta: ['trackCustom', 'QuizCompleted'], tiktok: null },
  quiz_ticket_click: { meta: ['track', 'InitiateCheckout'], tiktok: 'InitiateCheckout' },
};

export const quizTrack = (name, params = {}) => {
  const c = consent();
  const analyticsOk = Boolean(c.analytics || c.marketing);
  const clean = { campaign_id: 'halloween_quiz_2026' };
  Object.entries(params).forEach(([k, v]) => { if (ALLOWED.has(k) && v !== undefined && v !== null) clean[k] = Array.isArray(v) ? v.join(',') : v; });
  const eventId = uuid();
  const payload = { ...analyticsAttribution(), ...clean };

  if (analyticsOk && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, event_id: eventId, ...payload });
  }
  const map = PIXEL_MAP[name];
  if (map && c.marketing && typeof window !== 'undefined') {
    const pixelParams = { content_name: 'Halloween Quiz', content_category: 'Quiz', ...(clean.tier ? { value: clean.tier, currency: 'EUR' } : {}) };
    if (map.meta && window.fbq) { try { window.fbq(map.meta[0], map.meta[1], pixelParams, { eventID: eventId }); } catch (_) { /* pixel blocked */ } }
    if (map.tiktok && window.ttq) { try { window.ttq.track(map.tiktok, pixelParams, { event_id: eventId }); } catch (_) { /* pixel blocked */ } }
  }
};

export const scoreBand = (tier) => ({ 5: 'low', 10: 'mid', 15: 'top' }[tier]);
