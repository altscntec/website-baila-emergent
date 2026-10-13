import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './quiz.css';
import { quizApi, ApiError } from './api';
import { makeT, LANGS, LANG_NAMES, suggestLanguage, fmtDate } from './strings';
import { countryOptions } from './countries';
import { captureAttribution, getAttribution } from './attribution';
import { quizTrack, scoreBand } from './analytics';
import { takeVerificationToken, peekVerificationToken } from './earlyBoot';
import { MusicControl } from './MusicControl';
import { EVENTS } from '../utils/constants';
import { useCookieConsent } from '../context/CookieConsentContext';

const LANG_KEY = 'bd_quiz_lang';
const HALLOWEEN = EVENTS.find((e) => e.landing_page === '/halloween');
const readLang = () => { try { const l = localStorage.getItem(LANG_KEY); return LANGS.includes(l) ? l : null; } catch (_) { return null; } };
const saveLang = (l) => { try { localStorage.setItem(LANG_KEY, l); } catch (_) { /* storage blocked: fine */ } };

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

// Moves keyboard/screen-reader focus to the new step's heading whenever the step (or question) changes, so people
// are not left on a button that no longer exists. The very first heading of a page load is not focused (that would
// scroll and steal focus from the browser's own page-load behaviour).
let headingsMounted = 0;
const useFocusOnChange = (dep) => {
  const ref = useRef(null);
  useEffect(() => {
    if (headingsMounted++ === 0) return;
    if (ref.current) ref.current.focus({ preventScroll: false });
  }, [dep]);
  return ref;
};

const Spinner = ({ label }) => (
  <p className="flex items-center gap-3 text-[var(--bdq-dim)]" role="status"><span className="bdq-spinner" aria-hidden="true" /> {label}</p>
);
const ErrorBox = ({ children, onRetry, t }) => (
  <div className="bdq-card" role="alert" style={{ borderColor: '#ff7a7a' }}>
    <p>{children}</p>
    {onRetry && <button type="button" className="bdq-btn bdq-btn-ghost mt-4" onClick={onRetry}>{t('retry')}</button>}
  </div>
);

