import { useEffect, useRef, useState } from 'react';
import './halloween2027.css';
import { captureAttribution, getAttribution } from '../quiz/attribution';
import { CONSENT_KEY } from '../utils/constants';

// Baila Dembow · Halloween 2027 landing page (approved design, ported from the supplied static page; see
// docs/halloween-2027-signup.md). Signup: details -> 6-digit email code -> on the list. Email only: no WhatsApp
// verification or messages are triggered from this page. The API decides whether the page is open (cfg.h27OpensAt);
// before that it renders a plain not-found screen. ?preview=1 shows the page early (sign-ups still refused).

const BG = '/images/h27/pink-texture.jpg';
const ART = '/images/h27/artwork-1600.png';
const ART_SMALL = '/images/h27/artwork-900.png';
const LOGO = '/images/branding/baila-logo-white-27.png';
const STORE = 'bd_h27';
const RESEND_WAIT_MS = 30000;

const consentPrefs = () => { try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || 'null') || {}; } catch (_) { return {}; } };
const uuid = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
// Consent-aware measurement: GTM only with analytics/marketing consent; Meta Lead only with marketing consent. Never form values.
const track = (name) => {
  const c = consentPrefs();
  const eventId = uuid();
  if ((c.analytics || c.marketing) && typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: name, event_id: eventId, campaign_id: 'halloween_2027_updates' });
  }
  if (name === 'h27_verified' && c.marketing && window.fbq) {
    try { window.fbq('track', 'Lead', { content_name: 'Halloween 2027 updates', content_category: 'Signup' }, { eventID: eventId }); } catch (_) { /* pixel blocked */ }
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

// Visitor-friendly messages for every server outcome (the API returns stable codes, never prose).
const FIELD = {
  fullName: { required: 'Please enter your full name.', invalid: 'That name does not look right.' },
  email: { required: 'Please enter your email address.', invalid: 'That email address does not look right.' },
  phone: { required: 'Please enter your phone number.', invalid: 'Enter your phone number with a country code, for example +31612345678.' },
  consent: { required: 'Please tick the box to agree to receive event updates.' },
};
const MSG = {
  network: 'Unable to connect. Please check your internet and try again.',
  rate_limited: 'Too many attempts from this connection. Please wait a few minutes and try again.',
  code_invalid: 'That code is not right. Check the email and try again.',
  code_expired: 'That code has expired. Request a new one with "Resend code".',
  too_many_attempts: 'Too many wrong codes. Request a new one with "Resend code".',
  invalid_token: 'This signup session has expired. Please enter your details again.',
  not_open: 'Signups are not open yet. Please come back later.',
  server: 'Something went wrong on our side. Please try again in a moment.',
};
const msgFor = (r) => MSG[r.data && r.data.error] || (r.status === 0 ? MSG.network : r.status === 429 ? MSG.rate_limited : MSG.server);
const clientValidate = (f) => {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = f.fullName.trim() ? 'invalid' : 'required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = f.email.trim() ? 'invalid' : 'required';
  const digits = f.phone.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 16) e.phone = f.phone.trim() ? 'invalid' : 'required';
  if (!f.consent) e.consent = 'required';
  return e;
};

