'use strict';
const { sanitizeAttribution } = require('../lib/attribution');

const BOT_UA = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|telegram|curl|wget|python|headless|monitor/i;
const METRICS = new Set(['landing_view', 'start_click']);

// Cookieless daily counters: no ip, no user-agent, no identifiers. Only campaign params and language.
const bump = async (db, { metric, attribution, language, userAgent, now = new Date() }) => {
  if (!METRICS.has(metric)) return false;
  if (BOT_UA.test(userAgent || '')) return false;
  const a = sanitizeAttribution(attribution);
  const dims = {
    utm_source: a.utm_source || '', utm_medium: a.utm_medium || '', utm_campaign: a.utm_campaign || '',
    utm_content: a.utm_content || '', language: ['en', 'es', 'nl'].includes(language) ? language : 'en',
  };
  const key = [dims.utm_source, dims.utm_medium, dims.utm_campaign, dims.utm_content, dims.language].join('|');
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(now);
  await db.query(
    `INSERT INTO quiz.daily_counters (day, metric, dim_key, dims, count) VALUES ($1,$2,$3,$4,1)
     ON CONFLICT (day, metric, dim_key) DO UPDATE SET count = quiz.daily_counters.count + 1`,
    [day, metric, key, JSON.stringify(dims)]);
  return true;
};

module.exports = { bump };