// ---------------------------------------------------------------- language step
const LanguageStep = ({ t, suggested, onPick }) => {
  const h = useFocusOnChange('lang');
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('lang.title')}</h1>
      <p className="text-[var(--bdq-dim)]">{t('lang.intro')}</p>
      <div className="space-y-3">
        {LANGS.map((l) => (
          <button key={l} type="button" lang={l} className={`bdq-btn ${l === suggested ? '' : 'bdq-btn-ghost'}`} onClick={() => onPick(l)} data-testid={`quiz-lang-${l}`}>
            {LANG_NAMES[l]}{l === suggested ? ` · ${makeT(l)('lang.suggested')}` : ''}
          </button>
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- rules
const RulesStep = ({ t, lang, cfg, onStart }) => {
  const h = useFocusOnChange('rules');
  return (
    <section className="bdq-enter space-y-6" aria-labelledby="bdq-h">
      <div>
        <p className="font-extrabold tracking-widest text-xs text-[var(--bdq-orange)] uppercase mb-2">{t('rules.kicker')}</p>
        <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl sm:text-5xl" data-testid="quiz-headline">{t('rules.headline')}</h1>
      </div>
      <div className="bdq-card space-y-4">
        <h2 className="text-2xl">{t('rules.howTitle')}</h2>
        <ol className="space-y-3 list-decimal pl-5 text-[var(--bdq-dim)]">
          <li>{t('rules.r1')}</li>
          <li>
            {t('rules.r2')}
            <div className="mt-3 space-y-2 text-[var(--bdq-text)]">
              {[['tier5', 5], ['tier10', 10], ['tier15', 15]].map(([k, v]) => (
                <div className="bdq-tier" key={k}><span>{t(`rules.${k}`)}</span><strong>{t('rules.tierResult', { tier: v })}</strong></div>
              ))}
            </div>
          </li>
          <li>{t('rules.r3')}</li>
          <li>{t('rules.r4')}</li>
          <li>{t('rules.r5')}{cfg && cfg.codeExpiresAt ? ` ${t('rules.r5b', { date: fmtDate(cfg.codeExpiresAt, lang) })}` : ''}</li>
          <li>{t('rules.r6')}</li>
          <li>{t('rules.r7')}</li>
        </ol>
        <p className="text-sm text-[var(--bdq-dim)]"><a href="/terms" target="_blank" rel="noopener noreferrer">{t('rules.terms')}</a></p>
      </div>
      <div>
        <button type="button" className="bdq-btn" onClick={onStart} data-testid="quiz-start-cta">{t('rules.cta')}</button>
        <p className="text-center text-sm text-[var(--bdq-dim)] mt-3">{t('rules.time')}</p>
      </div>
    </section>
  );
};

// ---------------------------------------------------------------- form
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

const SignupForm = ({ t, lang, cfg, initial, onDone, onClosed }) => {
  const h = useFocusOnChange('form');
  const [f, setF] = useState(initial || { fullName: '', email: '', age: '', gender: '', genderSelf: '', city: '', country: '', acceptTerms: false, marketingOptIn: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [apiErr, setApiErr] = useState(null);
  const summaryRef = useRef(null);
  const countries = useMemo(() => countryOptions(lang), [lang]);
  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    setErrors((p) => { if (!p[k]) return p; const n = { ...p }; delete n[k]; return n; });   // clear a field's error as soon as it is edited
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
      quizTrack('quiz_form_success', { language: lang });
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
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('form.title')}</h1>
      <p className="text-[var(--bdq-dim)]">
        {t('form.why')} <a href="/privacy" target="_blank" rel="noopener noreferrer">{t('form.privacy')}</a>
      </p>
      <form onSubmit={submit} noValidate className="space-y-5" data-testid="quiz-form">
        {Object.keys(errors).length > 0 && (
          <div ref={summaryRef} tabIndex={-1} role="alert" className="bdq-card" style={{ borderColor: '#ff7a7a' }}>{t('form.summary')}</div>
        )}
        <Field id="fullName" label={t('form.fullName')} error={errors.fullName} t={t}>
          <input id="fullName" className="bdq-input" autoComplete="name" value={f.fullName} onChange={set('fullName')} maxLength={100} {...aria('fullName')} />
        </Field>
        <Field id="email" label={t('form.email')} error={errors.email} t={t}>
          <input id="email" type="email" inputMode="email" autoComplete="email" autoCapitalize="none" className="bdq-input" value={f.email} onChange={set('email')} maxLength={254} {...aria('email')} />
        </Field>
        <Field id="age" label={t('form.age')} error={errors.age} help={t('form.ageHelp')} t={t}>
          <input id="age" inputMode="numeric" pattern="[0-9]*" autoComplete="off" className="bdq-input" value={f.age} onChange={set('age')} maxLength={3} {...aria('age', true)} />
        </Field>
        <Field id="gender" label={t('form.gender')} error={errors.gender} t={t}>
          <select id="gender" className="bdq-input" value={f.gender} onChange={set('gender')} {...aria('gender')}>
            <option value="">{t('form.genderPick')}</option>
            {['woman', 'man', 'non_binary', 'self_describe', 'prefer_not_to_say'].map((g) => <option key={g} value={g}>{t(`form.genders.${g}`)}</option>)}
          </select>
        </Field>
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

        <div className="bdq-card space-y-4">
          <div>
            <label className="flex gap-3 items-start cursor-pointer">
              <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#ff6b00]" checked={f.acceptTerms} onChange={set('acceptTerms')} aria-invalid={errors.acceptTerms ? 'true' : undefined} aria-describedby={errors.acceptTerms ? 'acceptTerms-err' : undefined} data-testid="quiz-accept" />
              <span>
                {(() => { const [a, b] = t('form.accept', { privacy: '\u0000' }).split('\u0000'); return (<>{a}<a href="/privacy" target="_blank" rel="noopener noreferrer">{t('form.privacy')}</a>{b}</>); })()}
                {' '}<a href="/terms" target="_blank" rel="noopener noreferrer">({t('form.terms')})</a>
              </span>
            </label>
            {errors.acceptTerms && <p className="bdq-err" id="acceptTerms-err" role="alert">{t('form.err.acceptTerms')}</p>}
          </div>
          <fieldset className="border-t border-[var(--bdq-line)] pt-4">
            <legend className="sr-only">{t('form.marketingLegend')}</legend>
            <label className="flex gap-3 items-start cursor-pointer">
              {/* Separate, optional and UNCHECKED by default. Wording is served by the API so the stored consent text is exactly what was shown. */}
              <input type="checkbox" className="mt-1 w-6 h-6 shrink-0 accent-[#ff6b00]" checked={f.marketingOptIn} onChange={set('marketingOptIn')} data-testid="quiz-marketing" />
              <span className="text-[var(--bdq-dim)]">{marketingText}</span>
            </label>
          </fieldset>
        </div>

        {apiErr && <ErrorBox t={t}>{apiErr}</ErrorBox>}
        <button type="submit" className="bdq-btn" disabled={busy} data-testid="quiz-form-submit">{busy ? t('form.sending') : t('form.submit')}</button>
      </form>
    </section>
  );
};

// ---------------------------------------------------------------- check email
const CheckEmail = ({ t, lang, cfg, email, onVerified, onEdit }) => {
  const h = useFocusOnChange('check');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [info, setInfo] = useState(null);
  const verify = async (ev) => {
    ev.preventDefault();
    setMsg(null); setInfo(null); setBusy(true);
    try { await quizApi.verifyCode(email, code.trim()); quizTrack('quiz_verification_completed', { language: lang }); await onVerified(); }
    catch (e) { quizTrack('quiz_verification_failed', { error_code: e instanceof ApiError ? e.code : 'unknown' }); setMsg(errMsg(t, e)); }
    finally { setBusy(false); }
  };
  const resend = async () => {
    setMsg(null); setInfo(null); setBusy(true);
    try { await quizApi.resend(email, lang); setInfo(t('verify.resent')); quizTrack('quiz_verification_requested', { language: lang, kind: 'resend' }); }
    catch (e) { setMsg(errMsg(t, e)); } finally { setBusy(false); }
  };
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('verify.title')}</h1>
      <p className="text-[var(--bdq-dim)]">{t('verify.body', { email })}</p>
      <form onSubmit={verify} className="bdq-card space-y-4" noValidate>
        <div className="bdq-field">
          <label htmlFor="code">{t('verify.codeLabel')}</label>
          <input id="code" className="bdq-input" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} style={{ fontSize: 24, letterSpacing: '0.4em', textAlign: 'center' }} data-testid="quiz-code" />
        </div>
        {msg && <p className="bdq-err" role="alert">{msg}</p>}
        {info && <p role="status" className="text-[#9fe3b0]">{info}</p>}
        <button type="submit" className="bdq-btn" disabled={busy || code.length !== 6} data-testid="quiz-verify-submit">{busy ? t('verify.verifying') : t('verify.submit')}</button>
      </form>
      <p className="text-sm text-[var(--bdq-dim)]">{t('verify.hint', { minutes: 30 })}</p>
      <div className="flex flex-col gap-3">
        <button type="button" className="bdq-btn bdq-btn-ghost" onClick={resend} disabled={busy} data-testid="quiz-resend">{t('verify.resend')}</button>
        <button type="button" className="bdq-chip" onClick={onEdit}>{t('verify.edit')}</button>
      </div>
    </section>
  );
};