const Header = ({ onCta }) => (
  <header className="site-header">
    <a className="official-brand" href="/" aria-label="Baila Dembow home"><img src={LOGO} alt="Baila Dembow" width="1080" height="1350" /></a>
    <div className="edition">THE LATIN HALLOWEEN<br /><br />OCTOBER / 2027</div>
    {onCta ? <button type="button" className="nav-cta" onClick={onCta} data-testid="h27-nav-cta">JOIN THE LIST <span aria-hidden="true">↗</span></button> : <a className="nav-cta" href="/events">EVENTS <span aria-hidden="true">↗</span></a>}
  </header>
);
const Artwork = () => (
  <section className="original-artwork" aria-labelledby="h27-title">
    {/* visually hidden page title: the artwork carries it visually (approved design), screen readers and the audit need a real h1 */}
    <h1 id="h27-title" className="sr-only">The Latin Halloween Indoor Fest — October 2027</h1>
    <img src={ART} srcSet={`${ART_SMALL} 900w, ${ART} 1600w`} sizes="(max-width: 760px) 100vw, 712px" alt="Original Baila Dembow artwork: The Latin Halloween Indoor Fest, October 2027. Bigger and bloodier than ever." width="1600" height="2000" fetchpriority="high" />
  </section>
);
const Footer = () => (
  <>
    <div className="ticker" aria-hidden="true">BAILA DEMBOW · HALLOWEEN 2027 · INDOOR FESTIVAL · THE LATIN HALLOWEEN</div>
    <footer className="site-footer"><span>© BAILA DEMBOW / HALLOWEEN 2027</span><span>OCTOBER 2027 · MORE DETAILS TO COME</span><a href="/privacy" target="_blank" rel="noopener noreferrer">Your information</a></footer>
  </>
);
const NotFound = () => (
  <div className="h27v2" style={{ backgroundImage: `url(${BG})` }}><div className="notfound"><p>404 — PAGE NOT FOUND<br /><br /><a href="/">BACK TO BAILADEMBOW.COM</a></p></div></div>
);

