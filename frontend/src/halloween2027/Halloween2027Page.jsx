import { useEffect, useRef, useState } from 'react';
import '../quiz/quiz.css';
import './halloween2027.css';
import { captureAttribution, getAttribution } from '../quiz/attribution';
import { CONSENT_KEY } from '../utils/constants';

// Halloween 2027 early-release list (The Latin Halloween Indoor Fest 2027), styled after the campaign poster.
// Flow: details -> 6-digit email code -> WhatsApp (or SMS) code -> on the list. The API decides whether the page
// is open (1 Nov 2026 05:00 Amsterdam); before that it renders a plain not-found screen. ?preview=1 shows the
// form early (sign-ups still refused). The browser only ever holds a signed token for its own row.

const SHARE_TEXT = 'The Latin Halloween Indoor Fest 2027 by Baila Dembow: get on the early-release list before tickets go public. https://bailadembow.com/halloween/2027';
const STORE = 'bd_h27';
// Public texture (not bundled): smaller file on phones.
const TEXTURE = () => { try { return window.matchMedia('(min-width: 720px)').matches ? '/images/h27/pink-texture.jpg' : '/images/h27/pink-texture-540.jpg'; } catch (_) { return '/images/h27/pink-texture.jpg'; } };
const bg = () => ({ backgroundImage: `url(${TEXTURE()})` });
const DEFAULT_CONSENT = 'Yes, contact me by email, WhatsApp or SMS about the early ticket release for The Latin Halloween Indoor Fest 2027. I can unsubscribe at any time.';

const consent = () => { try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') || {}; } catch (_) { return {}; } };
const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
// Consent-aware measurement: GTM only with analytics/marketing consent; Meta Lead only with marketing consent. Never form values.
const track = (name, extra = {}) => {
  const c = consent();
  const eventId = uuid();
  if ((c.analytics || c.marketing) && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, event_id: eventId, campaign_id: 'halloween_2027_early_release', ...extra });
  }
  if (name === 'h27_verified' && c.marketing && window.fbq) {
    try { window.fbq('track', 'Lead', { content_name: 'Halloween 2027 early release', content_category: 'Signup' }, { eventID: eventId }); } catch (_) { /* pixel blocked */ }
  }
};
const post = async (path, body) => {
  let res;
  try { res = await fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); } catch (_) { return { status: 0, data: { error: 'network' } }; }
  let data = null; try { data = await res.json(); } catch (_) { /* empty */ }
  return { status: res.status, data: data || {} };
};
const load = () => { try { return JSON.parse(sessionStorage.getItem(STORE) || 'null'); } catch (_) { return null; } };
const save = (v) => { try { v ? sessionStorage.setItem(STORE, JSON.stringify(v)) : sessionStorage.removeItem(STORE); } catch (_) { /* ignore */ } };

