import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import '../quiz/quiz.css';
import './halloween2027.css';
import { ConejoMark } from './ConejoMark';
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
    <div className="h27-wrap pt-5 pb-2 flex items-center justify-between">
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
// Entrance choreography: one spring, staggered per block; nothing moves under reduced motion.
const useChoreo = () => {
  const reduce = useReducedMotion();
  const item = (i) => (reduce ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.08 + i * 0.07, type: 'spring', stiffness: 260, damping: 26 } });
  const step = reduce ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } } : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8, transition: { duration: 0.14 } }, transition: { type: 'spring', stiffness: 280, damping: 28 } };
  const tap = reduce ? {} : { whileHover: { scale: 1.02 }, whileTap: { scale: 0.97 } };
  return { reduce, item, step, tap };
};

const Hero = ({ compact, onCta, c }) => (
  <section className="h27-hero-grid" aria-labelledby="h27-title">
    <div>
      <motion.p className="bdq-kicker" {...c.item(0)}>Baila Dembow presents</motion.p>
      <motion.h1 id="h27-title" className="h27-hero mt-4" aria-label="The Latin Halloween Indoor Fest, October 2027" {...c.item(1)}>
        <span>The Latin</span>{' '}<span className="g">Halloween</span>{' '}<span>Indoor</span>{' '}<span>Fest</span>
        {!compact && <span className="s">October 2027</span>}
      </motion.h1>
      <motion.p className="h27-tag mt-3" {...c.item(2)}>Bigger &amp; bloodier than ever</motion.p>
      {!compact && (
        <>
          <motion.p className="h27-lead mt-6" style={{ maxWidth: '38ch' }} {...c.item(3)}>Before tickets go public, the early release goes to this list. Leave your details, confirm them, and you hear it first.</motion.p>
          <motion.div className="h27-cta-row mt-6" {...c.item(4)}>
            <motion.button type="button" className="bdq-btn" onClick={onCta} data-testid="h27-cta" {...c.tap}>Get early access</motion.button>
            <ul className="h27-meta" aria-label="In short"><li>Takes 1 minute</li><li>Email + WhatsApp confirmed</li><li>No spam</li></ul>
          </motion.div>
        </>
      )}
    </div>
    <motion.div className="h27-figure" {...c.item(compact ? 1 : 2)}><ConejoMark follow={!compact} /></motion.div>
  </section>
);

const WhatAndHow = ({ c }) => (
  <>
    <section className="h27-section" aria-labelledby="h27-what">
      <h2 id="h27-what">What you get</h2>
      <div className="space-y-4 h27-lead" style={{ fontWeight: 600 }}>
        <p>One message the moment the 2027 early release opens, by email and on WhatsApp, before the public sale. One reminder before it closes. Nothing else.</p>
        <p>This is first access to buy, not a ticket. Every release so far started at its lowest price and climbed with each round, so hearing first is worth real money.</p>
      </div>
    </section>
    <section className="h27-section" aria-labelledby="h27-how">
      <h2 id="h27-how">How it works</h2>
      <ol className="h27-steps-list">
        <li><strong>Your details</strong><p>Name, email, WhatsApp number. Thirty seconds.</p></li>
        <li><strong>Confirm email</strong><p>We email you a 6-digit code. Type it in.</p></li>
        <li><strong>Confirm WhatsApp</strong><p>A code lands on your phone. Type it in. Done: you are on the list.</p></li>
      </ol>
    </section>
  </>
);

const Faq = () => (
  <section className="h27-section" aria-labelledby="h27-faq">
    <h2 id="h27-faq">Good to know</h2>
    <div className="h27-faq">
      <details><summary>Is this a ticket?</summary><p>No. It is a place on the early-release list: you get to buy before the public sale opens. Tickets are sold through our ticket shop as usual.</p></details>
      <details><summary>What do you do with my number?</summary><p>We confirm it once with a code, then use it for the release message and one reminder. Never for anything else, never shared. The privacy notice has the details.</p></details>
      <details><summary>Can I leave the list?</summary><p>Yes, any time. Every message has a removal link, and you can also email ask@housedecoded.com.</p></details>
      <details><summary>Where and when exactly?</summary><p>October 2027. Venue, date and line-up are announced to this list first, so we are not publishing them yet.</p></details>
    </div>
  </section>
);

