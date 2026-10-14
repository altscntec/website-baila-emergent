'use strict';
const { EVENT_STATUS, RANK } = require('../mail/webhook');
const { raiseAlert } = require('./events');
const { recordEmailStatusEvent } = require('./mailer');

// Provider webhook -> outbox status. Idempotent on the webhook delivery id.
// "accepted" (provider took it) is never reported as "delivered"; only a delivered event does that.
const handleResendEvent = async (ctx, svixId, event) => {
  const status = EVENT_STATUS[event && event.type];
  const messageId = event && event.data && event.data.email_id;
  if (!status || !messageId) return { handled: false };
  const row = (await ctx.db.query('SELECT * FROM quiz.email_outbox WHERE provider_message_id = $1', [messageId])).rows[0];
  const ins = await ctx.db.query(
    `INSERT INTO quiz.email_events (id, outbox_id, provider_message_id, type, occurred_at) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING RETURNING id`,
    [svixId, row ? row.id : null, messageId, event.type, event.created_at || null]);
  if (!ins.rowCount) return { handled: true, duplicate: true };
  if (!row) return { handled: true, matched: false };
  if ((RANK[status] || 0) > (RANK[row.status] || 0)) {
    await ctx.db.query(
      `UPDATE quiz.email_outbox SET status=$2, updated_at=now(), delivered_at = CASE WHEN $2='delivered' THEN now() ELSE delivered_at END WHERE id=$1`,
      [row.id, status]);
    if (row.kind === 'reward') await recordEmailStatusEvent(ctx, row, status);
    if (['bounced', 'complained', 'failed'].includes(status)) await raiseAlert(ctx, `email_${status}`, { kind: row.kind });
  }
  return { handled: true, matched: true, status };
};

module.exports = { handleResendEvent };
