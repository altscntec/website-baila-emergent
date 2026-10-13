'use strict';
// Aggregate, non-personal measurement for the owner dashboard and the read-only daily agent.
// Every figure is a count with its definition spelled out in docs/quiz/measurement.md.
const num = (v) => (v === null || v === undefined ? null : Number(v));

const metrics = async (db, { from, to }) => {
  const q = async (sql, params = []) => (await db.query(sql, params)).rows;
  const win = [from, to];

  const [freshness] = await q(`SELECT
      (SELECT max(at) FROM quiz.funnel_events) AS last_funnel_event,
      (SELECT max(received_at) FROM quiz.email_events) AS last_email_webhook,
      (SELECT max(imported_at) FROM quiz.redemptions) AS last_redemption_import,
      (SELECT max(day) FROM quiz.daily_counters) AS last_counter_day`);

  const counters = await q(
    `SELECT metric, dims->>'utm_source' AS source, dims->>'utm_medium' AS medium, dims->>'utm_campaign' AS campaign,
            dims->>'utm_content' AS content, dims->>'language' AS language, sum(count)::int AS n
       FROM quiz.daily_counters WHERE day >= $1::date AND day <= $2::date GROUP BY 1,2,3,4,5,6`, win);

  // Distinct anonymous people reaching each stage in the window.
  const stages = await q(
    `SELECT name, count(DISTINCT anon_id)::int AS people, count(*)::int AS events FROM quiz.funnel_events
      WHERE at >= $1 AND at < $2 GROUP BY name ORDER BY name`, win);

  const byDim = async (expr, label) => q(
    `SELECT ${expr} AS key, name, count(DISTINCT anon_id)::int AS people
       FROM quiz.funnel_events WHERE at >= $1 AND at < $2 AND name IN ('form_success','verification_completed','quiz_started','quiz_completed','reward_issued')
      GROUP BY 1,2`, win).then((rows) => ({ dimension: label, rows }));
  const segments = await Promise.all([
    byDim(`coalesce(nullif(attribution->>'utm_campaign',''),'(none)')`, 'utm_campaign'),
    byDim(`coalesce(nullif(attribution->>'utm_source',''),'(none)')`, 'utm_source'),
    byDim(`coalesce(nullif(attribution->>'utm_content',''),'(none)')`, 'utm_content'),
    byDim(`coalesce(language,'(none)')`, 'language'),
    byDim(`coalesce(theme,'(none)')`, 'theme'),
    byDim(`coalesce(tier::text,'(none)')`, 'tier'),
  ]);

  const questions = await q(
    `SELECT question_id, theme,
            count(DISTINCT anon_id) FILTER (WHERE name='question_viewed')::int AS viewed,
            count(DISTINCT anon_id) FILTER (WHERE name='answer_submitted')::int AS answered,
            round(avg((props->>'duration_ms')::numeric) FILTER (WHERE name='answer_submitted'))::int AS avg_duration_ms
       FROM quiz.funnel_events WHERE question_id IS NOT NULL AND at >= $1 AND at < $2 GROUP BY 1,2 ORDER BY theme, question_id`, win);
  const positions = await q(
    `SELECT (props->>'position')::int AS position, count(DISTINCT anon_id) FILTER (WHERE name='question_viewed')::int AS viewed,
            count(DISTINCT anon_id) FILTER (WHERE name='answer_submitted')::int AS answered
       FROM quiz.funnel_events WHERE question_id IS NOT NULL AND at >= $1 AND at < $2 GROUP BY 1 ORDER BY 1`, win);

  const [timing] = await q(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (completed_at - started_at))) AS median_quiz_seconds
       FROM quiz.attempts WHERE status='completed' AND completed_at >= $1 AND completed_at < $2`, win);

  const scores = await q(`SELECT score, tier, count(*)::int AS n FROM quiz.attempts WHERE status='completed' AND completed_at >= $1 AND completed_at < $2 GROUP BY 1,2 ORDER BY 1`, win);

  const emails = await q(
    `SELECT kind, status, count(*)::int AS n FROM quiz.email_outbox WHERE created_at >= $1 AND created_at < $2 GROUP BY 1,2 ORDER BY 1,2`, win);
  const [pendingInv] = await q(`SELECT count(*)::int AS n FROM quiz.rewards WHERE status='pending_inventory'`);

  const inventory = await q(`SELECT tier, status, count(*)::int AS n FROM quiz.discount_codes GROUP BY 1,2 ORDER BY 1,2`);

  const redemptions = await q(
    `SELECT dc.tier, r.status, count(*)::int AS orders, count(DISTINCT r.code_id)::int AS codes,
            sum(r.gross_cents)::bigint AS gross_cents, sum(r.net_cents)::bigint AS net_cents, max(r.currency) AS currency
       FROM quiz.redemptions r JOIN quiz.discount_codes dc ON dc.id = r.code_id
      WHERE coalesce(r.ordered_at, r.imported_at) >= $1 AND coalesce(r.ordered_at, r.imported_at) < $2 GROUP BY 1,2 ORDER BY 1,2`, win);
  const redemptionsToDate = await q(
    `SELECT r.status, count(*)::int AS orders, count(DISTINCT r.code_id)::int AS codes, sum(r.gross_cents)::bigint AS gross_cents, sum(r.net_cents)::bigint AS net_cents, max(r.currency) AS currency
       FROM quiz.redemptions r GROUP BY 1 ORDER BY 1`);
  const redByDim = await q(
    `SELECT coalesce(nullif(p.attribution->>'utm_campaign',''),'(none)') AS campaign, p.language, a.theme, dc.tier,
            count(DISTINCT r.code_id) FILTER (WHERE r.status='paid')::int AS purchasers, sum(r.net_cents) FILTER (WHERE r.status='paid')::bigint AS net_cents
       FROM quiz.redemptions r JOIN quiz.discount_codes dc ON dc.id=r.code_id JOIN quiz.participants p ON p.id=dc.participant_id
       LEFT JOIN quiz.attempts a ON a.participant_id=p.id
      WHERE coalesce(r.ordered_at, r.imported_at) >= $1 AND coalesce(r.ordered_at, r.imported_at) < $2 GROUP BY 1,2,3,4`, win);
  const [lag] = await q(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (first_order - p.verified_at))/3600) AS median_hours_verified_to_order
       FROM (SELECT code_id, min(ordered_at) AS first_order FROM quiz.redemptions WHERE status='paid' AND ordered_at IS NOT NULL GROUP BY 1) f
       JOIN quiz.discount_codes dc ON dc.id=f.code_id JOIN quiz.participants p ON p.id=dc.participant_id`);

  const [leads] = await q(
    `SELECT count(*)::int AS participants_created,
            count(*) FILTER (WHERE verified_at IS NOT NULL)::int AS verified,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM quiz.marketing_consents mc WHERE mc.participant_id=p.id AND mc.opted_in
               AND mc.id = (SELECT max(id) FROM quiz.marketing_consents WHERE participant_id=p.id)))::int AS opted_in_now,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM quiz.redemptions r JOIN quiz.discount_codes dc ON dc.id=r.code_id WHERE dc.participant_id=p.id AND r.status='paid'))::int AS purchasers,
            count(*) FILTER (WHERE EXISTS (SELECT 1 FROM quiz.redemptions r JOIN quiz.discount_codes dc ON dc.id=r.code_id WHERE dc.participant_id=p.id AND r.status='paid')
               AND EXISTS (SELECT 1 FROM quiz.marketing_consents mc WHERE mc.participant_id=p.id AND mc.opted_in
               AND mc.id = (SELECT max(id) FROM quiz.marketing_consents WHERE participant_id=p.id)))::int AS opted_in_purchasers
       FROM quiz.participants p WHERE p.created_at >= $1 AND p.created_at < $2`, win);

  const [dupes] = await q(
    `SELECT count(*)::int AS groups, coalesce(sum(n),0)::int AS participants FROM (
        SELECT count(*) AS n FROM quiz.participants WHERE created_at >= $1 AND created_at < $2
         GROUP BY lower(full_name), lower(city), country, age HAVING count(*) > 1) g`, win);

  const alerts = await q(`SELECT kind, count(*)::int AS open FROM quiz.owner_alerts WHERE resolved_at IS NULL GROUP BY 1`);

  return {
    generatedAt: new Date().toISOString(), timezone: 'Europe/Amsterdam', window: { from, to },
    freshness: { lastFunnelEvent: freshness.last_funnel_event, lastEmailWebhook: freshness.last_email_webhook, lastRedemptionImport: freshness.last_redemption_import, lastCounterDay: freshness.last_counter_day },
    landing: counters,
    stages, segments, questions, positions,
    timing: { medianQuizSeconds: num(timing && timing.median_quiz_seconds), medianHoursVerifiedToOrder: num(lag && lag.median_hours_verified_to_order) },
    scores, emails, rewardsPendingInventory: pendingInv.n, inventory, redemptions, redemptionsToDate, redemptionsBySegment: redByDim,
    leads, suspiciousRepeats: { sameNameCityCountryAgeGroups: dupes.groups, participantsInGroups: dupes.participants, note: 'heuristic only; different emails can belong to one person' },
    openAlerts: alerts,
  };
};

module.exports = { metrics };