const LinkFailed = ({ t, lang, onSent }) => {
  const h = useFocusOnChange('linkfailed');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const send = async (ev) => {
    ev.preventDefault(); setBusy(true); setMsg(null);
    try { await quizApi.resend(email.trim(), lang); onSent(email.trim()); } catch (e) { setMsg(errMsg(t, e)); } finally { setBusy(false); }
  };
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('verify.linkFailed')}</h1>
      <p className="text-[var(--bdq-dim)]">{t('verify.linkFailedHelp')}</p>
      <form onSubmit={send} className="bdq-card space-y-4">
        <div className="bdq-field"><label htmlFor="remail">{t('verify.emailLabel')}</label>
          <input id="remail" type="email" className="bdq-input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {msg && <p className="bdq-err" role="alert">{msg}</p>}
        <button type="submit" className="bdq-btn" disabled={busy || !email.includes('@')}>{t('verify.resend')}</button>
      </form>
    </section>
  );
};

// ---------------------------------------------------------------- ready / quiz / result
const ReadyStep = ({ t, onStart, busy, error }) => {
  const h = useFocusOnChange('ready');
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{t('ready.title')}</h1>
      <p className="text-[var(--bdq-dim)]">{t('ready.body')}</p>
      {error && <ErrorBox t={t}>{error}</ErrorBox>}
      <button type="button" className="bdq-btn" onClick={onStart} disabled={busy} data-testid="quiz-begin">{busy ? t('loading') : t('ready.cta')}</button>
    </section>
  );
};

