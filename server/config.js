'use strict';
// Environment-driven configuration. Nothing here has a usable default for a secret:
// missing secrets make the relevant feature report "not configured" instead of
// silently falling back to something insecure.
const loadConfig = (env = process.env) => {
  const siteOrigin = (env.SITE_ORIGIN || 'https://bailadembow.com').replace(/\/$/, '');
  const extraOrigins = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (env.VERCEL_URL) extraOrigins.push(`https://${env.VERCEL_URL}`);
  if (env.VERCEL_BRANCH_URL) extraOrigins.push(`https://${env.VERCEL_BRANCH_URL}`);
  return {
    databaseUrl: env.DATABASE_URL || null,
    appSecret: env.APP_SECRET || null,                 // >= 32 chars; keys all token/code hashes
    adminKey: env.ADMIN_API_KEY || null,               // full owner control
    analyticsKey: env.ANALYTICS_API_KEY || null,       // read-only aggregate metrics (daily agent)
    cronSecret: env.CRON_SECRET || null,
    resendApiKey: env.RESEND_API_KEY || null,
    resendWebhookSecret: env.RESEND_WEBHOOK_SECRET || null,
    mailFrom: env.MAIL_FROM || null,                   // e.g. "Baila Dembow <quiz@bailadembow.com>"
    mailReplyTo: env.MAIL_REPLY_TO || null,
    ownerAlertEmail: env.OWNER_ALERT_EMAIL || null,
    siteOrigin,
    allowedOrigins: [siteOrigin, ...extraOrigins],
    isProd: env.VERCEL_ENV === 'production',
    cookieSecure: env.NODE_ENV !== 'test' && !/^http:\/\/localhost/.test(siteOrigin),
    verifyTtlMinutes: Number(env.VERIFY_TTL_MINUTES) || 30,
    sessionTtlDays: Number(env.SESSION_TTL_DAYS) || 14,
    // Halloween 2027 early-release list (/halloween/2027): hidden, and refusing sign-ups, before this moment.
    h27OpensAt: env.H27_OPENS_AT || '2026-11-01T04:00:00+01:00',
    // Phone verification (WhatsApp / SMS one-time codes) through Twilio Verify. Off unless H27_PHONE_VERIFICATION=on
    // AND the Twilio variables are set: the approved 2027 page verifies email only.
    h27PhoneVerification: env.H27_PHONE_VERIFICATION === 'on' ? 'on' : 'off',
    twilioAccountSid: env.TWILIO_ACCOUNT_SID || null, twilioAuthToken: env.TWILIO_AUTH_TOKEN || null, twilioVerifyServiceSid: env.TWILIO_VERIFY_SERVICE_SID || null,
  };
};

const configProblems = (cfg) => {
  const p = [];
  if (!cfg.databaseUrl) p.push('DATABASE_URL');
  if (!cfg.appSecret || cfg.appSecret.length < 32) p.push('APP_SECRET (>=32 chars)');
  return p;
};

module.exports = { loadConfig, configProblems };