const NotFound = () => (
  <div className="bdq"><div className="min-h-screen flex items-center justify-center px-6 text-center">
    <div><p className="bdq-kicker justify-center">404</p><h1 className="text-3xl mt-3" style={{ color: '#fff', textShadow: 'none' }}>Page not found</h1>
      <p className="mt-3 text-[var(--bdq-dim)]"><a href="/">Back to bailadembow.com</a></p></div>
  </div></div>
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
  // The next step mounts after the previous one has animated out (AnimatePresence wait), so focus it once it exists.
  useEffect(() => {
    setCode(''); setApiErr(null); setNote(null);
    let tries = 0;
    const t = setInterval(() => { tries++; if (headRef.current && document.contains(headRef.current)) { headRef.current.focus({ preventScroll: false }); clearInterval(t); } else if (tries > 20) clearInterval(t); }, 60);
    return () => clearInterval(t);
  }, [step]);

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

  const Alert = ({ children }) => <div className="bdq-card h27-alert" role="alert" style={{ padding: 14, boxShadow: 'none' }}>{children}</div>;
  const c = useChoreo();
  const formRef = useRef(null);
  const [showSticky, setShowSticky] = useState(false);
  useEffect(() => {
    if (step !== 'form' || !formRef.current || !('IntersectionObserver' in window)) { setShowSticky(false); return undefined; }
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && window.scrollY > 240), { threshold: 0.05 });
    io.observe(formRef.current);
    return () => io.disconnect();
  }, [step, status]);
  const toForm = () => { track('h27_cta_click'); const el = formRef.current; if (el) { el.scrollIntoView({ behavior: c.reduce ? 'auto' : 'smooth', block: 'start' }); setTimeout(() => { const i = el.querySelector('input'); if (i) i.focus({ preventScroll: true }); }, c.reduce ? 0 : 450); } };

  if (status === null) return <div className="bdq h27" style={bg()}><div className="min-h-screen" aria-busy="true" /></div>;
  if (status === 'hidden' && !preview) return <NotFound />;
  if (status === 'error') return <NotFound />;

  return (
    <div className="bdq h27" style={bg()}>
      <a className="bdq-skip" href="#h27-main">Skip to content</a>
      <Header />
      <div id="h27-main" className="h27-wrap pb-10">
        {preview && status === 'hidden' && <p className="h27-sticker mb-4" role="status">Preview · hidden for visitors until 1 Nov 2026, 05:00</p>}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} className="h27-enter" {...c.step}>
            {step === 'form' && (
              <>
                <Hero onCta={toForm} c={c} />
                <WhatAndHow c={c} />
                <section className="h27-section" aria-labelledby="h27-form-title" ref={formRef} id="signup">
                  <h2 id="h27-form-title">Get early access</h2>
                  <div className="bdq-card h27-form-panel space-y-5">
                    <Steps n={1} />
                    <p className="bdq-kicker on-dark">Step 1 of 3</p>
                    <form onSubmit={submit} noValidate className="space-y-5" data-testid="h27-form">
                      {Object.keys(errors).length > 0 && <div ref={summaryRef} tabIndex={-1}><Alert>Please check the highlighted fields.</Alert></div>}
                      <Field id="fullName" label="Full name" error={errors.fullName}>
                        <input id="fullName" className="bdq-input" autoComplete="name" value={f.fullName} onChange={set('fullName')} maxLength={100} {...aria('fullName')} />
                      </Field>
                      <Field id="email" label="Email address" error={errors.email} help="We email you a 6-digit code to confirm it.">
                        <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="bdq-input" value={f.email} onChange={set('email')} maxLength={254} {...aria('email')} aria-describedby={errors.email ? 'email-err' : 'email-help'} />
                      </Field>
                      <Field id="phone" label="WhatsApp number" error={errors.phone} help="With country code, e.g. +31 6 12345678. A code lands on WhatsApp to confirm it.">
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
                      <motion.button type="submit" className="bdq-btn wide" disabled={busy} data-testid="h27-submit" aria-busy={busy || undefined} {...c.tap}>{busy ? 'Sending your code…' : 'Get early access'}</motion.button>
                      <p className="bdq-help">Next: a 6-digit code in your inbox, then one on WhatsApp. Unsubscribe link in every message.</p>
                    </form>
                  </div>
                </section>
                <Faq />
              </>
            )}

            {step === 'email' && sess && (
              <>
                <Hero compact c={c} />
                <section className="h27-section" aria-labelledby="h27-email-title">
                  <h2>Almost there</h2>
                  <div className="bdq-card h27-form-panel space-y-5">
                    <Steps n={2} />
                    <p className="bdq-kicker on-dark">Step 2 of {sess.phoneVerification === 'off' ? 2 : 3}</p>
                    <h3 id="h27-email-title" className="text-xl h27-display" style={{ color: '#fff', letterSpacing: 0 }} ref={headRef} tabIndex={-1}>Confirm your email</h3>
                    <p>{sess.emailCode === 'failed' ? 'We could not send the email just now. Ask for a new code below.' : <>We sent a 6-digit code to <strong>{sess.email}</strong>. It works for 30 minutes.</>}</p>
                    <form onSubmit={verifyEmail} noValidate className="space-y-4" data-testid="h27-email-form">
                      <Field id="emailCode" label="Email code">
                        <input id="emailCode" className="bdq-input h27-code" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} data-testid="h27-email-code" />
                      </Field>
                      {apiErr && <Alert>{apiErr}</Alert>}
                      {note && <p role="status" className="text-sm">{note}</p>}
                      <motion.button type="submit" className="bdq-btn wide" disabled={busy || code.length !== 6} data-testid="h27-email-verify" aria-busy={busy || undefined} {...c.tap}>{busy ? 'Checking…' : 'Confirm email'}</motion.button>
                      <div className="flex gap-4 flex-wrap text-sm">
                        <button type="button" className="underline" onClick={resendEmail} disabled={busy}>Send a new code</button>
                        <button type="button" className="underline" onClick={startOver}>Wrong details? Start again</button>
                      </div>
                    </form>
                  </div>
                </section>
              </>
            )}

            {step === 'phone' && sess && (
              <>
                <Hero compact c={c} />
                <section className="h27-section" aria-labelledby="h27-phone-title">
                  <h2>Last step</h2>
                  <div className="bdq-card h27-form-panel space-y-5">
                    <Steps n={3} />
                    <p className="bdq-kicker on-dark">Step 3 of 3</p>
                    <h3 id="h27-phone-title" className="text-xl h27-display" style={{ color: '#fff', letterSpacing: 0 }} ref={headRef} tabIndex={-1}>Confirm your WhatsApp</h3>
                    {!sess.phoneSent ? (
                      <>
                        <p>Email confirmed. We send a code on WhatsApp to <strong>{sess.phone}</strong> so we know the number is yours.</p>
                        {apiErr && <Alert>{apiErr}</Alert>}
                        <motion.button type="button" className="bdq-btn wide" disabled={busy} onClick={() => startPhone('whatsapp')} data-testid="h27-phone-start" aria-busy={busy || undefined} {...c.tap}>{busy ? 'Sending…' : 'Send WhatsApp code'}</motion.button>
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
                        <motion.button type="submit" className="bdq-btn wide" disabled={busy || code.length < 4} data-testid="h27-phone-verify" aria-busy={busy || undefined} {...c.tap}>{busy ? 'Checking…' : 'Confirm number'}</motion.button>
                        <div className="flex gap-4 flex-wrap text-sm">
                          <button type="button" className="underline" disabled={busy} onClick={() => startPhone(sess.channel || 'whatsapp')}>Send again</button>
                          {sess.channel !== 'sms' && <button type="button" className="underline" disabled={busy} onClick={() => startPhone('sms')}>Send an SMS instead</button>}
                        </div>
                      </form>
                    )}
                  </div>
                </section>
              </>
            )}

            {step === 'done' && sess && (
              <section className="h27-hero-grid" aria-labelledby="h27-done">
                <div className="space-y-6">
                  <motion.p className="bdq-kicker" {...c.item(0)}>You are in</motion.p>
                  <motion.h1 id="h27-done" ref={headRef} tabIndex={-1} className="h27-display" style={{ fontSize: 'clamp(2.6rem, 11vw, 6.5rem)' }} {...c.item(1)}>{sess.firstName ? `${sess.firstName}, you're on the list.` : "You're on the list."}</motion.h1>
                  <motion.div className="bdq-card h27-form-panel space-y-3" data-testid="h27-done" {...c.item(2)}>
                    <p>Email and number confirmed. When the early release for The Latin Halloween Indoor Fest 2027 opens you hear it from us first, by email and on WhatsApp.</p>
                    <p className="bdq-help">A confirmation is on its way to your inbox. Did not get it? Check your spam folder; the sender is Baila Dembow.</p>
                  </motion.div>
                  <motion.div className="h27-cta-row" {...c.item(3)}>
                    <motion.a className="bdq-btn" href={`https://wa.me/?text=${encodeURIComponent(SHARE_TEXT)}`} target="_blank" rel="noopener noreferrer" onClick={() => track('h27_share_click')} {...c.tap}>Tell your crew on WhatsApp</motion.a>
                    <motion.a className="bdq-btn bdq-btn-dark" href="/events" {...c.tap}>See upcoming events</motion.a>
                  </motion.div>
                </div>
                <motion.div className="h27-figure" {...c.item(2)}><ConejoMark /></motion.div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>

        <footer className="h27-footer">
          <a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/">bailadembow.com</a><span className="h27-sticker" style={{ marginLeft: 'auto' }}>Baila Dembow · Halloween 2027</span>
        </footer>
      </div>
      {step === 'form' && (
        <div className={`h27-sticky${showSticky ? ' show' : ''}`} aria-hidden={!showSticky}>
          <button type="button" className="bdq-btn" tabIndex={showSticky ? 0 : -1} onClick={toForm}>Get early access</button>
        </div>
      )}
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
      <div className="h27-wrap py-10 space-y-4" style={{ maxWidth: 720 }}>
        <p className="bdq-kicker">Halloween 2027 list</p>
        {state === 'working' && <h1 className="text-3xl">One moment…</h1>}
        {state === 'done' && <><h1 className="text-3xl">You are off the list.</h1><p className="h27-lead">Your name, email and phone number have been deleted. You will not hear from us about the 2027 release.</p></>}
        {state === 'invalid' && <><h1 className="text-3xl">This link does not work.</h1><p className="h27-lead">Open the link from your confirmation email again, or email ask@housedecoded.com and we will remove you by hand.</p></>}
        <p className="font-bold"><a href="/">Back to bailadembow.com</a></p>
      </div>
    </div>
  );
};

export default Halloween2027Page;