const QuestionView = ({ t, st, resumed, onAnswer, busy, error, onRetry }) => {
  const q = st.question;
  const [choice, setChoice] = useState('');
  const h = useFocusOnChange(q.id);
  useEffect(() => { setChoice(''); }, [q.id]);
  const pct = Math.round((st.progress.answered / st.progress.total) * 100);
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 className="sr-only">{t('rules.kicker')}: {t(`quiz.themes.${st.theme}`)}</h1>
      <div>
        <div className="flex justify-between items-center text-sm font-bold mb-2">
          <span>{t('quiz.progress', { n: q.position + 1, total: q.total })}</span>
          <span className="text-[var(--bdq-dim)]">{t('quiz.theme')}: {t(`quiz.themes.${st.theme}`)}</span>
        </div>
        <div className="bdq-progress" role="progressbar" aria-label={t('quiz.progressLabel')} aria-valuemin={0} aria-valuemax={q.total} aria-valuenow={st.progress.answered}><span style={{ width: `${pct}%` }} /></div>
      </div>
      {resumed && q.position > 0 && <p role="status" className="text-[#9fe3b0] text-sm">{t('quiz.resumed')}</p>}
      <form onSubmit={(e) => { e.preventDefault(); if (choice) onAnswer(q, choice); }} className="space-y-4">
        <fieldset className="space-y-3" disabled={busy}>
          <legend ref={h} tabIndex={-1} className="text-2xl sm:text-3xl font-extrabold leading-snug mb-4" id="bdq-h" data-testid="quiz-question">{q.prompt}</legend>
          {q.options.map((o) => (
            <div key={o.id}>
              <input type="radio" className="peer sr-only" name="answer" id={`opt-${q.id}-${o.id}`} value={o.id} checked={choice === o.id} onChange={() => setChoice(o.id)} />
              <label className="bdq-option" htmlFor={`opt-${q.id}-${o.id}`} data-testid="quiz-option">{o.text}</label>
            </div>
          ))}
        </fieldset>
        {error && <ErrorBox t={t} onRetry={choice ? onRetry : undefined}>{error}</ErrorBox>}
        <button type="submit" className="bdq-btn" disabled={!choice || busy} data-testid="quiz-lock">{busy ? t('quiz.saving') : t('quiz.lock')}</button>
        {!choice && <p className="text-center text-sm text-[var(--bdq-dim)]">{t('quiz.pick')}</p>}
      </form>
    </section>
  );
};

const MAIL_FINAL = new Set(['delivered', 'bounced', 'complained', 'failed', 'waiting_for_inventory']);

