'use strict';
const { sha256, hmac } = require('../lib/crypto');
const { HttpError } = require('../lib/http');
const { getSettings, saveSettings, validateSettingsPatch, campaignState } = require('../lib/settings');
const { parseCsv, toCsv, toCents } = require('../lib/csv');
const { THEMES, TIERS } = require('../lib/tiers');
const { audit } = require('./events');
const mailer = require('./mailer');
const rewards = require('./rewards');
const { WORDING_VERSION } = require('./auth');

const unsubscribeToken = (ctx, participantId) => `${participantId}.${hmac(ctx.cfg.appSecret, `unsub:${participantId}`).slice(0, 32)}`;
const emailHash = (ctx, emailNorm) => hmac(ctx.cfg.appSecret, `supp:${emailNorm}`);

const overview = async (ctx, settingsOverride) => {
  const settings = settingsOverride || await getSettings(ctx.db);
  const q = async (s, p) => (await ctx.db.query(s, p)).rows;
  const inventory = await q(`SELECT tier, status, count(*)::int AS n FROM quiz.discount_codes GROUP BY 1,2 ORDER BY 1,2`);
  const emails = await q(`SELECT kind, status, count(*)::int AS n FROM quiz.email_outbox GROUP BY 1,2 ORDER BY 1,2`);
  const [counts] = await q(`SELECT (SELECT count(*) FROM quiz.participants)::int AS participants,
      (SELECT count(*) FROM quiz.participants WHERE verified_at IS NOT NULL)::int AS verified,
      (SELECT count(*) FROM quiz.attempts WHERE status='completed')::int AS completed,
      (SELECT count(*) FROM quiz.rewards WHERE status='pending_inventory')::int AS pending_inventory`);
  const bank = await q(`SELECT theme, count(*)::int AS active FROM quiz.questions WHERE active GROUP BY 1 ORDER BY 1`);
  const alerts = await q(`SELECT id, at, kind, detail FROM quiz.owner_alerts WHERE resolved_at IS NULL ORDER BY at DESC LIMIT 50`);
  const readiness = launchReadiness(ctx, settings, { inventory, bank });
  return { settings, state: campaignState(settings, ctx.now()), counts, inventory, emails, questionBank: bank, alerts, mail: { provider: ctx.mail.name || 'none', configured: Boolean(ctx.mail.configured) }, readiness };
};

// Everything that must be true before the offer is published. Surfaced in the admin UI.
const launchReadiness = (ctx, s, { inventory, bank }) => {
  const have = (tier) => (inventory.find((x) => x.tier === tier && x.status === 'available') || { n: 0 }).n;
  const checks = [
    ['email_provider_configured', Boolean(ctx.mail.configured), 'RESEND_API_KEY and MAIL_FROM set and the sending domain verified'],
    ['webhook_secret_configured', Boolean(ctx.cfg.resendWebhookSecret), 'RESEND_WEBHOOK_SECRET set (needed to show delivered/bounced)'],
    ['owner_alert_email_configured', Boolean(ctx.cfg.ownerAlertEmail), 'OWNER_ALERT_EMAIL set'],
    ['offer_confirmed', Boolean(s.offer_confirmed), 'You confirmed the Weeztix coupon settings and a real test redemption'],
    ['dates_set', Boolean(s.opens_at && s.closes_at && s.code_expires_at), 'opens_at, closes_at and code_expires_at set'],
    ['retention_set', Boolean(s.retention_days), 'retention_days chosen'],
    ...TIERS.map((t) => [`inventory_tier_${t}`, have(t) >= 1, `at least one available ${t}% code (recommended: expected participants x share of tier)`]),
    ...THEMES.map((th) => [`bank_${th}`, ((bank.find((b) => b.theme === th) || { active: 0 }).active) >= 10, `at least 10 active questions in theme ${th}`]),
  ];
  return { ready: checks.every((c) => c[1]), checks: checks.map(([key, ok, detail]) => ({ key, ok, detail })) };
};

const updateSettings = async (ctx, patch, actor) => {
  const current = await getSettings(ctx.db);
  const v = validateSettingsPatch(patch, current);
  if (!v.ok) throw new HttpError(400, 'invalid_settings', { errors: v.errors });
  if (v.next.enabled && !current.enabled) {
    const ov = await overview(ctx, v.next);
    const blocking = ov.readiness.checks.filter((c) => !c.ok && c.key !== 'webhook_secret_configured' && c.key !== 'owner_alert_email_configured');
    if (blocking.length) throw new HttpError(409, 'launch_blocked', { blocking: blocking.map((b) => b.key) });
  }
  await saveSettings(ctx.db, v.next);
  await audit(ctx.db, actor, 'settings.update', { keys: Object.keys(patch) });
  return v.next;
};

