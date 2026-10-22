import { useEffect, useRef, useState } from 'react';
import '../quiz/quiz.css';
import { QuizScene } from '../quiz/QuizScene';
import { captureAttribution, getAttribution } from '../quiz/attribution';
import { CONSENT_KEY } from '../utils/constants';

// Halloween 2027 early-release list. Name, email and phone number in exchange for first access to the 2027
// tickets. The API decides whether the page is open (cfg.h27OpensAt, 1 Nov 2026 05:00 Amsterdam); before that
// the page renders a plain not-found screen. ?preview=1 shows the form early, but the API still refuses sign-ups.
// Same visual language as the quiz (black / white / red, video backdrop).

const PAGE = '/halloween/2027';
const SHARE_TEXT = 'Halloween 2027 by Baila Dembow: get on the early-release list before tickets go public. https://bailadembow.com/halloween/2027';

const consent = () => { try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') || {}; } catch (_) { return {}; } };
const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
// Consent-aware measurement: GTM only with analytics/marketing consent; the Meta Lead only with marketing consent.
// Payloads never contain the form values.
const track = (name, extra = {}) => {
  const c = consent();
  const eventId = uuid();
  if ((c.analytics || c.marketing) && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, event_id: eventId, campaign_id: 'halloween_2027_early_release', ...extra });
  }
  if (name === 'h27_signup_success' && c.marketing && window.fbq) {
    try { window.fbq('track', 'Lead', { content_name: 'Halloween 2027 early release', content_category: 'Signup' }, { eventID: eventId }); } catch (_) { /* pixel blocked */ }
  }
};

const post = async (path, body) => {
  let res;
  try { res = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (_) { return { status: 0, data: { error: 'network' } }; }
  let data = null; try { data = await res.json(); } catch (_) { /* empty */ }
  return { status: res.status, data: data || {} };
};

const ERR = {
  fullName: { required: 'Please enter your name.', invalid: 'That name does not look right.' },
  email: { required: 'Please enter your email address.', invalid: 'That email address does not look right.' },
  phone: { required: 'Please enter your phone number.', invalid: 'Use a number with country code, for example +31 6 12345678.' },
  consent: { required: 'Tick the box so we are allowed to contact you about the release.' },
};
const clientValidate = (f) => {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = f.fullName.trim() ? 'invalid' : 'required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = f.email.trim() ? 'invalid' : 'required';
  const digits = f.phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) e.phone = f.phone.trim() ? 'invalid' : 'required';
  if (!f.consent) e.consent = 'required';
  return e;
};

const Header = () => (
  <header className="bdq-header">
    <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
      <a href="/" aria-label="Baila Dembow home"><img src="/images/branding/baila-logo-red.png" alt="Baila Dembow" width="960" height="395" style={{ height: 44, width: 'auto', display: 'block' }} /></a>
      <span className="bdq-kicker">Halloween 2027</span>
    </div>
  </header>
);

const Field = ({ id, label, error, help, children }) => (
  <div className="bdq-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {help && !error && <p className="bdq-help" id={`${id}-help`}>{help}</p>}
    {error && <p className="bdq-err" id={`${id}-err`} role="alert">{ERR[id][error] || 'Please check this field.'}</p>}
  </div>
);

const NotFound = () => (
  <div className="bdq"><main className="min-h-screen flex items-center justify-center px-6 text-center">
    <div><p className="bdq-kicker justify-center">404</p><h1 className="text-3xl mt-3" style={{ color: '#fff', textShadow: 'none' }}>Page not found</h1>
      <p className="mt-3 text-[var(--bdq-dim)]"><a href="/">Back to bailadembow.com</a></p></div>
  </main></div>
);