const ResultView = ({ t, lang, st, cfg, onResend, resendMsg, resendBusy }) => {
  const h = useFocusOnChange('result');
  const r = st.result;
  const mail = r.email || 'none';
  const canResend = r.reward === 'issued';
  return (
    <section className="bdq-enter space-y-6" aria-labelledby="bdq-h">
      <div className="text-center space-y-2">
        <p className="font-extrabold tracking-widest text-xs text-[var(--bdq-orange)] uppercase">{t('result.title')}</p>
        <div className="bdq-score" aria-hidden="true">{r.score}/{r.total}</div>
        <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-3xl">{t('result.score', { score: r.score, total: r.total })}</h1>
        <p className="text-xl font-extrabold" data-testid="quiz-earned">{t('result.earned', { tier: r.tier })}</p>
      </div>
      <div className="bdq-card space-y-3" data-testid="quiz-mail-status">
        <h2 className="text-xl">{t('result.emailTitle')}</h2>
        <p role="status" aria-live="polite">{t(`result.mail.${mail}`)}</p>
        <p className="text-sm text-[var(--bdq-dim)]">{t('result.codeNote')}</p>
        {cfg && cfg.codeExpiresAt && <p className="text-sm text-[var(--bdq-dim)]">{t('result.valid', { date: fmtDate(cfg.codeExpiresAt, lang) })}</p>}
        {canResend && (
          <button type="button" className="bdq-btn bdq-btn-ghost" onClick={onResend} disabled={resendBusy} data-testid="quiz-resend-reward">{t('result.resend')}</button>
        )}
        {resendMsg && <p role="status" className="text-sm">{resendMsg}</p>}
      </div>
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
      <div className="space-y-2">
        <a className="bdq-btn" style={{ textDecoration: 'none' }} href={HALLOWEEN.ticket_url} target="_blank" rel="noopener noreferrer"
          onClick={() => quizTrack('quiz_ticket_click', { tier: r.tier, language: lang })} data-testid="quiz-tickets">{t('result.tickets')}</a>
        <p className="text-center text-sm text-[var(--bdq-dim)]">{t('result.ticketsHelp')}</p>
      </div>
    </section>
  );
};

const ClosedView = ({ t, lang, state, cfg }) => {
  const h = useFocusOnChange('closed');
  const msg = state === 'not_open' ? t('closed.not_open', { date: fmtDate(cfg && cfg.opensAt, lang) }) : t(`closed.${state === 'closed' ? 'closed' : 'disabled'}`);
  return (
    <section className="bdq-enter space-y-5" aria-labelledby="bdq-h">
      <h1 id="bdq-h" ref={h} tabIndex={-1} className="text-4xl">{msg}</h1>
      <a className="bdq-btn" style={{ textDecoration: 'none' }} href="/halloween">{t('closed.tickets')}</a>
    </section>
  );
};