const CODE_RE = /^[A-Za-z0-9_-]{4,64}$/;
const importCodes = async (ctx, { tier, batch, codes }, actor) => {
  if (!TIERS.includes(tier)) throw new HttpError(400, 'invalid_tier');
  if (!Array.isArray(codes) || codes.length === 0 || codes.length > 5000) throw new HttpError(400, 'invalid_codes');
  const clean = [...new Set(codes.map((c) => String(c).trim()).filter(Boolean))];
  const bad = clean.filter((c) => !CODE_RE.test(c));
  if (bad.length) throw new HttpError(400, 'invalid_code_format', { count: bad.length });
  const label = String(batch || 'default').slice(0, 60);
  let inserted = 0;
  await ctx.db.tx(async (t) => {
    for (const c of clean) {
      const r = await t.query(`INSERT INTO quiz.discount_codes (tier, code, batch) VALUES ($1,$2,$3) ON CONFLICT (code) DO NOTHING`, [tier, c, label]);
      inserted += r.rowCount;
    }
  });
  await audit(ctx.db, actor, 'codes.import', { tier, batch: label, submitted: clean.length, inserted });
  const fulfilled = await rewards.fulfilPending(ctx);
  return { submitted: clean.length, inserted, duplicates: clean.length - inserted, pendingRewardsFulfilled: fulfilled };
};

const OPTION_ID = /^[a-z0-9]{1,6}$/;
const validateQuestion = (q) => {
  const errs = [];
  const langs = ['en', 'es', 'nl'];
  const tri = (o, name) => { if (!o || langs.some((l) => typeof o[l] !== 'string' || !o[l].trim())) errs.push(`${name} needs en/es/nl text`); };
  if (!q || !/^[A-Z]{3}-\d{3}$/.test(q.id || '')) errs.push('id must look like MOV-001');
  if (!THEMES.includes(q && q.theme)) errs.push('theme invalid');
  tri(q && q.prompt, 'prompt'); tri(q && q.explanation, 'explanation');
  const opts = (q && q.options) || [];
  if (!Array.isArray(opts) || opts.length < 3 || opts.length > 5) errs.push('3-5 options required');
  else {
    const ids = opts.map((o) => o.id);
    if (new Set(ids).size !== ids.length || ids.some((i) => !OPTION_ID.test(i || ''))) errs.push('option ids must be unique short [a-z0-9]');
    if (!ids.includes(q.correct)) errs.push('correct must be one of the option ids');
    opts.forEach((o, i) => tri(o.text, `option ${i}`));
    for (const l of langs) { const texts = opts.map((o) => String((o.text || {})[l] || '').trim().toLowerCase()); if (new Set(texts).size !== texts.length) errs.push(`duplicate option text in ${l}`); }
  }
  return errs;
};