const ERR = {
  fullName: { required: 'Please enter your name.', invalid: 'That name does not look right.' },
  email: { required: 'Please enter your email address.', invalid: 'That email address does not look right.' },
  phone: { required: 'Please enter your phone number.', invalid: 'Use a number with country code, for example +31 6 12345678.' },
  consent: { required: 'Tick the box so we are allowed to contact you about the release.' },
};
const GENERIC = {
  network: 'No connection. Check your internet and try again.', rate_limited: 'Too many attempts. Please wait a few minutes and try again.',
  code_invalid: 'That code is not right.', code_expired: 'That code has expired. Ask for a new one.', too_many_attempts: 'Too many wrong codes. Ask for a new one.',
  channel_unavailable: 'That number does not seem to have WhatsApp. Try SMS instead.', phone_invalid: 'That phone number cannot receive messages. Check it and sign up again.',
  phone_provider_error: 'Our messaging provider is having trouble. Try again in a minute.', invalid_token: 'This session has expired. Please start again.',
  server: 'Something went wrong on our side. Please try again in a moment.',
};
const msg = (r) => GENERIC[r.data && r.data.error] || GENERIC[r.status === 0 ? 'network' : r.status === 429 ? 'rate_limited' : 'server'];
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
    <div className="max-w-xl mx-auto px-4 pt-5 pb-2 flex items-center justify-between">
      <a href="/" aria-label="Baila Dembow home"><img src="/images/branding/baila-logo-white.png" alt="Baila Dembow" style={{ height: 40, width: 'auto', display: 'block' }} /></a>
      <span className="h27-sticker">Signup.</span>
    </div>
  </header>
);
const Field = ({ id, label, error, help, children }) => (
  <div className="bdq-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {help && !error && <p className="bdq-help" id={`${id}-help`}>{help}</p>}
    {error && <p className="bdq-err" id={`${id}-err`} role="alert">{ERR[id] ? (ERR[id][error] || 'Please check this field.') : error}</p>}
  </div>
);
const Steps = ({ n }) => <div className="h27-steps" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className={i <= n ? 'done' : ''} />)}</div>;
const Hero = ({ compact }) => (
  <section>
    <h1 className="h27-hero" aria-label="The Latin Halloween Indoor Fest, October 2027">
      <span>The Latin</span><span className="g">Halloween</span><span>Indoor</span><span>Fest</span>
      {!compact && <span className="s">October 2027</span>}
    </h1>
    <p className="h27-tag mt-3">Bigger &amp; bloodier than ever</p>
  </section>
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
  const [consentText, setConsentText] = useState(DEFAULT_CONSENT);
  const [f, setF] = useState({ fullName: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiErr, setApiErr] = useState(null);
  const [sess, setSess] = useState(() => load());       // { token, step, email, phone, phoneVerification, firstName, channel }
  const [code, setCode] = useState('');
  const [note, setNote] = useState(null);
  const summaryRef = useRef(null);
  const headRef = useRef(null);
  const step = sess ? sess.step : 'form';

  useEffect(() => {
    captureAttribution();
    fetch('/api/h27/status').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((s) => {
      setStatus(s.state); if (s.consentText) setConsentText(s.consentText);
      if (s.state === 'open') track('h27_view');
    }).catch(() => setStatus('error'));
  }, []);
  useEffect(() => { setCode(''); setApiErr(null); setNote(null); if (headRef.current) headRef.current.focus(); }, [step]);

  const go = (patch) => { const next = { ...(sess || {}), ...patch }; setSess(next); save(next.step === 'done' ? null : next); };
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const aria = (k) => ({ 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `${k}-err` : undefined });
  const call = async (path, body) => { setBusy(true); setApiErr(null); const r = await post(path, body); setBusy(false); return r; };
  const expired = (r) => { if (r.status === 401) { save(null); setSess(null); setApiErr(GENERIC.invalid_token); return true; } return false; };

  // step 0
  const submit = async (ev) => {
    ev.preventDefault();
    const e = clientValidate(f); setErrors(e); setApiErr(null);
    if (Object.keys(e).length) { setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0); return; }
    const r = await call('/api/h27/signup', { fullName: f.fullName, email: f.email, phone: f.phone, consent: f.consent, attribution: getAttribution() });
    if (r.status === 200) {
      track('h27_signup_submitted');
      go({ token: r.data.token, step: 'email', email: r.data.email, phone: r.data.phone, phoneVerification: r.data.phoneVerification, firstName: f.fullName.trim().split(' ')[0], emailCode: r.data.emailCode });
      return;
    }
    if (r.status === 400 && r.data.fields) { setErrors(r.data.fields); setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0); return; }
    if (r.status === 403) { if (preview) setApiErr('Preview only: the list opens on 1 November at 05:00 (Amsterdam time). Sign-ups are not accepted yet.'); else setStatus('hidden'); return; }
    setApiErr(msg(r));
  };
  // step 1
  const verifyEmail = async (ev) => {
    ev.preventDefault();
    const r = await call('/api/h27/email/verify', { token: sess.token, code });
    if (expired(r)) return;
    if (r.status === 200) {
      track('h27_email_verified');
      if (r.data.next === 'phone') { go({ step: 'phone', phoneSent: false }); return; }
      track('h27_verified'); go({ step: 'done' }); return;
    }
    setApiErr(r.data.attemptsLeft !== undefined && r.data.error === 'code_invalid' ? `${GENERIC.code_invalid} ${r.data.attemptsLeft} attempt${r.data.attemptsLeft === 1 ? '' : 's'} left.` : msg(r));
  };
  const resendEmail = async () => {
    const r = await call('/api/h27/email/resend', { token: sess.token });
    if (expired(r)) return;
    if (r.status === 200) setNote(r.data.emailCode === 'failed' ? 'We could not send the email just now. Try again in a minute.' : `New code sent to ${sess.email}.`); else setApiErr(msg(r));
  };
  // step 2
  const startPhone = async (channel) => {
    const r = await call('/api/h27/phone/start', { token: sess.token, channel });
    if (expired(r)) return;
    if (r.status === 200) { go({ phoneSent: true, channel: r.data.channel }); setNote(r.data.channel === 'sms' ? `Code sent by SMS to ${sess.phone}.` : `Code sent on WhatsApp to ${sess.phone}.`); return; }
    if (r.status === 400 && r.data.error === 'phone_verification_off') { track('h27_verified'); go({ step: 'done' }); return; }
    setApiErr(msg(r));
  };
  const verifyPhone = async (ev) => {
    ev.preventDefault();
    const r = await call('/api/h27/phone/verify', { token: sess.token, code });
    if (expired(r)) return;
    if (r.status === 200) { track('h27_verified'); go({ step: 'done' }); return; }
    setApiErr(msg(r));
  };
  const startOver = () => { save(null); setSess(null); setF({ fullName: '', email: '', phone: '', consent: false }); setErrors({}); };

  if (status === null) return <div className="bdq h27" style={bg()}><main className="min-h-screen" aria-busy="true" /></div>;
  if (status === 'hidden' && !preview) return <NotFound />;
  if (status === 'error') return <NotFound />;

  const Alert = ({ children }) => <div className="bdq-card h27-alert" role="alert" style={{ padding: 14, boxShadow: 'none' }}>{children}</div>;

  return (
    <div className="bdq h27" style={bg()}>
      <a className="bdq-skip" href="#h27-main">Skip to content</a>
      <Header />
      <main id="h27-main" className="max-w-xl mx-auto px-4 pb-16 pt-4 space-y-7">
        {preview && status === 'hidden' && <p className="h27-sticker" role="status">Preview · hidden for visitors until 1 Nov 2026, 05:00</p>}

        {step === 'form' && (
          <>
            <Hero />
            <p className="h27-lead">2026 sold out. For 2027 the early-release tickets go to this list before anyone else sees them. Leave your details, confirm your email and your WhatsApp number, and you hear it first.</p>
            <section className="bdq-card space-y-5" aria-labelledby="h27-form-title">
              <Steps n={1} />
              <h2 id="h27-form-title" className="text-xl" ref={headRef} tabIndex={-1}>Get on the list</h2>
              <form onSubmit={submit} noValidate className="space-y-5" data-testid="h27-form">
                {Object.keys(errors).length > 0 && <div ref={summaryRef} tabIndex={-1}><Alert>Please check the highlighted fields.</Alert></div>}
                <Field id="fullName" label="Full name" error={errors.fullName}>
                  <input id="fullName" className="bdq-input" autoComplete="name" value={f.fullName} onChange={set('fullName')} maxLength={100} {...aria('fullName')} />
                </Field>
                <Field id="email" label="Email address" error={errors.email} help="We send a 6-digit code to confirm it.">
                  <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="bdq-input" value={f.email} onChange={set('email')} maxLength={254} {...aria('email')} aria-describedby={errors.email ? 'email-err' : 'email-help'} />
                </Field>
                <Field id="phone" label="WhatsApp number" error={errors.phone} help="With country code, for example +31 6 12345678. We send a code on WhatsApp to confirm it.">
                  <input id="phone" type="tel" inputMode="tel" autoComplete="tel" className="bdq-input" placeholder="+31 6 12345678" value={f.phone} onChange={set('phone')} maxLength={40} {...aria('phone')} aria-describedby={errors.phone ? 'phone-err' : 'phone-help'} />
                </Field>
                <div>
                  <label className="flex gap-3 items-start cursor-pointer">
                    <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#97e52f]" checked={f.consent} onChange={set('consent')} aria-invalid={errors.consent ? 'true' : undefined} aria-describedby={errors.consent ? 'consent-err' : undefined} data-testid="h27-consent" />
                    <span>{consentText} <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy notice</a></span>
                  </label>
                  {errors.consent && <p className="bdq-err" id="consent-err" role="alert">{ERR.consent.required}</p>}
                </div>
                {apiErr && <Alert>{apiErr}</Alert>}
                <button type="submit" className="bdq-btn" disabled={busy} data-testid="h27-submit">{busy ? 'Sending…' : 'Put me on the list'}</button>
                <p className="bdq-help">No spam. One message when the release opens, plus a reminder before it closes. Unsubscribe link in every message.</p>
              </form>
            </section>
          </>
        )}

        {step === 'email' && sess && (
          <>
            <Hero compact />
            <section className="bdq-card space-y-5" aria-labelledby="h27-email-title">
              <Steps n={2} />
              <p className="bdq-kicker on-dark">Step 2 of {sess.phoneVerification === 'off' ? 2 : 3}</p>
              <h2 id="h27-email-title" className="text-xl" ref={headRef} tabIndex={-1}>Confirm your email</h2>
              <p>{sess.emailCode === 'failed' ? 'We could not send the email just now. Ask for a new code below.' : <>We sent a 6-digit code to <strong>{sess.email}</strong>. It works for 30 minutes.</>}</p>
              <form onSubmit={verifyEmail} noValidate className="space-y-4" data-testid="h27-email-form">
                <Field id="emailCode" label="Email code">
                  <input id="emailCode" className="bdq-input h27-code" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} data-testid="h27-email-code" />
                </Field>
                {apiErr && <Alert>{apiErr}</Alert>}
                {note && <p role="status" className="text-sm">{note}</p>}
                <button type="submit" className="bdq-btn" disabled={busy || code.length !== 6} data-testid="h27-email-verify">{busy ? 'Checking…' : 'Confirm email'}</button>
                <div className="flex gap-4 flex-wrap text-sm">
                  <button type="button" className="underline" onClick={resendEmail} disabled={busy}>Send a new code</button>
                  <button type="button" className="underline" onClick={startOver}>Wrong details? Start again</button>
                </div>
              </form>
            </section>
          </>
        )}

        {step === 'phone' && sess && (
          <>
            <Hero compact />
            <section className="bdq-card space-y-5" aria-labelledby="h27-phone-title">
              <Steps n={3} />
              <p className="bdq-kicker on-dark">Step 3 of 3</p>
              <h2 id="h27-phone-title" className="text-xl" ref={headRef} tabIndex={-1}>Confirm your WhatsApp</h2>
              {!sess.phoneSent ? (
                <>
                  <p>Email confirmed. Last step: we send a code on WhatsApp to <strong>{sess.phone}</strong> so we know the number is yours.</p>
                  {apiErr && <Alert>{apiErr}</Alert>}
                  <button type="button" className="bdq-btn" disabled={busy} onClick={() => startPhone('whatsapp')} data-testid="h27-phone-start">{busy ? 'Sending…' : 'Send WhatsApp code'}</button>
                  <div className="flex gap-4 flex-wrap text-sm">
                    <button type="button" className="underline" disabled={busy} onClick={() => startPhone('sms')}>No WhatsApp? Send an SMS instead</button>
                    <button type="button" className="underline" onClick={startOver}>Wrong number? Start again</button>
                  </div>
                </>
              ) : (
                <form onSubmit={verifyPhone} noValidate className="space-y-4" data-testid="h27-phone-form">
                  <p>{sess.channel === 'sms' ? 'SMS' : 'WhatsApp'} code sent to <strong>{sess.phone}</strong>.</p>
                  <Field id="phoneCode" label={`${sess.channel === 'sms' ? 'SMS' : 'WhatsApp'} code`}>
                    <input id="phoneCode" className="bdq-input h27-code" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={8} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} data-testid="h27-phone-code" />
                  </Field>
                  {apiErr && <Alert>{apiErr}</Alert>}
                  {note && <p role="status" className="text-sm">{note}</p>}
                  <button type="submit" className="bdq-btn" disabled={busy || code.length < 4} data-testid="h27-phone-verify">{busy ? 'Checking…' : 'Confirm number'}</button>
                  <div className="flex gap-4 flex-wrap text-sm">
                    <button type="button" className="underline" disabled={busy} onClick={() => startPhone(sess.channel || 'whatsapp')}>Send again</button>
                    {sess.channel !== 'sms' && <button type="button" className="underline" disabled={busy} onClick={() => startPhone('sms')}>Send an SMS instead</button>}
                  </div>
                </form>
              )}
            </section>
          </>
        )}

        {step === 'done' && sess && (
          <section className="space-y-6" aria-labelledby="h27-done">
            <p className="bdq-kicker">You are in</p>
            <h1 id="h27-done" ref={headRef} tabIndex={-1} className="h27-display" style={{ fontSize: 'clamp(2.6rem, 13vw, 6rem)' }}>{sess.firstName ? `${sess.firstName}, you're on the list.` : "You're on the list."}</h1>
            <div className="bdq-card space-y-3" data-testid="h27-done">
              <p>Email and number confirmed. When the early release for The Latin Halloween Indoor Fest 2027 opens you hear it from us first, by email and on WhatsApp.</p>
              <p className="bdq-help">A confirmation is on its way to your inbox. Did not get it? Check your spam folder; the sender is Baila Dembow.</p>
            </div>
            <a className="bdq-btn" href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('h27_share_click')}>Tell your crew on WhatsApp</a>
            <a className="bdq-btn bdq-btn-dark" href="/events">See upcoming events</a>
          </section>
        )}

        <footer className="bdq-footer text-sm pt-6 flex gap-4 flex-wrap font-bold">
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
    <div className="bdq h27" style={bg()}><Header />
      <main className="max-w-xl mx-auto px-4 py-10 space-y-4">
        <p className="bdq-kicker">Halloween 2027 list</p>
        {state === 'working' && <h1 className="text-3xl">One moment…</h1>}
        {state === 'done' && <><h1 className="text-3xl">You are off the list.</h1><p className="h27-lead">Your name, email and phone number have been deleted. You will not hear from us about the 2027 release.</p></>}
        {state === 'invalid' && <><h1 className="text-3xl">This link does not work.</h1><p className="h27-lead">Open the link from your confirmation email again, or email ask@housedecoded.com and we will remove you by hand.</p></>}
        <p className="font-bold"><a href="/">Back to bailadembow.com</a></p>
      </main>
    </div>
  );
};

export default Halloween2027Page;
