import { useEffect, useMemo, useState } from 'react';
import './quiz.css';
import { quizApi } from './api';
import { makeT, LANGS, LANG_NAMES, suggestLanguage } from './strings';
import { takeVerificationToken } from './earlyBoot';

// One-click-style unsubscribe for promotional email. The signed token arrives in the URL fragment (moved into
// memory by earlyBoot before any analytics can read it); the unsubscribe happens only after an explicit tap.
export const UnsubscribePage = () => {
  const [lang, setLang] = useState(() => { try { const l = localStorage.getItem('bd_quiz_lang'); if (LANGS.includes(l)) return l; } catch (_) { /* ignore */ } return suggestLanguage(); });
  const t = useMemo(() => makeT(lang), [lang]);
  const [token] = useState(() => takeVerificationToken());
  const [state, setState] = useState('ask');
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const go = async () => {
    setState('busy');
    try { await quizApi.unsubscribe(token); setState('done'); } catch (_) { setState('failed'); }
  };
  return (
    <div className="bdq" lang={lang}>
      <header className="max-w-xl mx-auto px-4 pt-4 flex justify-between items-center">
        <img src="/images/branding/baila-logo-white.png" alt="Baila Dembow" style={{ height: 40, width: 'auto' }} />
        <div role="group" aria-label={t('languageLabel')} className="flex gap-1">
          {LANGS.map((l) => <button key={l} type="button" lang={l} className="bdq-chip" aria-pressed={l === lang} aria-label={LANG_NAMES[l]} onClick={() => setLang(l)}>{l.toUpperCase()}</button>)}
        </div>
      </header>
      <div className="max-w-xl mx-auto px-4 pt-10 space-y-5">
        <h1 className="text-4xl">{t('unsub.title')}</h1>
        {!token && <p role="alert">{t('unsub.failed')}</p>}
        {token && state === 'ask' && (<><p className="text-[var(--bdq-dim)]">{t('unsub.body')}</p><button type="button" className="bdq-btn" onClick={go}>{t('unsub.cta')}</button></>)}
        {state === 'busy' && <p role="status">{t('loading')}</p>}
        {state === 'done' && <p role="status">{t('unsub.done')}</p>}
        {state === 'failed' && <p role="alert">{t('unsub.failed')}</p>}
      </div>
    </div>
  );
};
export default UnsubscribePage;