const importQuestions = async (ctx, questions, actor) => {
  if (!Array.isArray(questions) || !questions.length || questions.length > 500) throw new HttpError(400, 'invalid_questions');
  const problems = {};
  questions.forEach((q) => { const e = validateQuestion(q); if (e.length) problems[(q && q.id) || '(no id)'] = e; });
  if (Object.keys(problems).length) throw new HttpError(400, 'invalid_questions', { problems });
  const out = { created: 0, updated: 0, unchanged: 0 };
  await ctx.db.tx(async (t) => {
    for (const q of questions) {
      const content = { prompt: q.prompt, options: q.options.map((o) => ({ id: o.id, text: o.text })), explanation: q.explanation };
      const hash = sha256(JSON.stringify({ content, correct: q.correct, shuffle: q.shuffle_options !== false }));
      const ex = (await t.query('SELECT version, content_hash FROM quiz.questions WHERE id=$1 FOR UPDATE', [q.id])).rows[0];
      if (!ex) {
        await t.query(`INSERT INTO quiz.questions (id, theme, correct_option_id, content, shuffle_options, source_notes, content_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [q.id, q.theme, q.correct, JSON.stringify(content), q.shuffle_options !== false, q.source_notes || null, hash]); out.created++;
      } else if (ex.content_hash !== hash) {
        await t.query(`UPDATE quiz.questions SET theme=$2, correct_option_id=$3, content=$4, shuffle_options=$5, source_notes=$6, content_hash=$7, version=version+1, updated_at=now() WHERE id=$1`,
          [q.id, q.theme, q.correct, JSON.stringify(content), q.shuffle_options !== false, q.source_notes || null, hash]); out.updated++;
      } else out.unchanged++;
    }
  });
  await audit(ctx.db, actor, 'questions.import', out);
  return out;
};

const setQuestionActive = async (ctx, id, active, actor) => {
  const r = await ctx.db.query('UPDATE quiz.questions SET active=$2, updated_at=now() WHERE id=$1', [id, !!active]);
  if (!r.rowCount) throw new HttpError(404, 'not_found');
  await audit(ctx.db, actor, 'questions.active', { id, active: !!active });
  return { id, active: !!active };
};

const listQuestions = async (ctx) => (await ctx.db.query(
  `SELECT id, theme, version, active, shuffle_options, content, source_notes, updated_at FROM quiz.questions ORDER BY theme, id`)).rows;

const listEmails = async (ctx, status) => (await ctx.db.query(
  `SELECT o.id, o.kind, o.language, o.status, o.attempts, o.last_error, o.created_at, o.updated_at, o.accepted_at, o.delivered_at
     FROM quiz.email_outbox o WHERE ($1::text IS NULL OR o.status = $1) ORDER BY o.created_at DESC LIMIT 200`, [status || null])).rows;

const retryEmail = async (ctx, id, actor) => {
  const r = (await ctx.db.query('SELECT * FROM quiz.email_outbox WHERE id=$1', [id])).rows[0];
  if (!r) throw new HttpError(404, 'not_found');
  if (r.kind !== 'reward') throw new HttpError(400, 'only_reward_emails_can_be_retried');
  if (!['failed', 'queued'].includes(r.status)) throw new HttpError(409, 'not_retryable');
  await ctx.db.query(`UPDATE quiz.email_outbox SET status='queued', next_attempt_at=now(), attempts=LEAST(attempts,3) WHERE id=$1`, [id]);
  const status = await mailer.deliverReward(ctx, id);
  await audit(ctx.db, actor, 'email.retry', { id, status });
  return { id, status };
};

// Only people whose CURRENT consent is opt-in and who are not suppressed. Minimal fields.
const exportLeads = async (ctx, actor) => {
  const rows = (await ctx.db.query(
    `SELECT p.id, p.email, p.email_norm, p.full_name, p.language, p.country, p.city, mc.recorded_at AS consent_at, mc.wording_version
       FROM quiz.participants p
       JOIN LATERAL (SELECT * FROM quiz.marketing_consents WHERE participant_id = p.id ORDER BY id DESC LIMIT 1) mc ON true
      WHERE mc.opted_in AND p.verified_at IS NOT NULL ORDER BY p.created_at`)).rows;
  const supp = new Set((await ctx.db.query('SELECT email_hash FROM quiz.suppressions')).rows.map((r) => r.email_hash));
  const out = rows.filter((r) => !supp.has(emailHash(ctx, r.email_norm))).map((r) => ({
    full_name: r.full_name, email: r.email, language: r.language, country: r.country, city: r.city,
    consent_at: new Date(r.consent_at).toISOString(), consent_wording_version: r.wording_version,
    unsubscribe_url: `${ctx.cfg.siteOrigin}/halloween/quiz/unsubscribe#t=${unsubscribeToken(ctx, r.id)}`,
  }));
  await audit(ctx.db, actor, 'leads.export', { rows: out.length });
  return toCsv(['full_name', 'email', 'language', 'country', 'city', 'consent_at', 'consent_wording_version', 'unsubscribe_url'], out);
};

const unsubscribe = async (ctx, token) => {
  const [pid, sig] = String(token || '').split('.');
  if (!/^[0-9a-f-]{36}$/.test(pid || '') || !sig || sig !== hmac(ctx.cfg.appSecret, `unsub:${pid}`).slice(0, 32)) throw new HttpError(400, 'invalid_token');
  await ctx.db.tx(async (t) => {
    const p = (await t.query('SELECT id, email_norm, language FROM quiz.participants WHERE id=$1 FOR UPDATE', [pid])).rows[0];
    if (!p) return;
    await t.query(`INSERT INTO quiz.marketing_consents (participant_id, opted_in, wording_version, wording_text, language, source) VALUES ($1,false,$2,'unsubscribe',$3,'unsubscribe')`, [pid, WORDING_VERSION, p.language]);
    await t.query(`INSERT INTO quiz.suppressions (email_hash, reason) VALUES ($1,'unsubscribe') ON CONFLICT DO NOTHING`, [emailHash(ctx, p.email_norm)]);
  });
  return { status: 'unsubscribed' };
};

const deleteParticipant = async (ctx, emailNorm, actor) => {
  const r = await ctx.db.query('DELETE FROM quiz.participants WHERE email_norm=$1', [emailNorm]);
  await audit(ctx.db, actor, 'participant.delete', { deleted: r.rowCount });
  return { deleted: r.rowCount };
};

// Deletes everyone who is not currently opted in, once the retention period after close has passed.
const runRetention = async (ctx, actor, { dryRun = true } = {}) => {
  const s = await getSettings(ctx.db);
  if (!s.retention_days || !s.closes_at) throw new HttpError(409, 'retention_not_configured');
  const cutoff = new Date(Date.parse(s.closes_at) + s.retention_days * 86_400_000);
  if (ctx.now() < cutoff) return { dryRun, eligible: 0, deleted: 0, cutoff: cutoff.toISOString(), note: 'retention period has not elapsed' };
  const where = `NOT EXISTS (SELECT 1 FROM quiz.marketing_consents mc WHERE mc.participant_id = quiz.participants.id AND mc.opted_in
                 AND mc.id = (SELECT max(id) FROM quiz.marketing_consents WHERE participant_id = quiz.participants.id))`;
  const eligible = (await ctx.db.query(`SELECT count(*)::int AS n FROM quiz.participants WHERE ${where}`)).rows[0].n;
  let deleted = 0;
  if (!dryRun) deleted = (await ctx.db.query(`DELETE FROM quiz.participants WHERE ${where}`)).rowCount;
  await audit(ctx.db, actor, 'retention.run', { dryRun, eligible, deleted });
  return { dryRun, eligible, deleted, cutoff: cutoff.toISOString() };
};

// Orders exported from the ticketing platform. Column names are configurable because the real export
// format has not been confirmed. Rows whose code is not ours are reported, never invented.
const importRedemptions = async (ctx, { csv, mapping = {} }, actor) => {
  const m = { code: 'code', order_ref: 'order_id', ordered_at: 'ordered_at', gross: 'gross', net: 'net', status: 'status', currency: 'currency', ...mapping };
  const rows = parseCsv(csv);
  if (!rows.length) throw new HttpError(400, 'empty_csv');
  if (!(m.code in rows[0]) || !(m.order_ref in rows[0])) throw new HttpError(400, 'missing_columns', { need: [m.code, m.order_ref], have: Object.keys(rows[0]) });
  const out = { rows: rows.length, matched: 0, unmatched: 0, inserted: 0, updated: 0 };
  for (const r of rows) {
    const code = (r[m.code] || '').trim();
    const ref = (r[m.order_ref] || '').trim();
    if (!code || !ref) { out.unmatched++; continue; }
    const c = (await ctx.db.query('SELECT id FROM quiz.discount_codes WHERE code = $1', [code])).rows[0];
    if (!c) { out.unmatched++; continue; }
    out.matched++;
    const st = String(r[m.status] || '').toLowerCase();
    const status = /refund|terugbetaald|reembols/.test(st) ? 'refunded' : /cancel|geannuleerd|cancelad/.test(st) ? 'cancelled' : 'paid';
    const at = r[m.ordered_at] && !Number.isNaN(Date.parse(r[m.ordered_at])) ? new Date(r[m.ordered_at]) : null;
    const res = await ctx.db.query(
      `INSERT INTO quiz.redemptions (code_id, order_ref, ordered_at, gross_cents, net_cents, currency, status) VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (order_ref) DO UPDATE SET status = EXCLUDED.status, net_cents = EXCLUDED.net_cents, gross_cents = EXCLUDED.gross_cents, imported_at = now()
       RETURNING (xmax = 0) AS inserted`,
      [c.id, ref, at, toCents(r[m.gross]), toCents(r[m.net]), (r[m.currency] || 'EUR').slice(0, 3).toUpperCase(), status]);
    if (res.rows[0].inserted) out.inserted++; else out.updated++;
  }
  await audit(ctx.db, actor, 'redemptions.import', out);
  return out;
};

const resolveAlert = async (ctx, id, actor) => {
  await ctx.db.query('UPDATE quiz.owner_alerts SET resolved_at=now() WHERE id=$1', [id]);
  await audit(ctx.db, actor, 'alert.resolve', { id });
  return { id };
};

module.exports = { overview, launchReadiness, updateSettings, importCodes, importQuestions, setQuestionActive, listQuestions, listEmails, retryEmail, exportLeads, unsubscribe, unsubscribeToken, deleteParticipant, runRetention, importRedemptions, resolveAlert, validateQuestion };
