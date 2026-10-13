'use strict';
const { alertEmail } = require('../email/templates');
const { getSettings } = require('../lib/settings');

// Server-side journey events: anonymous id + allowlisted, non-personal props only.
const SAFE_PROP_KEYS = new Set(['position', 'status', 'kind', 'duration_ms', 'fields', 'reason', 'state', 'metric']);
const track = async (q, e) => {
  const props = {};
  for (const [k, v] of Object.entries(e.props || {})) if (SAFE_PROP_KEYS.has(k)) props[k] = v;
  await q.query(
    `INSERT INTO quiz.funnel_events (anon_id, name, theme, language, question_id, tier, props, attribution)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [e.anonId || null, e.name, e.theme || null, e.language || null, e.questionId || null, e.tier || null, JSON.stringify(props), JSON.stringify(e.attribution || {})]
  );
};

const audit = (q, actor, action, detail = {}) =>
  q.query('INSERT INTO quiz.audit_log (actor, action, detail) VALUES ($1,$2,$3)', [actor, action, JSON.stringify(detail)]);

// De-duplicated owner alert (same kind not re-raised within 6h while unresolved).
// Alert details must never include personal data, codes or tokens.
const raiseAlert = async (ctx, kind, detail = {}) => {
  try {
    const recent = await ctx.db.query(
      `SELECT 1 FROM quiz.owner_alerts WHERE kind = $1 AND resolved_at IS NULL AND at > now() - interval '6 hours' LIMIT 1`, [kind]);
    if (recent.rowCount) return false;
    await ctx.db.query('INSERT INTO quiz.owner_alerts (kind, detail) VALUES ($1,$2)', [kind, JSON.stringify(detail)]);
    const s = await getSettings(ctx.db);
    if (s.alert_email_enabled && ctx.cfg.ownerAlertEmail && ctx.mail.configured) {
      const m = alertEmail({ kind, detail });
      await ctx.mail.send({ to: ctx.cfg.ownerAlertEmail, ...m, tags: [{ name: 'kind', value: 'owner_alert' }] }).catch(() => {});
    }
    return true;
  } catch (_) {
    return false; // alerting must never break the user's request
  }
};

module.exports = { track, audit, raiseAlert };
