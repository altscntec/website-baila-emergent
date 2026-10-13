import { useCallback, useState } from 'react';
import './quiz.css';

// Owner console for the quiz campaign (English, internal). It contains no secrets: every call is authenticated
// with the ADMIN_API_KEY you paste in, which is held in memory only (gone on reload, never stored or logged).
const TZ = 'Europe/Amsterdam';
export const toLocalInput = (iso) => {
  if (!iso) return '';
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
// Interpret a datetime-local value as Amsterdam wall-clock time and return an ISO string with the right offset.
const offsetAt = (ms) => {
  const [d, t] = toLocalInput(new Date(ms).toISOString()).split('T'); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number);
  return (Date.UTC(y, mo - 1, da, h, mi) - Math.floor(ms / 60000) * 60000) / 60000;
};
export const fromLocalInput = (v) => {
  if (!v) return null;
  const [d, t] = v.split('T'); const [y, mo, da] = d.split('-').map(Number); const [h, mi] = t.split(':').map(Number);
  const wall = Date.UTC(y, mo - 1, da, h, mi);
  let off = offsetAt(wall); off = offsetAt(wall - off * 60000);
  const sign = off >= 0 ? '+' : '-'; const a = Math.abs(off);
  return `${v}:00${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
};

const Box = ({ title, children }) => <section className="bdq-card space-y-3"><h2 className="text-xl">{title}</h2>{children}</section>;
const Pre = ({ v }) => <pre className="text-xs overflow-auto max-h-80 bg-black/40 p-3 rounded-lg">{typeof v === 'string' ? v : JSON.stringify(v, null, 2)}</pre>;
const Row = ({ label, children }) => <label className="block"><span className="bdq-label">{label}</span>{children}</label>;

export const QuizAdminPage = () => {
  const [key, setKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [ov, setOv] = useState(null);
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);
  const [s, setS] = useState(null);
  const [codes, setCodes] = useState({ tier: 5, batch: 'weeztix-1', text: '' });
  const [csv, setCsv] = useState({ text: '', code: 'code', order_ref: 'order_id', ordered_at: 'ordered_at', gross: 'gross', net: 'net', status: 'status' });
  const [range, setRange] = useState({ from: '', to: '' });
  const [emailStatus, setEmailStatus] = useState('failed');
  const [emails, setEmails] = useState(null);
  const [eraseEmail, setEraseEmail] = useState('');

  const api = useCallback(async (method, path, body, raw) => {
    setBusy(true);
    try {
      const res = await fetch(path, { method, headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
      if (raw) return res;
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw Object.assign(new Error(j.error || res.status), { data: j });
      return j;
    } finally { setBusy(false); }
  }, [key]);
  const quietLoad = async () => { try { setOut(null); await loadOverview(); } catch (e) { setOut({ error: e.message, ...(e.data || {}) }); } };
  const run = async (fn) => { try { setOut(null); const r = await fn(); setOut(r); return r; } catch (e) { setOut({ error: e.message, ...(e.data || {}) }); return null; } };
  const loadOverview = async () => { const o = await api('GET', '/api/admin/overview'); setOv(o); setS({ ...o.settings }); setAuthed(true); return o; };

  if (!authed) {
    return (
      <div className="bdq"><div className="max-w-md mx-auto px-4 pt-20 space-y-4">
        <h1 className="text-4xl">Quiz admin</h1>
        <Row label="Admin key"><input type="password" className="bdq-input" value={key} autoComplete="off" onChange={(e) => setKey(e.target.value)} /></Row>
        <button type="button" className="bdq-btn" disabled={!key || busy} onClick={quietLoad}>Sign in</button>
        {out && <Pre v={out} />}
      </div></div>
    );
  }

  const set = (k) => (e) => setS((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const note = (k, l) => (e) => setS((p) => ({ ...p, [k]: { ...p[k], [l]: e.target.value } }));
  const save = () => run(async () => {
    const patch = {
      enabled: !!s.enabled, offer_confirmed: !!s.offer_confirmed, opens_at: s.opens_at, closes_at: s.closes_at, code_expires_at: s.code_expires_at,
      checkout_url: s.checkout_url, coupon_param: s.coupon_param, eligible_ticket_types: Array.isArray(s.eligible_ticket_types) ? s.eligible_ticket_types : String(s.eligible_ticket_types || '').split(',').map((x) => x.trim()).filter(Boolean),
      excluded_note: s.excluded_note, stacking_note: s.stacking_note, redemption_note: s.redemption_note, low_inventory_threshold: Number(s.low_inventory_threshold),
      retention_days: s.retention_days === '' || s.retention_days === null ? null : Number(s.retention_days), show_review_after_completion: !!s.show_review_after_completion, alert_email_enabled: !!s.alert_email_enabled,
    };
    const r = await api('PUT', '/api/admin/settings', patch); await loadOverview(); return { saved: true, settings: r };
  });
  const dt = (k) => <input type="datetime-local" className="bdq-input" value={toLocalInput(s[k])} onChange={(e) => setS((p) => ({ ...p, [k]: fromLocalInput(e.target.value) }))} />;

  return (
    <div className="bdq"><div className="max-w-3xl mx-auto px-4 py-10 space-y-6" data-testid="quiz-admin">
      <h1 className="text-4xl">Quiz admin</h1>
      {busy && <p role="status">Working…</p>}
      {out && <Box title="Last result"><Pre v={out} /></Box>}

      <Box title={`Overview · campaign ${ov.state}`}>
        <p>Participants {ov.counts.participants} · verified {ov.counts.verified} · completed {ov.counts.completed} · rewards waiting for codes {ov.counts.pending_inventory}</p>
        <p>Email provider: {ov.mail.provider} ({ov.mail.configured ? 'configured' : 'NOT configured'})</p>
        <h3 className="font-bold mt-2">Launch readiness: {ov.readiness.ready ? 'READY' : 'NOT READY'}</h3>
        <ul className="text-sm space-y-1">{ov.readiness.checks.map((c) => <li key={c.key}>{c.ok ? '[ok]' : '[missing]'} {c.key}: {c.detail}</li>)}</ul>
        <h3 className="font-bold mt-2">Code inventory</h3><Pre v={ov.inventory} />
        <h3 className="font-bold mt-2">Email outbox</h3><Pre v={ov.emails} />
        <h3 className="font-bold mt-2">Open alerts</h3>
        {ov.alerts.length === 0 ? <p className="text-sm">None</p> : ov.alerts.map((a) => (
          <div key={a.id} className="flex justify-between gap-3 text-sm"><span>{a.kind} · {new Date(a.at).toLocaleString()}</span>
            <button type="button" className="bdq-chip" onClick={() => run(async () => { await api('POST', '/api/admin/alerts/resolve', { id: a.id }); await loadOverview(); return { resolved: a.id }; })}>Resolve</button></div>))}
        <button type="button" className="bdq-chip" onClick={quietLoad}>Refresh</button>
      </Box>

      <Box title="Offer and campaign settings">
        <p className="text-sm text-[var(--bdq-dim)]">The campaign cannot be switched on until every readiness item above is met. Dates are Europe/Amsterdam.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Opens"><>{dt('opens_at')}</></Row><Row label="Closes"><>{dt('closes_at')}</></Row>
          <Row label="Codes expire (must match the Weeztix coupon validity)"><>{dt('code_expires_at')}</></Row>
          <Row label="Retention (days after close)"><input className="bdq-input" inputMode="numeric" value={s.retention_days ?? ''} onChange={set('retention_days')} /></Row>
          <Row label="Checkout URL"><input className="bdq-input" value={s.checkout_url} onChange={set('checkout_url')} /></Row>
          <Row label="Coupon URL parameter"><input className="bdq-input" value={s.coupon_param} onChange={set('coupon_param')} /></Row>
          <Row label="Eligible ticket types (comma separated, shown in the email)"><input className="bdq-input" value={Array.isArray(s.eligible_ticket_types) ? s.eligible_ticket_types.join(', ') : s.eligible_ticket_types} onChange={set('eligible_ticket_types')} /></Row>
          <Row label="Low-inventory alert at"><input className="bdq-input" inputMode="numeric" value={s.low_inventory_threshold} onChange={set('low_inventory_threshold')} /></Row>
        </div>
        {['excluded_note', 'stacking_note', 'redemption_note'].map((k) => (
          <div key={k} className="space-y-2"><span className="bdq-label">{k.replace('_', ' ')} (EN / ES / NL)</span>
            {['en', 'es', 'nl'].map((l) => <input key={l} aria-label={`${k} ${l}`} className="bdq-input" value={s[k][l]} onChange={note(k, l)} />)}</div>))}
        <label className="flex gap-3 items-center"><input type="checkbox" checked={!!s.offer_confirmed} onChange={set('offer_confirmed')} className="w-5 h-5" /> I confirmed the Weeztix coupon settings and completed a real test redemption</label>
        <label className="flex gap-3 items-center"><input type="checkbox" checked={!!s.show_review_after_completion} onChange={set('show_review_after_completion')} className="w-5 h-5" /> Show correct answers and explanations after completion (leaks the key; off by default)</label>
        <label className="flex gap-3 items-center"><input type="checkbox" checked={!!s.alert_email_enabled} onChange={set('alert_email_enabled')} className="w-5 h-5" /> Email owner alerts</label>
        <label className="flex gap-3 items-center font-bold"><input type="checkbox" checked={!!s.enabled} onChange={set('enabled')} className="w-5 h-5" /> Campaign enabled (public)</label>
        <button type="button" className="bdq-btn" onClick={save}>Save settings</button>
      </Box>

      <Box title="Import discount codes (one tier at a time)">
        <p className="text-sm text-[var(--bdq-dim)]">Paste the codes you generated in Weeztix for this tier (Dashboard, Coupons). Codes are stored server-side and only ever sent by email.</p>
        <div className="grid grid-cols-2 gap-3">
          <Row label="Tier"><select className="bdq-input" value={codes.tier} onChange={(e) => setCodes({ ...codes, tier: Number(e.target.value) })}>{[5, 10, 15].map((t) => <option key={t} value={t}>{t}%</option>)}</select></Row>
          <Row label="Batch label"><input className="bdq-input" value={codes.batch} onChange={(e) => setCodes({ ...codes, batch: e.target.value })} /></Row>
        </div>
        <textarea className="bdq-input" style={{ minHeight: 120, padding: 10 }} aria-label="Codes" value={codes.text} onChange={(e) => setCodes({ ...codes, text: e.target.value })} />
        <button type="button" className="bdq-btn" onClick={() => run(async () => { const r = await api('POST', '/api/admin/codes/import', { tier: codes.tier, batch: codes.batch, codes: codes.text.split(/[\s,;]+/).filter(Boolean) }); setCodes({ ...codes, text: '' }); await loadOverview(); return r; })}>Import codes</button>
      </Box>

      <Box title="Question bank">
        <input type="file" accept="application/json" aria-label="Question bank JSON" onChange={(e) => { const f = e.target.files[0]; if (f) f.text().then((txt) => run(async () => { const r = await api('POST', '/api/admin/questions/import', { questions: JSON.parse(txt) }); await loadOverview(); return r; })); }} />
        <Pre v={ov.questionBank} />
        <button type="button" className="bdq-chip" onClick={() => run(async () => { const r = await api('GET', '/api/admin/questions'); return r.questions.map((q) => ({ id: q.id, theme: q.theme, v: q.version, active: q.active })); })}>List questions</button>
      </Box>

      <Box title="Email problems">
        <div className="flex gap-2 items-center"><select className="bdq-input" value={emailStatus} onChange={(e) => setEmailStatus(e.target.value)}>{['failed', 'queued', 'bounced', 'complained', 'delayed', 'accepted', 'delivered'].map((x) => <option key={x}>{x}</option>)}</select>
          <button type="button" className="bdq-chip" onClick={() => run(async () => { const r = await api('GET', `/api/admin/emails?status=${emailStatus}`); setEmails(r.emails); return { count: r.emails.length }; })}>Load</button></div>
        {emails && emails.map((m) => <div key={m.id} className="flex justify-between gap-3 text-sm"><span>{m.kind} · {m.status} · attempts {m.attempts} · {m.last_error || ''}</span>
          {m.kind === 'reward' && ['failed', 'queued'].includes(m.status) && <button type="button" className="bdq-chip" onClick={() => run(() => api('POST', '/api/admin/emails/retry', { id: m.id }))}>Retry</button>}</div>)}
      </Box>

      <Box title="Import ticket orders that used a code (purchase data)">
        <p className="text-sm text-[var(--bdq-dim)]">Export the order list from Weeztix and paste it here. Column names are configurable because the real export format is unconfirmed. Without this import, purchases and revenue are reported as unavailable.</p>
        <div className="grid grid-cols-2 gap-3">{['code', 'order_ref', 'ordered_at', 'gross', 'net', 'status'].map((k) => <Row key={k} label={`Column: ${k}`}><input className="bdq-input" value={csv[k]} onChange={(e) => setCsv({ ...csv, [k]: e.target.value })} /></Row>)}</div>
        <textarea className="bdq-input" style={{ minHeight: 120, padding: 10 }} aria-label="Orders CSV" value={csv.text} onChange={(e) => setCsv({ ...csv, text: e.target.value })} />
        <button type="button" className="bdq-btn" onClick={() => run(() => api('POST', '/api/admin/redemptions/import', { csv: csv.text, mapping: { code: csv.code, order_ref: csv.order_ref, ordered_at: csv.ordered_at, gross: csv.gross, net: csv.net, status: csv.status } }))}>Import orders</button>
      </Box>

      <Box title="Metrics (aggregate, no personal data)">
        <div className="grid grid-cols-2 gap-3"><Row label="From (ISO)"><input className="bdq-input" value={range.from} onChange={(e) => setRange({ ...range, from: e.target.value })} placeholder="2026-10-20T00:00:00+02:00" /></Row><Row label="To (ISO)"><input className="bdq-input" value={range.to} onChange={(e) => setRange({ ...range, to: e.target.value })} /></Row></div>
        <button type="button" className="bdq-chip" onClick={() => run(() => api('GET', `/api/admin/metrics?${new URLSearchParams(Object.fromEntries(Object.entries(range).filter(([, v]) => v)))}`))}>Load metrics</button>
      </Box>

      <Box title="Consent-filtered lead export">
        <p className="text-sm text-[var(--bdq-dim)]">Only people who ticked the optional promotional box and have not unsubscribed. Name, email, language, country, city, consent proof and an unsubscribe link.</p>
        <button type="button" className="bdq-chip" onClick={async () => { const res = await api('GET', '/api/admin/leads.csv', null, true); if (res.ok) { const b = await res.blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'optin-leads.csv'; a.click(); } else setOut({ error: res.status }); }}>Download CSV</button>
      </Box>

      <Box title="Retention and erasure">
        <button type="button" className="bdq-chip" onClick={() => run(() => api('POST', '/api/admin/retention/run', { dryRun: true }))}>Dry run retention</button>{' '}
        <button type="button" className="bdq-chip" onClick={() => { if (window.confirm('Permanently delete all non-opted-in participants past the retention date?')) run(() => api('POST', '/api/admin/retention/run', { dryRun: false })); }}>Run retention (deletes)</button>
        <div className="flex gap-2 items-end"><Row label="Erase one person by email"><input className="bdq-input" value={eraseEmail} onChange={(e) => setEraseEmail(e.target.value)} /></Row>
          <button type="button" className="bdq-chip" onClick={() => { if (eraseEmail && window.confirm(`Permanently delete ${eraseEmail}?`)) run(() => api('POST', '/api/admin/participants/delete', { email: eraseEmail })); }}>Erase</button></div>
      </Box>
    </div></div>
  );
};
export default QuizAdminPage;
