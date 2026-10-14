import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import './quiz.css';
import { quizApi, ApiError } from './api';
import { makeT, LANGS, LANG_NAMES, suggestLanguage, fmtDate } from './strings';
import { countryOptions } from './countries';
import { captureAttribution, getAttribution } from './attribution';
import { quizTrack, scoreBand } from './analytics';
import { takeVerificationToken, peekVerificationToken } from './earlyBoot';
import { MusicControl } from './MusicControl';
import { QuizScene } from './QuizScene';
import { EVENTS } from '../utils/constants';
import { useCookieConsent } from '../context/CookieConsentContext';

// Flow (play first): language -> rules -> five questions -> score + tier -> details -> verify email -> code by email.
const LANG_KEY = 'bd_quiz_lang';
const EMAIL_KEY = 'bdq_pending_email';   // the address typed in this browser, so the code screen can be prefilled
const HALLOWEEN = EVENTS.find((e) => e.landing_page === '/halloween');
const readLang = () => { try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : null; } catch (_) { return null; } };
const saveLang = (l) => { try { localStorage.setItem(LANG_KEY, l); } catch (_) { /* storage blocked: fine */ } };
const readEmail = () => { try { return sessionStorage.getItem(EMAIL_KEY) || ''; } catch (_) { return ''; } };
const saveEmail = (e) => { try { sessionStorage.setItem(EMAIL_KEY, e); } catch (_) { /* ignore */ } };

// Localised, human message for any API failure. Never shows raw codes or server text.
const errMsg = (t, e) => {
  if (!(e instanceof ApiError)) return t('errors.generic');
  if (e.status === 0) return t('errors.network');
  if (e.status === 429) return t('errors.rate_limited', { minutes: Math.max(1, Math.ceil(((e.data && e.data.retryAfter) || 60) / 60)) });
  if (e.status >= 500 && e.code === 'not_configured') return t('errors.not_configured');
  const key = `errors.${e.code}`;
  const msg = t(key);
  return msg === key ? (e.status >= 500 ? t('errors.server') : t('errors.generic')) : msg;
};

// Moves keyboard/screen-reader focus to the new step's heading whenever the step (or question) changes.
let headingsMounted = 0;
const useFocusOnChange = (dep) => {
  const ref = useRef(null);
  useEffect(() => {
    if (headingsMounted++ === 0) return;
    if (ref.current) ref.current.focus({ preventScroll: false });
  }, [dep]);
  return ref;
};

// One motion vocabulary for the whole page: spring in from below, quick fade out. Off under reduced motion.
const useMotion = () => {
  const reduce = useReducedMotion();
  const step = reduce
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 }, transition: { duration: 0 } }
    : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10, transition: { duration: 0.16, ease: 'easeIn' } }, transition: { type: 'spring', stiffness: 300, damping: 28, mass: 0.8 } };
  const item = (i) => (reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 + i * 0.045, type: 'spring', stiffness: 320, damping: 26 } });
  return { reduce, step, item };
};

const Spinner = ({ label }) => (
  <p className="flex items-center gap-3 text-[var(--bdq-dim)]" role="status"><span className="bdq-spinner" aria-hidden="true" /> {label}</p>
);
const ErrorBox = ({ children, onRetry, t }) => (
  <div className="bdq-card" role="alert" style={{ borderColor: 'var(--bdq-accent)' }}>
    <p>{children}</p>
    {onRetry && <button type="button" className="bdq-btn bdq-btn-ghost mt-4" onClick={onRetry}>{t('retry')}</button>}
  </div>
);