// ---------------------------------------------------------------- page
export const QuizPage = ({ mode = 'quiz' }) => {
  const stored = readLang();
  const [lang, setLang] = useState(stored || suggestLanguage());
  const [langPicked, setLangPicked] = useState(Boolean(stored));
  const [cfg, setCfg] = useState(null);
  const [phase, setPhase] = useState('boot');
  const [st, setSt] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formData, setFormData] = useState(null);
  const [email, setEmail] = useState('');
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

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const applyState = useCallback((s, { fromResume = false, justCompleted = false } = {}) => {
    setSt(s);
    if (s.campaign.state === 'disabled') { setClosedState('disabled'); setPhase('closed'); return; }
    if (s.status === 'completed') {
      setPhase('result');
      if (justCompleted) {
        quizTrack('quiz_completed', { theme: s.theme, tier: s.result.tier, score_band: scoreBand(s.result.tier), language: langRef.current });
        quizTrack('quiz_discount_earned', { theme: s.theme, tier: s.result.tier, language: langRef.current });
        quizTrack('quiz_reward_email_status', { status: s.result.email, tier: s.result.tier });
      }
    } else if (s.status === 'in_progress') { setPhase('quiz'); setResumed(fromResume); }
    else setPhase('ready');
  }, []);

  const intro = useCallback((c, picked) => {
    if (c.state !== 'open') { setClosedState(c.state); setPhase('closed'); return; }
    setPhase(picked ? 'rules' : 'lang');
  }, []);

  const loadSession = useCallback(async (opts) => {
    const s = await quizApi.state(langRef.current);
    if (!readLang() && s.participant && s.participant.language) { setLang(s.participant.language); langRef.current = s.participant.language; }
    applyState(s, opts);
    return s;
  }, [applyState]);

  const verifyLink = useCallback(async (token) => {
    setPhase('verifying');
    try {
      if (!token) throw new ApiError(400, 'invalid_or_expired');
      await quizApi.verifyToken(token);
      quizTrack('quiz_verification_completed', { language: langRef.current, kind: 'link' });
      window.history.replaceState(null, '', '/halloween/quiz');
      await loadSession({ fromResume: true });
    } catch (e) {
      quizTrack('quiz_verification_failed', { error_code: e instanceof ApiError ? e.code : 'unknown' });
      if (e instanceof ApiError && e.code === 'invalid_or_expired') { setPhase('link_failed'); } else { setErr(e); setPhase('error'); }
    }
  }, [loadSession]);

  const boot = useCallback(async () => {
    setPhase('boot'); setErr(null);
    captureAttribution();
    let c;
    try { c = await quizApi.config(); setCfg(c); } catch (e) { setErr(e); setPhase('error'); return; }
    const token = takeVerificationToken();
    if (token || mode === 'verify') { await verifyLink(token); return; }
    try { await loadSession({ fromResume: true }); return; }
    catch (e) { if (!(e instanceof ApiError && e.status === 401)) { setErr(e); setPhase('error'); return; } }
    intro(c, Boolean(readLang()));
  }, [intro, loadSession, mode, verifyLink]);

  useEffect(() => {
    if (booted.current) return;   // a ref survives React StrictMode's simulated remount, so boot runs once
    booted.current = true;
    captureAttribution();
    // A visit that arrives through the emailed verification link is a returning participant, not an ad landing.
    if (mode !== 'verify' && !peekVerificationToken()) {
      quizApi.ping('landing_view', getAttribution(), langRef.current);   // cookieless aggregate counter
      quizTrack('quiz_landing_view', { language: langRef.current });
    }
    boot();
  }, [boot, mode]);

  const changeLang = async (l) => {
    setLang(l); langRef.current = l; saveLang(l); setLangPicked(true);
    quizTrack('quiz_language_selected', { language: l });
    setLive(makeT(l)('languageLabel') + ': ' + LANG_NAMES[l]);
    if (st && ['quiz', 'ready', 'result'].includes(phase)) {
      try { const s = await quizApi.setLanguage(l); setSt(s); } catch (_) { /* wording stays in old language until next call */ }
    }
  };

  // Poll the email status for a while after completion so "delivered / bounced" shows without a reload.
  useEffect(() => {
    if (phase !== 'result' || !st || !st.result || MAIL_FINAL.has(st.result.email)) return undefined;
    let n = 0;
    const id = setInterval(async () => {
      n += 1; if (n > 10) { clearInterval(id); return; }
      try { const s = await quizApi.state(langRef.current); setSt((prev) => { if (prev && prev.result && s.result && prev.result.email !== s.result.email) quizTrack('quiz_reward_email_status', { status: s.result.email, tier: s.result.tier }); return s; }); } catch (_) { /* try next tick */ }
    }, 8000);
    return () => clearInterval(id);
  }, [phase, st]);

  // question viewed (client-side, once per question per page load)
  useEffect(() => {
    if (phase === 'quiz' && st && st.question && !viewed.current.has(st.question.id)) {
      viewed.current.add(st.question.id);
      quizTrack('quiz_question_viewed', { theme: st.theme, question_id: st.question.id, position: st.question.position, language: langRef.current });
    }
  }, [phase, st]);

  const onStartCta = () => { quizTrack('quiz_start_click', { language: lang }); quizApi.ping('start_click', getAttribution(), lang); setPhase('form'); };

  const beginQuiz = async () => {
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
      if (e instanceof ApiError && e.status === 401) { setPhase('lang'); setErr(null); intro(cfg || { state: 'open' }, true); }
      else setErr(e);
    } finally { setBusy(false); }
  };

  const resendReward = async () => {
    setBusy(true); setResendMsg(null);
    try { await quizApi.resendReward(lang); setResendMsg(t('result.resendDone')); const s = await quizApi.state(lang); setSt(s); }
    catch (e) { setResendMsg(e instanceof ApiError && e.status === 429 ? t('result.resendWait') : errMsg(t, e)); }
    finally { setBusy(false); }
  };

  const retryAnswer = () => setErr(null);

  let screen = null;
  switch (phase) {
    case 'boot': screen = <Spinner label={t('loading')} />; break;
    case 'verifying': screen = <Spinner label={t('verify.linkTitle')} />; break;
    case 'error': screen = <ErrorBox t={t} onRetry={boot}>{errMsg(t, err)}</ErrorBox>; break;
    case 'closed': screen = <ClosedView t={t} lang={lang} state={closedState} cfg={cfg} />; break;
    case 'lang': screen = <LanguageStep t={t} suggested={lang} onPick={(l) => { changeLang(l); setPhase('rules'); }} />; break;
    case 'rules': screen = <RulesStep t={t} lang={lang} cfg={cfg} onStart={onStartCta} />; break;
    case 'form': screen = <SignupForm t={t} lang={lang} cfg={cfg} initial={formData} onDone={(f) => { setFormData(f); setEmail(f.email.trim()); setPhase('check'); }} onClosed={(s) => { setClosedState(s || 'disabled'); setPhase('closed'); }} />; break;
    case 'check': screen = <CheckEmail t={t} lang={lang} cfg={cfg} email={email} onVerified={() => loadSession()} onEdit={() => setPhase('form')} />; break;
    case 'link_failed': screen = <LinkFailed t={t} lang={lang} onSent={(e) => { setEmail(e); setPhase('check'); }} />; break;
    case 'ready': screen = <ReadyStep t={t} onStart={beginQuiz} busy={busy} error={err ? errMsg(t, err) : null} />; break;
    case 'quiz': screen = st && st.question ? <QuestionView t={t} st={st} resumed={resumed} onAnswer={answer} busy={busy} error={err ? errMsg(t, err) : null} onRetry={retryAnswer} /> : <Spinner label={t('loading')} />; break;
    case 'result': screen = <ResultView t={t} lang={lang} st={st} cfg={cfg} onResend={resendReward} resendMsg={resendMsg} resendBusy={busy} />; break;
    default: screen = null;
  }

  return (
    <div className="bdq" lang={lang} data-testid="quiz-root">
      <a href="#bdq-main" className="bdq-skip">{t('skipToContent')}</a>
      <header className="max-w-xl mx-auto px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
        <a href="/halloween" aria-label={t('footer.hello')}><img src="/images/branding/baila-logo-white.png" alt="Baila Dembow" width="120" height="40" style={{ height: 40, width: 'auto' }} /></a>
        <div className="flex items-center gap-2 flex-wrap">
          <div role="group" aria-label={t('languageLabel')} className="flex gap-1" data-testid="quiz-lang-switch">
            {LANGS.map((l) => (
              <button key={l} type="button" lang={l} className="bdq-chip" aria-pressed={l === lang} aria-label={LANG_NAMES[l]} onClick={() => changeLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
          <MusicControl t={t} />
        </div>
      </header>
      <div id="bdq-main" className="max-w-xl mx-auto px-4 pt-6 pb-24">{screen}</div>
      <footer className="max-w-xl mx-auto px-4 pb-10 text-sm text-[var(--bdq-dim)] flex flex-wrap gap-x-5 gap-y-2">
        <a href="/terms">{t('footer.terms')}</a>
        <a href="/privacy">{t('footer.privacy')}</a>
        {consent && <button type="button" className="underline" onClick={consent.openPreferences}>{t('footer.cookies')}</button>}
        <a href="/halloween">{t('footer.hello')}</a>
      </footer>
      <div className="sr-only" aria-live="polite" role="status">{live}</div>
    </div>
  );
};

export default QuizPage;