export const Halloween2027Page = () => {
  const [status, setStatus] = useState(null);           // null = loading, 'hidden', 'open', 'error'
  const [preview] = useState(() => { try { return new URLSearchParams(window.location.search).get('preview') === '1'; } catch (_) { return false; } });
  const [f, setF] = useState({ fullName: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiErr, setApiErr] = useState(null);
  const [done, setDone] = useState(false);
  const [consentText, setConsentText] = useState('Yes, contact me by email, WhatsApp or SMS about the early ticket release for the Amsterdam Latin Halloween Festival 2027. I can unsubscribe at any time.');
  const summaryRef = useRef(null);

  useEffect(() => {
    captureAttribution();
    fetch('/api/h27/status').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((s) => {
      setStatus(s.state); if (s.consentText) setConsentText(s.consentText);
      if (s.state === 'open') track('h27_view');
    }).catch(() => setStatus('error'));
  }, []);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const aria = (k) => ({ 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });

  const submit = async (ev) => {
    ev.preventDefault();
    const e = clientValidate(f);
    setErrors(e); setApiErr(null);
    if (Object.keys(e).length) { setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0); return; }
    setBusy(true);
    const r = await post('/api/h27/signup', { fullName: f.fullName, email: f.email, phone: f.phone, consent: f.consent, attribution: getAttribution() });
    setBusy(false);
    if (r.status === 200) { setDone(true); track('h27_signup_success'); return; }
    if (r.status === 400 && r.data.fields) { setErrors(r.data.fields); setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0); return; }
    if (r.status === 403) { setApiErr(preview ? 'Preview only: the list opens on 1 November at 05:00 (Amsterdam time). Sign-ups are not accepted yet.' : null); if (!preview) setStatus('hidden'); return; }
    if (r.status === 429) { setApiErr('Too many attempts from this connection. Please try again in a few minutes.'); return; }
    if (r.status === 0) { setApiErr('No connection. Check your internet and try again.'); return; }
    setApiErr('Something went wrong on our side. Please try again in a moment.');
  };

  if (status === null) return <div className="bdq"><main className="min-h-screen" aria-busy="true" /></div>;
  if (status === 'hidden' && !preview) return <NotFound />;
  if (status === 'error') return <NotFound />;

  const first = f.fullName.trim().split(' ')[0];
  return (
    <div className="bdq">
      <QuizScene />
      <a className="bdq-skip" href="#h27-main">Skip to content</a>
      <Header />
      <main id="h27-main" className="max-w-xl mx-auto px-4 pb-16 pt-6 space-y-7">
        {preview && status === 'hidden' && <p className="bdq-card text-sm" role="status">Preview. This page is hidden for visitors until 1 November 2026, 05:00 (Amsterdam time).</p>}
        {!done ? (
          <>
            <section>
              <p className="bdq-kicker">Amsterdam Latin Halloween Festival 2027</p>
              <h1 className="text-[2.05rem] sm:text-5xl mt-3">Be first in line for Halloween 2027.</h1>
              <p className="mt-4 text-lg text-[var(--bdq-dim)]">2026 sold out. For 2027, the early-release tickets go to this list before anyone else sees them. Leave your details and we will tell you the moment they drop.</p>
            </section>
            <section className="bdq-card space-y-5" aria-labelledby="h27-form-title">
              <h2 id="h27-form-title" className="text-xl">Get on the list</h2>
              <form onSubmit={submit} noValidate className="space-y-5" data-testid="h27-form">
                {Object.keys(errors).length > 0 && (
                  <div ref={summaryRef} tabIndex={-1} role="alert" className="bdq-card" style={{ borderColor: 'var(--bdq-accent)', padding: 14 }}>Please check the highlighted fields.</div>
                )}
                <Field id="fullName" label="Full name" error={errors.fullName}>
                  <input id="fullName" className="bdq-input" autoComplete="name" value={f.fullName} onChange={set('fullName')} maxLength={100} {...aria('fullName')} />
                </Field>
                <Field id="email" label="Email address" error={errors.email}>
                  <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="bdq-input" value={f.email} onChange={set('email')} maxLength={254} {...aria('email')} />
                </Field>
                <Field id="phone" label="Phone number" error={errors.phone} help="With country code, for example +31 6 12345678. Used for the release message only.">
                  <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="bdq-input" placeholder="+31 6 12345678" value={f.phone} onChange={set('phone')} maxLength={40} {...aria('phone')} aria-describedby={errors.phone ? 'phone-err' : 'phone-help'} />
                </Field>
                <div>
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#FF4015]" checked={f.consent} onChange={set('consent')} aria-invalid={errors.consent ? 'true' : undefined} aria-describedby={errors.consent ? 'consent-err' : undefined} data-testid="h27-consent" />
                    <span>{consentText} <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy notice</a></span>
                  </label>
                  {errors.consent && <p className="bdq-err" id="consent-err" role="alert">{ERR.consent.required}</p>}
                </div>
                {apiErr && <div className="bdq-card" role="alert" style={{ borderColor: 'var(--bdq-accent)', padding: 14 }}>{apiErr}</div>}
                <button type="submit" className="bdq-btn" disabled={busy} data-testid="h27-submit">{busy ? 'Sending…' : 'Put me on the list'}</button>
                <p className="bdq-help">No spam. One message when the release opens, plus a reminder before it closes. Unsubscribe link in every message.</p>
              </form>
            </section>
          </>
        ) : (
          <section className="space-y-6" aria-labelledby="h27-done">
            <p className="bdq-kicker">You are in</p>
            <h1 id="h27-done" tabIndex={-1} className="text-4xl">{first ? `${first}, you're on the list.` : "You're on the list."}</h1>
            <div className="bdq-card space-y-3" data-testid="h27-done">
              <p>We have sent a confirmation to your email. When the 2027 early release opens you will hear it from us first, by email and on your phone.</p>
              <p className="text-[var(--bdq-dim)] text-sm">Did not get the email within a few minutes? Check your spam folder; the sender is Baila Dembow.</p>
            </div>
            <a className="bdq-btn" href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('h27_share_click')}>Tell your crew on WhatsApp</a>
            <a className="bdq-btn bdq-btn-ghost" href="/events">See upcoming events</a>
          </section>
        )}
        <footer className="bdq-footer text-sm pt-6 flex gap-4 flex-wrap">
          <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/">bailadembow.com</a>
        </footer>
      </main>
    </div>
  );
};

// /halloween/2027/unsubscribe#t=<token> from the confirmation email: removes the person from the list.
export const H27UnsubscribePage = () => {
  const [state, setState] = useState('working');
  useEffect(() => {
    const t = (window.location.hash.match(/#t=([^&]+)/) || [])[1];
    if (!t) { setState('invalid'); return; }
    try { window.history.replaceState(null, '', window.location.pathname); } catch (_) { /* ignore */ }
    post('/api/h27/unsubscribe', { token: decodeURIComponent(t) }).then((r) => setState(r.status === 200 ? 'done' : 'invalid'));
  }, []);
  return (
    <div className="bdq"><Header />
      <main className="max-w-xl mx-auto px-4 py-16 space-y-4">
        <p className="bdq-kicker">Halloween 2027 list</p>
        {state === 'working' && <h1 className="text-3xl">One moment…</h1>}
        {state === 'done' && <><h1 className="text-3xl">You are off the list.</h1><p className="text-[var(--bdq-dim)]">Your name, email and phone number have been deleted. You will not hear from us about the 2027 release.</p></>}
        {state === 'invalid' && <><h1 className="text-3xl">This link does not work.</h1><p className="text-[var(--bdq-dim)]">Open the link from your confirmation email again, or email ask@housedecoded.com and we will remove you by hand.</p></>}
        <p><a href="/">Back to bailadembow.com</a></p>
      </main>
    </div>
  );
};

export default Halloween2027Page;