// ---------------------------------------------------------------- language
const LanguageStep = ({ t, suggested, onPick, m }) => {
  const h = useFocusOnChange('lang');
  return (
    <section className="space-y-6" aria-labelledby="bdq-h">
      <div>
        <p className="bdq-kicker">{t('rules.kicker')}</p>
        <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-[2.6rem] mt-3">{t('lang.title')}</h1>
        <p className="text-[var(--bdq-dim)] mt-2">{t('lang.intro')}</p>
      </div>
      <div className="space-y-3">
        {LANGS.map((l, i) => (
          <motion.div key={l} {...m.item(i)}>
            <button type="button" lang={l} className={`bdq-btn ${l === suggested ? '' : 'bdq-btn-ghost'}`} onClick={() => onPick(l)} data-testid={`quiz-lang-${l}`}>
              <span className="flex flex-col items-center leading-tight"><span>{LANG_NAMES[l]}</span>{l === suggested && <span className="text-xs font-semibold opacity-80">{makeT(l)('lang.suggested')}</span>}</span>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- rules
const RulesStep = ({ t, lang, cfg, onStart, busy, error, m }) => {
  const h = useFocusOnChange('rules');
  return (
    <section className="space-y-7" aria-labelledby="bdq-h">
      <div>
        <p className="bdq-kicker">{t('rules.kicker')}</p>
        <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-[2.5rem] sm:text-5xl mt-3" data-testid="quiz-headline">{t('rules.headline')}</h1>
      </div>
      <motion.div className="bdq-card space-y-4" {...m.item(0)}>
        <h2 className="text-xl">{t('rules.howTitle')}</h2>
        <ol className="space-y-3 list-decimal pl-5 text-[var(--bdq-dim)]">
          <li>{t('rules.r1')}</li>
          <li>
            {t('rules.r2')}
            <div className="mt-3 space-y-2 text-[var(--bdq-text)]">
              {[['tier5', 5], ['tier10', 10], ['tier15', 15]].map(([k, v], i) => (
                <motion.div className="bdq-tier" key={k} {...m.item(i + 1)}><span>{t(`rules.${k}`)}</span><strong>{t('rules.tierResult', { tier: v })}</strong></motion.div>
              ))}
            </div>
          </li>
          <li>{t('rules.r3')}</li>
          <li>{t('rules.r4')}</li>
          <li>{t('rules.r5')}{cfg && cfg.codeExpiresAt ? ` ${t('rules.r5b', { date: fmtDate(cfg.codeExpiresAt, lang) })}` : ''}</li>
          <li>{t('rules.r6')}</li>
          <li>{t('rules.r7')}</li>
        </ol>
        <p className="text-sm"><a href="/terms" target="_blank" rel="noopener noreferrer">{t('rules.terms')}</a></p>
      </motion.div>
      {error && <ErrorBox t={t}>{error}</ErrorBox>}
      <motion.div {...m.item(4)}>
        <button type="button" className="bdq-btn" onClick={onStart} disabled={busy} data-testid="quiz-start-cta">{busy ? t('rules.starting') : t('rules.cta')}</button>
        <p className="text-center text-sm text-[var(--bdq-dim)] mt-3">{t('rules.time')}</p>
      </motion.div>
    </section>
  );
};

// ---------------------------------------------------------------- question
const QuestionView = ({ t, st, resumed, onAnswer, busy, error, onRetry, m }) => {
  const q = st.question;
  const [choice, setChoice] = useState('');
  const h = useFocusOnChange(q.id);
  useEffect(() => { setChoice(''); }, [q.id]);
  const pct = Math.round((st.progress.answered / st.progress.total) * 100);
  return (
    <section className="space-y-6" aria-labelledby="bdq-h">
      <h1 className="sr-only">{t('rules.kicker')}: {t(`quiz.themes.${st.theme}`)}</h1>
      <div>
        <div className="flex justify-between items-baseline gap-3 text-sm font-bold mb-2">
          <span className="bdq-kicker">{t('quiz.progress', { n: q.position + 1, total: q.total })}</span>
          <span className="text-[var(--bdq-dim)] font-semibold">{t(`quiz.themes.${st.theme}`)}</span>
        </div>
        <div className="bdq-progress" role="progressbar" aria-label={t('quiz.progressLabel')} aria-valuemin={0} aria-valuemax={q.total} aria-valuenow={st.progress.answered}><span style={{ width: `${pct}%` }} /></div>
      </div>
      {resumed && q.position > 0 && <p role="status" className="text-sm text-[var(--bdq-dim)]">{t('quiz.resumed')}</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (choice) onAnswer(q, choice); }} className="space-y-4">
        <fieldset className="space-y-3" disabled={busy}>
          <legend ref={h} tabIndex={-1} className="text-[1.55rem] sm:text-3xl font-extrabold leading-snug mb-5" id="bdq-h" data-testid="quiz-question">{q.prompt}</legend>
          {q.options.map((o, i) => (
            <motion.div key={o.id} {...m.item(i)}>
              <input type="radio" className="peer sr-only" name="answer" id={`opt-${q.id}-${o.id}`} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} />
              <label className="bdq-option" htmlFor={`opt-${q.id}-${o.id}`} data-testid="quiz-option">{o.text}</label>
            </motion.div>
          ))}
        </fieldset>
        {error && <ErrorBox t={t} onRetry={choice ? onRetry : undefined}>{error}</ErrorBox>}
        <button type="submit" className="bdq-btn" disabled={!choice || busy} data-testid="quiz-lock">{busy ? t('quiz.saving') : t('quiz.lock')}</button>
        {!choice && <p className="text-center text-sm text-[var(--bdq-dim)]">{t('quiz.pick')}</p>}
      </form>
    </section>
  );
};

// ---------------------------------------------------------------- score header (shared by result screens)
const ScoreHeader = ({ t, r, refEl, kicker }) => (
  <div className="text-center space-y-1">
    <p className="bdq-kicker justify-center">{kicker || t('result.title')}</p>
    <div className="bdq-score" aria-hidden="true">{r.score}<small>/{r.total}</small></div>
    <div className="bdq-rule" aria-hidden="true" />
    <h1 id="bdq-h" ref={refEl} tabIndex={-1} className="text-2xl">{t('result.score', { score: r.score, total: r.total })}</h1>
    <p className="text-lg font-extrabold" data-testid="quiz-earned">{t('result.earned', { tier: r.tier })}</p>
  </div>
);

// ---------------------------------------------------------------- claim form (after the score)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clientValidate = (f) => {
  const e = {};
  if (f.fullName.trim().length < 2) e.fullName = f.fullName.trim() ? 'invalid' : 'required';
  if (!f.email.trim()) e.email = 'required'; else if (!EMAIL_RE.test(f.email.trim())) e.email = 'invalid';
  if (!f.age.trim()) e.age = 'required'; else if (!/^\d{1,3}$/.test(f.age.trim())) e.age = 'invalid'; else if (Number(f.age) < 18) e.age = 'under_18'; else if (Number(f.age) > 120) e.age = 'invalid';
  if (!f.gender) e.gender = 'required';
  if (f.gender === 'self_describe' && !f.genderSelf.trim()) e.genderSelf = 'required';
  if (!f.city.trim()) e.city = 'required';
  if (!f.country) e.country = 'required';
  if (!f.acceptTerms) e.acceptTerms = 'acceptTerms';
  return e;
};

const Field = ({ id, label, error, help, t, children }) => (
  <div className="bdq-field">
    <label htmlFor={id}>{label}</label>
    {children}
    {help && <p className="bdq-help" id={`${id}-help`}>{help}</p>}
    {error && <p className="bdq-err" id={`${id}-err`} role="alert">{t(`form.err.${error}`)}</p>}
  </div>
);

const ClaimStep = ({ t, lang, cfg, st, initial, onDone, onClosed, m }) => {
  const h = useFocusOnChange('claim');
  const r = st.result;
  const [f, setF] = useState(initial || { fullName: '', email: '', age: '', gender: '', genderSelf: '', city: '', country: '', acceptTerms: false, marketingOptIn: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiErr, setApiErr] = useState(null);
  const summaryRef = useRef(null);
  const countries = useMemo(() => countryOptions(lang), [lang]);
  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    setErrors((p) => { if (!p[k]) return p; const n = { ...p }; delete n[k]; return n; });
  };
  const aria = (k, hasHelp) => ({ 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': [hasHelp ? `${k}-help` : '', errors[k] ? `${k}-err` : ''].filter(Boolean).join(' ') || undefined });
  const marketingText = cfg && cfg.marketing && cfg.marketing.wording ? cfg.marketing.wording[lang] : '';

  const submit = async (ev) => {
    ev.preventDefault();
    setApiErr(null);
    const errs = clientValidate(f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      quizTrack('quiz_form_validation_error', { language: lang, fields: Object.entries(errs).map(([k, v]) => `${k}:${v}`) });
      setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0);
      return;
    }
    setBusy(true);
    try {
      await quizApi.signup({
        fullName: f.fullName, email: f.email, age: Number(f.age), gender: f.gender, genderSelf: f.gender === 'self_describe' ? f.genderSelf : undefined,
        city: f.city, country: f.country, language: lang, acceptTerms: true, marketingOptIn: f.marketingOptIn === true, attribution: getAttribution(),
      });
      quizTrack('quiz_form_success', { language: lang, tier: r.tier });
      quizTrack('quiz_verification_requested', { language: lang });
      onDone(f);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.data && e.data.fields) {
        setErrors(e.data.fields);
        quizTrack('quiz_form_validation_error', { language: lang, fields: Object.entries(e.data.fields).map(([k, v]) => `${k}:${v}`), kind: 'server' });
        setTimeout(() => summaryRef.current && summaryRef.current.focus(), 0);
      } else if (e instanceof ApiError && e.code === 'campaign_unavailable') {
        onClosed(e.data && e.data.state);
      } else {
        quizTrack('quiz_error', { step: 'form', error_code: e instanceof ApiError ? e.code : 'unknown' });
        setApiErr(errMsg(t, e));
      }
    } finally { setBusy(false); }
  };

  return (
    <section className="space-y-7" aria-labelledby="bdq-h">
      <ScoreHeader t={t} r={r} refEl={h} />
      <motion.div className="bdq-card space-y-5" {...m.item(1)}>
        <div>
          <p className="bdq-kicker">{t('result.claimKicker')}</p>
          <h2 className="text-2xl mt-2">{t('result.claimTitle', { tier: r.tier })}</h2>
          <p className="text-[var(--bdq-dim)] mt-2">{t('result.claimIntro')} <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('form.privacy')}</a></p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-5" data-testid="quiz-form">
          {Object.keys(errors).length > 0 && (
            <div ref={summaryRef} tabIndex={-1} role="alert" className="bdq-card" style={{ borderColor: 'var(--bdq-accent)', padding: 14 }}>{t('form.summary')}</div>
          )}
          <Field id="fullName" label={t('form.fullName')} error={errors.fullName} t={t}>
            <input id="fullName" className="bdq-input" autoComplete="name" value={f.fullName} onChange={set('fullName')} maxLength={100} {...aria('fullName')} />
          </Field>
          <Field id="email" label={t('form.email')} error={errors.email} t={t}>
            <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="bdq-input" value={f.email} onChange={set('email')} maxLength={254} {...aria('email')} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field id="age" label={t('form.age')} error={errors.age} help={t('form.ageHelp')} t={t}>
              <input id="age" inputMode="numeric" pattern="[0-9]*" autoComplete="off" className="bdq-input" value={f.age} onChange={set('age')} maxLength={3} {...aria('age', true)} />
            </Field>
            <Field id="gender" label={t('form.gender')} error={errors.gender} t={t}>
              <select id="gender" className="bdq-input" value={f.gender} onChange={set('gender')} {...aria('gender')}>
                <option value="">{t('form.genderPick')}</option>
                {['woman', 'man', 'non_binary', 'self_describe', 'prefer_not_to_say'].map((g) => <option key={g} value={g}>{t(`form.genders.${g}`)}</option>)}
              </select>
            </Field>
          </div>
          {f.gender === 'self_describe' && (
            <Field id="genderSelf" label={t('form.genderSelf')} error={errors.genderSelf} t={t}>
              <input id="genderSelf" className="bdq-input" value={f.genderSelf} onChange={set('genderSelf')} maxLength={40} {...aria('genderSelf')} />
            </Field>
          )}
          <Field id="city" label={t('form.city')} error={errors.city} t={t}>
            <input id="city" autoComplete="address-level2" className="bdq-input" value={f.city} onChange={set('city')} maxLength={80} {...aria('city')} />
          </Field>
          <Field id="country" label={t('form.country')} error={errors.country} t={t}>
            <select id="country" autoComplete="country" className="bdq-input" value={f.country} onChange={set('country')} {...aria('country')}>
              <option value="">{t('form.countryPick')}</option>
              {countries.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
            </select>
          </Field>
          <div className="space-y-4">
            <div className="bdq-divider" />
            <div>
              <label className="flex gap-3 items-start cursor-pointer">
                <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#FF6B00]" checked={f.acceptTerms} onChange={set('acceptTerms')} aria-invalid={errors.acceptTerms ? 'true' : undefined} aria-describedby={errors.acceptTerms ? 'acceptTerms-err' : undefined} data-testid="quiz-accept" />
                <span>
                  {(() => { const [a, b] = t('form.accept', { privacy: '\u0000' }).split('\u0000'); return (<>{a}<a href="/privacy" target="_blank" rel="noopener noreferrer">{t('form.privacy')}</a>{b}</>); })()}
                  {' '}<a href="/terms" target="_blank" rel="noopener noreferrer">({t('form.terms')})</a>
                </span>
              </label>
              {errors.acceptTerms && <p className="bdq-err" id="acceptTerms-err" role="alert">{t('form.err.acceptTerms')}</p>}
            </div>
            <fieldset>
              <legend className="sr-only">{t('form.marketingLegend')}</legend>
              <label className="flex gap-3 items-start cursor-pointer">
                {/* Separate, optional and UNCHECKED by default. Wording comes from the API so the stored consent text is exactly what was shown. */}
                <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#FF6B00]" checked={f.marketingOptIn} onChange={set('marketingOptIn')} data-testid="quiz-marketing" />
                <span className="text-[var(--bdq-dim)]">{marketingText}</span>
              </label>
            </fieldset>
          </div>
          {apiErr && <ErrorBox t={t}>{apiErr}</ErrorBox>}
          <button type="submit" className="bdq-btn" disabled={busy} data-testid="quiz-form-submit">{busy ? t('form.sending') : t('form.submit')}</button>
        </form>
      </motion.div>
    </section>
  );
};

// ---------------------------------------------------------------- pending verification (code entry)
const PendingStep = ({ t, lang, st, email, onVerified, onEdit, m }) => {
  const h = useFocusOnChange('pending');
  const r = st.result;
  const [addr, setAddr] = useState(email || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [info, setInfo] = useState(null);
  const shown = email || r.maskedEmail || '';
  const verify = async (ev) => {
    ev.preventDefault();
    setMsg(null); setInfo(null); setBusy(true);
    try { await quizApi.verifyCode(addr.trim(), code.trim()); quizTrack('quiz_verification_completed', { language: lang }); await onVerified(); }
    catch (e) { quizTrack('quiz_verification_failed', { error_code: e instanceof ApiError ? e.code : 'unknown' }); setMsg(errMsg(t, e)); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setMsg(null); setInfo(null); setBusy(true);
    try { await quizApi.resend(addr.trim(), lang); setInfo(t('verify.resent')); quizTrack('quiz_verification_requested', { language: lang, kind: 'resend' }); }
    catch (e) { setMsg(errMsg(t, e)); } finally { setBusy(false); }
  };
  return (
    <section className="space-y-7" aria-labelledby="bdq-h">
      <ScoreHeader t={t} r={r} refEl={h} kicker={t('result.pendingTitle')} />
      <motion.form onSubmit={verify} className="bdq-card space-y-4" noValidate {...m.item(1)}>
        <p className="text-[var(--bdq-dim)]">{t('result.pendingBody', { email: shown })}</p>
        {!email && (
          <div className="bdq-field"><label htmlFor="vemail">{t('verify.emailLabel')}</label>
            <input id="vemail" type="email" autoComplete="email" className="bdq-input" value={addr} onChange={(e) => setAddr(e.target.value)} /></div>
        )}
        <div className="bdq-field">
          <label htmlFor="code">{t('verify.codeLabel')}</label>
          <input id="code" className="bdq-input" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 26, letterSpacing: '0.45em', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }} data-testid="quiz-code" />
        </div>
        {msg && <p className="bdq-err" role="alert">{msg}</p>}
        {info && <p role="status" className="text-sm">{info}</p>}
        <button type="submit" className="bdq-btn" disabled={busy || code.length !== 6 || !addr.includes('@')} data-testid="quiz-verify-submit">{busy ? t('verify.verifying') : t('verify.submit')}</button>
        <p className="text-sm text-[var(--bdq-dim)]">{t('verify.hint', { minutes: 30 })}</p>
        <div className="flex flex-col gap-3">
          <button type="button" className="bdq-btn bdq-btn-ghost" onClick={resend} disabled={busy || !addr.includes('@')} data-testid="quiz-resend">{t('verify.resend')}</button>
          <button type="button" className="bdq-chip" onClick={onEdit}>{t('verify.edit')}</button>
        </div>
      </motion.form>
    </section>
  );
};

const LinkFailed = ({ t, lang, onSent, m }) => {
  const h = useFocusOnChange('linkfailed');
  const [email, setEmail] = useState(readEmail());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const send = async (ev) => {
    ev.preventDefault(); setBusy(true); setMsg(null);
    try { await quizApi.resend(email.trim(), lang); onSent(email.trim()); } catch (e) { setMsg(errMsg(t, e)); } finally { setBusy(false); }
  };
  return (
    <section className="space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('verify.linkFailed')}</h1>
      <p className="text-[var(--bdq-dim)]">{t('verify.linkFailedHelp')}</p>
      <motion.form onSubmit={send} className="bdq-card space-y-4" {...m.item(0)}>
        <div className="bdq-field"><label htmlFor="remail">{t('verify.emailLabel')}</label>
          <input id="remail" type="email" className="bdq-input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {msg && <p className="bdq-err" role="alert">{msg}</p>}
        <button type="submit" className="bdq-btn" disabled={busy || !email.includes('@')}>{t('verify.resend')}</button>
      </motion.form>
    </section>
  );
};

// ---------------------------------------------------------------- claimed / already played
const MAIL_FINAL = new Set(['delivered', 'bounced', 'complained', 'failed', 'waiting_for_inventory']);

const ClaimedView = ({ t, lang, st, cfg, onResend, resendMsg, resendBusy, already, m }) => {
  const h = useFocusOnChange(already ? 'already' : 'claimed');
  const r = st.result;
  const mail = r.email || 'none';
  return (
    <section className="space-y-7" aria-labelledby="bdq-h">
      <ScoreHeader t={t} r={r} refEl={h} kicker={already ? t('result.alreadyTitle') : undefined} />
      <motion.div className="bdq-card space-y-3" data-testid="quiz-mail-status" {...m.item(1)}>
        <h2 className="text-xl">{t('result.emailTitle')}</h2>
        {already && <p className="text-[var(--bdq-dim)]">{t('result.already')}</p>}
        {!already && <p role="status" aria-live="polite">{t(`result.mail.${mail}`)}</p>}
        <p className="text-sm text-[var(--bdq-dim)]">{t('result.codeNote')}</p>
        {cfg && cfg.codeExpiresAt && <p className="text-sm text-[var(--bdq-dim)]">{t('result.valid', { date: fmtDate(cfg.codeExpiresAt, lang) })}</p>}
        <button type="button" className="bdq-btn bdq-btn-ghost" onClick={onResend} disabled={resendBusy} data-testid="quiz-resend-reward">{t('result.resend')}</button>
        {resendMsg && <p role="status" className="text-sm">{resendMsg}</p>}
      </motion.div>
      {r.review && (
        <div className="bdq-card space-y-4"><h2 className="text-xl">{t('result.review')}</h2>
          {r.review.map((q) => (
            <div key={q.questionId} className="space-y-1">
              <p className="font-bold">{q.prompt}</p>
              <p className="text-sm text-[var(--bdq-dim)]">{t('result.reviewYours')}: {(q.options.find((o) => o.id === q.selected) || {}).text}</p>
              {!q.wasCorrect && <p className="text-sm">{t('result.reviewCorrect')}: {(q.options.find((o) => o.id === q.correct) || {}).text}</p>}
              <p className="text-sm text-[var(--bdq-dim)]">{q.explanation}</p>
            </div>
          ))}
        </div>
      )}
      <motion.div className="space-y-2" {...m.item(2)}>
        <a className="bdq-btn" href={HALLOWEEN.ticket_url} target="_blank" rel="noopener noreferrer"
          onClick={() => quizTrack('quiz_ticket_click', { tier: r.tier, language: lang })} data-testid="quiz-tickets">{t('result.tickets')}</a>
        <p className="text-center text-sm text-[var(--bdq-dim)]">{t('result.ticketsHelp')}</p>
      </motion.div>
    </section>
  );
};

const ClosedView = ({ t, lang, state, cfg }) => {
  const h = useFocusOnChange('closed');
  const msg = state === 'not_open' ? t('closed.not_open', { date: fmtDate(cfg && cfg.opensAt, lang) }) : t(`closed.${state === 'closed' ? 'closed' : 'disabled'}`);
  return (
    <section className="space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{msg}</h1>
      <a className="bdq-btn" href="/halloween">{t('closed.tickets')}</a>
    </section>
  );
};

// ---------------------------------------------------------------- page
export const QuizPage = ({ mode = 'quiz' }) => {
  const stored = readLang();
  const [lang, setLang] = useState(stored || suggestLanguage());
  const [cfg, setCfg] = useState(null);
  const [phase, setPhase] = useState('boot');
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState(null);
  const [email, setEmail] = useState(readEmail());
  const [resumed, setResumed] = useState(false);
  const [resendMsg, setResendMsg] = useState(null);
  const [live, setLive] = useState('');
  const [closedState, setClosedState] = useState('disabled');
  const viewed = useRef(new Set());
  const booted = useRef(false);
  const consent = useCookieConsent();
  const t = useMemo(() => makeT(lang), [lang]);
  const langRef = useRef(lang);
  langRef.current = lang;
  const m = useMotion();

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Map the server state to a screen.
  const applyState = useCallback((s, { fromResume = false, justCompleted = false } = {}) => {
    setSt(s);
    if (s.campaign.state === 'disabled') { setClosedState('disabled'); setPhase('closed'); return; }
    if (s.status === 'in_progress') { setPhase('quiz'); setResumed(fromResume); return; }
    if (s.status === 'completed') {
      if (justCompleted) {
        quizTrack('quiz_completed', { theme: s.theme, tier: s.result.tier, score_band: scoreBand(s.result.tier), language: langRef.current });
        quizTrack('quiz_discount_earned', { theme: s.theme, tier: s.result.tier, language: langRef.current });
      }
      const c = s.result.claim;
      if (c === 'unclaimed') setPhase('claim');
      else if (c === 'pending_verification') setPhase('pending');
      else if (c === 'already_played') setPhase('already');
      else setPhase('claimed');
      return;
    }
    // idle: nothing started in this browser
    if (s.campaign.state !== 'open') { setClosedState(s.campaign.state); setPhase('closed'); return; }
    setPhase(readLang() ? 'rules' : 'lang');
  }, []);

  const loadState = useCallback(async (opts) => { const s = await quizApi.state(langRef.current); applyState(s, opts); return s; }, [applyState]);

  const verifyLink = useCallback(async (token) => {
    setPhase('verifying');
    try {
      if (!token) throw new ApiError(400, 'invalid_or_expired');
      const r = await quizApi.verifyToken(token);
      quizTrack('quiz_verification_completed', { language: langRef.current, kind: 'link' });
      if (r && r.claim === 'claimed') { const s0 = await quizApi.state(langRef.current); if (s0.result) quizTrack('quiz_reward_email_status', { status: s0.result.email, tier: s0.result.tier }); }
      window.history.replaceState(null, '', '/halloween/quiz');
      await loadState();
    } catch (e) {
      quizTrack('quiz_verification_failed', { error_code: e instanceof ApiError ? e.code : 'unknown' });
      if (e instanceof ApiError && e.code === 'invalid_or_expired') setPhase('link_failed'); else { setErr(e); setPhase('error'); }
    }
  }, [loadState]);

  const boot = useCallback(async () => {
    setPhase('boot'); setErr(null);
    captureAttribution();
    try { setCfg(await quizApi.config()); } catch (e) { setErr(e); setPhase('error'); return; }
    const token = takeVerificationToken();
    if (token || mode === 'verify') { await verifyLink(token); return; }
    try { await loadState({ fromResume: true }); } catch (e) { setErr(e); setPhase('error'); }
  }, [loadState, mode, verifyLink]);

  useEffect(() => {
    if (booted.current) return;   // survives React StrictMode's simulated remount
    booted.current = true;
    captureAttribution();
    if (mode !== 'verify' && !peekVerificationToken()) {
      quizApi.ping('landing_view', getAttribution(), langRef.current);   // cookieless aggregate counter
      quizTrack('quiz_landing_view', { language: langRef.current });
    }
    boot();
  }, [boot, mode]);

  const changeLang = async (l) => {
    setLang(l); langRef.current = l; saveLang(l);
    quizTrack('quiz_language_selected', { language: l });
    setLive(makeT(l)('languageLabel') + ': ' + LANG_NAMES[l]);
    if (st && st.status !== 'idle') { try { setSt(await quizApi.setLanguage(l)); } catch (_) { /* wording updates on the next call */ } }
  };

  // Poll the email status for a while after claiming so "delivered / bounced" shows without a reload.
  useEffect(() => {
    if (phase !== 'claimed' || !st || !st.result || MAIL_FINAL.has(st.result.email)) return undefined;
    let n = 0;
    const id = setInterval(async () => {
      n += 1; if (n > 10) { clearInterval(id); return; }
      try { const s = await quizApi.state(langRef.current); setSt((prev) => { if (prev && prev.result && s.result && prev.result.email !== s.result.email) quizTrack('quiz_reward_email_status', { status: s.result.email, tier: s.result.tier }); return s; }); } catch (_) { /* next tick */ }
    }, 8000);
    return () => clearInterval(id);
  }, [phase, st]);

  useEffect(() => {
    if (phase === 'quiz' && st && st.question && !viewed.current.has(st.question.id)) {
      viewed.current.add(st.question.id);
      quizTrack('quiz_question_viewed', { theme: st.theme, question_id: st.question.id, position: st.question.position, language: langRef.current });
    }
  }, [phase, st]);

  // "Start the challenge": begin the anonymous attempt straight away.
  const startQuiz = async () => {
    quizTrack('quiz_start_click', { language: lang }); quizApi.ping('start_click', getAttribution(), lang);
    setBusy(true); setErr(null);
    try { const s = await quizApi.start(lang); quizTrack('quiz_started', { theme: s.theme, language: lang }); viewed.current = new Set(); applyState(s); }
    catch (e) { if (e instanceof ApiError && e.code === 'campaign_unavailable') { setClosedState((e.data && e.data.state) || 'disabled'); setPhase('closed'); } else setErr(e); }
    finally { setBusy(false); }
  };

  const answer = async (q, optionId) => {
    setBusy(true); setErr(null); const t0 = Date.now();
    try {
      const s = await quizApi.answer(q.id, optionId, lang);
      quizTrack('quiz_answer_submitted', { theme: st.theme, question_id: q.id, position: q.position, duration_ms: Date.now() - t0, language: lang });
      setLive(s.status === 'completed' ? t('result.title') : t('quiz.progress', { n: (s.question ? s.question.position : q.position) + 1, total: q.total }));
      applyState(s, { justCompleted: s.status === 'completed' });
    } catch (e) {
      quizTrack('quiz_error', { step: 'answer', error_code: e instanceof ApiError ? e.code : 'unknown' });
      if (e instanceof ApiError && e.status === 401) await loadState(); else setErr(e);
    } finally { setBusy(false); }
  };

  const resendReward = async () => {
    setBusy(true); setResendMsg(null);
    try { await quizApi.resendReward(lang); setResendMsg(t('result.resendDone')); setSt(await quizApi.state(lang)); }
    catch (e) { setResendMsg(e instanceof ApiError && e.status === 429 ? t('result.resendWait') : errMsg(t, e)); }
    finally { setBusy(false); }
  };

  const afterVerified = async () => {
    const s = await loadState();
    if (s && s.result) quizTrack('quiz_reward_email_status', { status: s.result.email, tier: s.result.tier });
  };

  let screen = null; let key = phase;
  switch (phase) {
    case 'boot': screen = <Spinner label={t('loading')} />; break;
    case 'verifying': screen = <Spinner label={t('verify.linkTitle')} />; break;
    case 'error': screen = <ErrorBox t={t} onRetry={boot}>{errMsg(t, err)}</ErrorBox>; break;
    case 'closed': screen = <ClosedView t={t} lang={lang} state={closedState} cfg={cfg} />; break;
    case 'lang': screen = <LanguageStep t={t} suggested={lang} m={m} onPick={(l) => { changeLang(l); setPhase('rules'); }} />; break;
    case 'rules': screen = <RulesStep t={t} lang={lang} cfg={cfg} onStart={startQuiz} busy={busy} error={err ? errMsg(t, err) : null} m={m} />; break;
    case 'quiz': key = `q-${st && st.question ? st.question.id : ''}`; screen = st && st.question ? <QuestionView t={t} st={st} resumed={resumed} onAnswer={answer} busy={busy} error={err ? errMsg(t, err) : null} onRetry={() => setErr(null)} m={m} /> : <Spinner label={t('loading')} />; break;
    case 'claim': screen = <ClaimStep t={t} lang={lang} cfg={cfg} st={st} initial={formData} m={m} onDone={(f) => { setFormData(f); setEmail(f.email.trim()); saveEmail(f.email.trim()); setPhase('pending'); }} onClosed={(s) => { setClosedState(s || 'disabled'); setPhase('closed'); }} />; break;
    case 'pending': screen = <PendingStep t={t} lang={lang} st={st} email={email} m={m} onVerified={afterVerified} onEdit={() => setPhase('claim')} />; break;
    case 'link_failed': screen = <LinkFailed t={t} lang={lang} m={m} onSent={async (e) => { setEmail(e); saveEmail(e); await loadState(); }} />; break;
    case 'claimed': screen = <ClaimedView t={t} lang={lang} st={st} cfg={cfg} onResend={resendReward} resendMsg={resendMsg} resendBusy={busy} m={m} />; break;
    case 'already': screen = <ClaimedView t={t} lang={lang} st={st} cfg={cfg} onResend={resendReward} resendMsg={resendMsg} resendBusy={busy} already m={m} />; break;
    default: screen = null;
  }

  return (
    <div className="bdq" lang={lang} data-testid="quiz-root">
      <QuizScene />
      <a href="#bdq-main" className="bdq-skip">{t('skipToContent')}</a>
      <header className="bdq-header">
        <div className="max-w-xl mx-auto px-4 pt-3 pb-3 flex items-center justify-between gap-3">
          <a href="/halloween" aria-label={t('footer.hello')} className="shrink-0">
            <img src="/images/branding/baila-logo-red.png" alt="Baila Dembow" width="960" height="395" style={{ height: 44, width: 'auto', display: 'block' }} />
          </a>
          <div className="flex items-center gap-2">
            <div role="group" aria-label={t('languageLabel')} className="flex gap-1" data-testid="quiz-lang-switch">
              {LANGS.map((l) => (
                <button key={l} type="button" lang={l} className="bdq-chip" aria-pressed={l === lang} aria-label={LANG_NAMES[l]} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
              ))}
            </div>
            <MusicControl t={t} />
          </div>
        </div>
      </header>
      <div id="bdq-main" className="max-w-xl mx-auto px-4 pt-6 pb-28">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={key} className="bdq-enter" initial={m.step.initial} animate={m.step.animate} exit={m.step.exit} transition={m.step.transition}>
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>
      <footer className="bdq-footer max-w-xl mx-auto px-4 pb-10 text-sm flex flex-wrap gap-x-5 gap-y-2">
        <a href="/terms">{t('footer.terms')}</a>
        <a href="/privacy">{t('footer.privacy')}</a>
        {consent && <button type="button" className="underline text-[var(--bdq-dim)]" onClick={consent.openPreferences}>{t('footer.cookies')}</button>}
        <a href="/halloween">{t('footer.hello')}</a>
      </footer>
      <div className="sr-only" aria-live="polite" role="status">{live}</div>
    </div>
  );
};

export default QuizPage;