export const Halloween2027Page = () => {
  const [status, setStatus] = useState(null);           // null = loading, 'hidden', 'open', 'error'
  const [preview] = useState(() => { try { return new URLSearchParams(window.location.search).get('preview') === '1'; } catch (_) { return false; } });
  const [consentText, setConsentText] = useState('I agree to receive Halloween 2027 event updates from Baila Dembow by email and WhatsApp. I can unsubscribe at any time.');
  const [f, setF] = useState({ fullName: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState({ text: '', error: false });
  const [sess, setSess] = useState(() => load());       // { token, stage: 'email' | 'complete', email }
  const [code, setCode] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const titleRef = useRef(null);
  const codeRef = useRef(null);
  const nameRef = useRef(null);
  const signupRef = useRef(null);
  const stage = sess ? sess.stage : 'details';

  useEffect(() => {
    captureAttribution();
    fetch('/api/h27/status').then((r) => (r.ok ? r.json() : Promise.reject(r.status))).then((s) => {
      setStatus(s.state); if (s.consentText) setConsentText(s.consentText);
      if (s.state === 'open') track('h27_view');
    }).catch(() => setStatus('error'));
  }, []);
  useEffect(() => {
    if (stage === 'email' && codeRef.current) codeRef.current.focus();
    if (stage === 'complete' && titleRef.current) titleRef.current.focus();
  }, [stage]);

  const message = (text, error = false) => setNote({ text, error });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const aria = (k, describedBy) => ({ 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `${k}-error` : describedBy });
  const call = async (path, body) => { setBusy(true); message(''); const r = await post(path, body); setBusy(false); return r; };
  const expired = (r) => { if (r.status === 401) { save(null); setSess(null); message(MSG.invalid_token, true); return true; } return false; };
  const toSignup = () => { const el = signupRef.current; if (el) { el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); setTimeout(() => nameRef.current && nameRef.current.focus({ preventScroll: true }), 400); } };

  const submitDetails = async (ev) => {
    ev.preventDefault();
    const e = clientValidate(f); setErrors(e);
    if (Object.keys(e).length) { const first = Object.keys(e)[0]; message(FIELD[first][e[first]], true); const el = document.getElementById(first); if (el) el.focus(); return; }
    const r = await call('/api/h27/signup', { fullName: f.fullName.trim(), email: f.email.trim(), phone: f.phone.trim(), consent: f.consent, attribution: getAttribution() });
    if (r.status === 200) {
      track('h27_signup_submitted');
      const next = { token: r.data.token, stage: 'email', email: f.email.trim() }; setSess(next); save(next); setResendAt(Date.now() + RESEND_WAIT_MS);
      message(r.data.emailCode === 'failed' ? 'We could not send the email just now. Use "Resend code" in a moment.' : 'Email code sent. Check your spam folder too.', r.data.emailCode === 'failed');
      return;
    }
    if (r.status === 400 && r.data.fields) { setErrors(r.data.fields); const first = Object.keys(r.data.fields)[0]; message(FIELD[first] ? FIELD[first][r.data.fields[first]] || 'Please check your details.' : 'Please check your details.', true); return; }
    if (r.status === 403) { if (preview) message('Preview only: signups open on 1 November at 05:00 (Amsterdam time).', true); else setStatus('hidden'); return; }
    message(msgFor(r), true);
  };
  const verify = async (ev) => {
    ev.preventDefault();
    if (!/^\d{6}$/.test(code)) { message('Enter the 6-digit code from the email.', true); if (codeRef.current) codeRef.current.focus(); return; }
    const r = await call('/api/h27/email/verify', { token: sess.token, code });
    if (expired(r)) return;
    if (r.status === 200) { track('h27_verified'); const next = { ...sess, stage: 'complete' }; setSess(next); save(null); message('Your signup is confirmed.'); return; }
    const left = r.data && r.data.attemptsLeft;
    message(r.data.error === 'code_invalid' && left !== undefined ? `${MSG.code_invalid} ${left} attempt${left === 1 ? '' : 's'} left.` : msgFor(r), true);
  };
  const resend = async () => {
    if (Date.now() < resendAt) { message(`Please wait ${Math.ceil((resendAt - Date.now()) / 1000)} seconds before requesting another code.`); return; }
    const r = await call('/api/h27/email/resend', { token: sess.token });
    if (expired(r)) return;
    if (r.status === 200) { setResendAt(Date.now() + RESEND_WAIT_MS); setCode(''); message(r.data.emailCode === 'failed' ? 'We could not send the email just now. Please try again in a minute.' : 'A new code is on its way.', r.data.emailCode === 'failed'); return; }
    message(msgFor(r), true);
  };
  const edit = () => { save(null); setSess(null); setCode(''); setErrors({}); message('Update your details and request a new email code.'); setTimeout(() => nameRef.current && nameRef.current.focus(), 0); };

  if (status === null) return <div className="h27v2" style={{ backgroundImage: `url(${BG})`, minHeight: '100vh' }} aria-busy="true" />;
  if (status === 'hidden' && !preview) return <NotFound />;
  if (status === 'error') return <NotFound />;

  return (
    <div className="h27v2" style={{ backgroundImage: `url(${BG})` }}>
      <Header onCta={stage === 'details' ? toSignup : null} />
      {preview && status === 'hidden' && <p className="preview-note" role="status">PREVIEW · HIDDEN FOR VISITORS UNTIL 1 NOV 2026, 05:00 · SIGNUPS NOT ACCEPTED YET</p>}
      <Artwork />
      <div className="main" id="signup" ref={signupRef}>
        <div className="event-caption"><span>OCTOBER 2027</span><span>BAILA DEMBOW</span></div>
        <section className="signup" aria-labelledby="form-title">
          <div className="signup-top">YOUR WAY IN</div>
          <h2 id="form-title" ref={titleRef} tabIndex={-1}>{stage === 'complete' ? "You're on the list." : 'Sign up'}</h2>
          {stage !== 'complete' && <p className="intro" id="intro">Sign up for Halloween 2027 updates. Leave your details and verify your email.</p>}
          {stage !== 'complete' && (
            <ol className="steps" aria-label="Signup progress">
              <li className="active" aria-current={stage === 'details' ? 'step' : undefined}>01 / DETAILS</li>
              <li className={stage === 'email' ? 'active' : ''} aria-current={stage === 'email' ? 'step' : undefined}>02 / EMAIL</li>
            </ol>
          )}

          {stage === 'details' && (
            <form className="panel" onSubmit={submitDetails} noValidate data-testid="h27-form">
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" ref={nameRef} name="name" autoComplete="name" placeholder="Your full name" maxLength={100} value={f.fullName} onChange={set('fullName')} {...aria('fullName')} />
              {errors.fullName && <p className="field-error" id="fullName-error">{FIELD.fullName[errors.fullName]}</p>}
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" placeholder="you@example.com" maxLength={254} value={f.email} onChange={set('email')} {...aria('email')} />
              {errors.email && <p className="field-error" id="email-error">{FIELD.email[errors.email]}</p>}
              <label htmlFor="phone">Phone number</label>
              <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+31 6 1234 5678" maxLength={25} value={f.phone} onChange={set('phone')} {...aria('phone', 'phone-hint')} />
              <p className="hint" id="phone-hint">Include your country code.</p>
              {errors.phone && <p className="field-error" id="phone-error">{FIELD.phone[errors.phone]}</p>}
              <label className="consent">
                <input id="consent" type="checkbox" checked={f.consent} onChange={set('consent')} aria-invalid={errors.consent ? 'true' : undefined} aria-describedby={errors.consent ? 'consent-error' : undefined} data-testid="h27-consent" />
                <span>{consentText}</span>
              </label>
              {errors.consent && <p className="field-error" id="consent-error">{FIELD.consent.required}</p>}
              <button className="cta" type="submit" disabled={busy} aria-busy={busy || undefined} data-testid="h27-submit"><span>{busy ? 'Sending…' : 'Send email code'}</span><span aria-hidden="true">↗</span></button>
              <p className="fine">SIGNUP IS FOR EVENT UPDATES. IT IS NOT A TICKET.</p>
            </form>
          )}

          {stage === 'email' && sess && (
            <form className="panel" onSubmit={verify} noValidate data-testid="h27-email-form">
              <p className="intro" id="destination">Enter the code sent to {sess.email}.</p>
              <label htmlFor="code">6-digit verification code</label>
              <input id="code" ref={codeRef} className="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} data-testid="h27-email-code" />
              <button className="cta" type="submit" disabled={busy} aria-busy={busy || undefined} data-testid="h27-email-verify"><span>{busy ? 'Checking…' : 'Verify email & sign up'}</span><span aria-hidden="true">↗</span></button>
              <button className="secondary" type="button" onClick={resend} disabled={busy} data-testid="h27-resend">Resend code</button>
              <button className="secondary" type="button" onClick={edit} disabled={busy} data-testid="h27-edit">Edit details</button>
            </form>
          )}

          {stage === 'complete' && (
            <div className="panel complete" data-testid="h27-done">
              <div className="success-mark" aria-hidden="true">↗</div>
              <h3>You're on the list.</h3>
              <p className="intro">Email confirmed. Watch your inbox for Halloween 2027 updates from Baila Dembow.</p>
              <p className="fine">THIS IS AN UPDATES SIGNUP, NOT A TICKET OR ENTRY CONFIRMATION.</p>
            </div>
          )}

          <p className={`status${note.error ? ' error' : ''}`} role="status" aria-live="polite" data-testid="h27-status">{note.text}</p>
        </section>
      </div>
      <Footer />
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
    <div className="h27v2" style={{ backgroundImage: `url(${BG})` }}>
      <Header />
      <div className="main"><section className="signup">
        <div className="signup-top">HALLOWEEN 2027 LIST</div>
        {state === 'working' && <h1 className="h27-h">One moment…</h1>}
        {state === 'done' && <><h1 className="h27-h">You are off the list.</h1><p className="intro">Your name, email and phone number have been deleted. You will not receive Halloween 2027 updates from us.</p></>}
        {state === 'invalid' && <><h1 className="h27-h">This link does not work.</h1><p className="intro">Open the link from your email again, or write to ask@housedecoded.com and we will remove you by hand.</p></>}
        <p className="fine"><a href="/">BACK TO BAILADEMBOW.COM</a></p>
      </section></div>
      <Footer />
    </div>
  );
};

export default Halloween2027Page;
