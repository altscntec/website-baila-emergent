import { useState, useEffect, useRef, createContext, useContext, useMemo } from 'react';

/* ─────────────────────────────────────────────────────────────────────────
 * PADEL × REGGAETON — standalone branded landing page
 * Aesthetic: Wimbledon programme × Rolex × Lacoste polo × Nike
 * Route: /#/events/PadelXReggaeton (and /#/events/padel-x-reggaeton)
 * Languages: EN (default) · NL  — toggle in top-right of hero
 * ───────────────────────────────────────────────────────────────────────── */

// Restrained palette
const C = {
  cream:    '#F4EDE0',
  ivory:    '#FAF7F0',
  ink:      '#141414',
  charcoal: '#2A2A2A',
  green:    '#0F4F2E',
  greenDk:  '#083922',
  gold:     '#C8A659',
  goldDk:   '#9F8233',
  clay:     '#B73E36',
  pink:     '#FF1A6B',
  hair:     'rgba(20,20,20,0.12)',
};

/* ─────────── i18n strings ─────────── */
const COPY = {
  en: {
    kicker_loc: 'Amsterdam · 2026',
    kicker_prog: 'Programme №01',
    credit: 'A House Decoded Production',
    cta_tickets: 'Get Tickets',
    cta_register: 'Tournament Registration',
    cta_whatsapp: 'Join the Padel Community',

    strip_discipline_k: 'Date',     strip_discipline_v: 'Sun · 7 Jun 2026',
    strip_soundtrack_k: 'Time',      strip_soundtrack_v: '16:00 – 21:30',
    strip_format_k: 'Venue',         strip_format_v: 'Padeldam · Amsterdam',
    strip_tickets_k: 'Tickets',      strip_tickets_v: 'Live Below',

    marquee: ['Where the court meets the dance floor', 'PADEL × REGGAETON', 'House Decoded · Baila Dembow', 'Open Play · Doubles · Live DJ', 'Amsterdam 2026'],

    about_kicker: 'The Event',
    about_h2_l1: 'A day on court.',
    about_h2_l2: 'A night on the floor.',
    about_intro_strong: 'Padel X Reggaeton',
    about_intro_tail: 'Where the court meets the dance floor.',
    about_p1: "Padel X Reggaeton is a day event built around two things we love: good rallies and good music. Bring your racquet, bring your crew, and spend the day playing padel while live DJs run Reggaeton, Dembow, and Latin hits through the speakers. 🌴☀️",
    about_p2: "Whether you're a regular on court or you've never held a racquet before, there's a spot for you. Expect open play sessions, mini tournaments, beginner-friendly games, and plenty of time to sit court side with a cold drink and enjoy the vibe. 🍹🎧",
    about_p3: "🏐 The volleyball court is open and free to use all day for everyone with a ticket, so if padel isn't your thing — or you just need a break — another game is waiting for you.",
    about_quote: "\"This isn't a tournament just for pros. It's padel the way it should be — loud, social, sweaty, and fun.\" 🔥",

    included_kicker: 'Programme',
    included_h2: "What's included.",
    included_suffix: 'With every ticket',
    included: [
      { icon: '🎾', t: 'Padel Court',      d: 'Padel court access & open play throughout the day.' },
      { icon: '🏐', t: 'Volleyball Court', d: 'Free volleyball court access for all ticket holders.' },
      { icon: '🎶', t: 'Live DJ All Day',  d: 'Reggaeton, Dembow and Latin hits by Baila Dembow.' },
      { icon: '🍹', t: 'Welcome Drink',    d: 'A welcome drink during the first hour on arrival.' },
      { icon: '📸', t: 'Photo & Video',    d: 'Professional photo & video content from the event.' },
    ],

    bring_kicker: 'The Kit',
    bring_h2: 'What to bring.',
    bring: [
      { emoji: '👟', label: 'Sportswear' },
      { emoji: '👟', label: 'Clean indoor trainers' },
      { emoji: '⚡', label: 'Good energy' },
    ],
    bring_note: 'Bring your own racquet — or rent one at the venue.',

    prize_kicker: 'The Trophy',
    prize_h2: 'Tournament Prize.',
    prize_value: 'TBA',
    prize_note: 'The trophy is being polished. Final prize details revealed at opening ceremony.',

    tickets_kicker: 'Official Ticketing',
    tickets_h2: 'Secure your spot.',
    tickets_intro: 'Tickets are released via Weeztix below. Capacity is limited — choose your category, select your seats, and confirm in a single checkout.',
    tickets_banner_kicker: 'Doubles Tournament',
    tickets_banner_body_pre: 'Buying a ',
    tickets_banner_body_strong_1: 'Solo Player Ticket for Doubles Tournament',
    tickets_banner_body_or: ' or a ',
    tickets_banner_body_strong_2: 'Doubles Ticket for Doubles Tournament',
    tickets_banner_body_post: '? Please complete the short registration form so we can seed the draw and (if you\'ve asked us to) find you a partner.',
    tickets_banner_cta: 'Open Registration Form →',

    venue_kicker: 'The Venue',
    venue_h2: 'Padeldam.',
    venue_address_l1: 'Tom Schreursweg 16',
    venue_address_l2: '1067 MC Amsterdam',
    venue_city: 'Amsterdam · Netherlands',
    venue_cta: 'Open in Google Maps ↗',
    venue_note: 'Easy to reach by car, bike or public transport. Free parking on site.',

    modal_kicker: 'Tournament Registration',
    modal_title: 'Padel × Reggaeton — Doubles draw',
    modal_intro: 'All fields are required. Use the same name and email as on your Weeztix ticket so we can match your registration to your seat in the draw.',
    q1: '01. Do you want to join the doubles tournament?',
    q1_yes: 'Yes', q1_no: 'No',
    q2: '02. How many times in a month do you play Padel?',
    q2_opts: ['Select…', '0 (first time)', '1–2 times', '3–5 times', '6–10 times', '10+ times'],
    q3: '03. What is your Playtomic score?',
    q3_ph: "e.g. 2.45  ·  or  'I don't have one yet'",
    q4: '04. Do you have a partner — or should we pair you?',
    q4_opts: [
      { v: 'I have a partner',                  d: 'I will register and bring my partner.' },
      { v: 'Pair me by skill / Playtomic score', d: 'Assign me a partner that matches my level.' },
    ],
    q5: '05. Full name (same as ticket)',
    q6: '06. Email (same as ticket)',
    submit: 'Submit Registration →',
    submit_help: 'We\'ll come back to you with your doubles seeding and partner pairing.',
    submitting: 'Submitting…',
    success_title: 'Registration received.',
    success_body: 'Thanks — we\'ve got your details. We\'ll come back to you with your doubles seeding and partner pairing. See you on court.',
    error_title: 'Couldn\'t submit just now.',
    error_body: 'Our system didn\'t respond. We\'ve opened your email app as a backup — please tap Send to deliver the registration directly.',
    close: 'Close',

    liability_kicker: 'The Fine Print',
    liability_h2_l1: 'Participation, requirements',
    liability_h2_l2: '& liability.',
    liability_h4_1: 'Participation Requirements',
    liability_p1a: 'Participation in the tournament requires a reasonable level of physical fitness and health. By registering for the event, participants confirm that they are physically capable of taking part in sporting activities such as padel.',
    liability_p1b: 'Participants are responsible for assessing their own physical condition and, where necessary, seeking medical advice before participating.',
    liability_h4_2: 'Liability Waiver',
    liability_p2a: "Participation in the tournament and all related activities is entirely at the participant's own risk.",
    liability_p2b_pre: 'The organiser, ',
    liability_p2b_strong: 'House Decoded',
    liability_p2b_post: ', shall not be held responsible for any injuries, physical conditions, accidents, losses, damages, or health-related issues that may occur before, during, or after the event, including those arising from participation in matches, warm-ups, or use of the venue facilities.',
    liability_p2c: 'The organiser is only liable in cases involving intentional misconduct or gross negligence, to the maximum extent permitted under applicable law.',
    liability_p2d: 'Participants are solely responsible for their personal belongings and valuables brought to the event. The organiser accepts no responsibility for lost, stolen, or damaged items.',

    presented: 'Presented by',
    join_padel: 'Join the Padel Community ↗',
    back_baila: '← Back to Baila Dembow',
    copyright: 'House Decoded Events · KVK 67994725',

    gate_kicker: 'Private Preview',
    gate_title: 'Password required',
    gate_body: 'This page is in soft launch. Enter the access password to view the Padel × Reggaeton programme.',
    gate_label: 'Access password',
    gate_submit: 'Unlock →',
    gate_error: 'Wrong password. Try again.',
    gate_help: 'Need access? Ask your host or email ask@housedecoded.com.',
  },

  nl: {
    kicker_loc: 'Amsterdam · 2026',
    kicker_prog: 'Programma №01',
    credit: 'Een productie van House Decoded',
    cta_tickets: 'Koop Tickets',
    cta_register: 'Toernooi Registratie',
    cta_whatsapp: 'Word lid van de Padel Community',

    strip_discipline_k: 'Datum',     strip_discipline_v: 'Zo · 7 jun 2026',
    strip_soundtrack_k: 'Tijd',       strip_soundtrack_v: '16:00 – 21:30',
    strip_format_k: 'Locatie',        strip_format_v: 'Padeldam · Amsterdam',
    strip_tickets_k: 'Tickets',       strip_tickets_v: 'Hieronder',

    marquee: ['Waar de baan de dansvloer ontmoet', 'PADEL × REGGAETON', 'House Decoded · Baila Dembow', 'Open Play · Dubbel · Live DJ', 'Amsterdam 2026'],

    about_kicker: 'Het Evenement',
    about_h2_l1: 'Een dag op de baan.',
    about_h2_l2: 'Een avond op de dansvloer.',
    about_intro_strong: 'Padel X Reggaeton',
    about_intro_tail: 'Waar de baan de dansvloer ontmoet.',
    about_p1: "Padel X Reggaeton is een dagevenement opgebouwd rond twee dingen waar we van houden: goede rally's en goede muziek. Neem je racket mee, neem je crew mee en speel een hele dag padel terwijl live DJ's Reggaeton, Dembow en Latin hits door de speakers laten knallen. 🌴☀️",
    about_p2: "Of je nu vaste klant bent op de baan of nog nooit een racket hebt vastgehouden — er is plek voor jou. Verwacht open play-sessies, mini-toernooien, beginnersvriendelijke partijen en tijd zat om court-side te zitten met een cold drink en te genieten van de vibe. 🍹🎧",
    about_p3: "🏐 De volleybalbaan is de hele dag gratis te gebruiken voor iedereen met een ticket, dus als padel niet jouw ding is — of je gewoon even pauze nodig hebt — staat er een ander spel op je te wachten.",
    about_quote: "\"Dit is geen toernooi alleen voor pro's. Dit is padel zoals het hoort — luid, sociaal, zweterig en leuk.\" 🔥",

    included_kicker: 'Programma',
    included_h2: 'Wat is inbegrepen.',
    included_suffix: 'Bij elk ticket',
    included: [
      { icon: '🎾', t: 'Padelbaan',            d: 'Toegang tot de padelbaan & open play de hele dag.' },
      { icon: '🏐', t: 'Volleybalbaan',        d: 'Gratis toegang tot de volleybalbaan voor alle ticket­houders.' },
      { icon: '🎶', t: 'Live DJ de hele dag',  d: 'Reggaeton, Dembow en Latin hits door Baila Dembow.' },
      { icon: '🍹', t: 'Welkomstdrankje',      d: 'Een welkomstdrankje tijdens het eerste uur bij aankomst.' },
      { icon: '📸', t: 'Foto & Video',         d: 'Professionele foto- & videocontent van het evenement.' },
    ],

    bring_kicker: 'De Uitrusting',
    bring_h2: 'Wat te meenemen.',
    bring: [
      { emoji: '👟', label: 'Sportkleding' },
      { emoji: '👟', label: 'Schone indoor sportschoenen' },
      { emoji: '⚡', label: 'Goede energie' },
    ],
    bring_note: 'Neem je eigen racket mee — of huur er een ter plaatse.',

    prize_kicker: 'De Trofee',
    prize_h2: 'Toernooiprijs.',
    prize_value: 'TBA',
    prize_note: 'De trofee wordt opgepoetst. De definitieve prijsdetails worden onthuld bij de openingsceremonie.',

    tickets_kicker: 'Officiële Ticketverkoop',
    tickets_h2: 'Reserveer je plek.',
    tickets_intro: 'Tickets worden hieronder uitgegeven via Weeztix. De capaciteit is beperkt — kies je categorie, selecteer je plek en bevestig in één checkout.',
    tickets_banner_kicker: 'Dubbel Toernooi',
    tickets_banner_body_pre: 'Koop je een ',
    tickets_banner_body_strong_1: 'Solo Player Ticket for Doubles Tournament',
    tickets_banner_body_or: ' of een ',
    tickets_banner_body_strong_2: 'Doubles Ticket for Doubles Tournament',
    tickets_banner_body_post: '? Vul dan het korte registratieformulier in zodat we de loting kunnen samenstellen en (indien gewenst) een partner voor je kunnen vinden.',
    tickets_banner_cta: 'Open Registratieformulier →',

    venue_kicker: 'De Locatie',
    venue_h2: 'Padeldam.',
    venue_address_l1: 'Tom Schreursweg 16',
    venue_address_l2: '1067 MC Amsterdam',
    venue_city: 'Amsterdam · Nederland',
    venue_cta: 'Open in Google Maps ↗',
    venue_note: 'Goed te bereiken met auto, fiets of OV. Gratis parkeren ter plaatse.',

    modal_kicker: 'Toernooi Registratie',
    modal_title: 'Padel × Reggaeton — Dubbel loting',
    modal_intro: 'Alle velden zijn verplicht. Gebruik dezelfde naam en e-mail als op je Weeztix-ticket zodat we je registratie aan je plek in de loting kunnen koppelen.',
    q1: '01. Wil je meedoen aan het dubbeltoernooi?',
    q1_yes: 'Ja', q1_no: 'Nee',
    q2: '02. Hoe vaak per maand speel je Padel?',
    q2_opts: ['Selecteer…', '0 (eerste keer)', '1–2 keer', '3–5 keer', '6–10 keer', '10+ keer'],
    q3: '03. Wat is je Playtomic-score?',
    q3_ph: "bijv. 2.45  ·  of  'Ik heb er nog geen'",
    q4: '04. Heb je een partner — of zullen we je koppelen?',
    q4_opts: [
      { v: 'Ik heb een partner',                  d: 'Ik registreer en breng mijn partner mee.' },
      { v: 'Koppel me op niveau / Playtomic-score', d: 'Wijs me een partner toe die bij mijn niveau past.' },
    ],
    q5: '05. Volledige naam (zoals op ticket)',
    q6: '06. E-mailadres (zoals op ticket)',
    submit: 'Registratie Indienen →',
    submit_help: 'We komen bij je terug met je dubbel-seeding en partnertoewijzing.',
    submitting: 'Bezig met indienen…',
    success_title: 'Registratie ontvangen.',
    success_body: 'Dank je — we hebben je gegevens binnen. We komen bij je terug met je dubbel-seeding en partnertoewijzing. Tot op de baan.',
    error_title: 'Kon nu niet versturen.',
    error_body: 'Onze server reageerde niet. We hebben je e-mailapp geopend als backup — druk op Verzenden om de registratie direct te bezorgen.',
    close: 'Sluiten',

    liability_kicker: 'De kleine lettertjes',
    liability_h2_l1: 'Deelname, vereisten',
    liability_h2_l2: '& aansprakelijkheid.',
    liability_h4_1: 'Deelnamevoorwaarden',
    liability_p1a: 'Deelname aan het toernooi vereist een redelijk niveau van fysieke conditie en gezondheid. Door je aan te melden voor het evenement bevestigen deelnemers dat zij fysiek in staat zijn om deel te nemen aan sportieve activiteiten zoals padel.',
    liability_p1b: 'Deelnemers zijn zelf verantwoordelijk voor het beoordelen van hun fysieke conditie en, indien nodig, het inwinnen van medisch advies vóór deelname.',
    liability_h4_2: 'Aansprakelijkheidsverklaring',
    liability_p2a: 'Deelname aan het toernooi en alle bijbehorende activiteiten is volledig op eigen risico van de deelnemer.',
    liability_p2b_pre: 'De organisator, ',
    liability_p2b_strong: 'House Decoded',
    liability_p2b_post: ', kan niet aansprakelijk worden gesteld voor enige verwondingen, fysieke aandoeningen, ongevallen, verliezen, schade of gezondheidsgerelateerde problemen die zich vóór, tijdens of na het evenement kunnen voordoen, waaronder die voortvloeien uit deelname aan wedstrijden, warming-ups of het gebruik van de venue-faciliteiten.',
    liability_p2c: 'De organisator is uitsluitend aansprakelijk in gevallen van opzettelijk wangedrag of grove nalatigheid, tot de maximaal toegestane omvang onder toepasselijk recht.',
    liability_p2d: 'Deelnemers zijn als enige verantwoordelijk voor hun persoonlijke bezittingen en waardevolle spullen die zij naar het evenement meenemen. De organisator aanvaardt geen verantwoordelijkheid voor verloren, gestolen of beschadigde voorwerpen.',

    presented: 'Gepresenteerd door',
    join_padel: 'Word lid van de Padel Community ↗',
    back_baila: '← Terug naar Baila Dembow',
    copyright: 'House Decoded Events · KVK 67994725',

    gate_kicker: 'Besloten preview',
    gate_title: 'Wachtwoord vereist',
    gate_body: 'Deze pagina is in soft launch. Voer het toegangswachtwoord in om het Padel × Reggaeton programma te bekijken.',
    gate_label: 'Toegangswachtwoord',
    gate_submit: 'Ontgrendelen →',
    gate_error: 'Verkeerd wachtwoord. Probeer opnieuw.',
    gate_help: 'Toegang nodig? Vraag het je host of mail ask@housedecoded.com.',
  },
};

const LangCtx = createContext({ lang: 'en', t: COPY.en, setLang: () => {} });
const useT = () => useContext(LangCtx);

/* ─────────── primitives ─────────── */
const Pinstripe = ({ className = '' }) => (
  <div
    className={className}
    style={{
      height: 1,
      background: `linear-gradient(to right, transparent 0%, ${C.gold} 20%, ${C.gold} 80%, transparent 100%)`,
    }}
  />
);

const KickerLabel = ({ children, color = C.green }) => (
  <span
    className="inline-block"
    style={{
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      fontSize: 10,
      letterSpacing: '0.35em',
      textTransform: 'uppercase',
      color,
      fontWeight: 600,
    }}
  >
    {children}
  </span>
);

const SerifHeading = ({ children, className = '', style = {} }) => (
  <h2
    className={className}
    style={{
      fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
      fontWeight: 500,
      letterSpacing: '-0.01em',
      color: C.ink,
      lineHeight: 0.95,
      ...style,
    }}
  >
    {children}
  </h2>
);

/* ─────────── Global animations (CTA pop / wiggle / halo) ─────────── */
const PadelGlobalAnimations = () => (
  <style>{`
    /* GET TICKETS — pronounced, attention-grabbing pop + wiggle + halo */
    @keyframes padelCtaPop {
      0%   { transform: scale(0.80); opacity: 0; }
      35%  { transform: scale(1.18); opacity: 1; }
      55%  { transform: scale(0.95); }
      75%  { transform: scale(1.07); }
      100% { transform: scale(1); }
    }
    /* Wiggle now occupies ~22% of a 4s cycle — fires noticeably every few seconds */
    @keyframes padelCtaWiggle {
      0%, 78%, 100% { transform: scale(1) rotate(0deg); }
      80%  { transform: scale(1.08) rotate(-6deg); }
      82%  { transform: scale(1.08) rotate(6deg);  }
      84%  { transform: scale(1.08) rotate(-5deg); }
      86%  { transform: scale(1.08) rotate(5deg);  }
      88%  { transform: scale(1.08) rotate(-3deg); }
      90%  { transform: scale(1.08) rotate(3deg);  }
      92%  { transform: scale(1.06) rotate(-1.5deg); }
      94%  { transform: scale(1.05) rotate(1deg); }
      96%  { transform: scale(1.04) rotate(0); }
    }
    /* Brighter, wider halo with a punchier pulse */
    @keyframes padelCtaHalo {
      0%, 100% {
        box-shadow:
          0 0 0 0   rgba(200,166,89,0),
          0 0 0 0   rgba(15,79,46,0),
          0 8px 22px rgba(15,79,46,0.28);
      }
      50% {
        box-shadow:
          0 0 0 4px  rgba(200,166,89,0.35),
          0 0 0 22px rgba(15,79,46,0),
          0 14px 34px rgba(15,79,46,0.45);
      }
    }
    .padel-cta-tickets {
      animation:
        padelCtaPop      0.85s cubic-bezier(.34, 1.56, .64, 1) both,
        padelCtaWiggle   4s    ease-in-out 1s infinite,
        padelCtaHalo     2s    ease-in-out 1s infinite;
      transform-origin: center;
      will-change: transform, box-shadow;
    }
    .padel-cta-tickets:hover {
      animation-play-state: paused;
      transform: scale(1.1);
      transition: transform .2s cubic-bezier(.34, 1.56, .64, 1);
    }
    .padel-cta-tickets:active {
      transform: scale(0.96);
    }
    .padel-cta-tickets:focus-visible {
      outline: 2px solid #C8A659;
      outline-offset: 4px;
    }
    @media (prefers-reduced-motion: reduce) {
      .padel-cta-tickets { animation: none; }
    }
  `}</style>
);

/* ─────────── Password Gate ─────────── */
const PADEL_PASSWORD = 'thedayrave';
const PADEL_UNLOCK_KEY = 'padel.unlock';

const PasswordGate = ({ children }) => {
  const { t } = useT();
  const [unlocked, setUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(PADEL_UNLOCK_KEY) === PADEL_PASSWORD;
    } catch (_) { return false; }
  });
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!unlocked) setTimeout(() => inputRef.current?.focus(), 50);
  }, [unlocked]);

  if (unlocked) return children;

  const tryUnlock = (e) => {
    e.preventDefault();
    if (value.trim().toLowerCase() === PADEL_PASSWORD) {
      try { window.localStorage.setItem(PADEL_UNLOCK_KEY, PADEL_PASSWORD); } catch (_) {}
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  return (
    <section
      style={{ background: C.cream, color: C.ink, minHeight: '100vh' }}
      data-testid="padel-gate"
    >
      {/* Court line pattern (matches hero motif) */}
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.05, position: 'fixed' }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 700"
      >
        <rect x="40" y="40" width="1120" height="620" fill="none" stroke={C.green} strokeWidth="2" />
        <line x1="40" y1="350" x2="1160" y2="350" stroke={C.green} strokeWidth="2" />
        <line x1="600" y1="40" x2="600" y2="660" stroke={C.green} strokeWidth="2" />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-10">
        <div className="flex items-center justify-between mb-12 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: C.gold }} />
            <KickerLabel>{t.kicker_loc}</KickerLabel>
          </div>
          <LangToggle />
        </div>

        <Pinstripe className="mb-14" />

        <div className="mx-auto" style={{ maxWidth: 540 }}>
          <div className="text-center">
            <img
              src="/images/events/padel-x-reggaeton-badge.png"
              alt="Padel × Reggaeton — The Day Rave · Baila Dembow · 2026"
              className="block mx-auto"
              style={{
                width: 'clamp(180px, 28vw, 240px)',
                height: 'auto',
                userSelect: 'none',
                filter: 'drop-shadow(0 12px 24px rgba(10,40,28,0.18))',
              }}
              draggable={false}
            />
          </div>

          <div
            className="mt-10 p-8 md:p-10"
            style={{
              background: C.ivory,
              border: `1px solid ${C.gold}`,
              boxShadow: '0 20px 50px rgba(10,40,28,0.10)',
            }}
          >
            <KickerLabel color={C.goldDk}>{t.gate_kicker}</KickerLabel>
            <h1 className="mt-3" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 'clamp(28px, 3.6vw, 38px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: C.ink,
            }}>
              {t.gate_title}
            </h1>
            <p className="mt-4" style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 14,
              lineHeight: 1.65,
              color: C.charcoal,
            }}>
              {t.gate_body}
            </p>

            <form onSubmit={tryUnlock} className="mt-7 space-y-3">
              <label htmlFor="padel-pass" style={{
                display: 'block',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: C.charcoal,
              }}>
                {t.gate_label}
              </label>
              <input
                id="padel-pass"
                ref={inputRef}
                type="password"
                autoComplete="current-password"
                value={value}
                onChange={(e) => { setValue(e.target.value); if (error) setError(false); }}
                aria-invalid={error}
                aria-describedby={error ? 'padel-pass-err' : undefined}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: C.cream,
                  border: `1px solid ${error ? C.clay : C.hair}`,
                  fontFamily: "'Archivo', sans-serif",
                  fontSize: 16,
                  color: C.ink,
                  outline: 'none',
                  letterSpacing: '0.06em',
                }}
                data-testid="padel-gate-input"
              />
              {error && (
                <p id="padel-pass-err" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: C.clay,
                  marginTop: 6,
                }} data-testid="padel-gate-error">
                  {t.gate_error}
                </p>
              )}
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 mt-2"
                style={{
                  background: C.green,
                  color: C.ivory,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  padding: '14px 22px',
                  border: `1px solid ${C.green}`,
                  borderRadius: 999,
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = C.greenDk; }}
                onMouseOut={(e) => { e.currentTarget.style.background = C.green; }}
                data-testid="padel-gate-submit"
              >
                {t.gate_submit}
              </button>
            </form>

            <p className="mt-6" style={{
              fontFamily: "'Archivo', sans-serif",
              fontSize: 12,
              lineHeight: 1.6,
              color: C.charcoal,
              opacity: 0.7,
            }}>
              {t.gate_help}
            </p>
          </div>

          <Pinstripe className="mt-14" />
          <p className="mt-6 text-center" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: C.charcoal,
            opacity: 0.55,
          }}>
            House Decoded · The Day Rave · Baila Dembow
          </p>
        </div>
      </div>
    </section>
  );
};

/* ─────────── Language toggle ─────────── */
const LangToggle = () => {
  const { lang, setLang } = useT();
  const baseStyle = {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: 10,
    letterSpacing: '0.28em',
    textTransform: 'uppercase',
    fontWeight: 600,
    padding: '4px 10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    color: C.charcoal,
    opacity: 0.55,
    transition: 'opacity .2s, color .2s',
  };
  const activeStyle = { ...baseStyle, color: C.ink, opacity: 1 };
  return (
    <div
      className="inline-flex items-center"
      style={{ border: `1px solid ${C.hair}`, borderRadius: 999, padding: 2 }}
      data-testid="padel-lang-toggle"
      aria-label="Language"
      role="group"
    >
      <button
        type="button"
        onClick={() => setLang('nl')}
        style={lang === 'nl' ? activeStyle : baseStyle}
        aria-pressed={lang === 'nl'}
        data-testid="padel-lang-nl"
      >NL</button>
      <span aria-hidden="true" style={{ color: C.hair }}>|</span>
      <button
        type="button"
        onClick={() => setLang('en')}
        style={lang === 'en' ? activeStyle : baseStyle}
        aria-pressed={lang === 'en'}
        data-testid="padel-lang-en"
      >EN</button>
    </div>
  );
};

/* ─────────── HERO ─────────── */
const Hero = ({ onScrollToTickets, onOpenRegistration }) => {
  const { t } = useT();
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: C.cream, color: C.ink, paddingTop: 36, paddingBottom: 48 }}
      data-testid="padel-hero"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ opacity: 0.06 }}
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1200 700"
      >
        <rect x="40" y="40" width="1120" height="620" fill="none" stroke={C.green} strokeWidth="2" />
        <line x1="40" y1="350" x2="1160" y2="350" stroke={C.green} strokeWidth="2" />
        <line x1="600" y1="40" x2="600" y2="660" stroke={C.green} strokeWidth="2" />
        <rect x="40" y="220" width="1120" height="260" fill="none" stroke={C.green} strokeWidth="2" />
      </svg>

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-10">
        {/* Programme strip with language toggle */}
        <div className="flex items-center justify-between mb-10 md:mb-14 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: C.gold }} />
            <KickerLabel>{t.kicker_loc}</KickerLabel>
          </div>
          <div className="flex items-center gap-4">
            <KickerLabel color={C.charcoal}>{t.kicker_prog}</KickerLabel>
            <LangToggle />
          </div>
        </div>

        <Pinstripe className="mb-10 md:mb-14" />

        <div className="text-center">
          <p className="mb-8" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            letterSpacing: '0.4em',
            textTransform: 'uppercase',
            color: C.charcoal,
            opacity: 0.75,
          }}>
            <a
              href="https://www.housedecoded.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: 'inherit',
                textDecoration: 'underline',
                textUnderlineOffset: 4,
                textDecorationColor: C.gold,
                textDecorationThickness: 1,
              }}
              data-testid="padel-credit-link"
            >
              {t.credit}
            </a>
          </p>

          {/* H1 wraps the badge so SEO + a11y still get the title via sr-only text */}
          <h1
            className="mx-auto"
            style={{ margin: 0, padding: 0, lineHeight: 0, display: 'flex', justifyContent: 'center' }}
            data-testid="padel-h1"
          >
            <span className="sr-only" style={{
              position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
              overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0,
            }}>Padeldam — Padel × Reggaeton by Baila Dembow · Sunday 7 June 2026 · Amsterdam</span>
            <img
              src="/images/events/padeldam-poster.png"
              alt="PADELDAM — Padel × Reggaeton by Baila Dembow · Sunday 7 June 2026 · 16:00–21:30 · Amsterdam"
              className="block mx-auto w-full"
              style={{
                maxWidth: 'min(960px, 100%)',
                height: 'auto',
                userSelect: 'none',
                borderRadius: 4,
                boxShadow: '0 22px 50px rgba(10,40,28,0.22), 0 0 0 1px rgba(200,166,89,0.35)',
              }}
              draggable={false}
            />
          </h1>

          <div className="mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onScrollToTickets}
              className="padel-cta-tickets inline-flex items-center gap-2 px-7 py-4"
              style={{
                background: C.green, color: C.ivory,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
                fontWeight: 600, border: `1px solid ${C.green}`, borderRadius: 999,
                cursor: 'pointer',
              }}
              data-testid="padel-cta-tickets"
              onMouseOver={(e) => { e.currentTarget.style.background = C.greenDk; }}
              onMouseOut={(e) => { e.currentTarget.style.background = C.green; }}
            >
              {t.cta_tickets}
            </button>

            <button
              type="button"
              onClick={onOpenRegistration}
              className="inline-flex items-center gap-2 px-7 py-4 transition-all"
              style={{
                background: 'transparent', color: C.ink,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
                fontWeight: 600, border: `1px solid ${C.ink}`, borderRadius: 999,
              }}
              data-testid="padel-cta-registration"
              onMouseOver={(e) => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = C.ivory; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.ink; }}
            >
              {t.cta_register} <span aria-hidden="true">→</span>
            </button>

            <a
              href="https://chat.whatsapp.com/GYlKv3pxMwzJ40K7RVglIb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-4 transition-all"
              style={{
                background: '#25D366', color: C.ivory,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
                fontWeight: 600, border: '1px solid #1FB256', borderRadius: 999,
                textDecoration: 'none',
              }}
              data-testid="padel-cta-whatsapp"
              onMouseOver={(e) => { e.currentTarget.style.background = '#1FB256'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#25D366'; }}
            >
              <span aria-hidden="true">●</span> {t.cta_whatsapp}
            </a>
          </div>

          <div className="mt-14 md:mt-20">
            <Pinstripe className="mb-6" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { k: t.strip_discipline_k, v: t.strip_discipline_v },
                { k: t.strip_soundtrack_k, v: t.strip_soundtrack_v },
                { k: t.strip_format_k,     v: t.strip_format_v },
                { k: t.strip_tickets_k,    v: t.strip_tickets_v },
              ].map((cell, i) => (
                <div key={i}>
                  <KickerLabel>{cell.k}</KickerLabel>
                  <p className="mt-2" style={{
                    fontFamily: "'Anton', sans-serif",
                    fontSize: 'clamp(16px, 2vw, 22px)',
                    letterSpacing: '0.04em',
                    color: C.ink,
                    textTransform: 'uppercase',
                  }}>{cell.v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────── MARQUEE ─────────── */
const Marquee = () => {
  const { t } = useT();
  const row = [...t.marquee, ...t.marquee, ...t.marquee];
  return (
    <div
      className="overflow-hidden"
      style={{ background: C.green, color: C.cream, borderTop: `1px solid ${C.goldDk}`, borderBottom: `1px solid ${C.goldDk}` }}
      aria-hidden="true"
      data-testid="padel-marquee"
    >
      <div className="py-4 whitespace-nowrap flex" style={{ animation: 'padelMarquee 38s linear infinite' }}>
        {row.map((s, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-8" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            {s}<span style={{ color: C.gold }}>●</span>
          </span>
        ))}
      </div>
      <style>{`@keyframes padelMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-33.3333%); } }`}</style>
    </div>
  );
};

/* ─────────── ABOUT ─────────── */
const About = () => {
  const { t } = useT();
  return (
    <section style={{ background: C.ivory, color: C.ink, padding: '96px 24px' }} data-testid="padel-about">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10 md:gap-16 items-start">
          <div className="md:col-span-4">
            <KickerLabel>{t.about_kicker}</KickerLabel>
            <SerifHeading className="mt-4" style={{ fontSize: 'clamp(38px, 5vw, 68px)' }}>
              {t.about_h2_l1}<br />
              <span style={{ fontStyle: 'italic', color: C.green }}>{t.about_h2_l2}</span>
            </SerifHeading>
            <Pinstripe className="mt-8 max-w-[180px]" />
            <p className="mt-6" style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.7, color: C.charcoal,
            }}>
              🎾🔥 <strong>{t.about_intro_strong}</strong> 🔥🎶<br />
              {t.about_intro_tail}
            </p>
          </div>

          <div className="md:col-span-8">
            <div style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 17, lineHeight: 1.75, color: C.charcoal,
            }}>
              <p className="mb-5">{t.about_p1}</p>
              <p className="mb-5">{t.about_p2}</p>
              <p className="mb-5">{t.about_p3}</p>
              <p className="mt-8" style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontStyle: 'italic', fontSize: 22, lineHeight: 1.4, color: C.green,
                borderLeft: `2px solid ${C.gold}`, paddingLeft: 18,
              }}>
                {t.about_quote}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────── INCLUDED ─────────── */
const Included = () => {
  const { t } = useT();
  return (
    <section style={{ background: C.cream, padding: '96px 24px' }} data-testid="padel-included">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
          <div>
            <KickerLabel>{t.included_kicker}</KickerLabel>
            <SerifHeading className="mt-3" style={{ fontSize: 'clamp(38px, 5vw, 64px)' }}>
              {t.included_h2}
            </SerifHeading>
          </div>
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: C.charcoal, opacity: 0.7,
          }}>
            {t.included_suffix}
          </p>
        </div>

        <Pinstripe className="mb-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-0"
          style={{ border: `1px solid ${C.hair}`, background: C.ivory }}>
          {t.included.map((it, i) => (
            <div
              key={i}
              className="p-6 md:p-8"
              style={{
                borderRight: i < t.included.length - 1 ? `1px solid ${C.hair}` : 'none',
                borderBottom: `1px solid ${C.hair}`,
              }}
              data-testid={`padel-included-${i}`}
            >
              <div className="text-3xl mb-4" aria-hidden="true">{it.icon}</div>
              <h3 style={{
                fontFamily: "'Anton', sans-serif", fontSize: 18,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                color: C.ink, marginBottom: 8,
              }}>{it.t}</h3>
              <p style={{
                fontFamily: "'Archivo', sans-serif", fontSize: 13, lineHeight: 1.6,
                color: C.charcoal,
              }}>{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ─────────── BRING + PRIZE ─────────── */
const BringAndPrize = () => {
  const { t } = useT();
  return (
    <section style={{ background: C.ivory, padding: '96px 24px' }} data-testid="padel-bring-prize">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20">
        <div>
          <KickerLabel>{t.bring_kicker}</KickerLabel>
          <SerifHeading className="mt-3" style={{ fontSize: 'clamp(34px, 4.5vw, 56px)' }}>
            {t.bring_h2}
          </SerifHeading>
          <Pinstripe className="mt-6 max-w-[140px]" />
          <ul className="mt-8 space-y-3">
            {t.bring.map((b, i) => (
              <li key={i} className="flex items-center gap-4" style={{
                fontFamily: "'Archivo', sans-serif", fontSize: 16, color: C.ink,
                paddingBottom: 12, borderBottom: `1px solid ${C.hair}`,
              }}>
                <span className="text-2xl">{b.emoji}</span>
                <span>{b.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6" style={{
            fontFamily: "'Archivo', sans-serif", fontSize: 14, fontStyle: 'italic', color: C.charcoal,
          }}>
            {t.bring_note}
          </p>
        </div>

        <div
          className="relative p-10 md:p-14"
          style={{
            background: C.green, color: C.cream,
            border: `1px solid ${C.goldDk}`,
            boxShadow: `inset 0 0 0 1px ${C.gold}33`,
          }}
        >
          <div className="absolute top-6 right-6" style={{ width: 32, height: 32 }}>
            <svg viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" stroke={C.gold} strokeWidth="0.5" />
              <path d="M16 6 L18 14 L26 14 L19 19 L22 27 L16 22 L10 27 L13 19 L6 14 L14 14 Z" fill={C.gold} />
            </svg>
          </div>
          <KickerLabel color={C.gold}>{t.prize_kicker}</KickerLabel>
          <SerifHeading className="mt-3" style={{ color: C.cream, fontSize: 'clamp(36px, 4.5vw, 58px)' }}>
            {t.prize_h2}
          </SerifHeading>
          <Pinstripe className="mt-6 max-w-[140px]" />
          <p className="mt-8" style={{
            fontFamily: "'Anton', sans-serif", fontSize: 'clamp(56px, 8vw, 96px)',
            lineHeight: 0.95, letterSpacing: '0.04em', color: C.gold,
            textTransform: 'uppercase',
          }}>
            {t.prize_value}
          </p>
          <p className="mt-6" style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontStyle: 'italic', fontSize: 17, lineHeight: 1.5,
            color: C.cream, opacity: 0.85,
          }}>
            {t.prize_note}
          </p>
        </div>
      </div>
    </section>
  );
};

/* ─────────── TICKETS ─────────── */
const TICKET_SHOP_URL = 'https://shop.weeztix.com/d93d6926-f65b-4d2e-b9c2-8afd9f0381a7';

const Tickets = ({ ticketsRef, onOpenRegistration }) => {
  const { t } = useT();
  useEffect(() => {
    if (document.querySelector('script[data-weeztix="padel"]')) return;
    const s = document.createElement('script');
    s.src = 'https://shop.weeztix.com/build/integrate.js';
    s.async = true;
    s.dataset.weeztix = 'padel';
    document.body.appendChild(s);
  }, []);

  return (
    <section
      ref={ticketsRef}
      style={{ background: C.cream, padding: '96px 24px' }}
      data-testid="padel-tickets"
      id="tickets"
    >
      <div className="max-w-3xl mx-auto text-center">
        <KickerLabel>{t.tickets_kicker}</KickerLabel>
        <SerifHeading className="mt-3" style={{ fontSize: 'clamp(38px, 5vw, 64px)' }}>
          {t.tickets_h2}
        </SerifHeading>
        <Pinstripe className="mt-6 mx-auto max-w-[140px]" />
        <p className="mt-6 mb-10" style={{
          fontFamily: "'Archivo', sans-serif", fontSize: 15, lineHeight: 1.7, color: C.charcoal,
        }}>
          {t.tickets_intro}
        </p>

        <div
          className="text-left mb-10 p-6 md:p-8"
          style={{ background: C.ivory, border: `1px solid ${C.gold}`, borderRadius: 4 }}
        >
          <div className="flex items-start gap-4">
            <span className="text-2xl mt-0.5" aria-hidden="true">🏆</span>
            <div className="flex-1">
              <KickerLabel color={C.goldDk}>{t.tickets_banner_kicker}</KickerLabel>
              <p className="mt-2 mb-4" style={{
                fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.6, color: C.charcoal,
              }}>
                {t.tickets_banner_body_pre}
                <strong>{t.tickets_banner_body_strong_1}</strong>
                {t.tickets_banner_body_or}
                <strong>{t.tickets_banner_body_strong_2}</strong>
                {t.tickets_banner_body_post}
              </p>
              <button
                type="button"
                onClick={onOpenRegistration}
                className="padel-cta-tickets inline-flex items-center gap-2 px-5 py-3"
                style={{
                  background: C.green, color: C.ivory,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase',
                  fontWeight: 600, border: `1px solid ${C.green}`, borderRadius: 999,
                  cursor: 'pointer',
                }}
                data-testid="padel-cta-inline-registration"
                onMouseOver={(e) => { e.currentTarget.style.background = C.greenDk; }}
                onMouseOut={(e) => { e.currentTarget.style.background = C.green; }}
              >
                {t.tickets_banner_cta}
              </button>
            </div>
          </div>
        </div>

        <div
          id="shop-frame"
          data-url={TICKET_SHOP_URL}
          style={{ maxWidth: 600, margin: '0 auto' }}
        />
      </div>
    </section>
  );
};

/* ─────────── MODAL ─────────── */

/**
 * Web3Forms access key — bound to ask@housedecoded.com. This is the
 * intentionally-public client-side key (Web3Forms docs: "you can use it
 * in client side code"). Each POST delivers a formatted email with all
 * 6 answers to ask@housedecoded.com the moment the user clicks Submit.
 * Free tier: 250 submissions/month. Env var `REACT_APP_PADEL_W3F_KEY`
 * overrides this for staging/preview builds if ever needed. If the POST
 * fails for any reason (offline, rate limit, etc.) the form falls back
 * to a pre-filled mailto: so the registration is never lost.
 */
const WEB3FORMS_ACCESS_KEY =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_PADEL_W3F_KEY) ||
  'e3fb20ee-ee63-420c-8126-e44eac23ca56';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';
const REGISTRATION_DESTINATION = 'ask@housedecoded.com';

const buildMailtoFallback = (form) => {
  const subject = encodeURIComponent('Padel × Reggaeton — Doubles Tournament Registration');
  const body = encodeURIComponent([
    'PADEL × REGGAETON — DOUBLES TOURNAMENT REGISTRATION',
    '────────────────────────────────────────────',
    '',
    `1. Join doubles tournament: ${form.joinTournament}`,
    `2. Times per month playing padel: ${form.playsPerMonth}`,
    `3. Playtomic score: ${form.playtomicScore}`,
    `4. Partner preference: ${form.partnerPreference}`,
    `5. Full name (as on ticket): ${form.fullName}`,
    `6. Email (as on ticket): ${form.email}`,
    '',
    'Submitted from: https://bailadembow.com/#/events/PadelXReggaeton',
  ].join('\n'));
  return `mailto:${REGISTRATION_DESTINATION}?subject=${subject}&body=${body}`;
};

const RegistrationModal = ({ open, onClose }) => {
  const { t } = useT();
  const [form, setForm] = useState({
    joinTournament: '',
    playsPerMonth: '',
    playtomicScore: '',
    partnerPreference: '',
    fullName: '',
    email: '',
  });
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    setTimeout(() => dialogRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === 'submitting') return;
    const required = ['joinTournament','playsPerMonth','playtomicScore','partnerPreference','fullName','email'];
    for (const k of required) if (!String(form[k]).trim()) return;

    setStatus('submitting');

    // POST to Web3Forms — delivers straight to ask@housedecoded.com
    try {
      const payload = new FormData();
      payload.append('access_key', WEB3FORMS_ACCESS_KEY);
      payload.append('subject', 'Padel × Reggaeton — Doubles Tournament Registration');
      payload.append('from_name', `${form.fullName} (Padel × Reggaeton)`);
      payload.append('name', form.fullName);
      payload.append('email', form.email);
      payload.append('replyto', form.email);
      payload.append('Q1 — Join doubles tournament', form.joinTournament);
      payload.append('Q2 — Padel sessions per month', form.playsPerMonth);
      payload.append('Q3 — Playtomic score', form.playtomicScore);
      payload.append('Q4 — Partner preference', form.partnerPreference);
      payload.append('Q5 — Full name (as on ticket)', form.fullName);
      payload.append('Q6 — Email (as on ticket)', form.email);
      payload.append('Submitted from', 'https://bailadembow.com/#/events/PadelXReggaeton');
      payload.append('botcheck', '');

      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: payload,
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok && data && data.success) {
        setStatus('success');
        return;
      }
      throw new Error(data?.message || `HTTP ${response.status}`);
    } catch (err) {
      // POST failed (no access key configured yet, offline, or service error)
      // Fall back to mailto: so the user never loses their submission.
      // eslint-disable-next-line no-console
      console.warn('Padel registration POST failed — falling back to mailto:', err);
      window.location.href = buildMailtoFallback(form);
      setStatus('error');
    }
  };

  const submitted = status === 'success' || status === 'error';

  const labelStyle = {
    display: 'block',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase',
    color: C.charcoal, marginBottom: 10,
  };
  const inputStyle = {
    width: '100%', padding: '12px 14px', background: C.cream,
    border: `1px solid ${C.hair}`, fontFamily: "'Archivo', sans-serif",
    fontSize: 14, color: C.ink,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="padel-reg-title"
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(20,20,20,0.72)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="padel-modal"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full md:max-w-2xl outline-none"
        style={{
          background: C.ivory, color: C.ink,
          maxHeight: '92vh', overflowY: 'auto',
          border: `1px solid ${C.gold}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
        }}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 md:px-10 py-5"
          style={{ background: C.ivory, borderBottom: `1px solid ${C.hair}` }}
        >
          <div>
            <KickerLabel color={C.goldDk}>{t.modal_kicker}</KickerLabel>
            <h3 id="padel-reg-title" className="mt-1" style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 22, lineHeight: 1.1, color: C.ink, fontWeight: 500,
            }}>
              {t.modal_title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="ml-4 shrink-0 inline-flex items-center justify-center"
            style={{
              width: 36, height: 36, borderRadius: 999,
              border: `1px solid ${C.hair}`, background: 'transparent',
              color: C.ink, fontSize: 18,
            }}
          >×</button>
        </div>

        {submitted ? (
          <div className="px-6 md:px-10 py-12 text-center">
            <div className="text-4xl mb-4" aria-hidden="true">{status === 'success' ? '🎾' : '✉️'}</div>
            <SerifHeading style={{ fontSize: 28 }}>
              {status === 'success' ? t.success_title : t.error_title}
            </SerifHeading>
            <p className="mt-4 mx-auto max-w-md" style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.6, color: C.charcoal,
            }}>
              {status === 'success' ? t.success_body : t.error_body}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex items-center gap-2 px-6 py-3"
              style={{
                background: C.green, color: C.ivory,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.26em', textTransform: 'uppercase',
                fontWeight: 600, border: `1px solid ${C.green}`, borderRadius: 999,
                cursor: 'pointer',
              }}
            >{t.close}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 md:px-10 py-8 space-y-7">
            <p style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 13, lineHeight: 1.6, color: C.charcoal,
            }}>
              {t.modal_intro}
            </p>

            <fieldset>
              <legend style={labelStyle}>{t.q1}</legend>
              <div className="flex flex-wrap gap-3">
                {[{v: 'Yes', label: t.q1_yes}, {v: 'No', label: t.q1_no}].map((opt) => (
                  <label key={opt.v} className="cursor-pointer">
                    <input
                      type="radio"
                      name="joinTournament"
                      value={opt.v}
                      required
                      checked={form.joinTournament === opt.v}
                      onChange={update('joinTournament')}
                      className="sr-only peer"
                    />
                    <span
                      className="inline-block px-5 py-2.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
                        color: form.joinTournament === opt.v ? C.ivory : C.ink,
                        background: form.joinTournament === opt.v ? C.green : 'transparent',
                        border: `1px solid ${form.joinTournament === opt.v ? C.green : C.hair}`,
                        borderRadius: 999,
                      }}
                    >{opt.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="playsPerMonth" style={labelStyle}>{t.q2}</label>
              <select id="playsPerMonth" required value={form.playsPerMonth} onChange={update('playsPerMonth')} style={inputStyle}>
                <option value="" disabled>{t.q2_opts[0]}</option>
                {t.q2_opts.slice(1).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="playtomicScore" style={labelStyle}>{t.q3}</label>
              <input id="playtomicScore" type="text" required
                placeholder={t.q3_ph}
                value={form.playtomicScore}
                onChange={update('playtomicScore')}
                style={inputStyle}
              />
            </div>

            <fieldset>
              <legend style={labelStyle}>{t.q4}</legend>
              <div className="flex flex-col gap-2">
                {t.q4_opts.map((opt) => (
                  <label key={opt.v} className="cursor-pointer flex items-start gap-3 p-3"
                    style={{
                      border: `1px solid ${form.partnerPreference === opt.v ? C.green : C.hair}`,
                      background: form.partnerPreference === opt.v ? `${C.green}0D` : 'transparent',
                    }}>
                    <input
                      type="radio" name="partnerPreference" value={opt.v}
                      required
                      checked={form.partnerPreference === opt.v}
                      onChange={update('partnerPreference')}
                      style={{ marginTop: 3 }}
                    />
                    <span>
                      <span style={{
                        display: 'block', fontFamily: "'Anton', sans-serif", fontSize: 14,
                        letterSpacing: '0.04em', textTransform: 'uppercase', color: C.ink,
                      }}>{opt.v}</span>
                      <span style={{
                        display: 'block', fontFamily: "'Archivo', sans-serif", fontSize: 12,
                        color: C.charcoal, marginTop: 2,
                      }}>{opt.d}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="fullName" style={labelStyle}>{t.q5}</label>
                <input id="fullName" type="text" required autoComplete="name"
                  value={form.fullName} onChange={update('fullName')} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="email" style={labelStyle}>{t.q6}</label>
                <input id="email" type="email" required autoComplete="email"
                  value={form.email} onChange={update('email')} style={inputStyle} />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit"
                disabled={status === 'submitting'}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-4"
                style={{
                  background: status === 'submitting' ? C.greenDk : C.green,
                  color: C.ivory,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11, letterSpacing: '0.28em', textTransform: 'uppercase',
                  fontWeight: 600, border: `1px solid ${C.green}`, borderRadius: 999,
                  cursor: status === 'submitting' ? 'wait' : 'pointer',
                  opacity: status === 'submitting' ? 0.8 : 1,
                  transition: 'background .2s, opacity .2s',
                }}
                onMouseOver={(e) => { if (status !== 'submitting') e.currentTarget.style.background = C.greenDk; }}
                onMouseOut={(e) => { if (status !== 'submitting') e.currentTarget.style.background = C.green; }}
              >
                {status === 'submitting' ? t.submitting : t.submit}
              </button>
              <p className="mt-3 text-center" style={{
                fontFamily: "'Archivo', sans-serif", fontSize: 11, color: C.charcoal, opacity: 0.7,
              }}>
                {t.submit_help}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─────────── VENUE ─────────── */
const VENUE_MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=Padeldam%2C%20Tom%20Schreursweg%2016%2C%201067%20MC%20Amsterdam';

const Venue = () => {
  const { t } = useT();
  return (
    <section
      style={{ background: C.ivory, padding: '96px 24px' }}
      data-testid="padel-venue"
      id="venue"
    >
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-stretch">
          {/* Left: address card */}
          <div className="md:col-span-5 flex">
            <div
              className="p-8 md:p-10 w-full flex flex-col"
              style={{ background: C.cream, border: `1px solid ${C.hair}` }}
            >
              <KickerLabel>{t.venue_kicker}</KickerLabel>
              <SerifHeading className="mt-3" style={{ fontSize: 'clamp(40px, 5.2vw, 70px)' }}>
                {t.venue_h2}
              </SerifHeading>
              <Pinstripe className="mt-6 max-w-[140px]" />

              <address className="mt-8 not-italic" style={{
                fontFamily: "'Anton', sans-serif",
                fontSize: 'clamp(20px, 2.4vw, 26px)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: C.ink,
                lineHeight: 1.35,
              }}>
                {t.venue_address_l1}<br />
                {t.venue_address_l2}
              </address>

              <p className="mt-3" style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: C.charcoal,
                opacity: 0.7,
              }}>
                {t.venue_city}
              </p>

              <p className="mt-6" style={{
                fontFamily: "'Archivo', sans-serif",
                fontSize: 13,
                lineHeight: 1.65,
                color: C.charcoal,
              }}>
                {t.venue_note}
              </p>

              <div className="mt-auto pt-8">
                <a
                  href={VENUE_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 transition-all"
                  style={{
                    background: C.green,
                    color: C.ivory,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    border: `1px solid ${C.green}`,
                    borderRadius: 999,
                    textDecoration: 'none',
                  }}
                  data-testid="padel-venue-maps-link"
                  onMouseOver={(e) => { e.currentTarget.style.background = C.greenDk; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = C.green; }}
                >
                  {t.venue_cta}
                </a>
              </div>
            </div>
          </div>

          {/* Right: branded map card (click-through to Google Maps) */}
          <div className="md:col-span-7">
            <a
              href={VENUE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '4 / 3',
                border: `1px solid ${C.goldDk}`,
                background: C.green,
                overflow: 'hidden',
                textDecoration: 'none',
                transition: 'transform .25s cubic-bezier(.2,.8,.2,1), box-shadow .25s',
              }}
              data-testid="padel-venue-map"
              aria-label="Open Padeldam, Tom Schreursweg 16, 1067 MC Amsterdam in Google Maps"
              onMouseOver={(e) => { e.currentTarget.style.boxShadow = `0 18px 38px ${C.greenDk}88`; }}
              onMouseOut={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
            >
              {/* Court-line motif background */}
              <svg
                aria-hidden="true"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}
                preserveAspectRatio="xMidYMid slice"
                viewBox="0 0 800 600"
              >
                <rect x="40" y="40" width="720" height="520" fill="none" stroke={C.gold} strokeWidth="2" />
                <line x1="40" y1="300" x2="760" y2="300" stroke={C.gold} strokeWidth="2" />
                <line x1="400" y1="40" x2="400" y2="560" stroke={C.gold} strokeWidth="2" />
                <rect x="40" y="180" width="720" height="240" fill="none" stroke={C.gold} strokeWidth="2" />
              </svg>

              {/* Centered location mark + label */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center text-center"
                style={{ padding: 24 }}
              >
                {/* Map pin */}
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 2C7.582 2 4 5.582 4 10c0 6 8 12 8 12s8-6 8-12c0-4.418-3.582-8-8-8z"
                    fill={C.gold}
                    stroke={C.cream}
                    strokeWidth="1"
                  />
                  <circle cx="12" cy="10" r="3" fill={C.green} />
                </svg>

                <p className="mt-4" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.34em',
                  textTransform: 'uppercase',
                  color: C.gold,
                  margin: 0,
                }}>52° 21' 22" N · 4° 48' 38" E</p>

                <h3 className="mt-3" style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 'clamp(28px, 3.6vw, 44px)',
                  fontWeight: 500,
                  lineHeight: 1.1,
                  color: C.cream,
                  margin: 0,
                }}>Padeldam</h3>

                <p className="mt-3" style={{
                  fontFamily: "'Anton', sans-serif",
                  fontSize: 'clamp(13px, 1.4vw, 16px)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: C.cream,
                  opacity: 0.92,
                  margin: 0,
                  lineHeight: 1.4,
                }}>
                  Tom Schreursweg 16<br />1067 MC Amsterdam
                </p>

                <span className="mt-6 inline-flex items-center gap-2" style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: C.cream,
                  opacity: 0.85,
                  padding: '8px 14px',
                  border: `1px solid ${C.gold}66`,
                  borderRadius: 999,
                }}>
                  View on Google Maps ↗
                </span>
              </div>

              {/* Corner ornaments */}
              <span aria-hidden="true" style={{
                position: 'absolute', top: 14, left: 14, width: 18, height: 18,
                borderTop: `1px solid ${C.gold}`, borderLeft: `1px solid ${C.gold}`,
              }} />
              <span aria-hidden="true" style={{
                position: 'absolute', top: 14, right: 14, width: 18, height: 18,
                borderTop: `1px solid ${C.gold}`, borderRight: `1px solid ${C.gold}`,
              }} />
              <span aria-hidden="true" style={{
                position: 'absolute', bottom: 14, left: 14, width: 18, height: 18,
                borderBottom: `1px solid ${C.gold}`, borderLeft: `1px solid ${C.gold}`,
              }} />
              <span aria-hidden="true" style={{
                position: 'absolute', bottom: 14, right: 14, width: 18, height: 18,
                borderBottom: `1px solid ${C.gold}`, borderRight: `1px solid ${C.gold}`,
              }} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────── LIABILITY ─────────── */
const Liability = () => {
  const { t } = useT();
  return (
    <section style={{ background: C.ink, color: C.cream, padding: '96px 24px' }} data-testid="padel-liability">
      <div className="max-w-4xl mx-auto">
        <KickerLabel color={C.gold}>{t.liability_kicker}</KickerLabel>
        <SerifHeading className="mt-3" style={{ color: C.cream, fontSize: 'clamp(34px, 4.5vw, 56px)' }}>
          {t.liability_h2_l1}<br />{t.liability_h2_l2}
        </SerifHeading>
        <Pinstripe className="mt-8 max-w-[160px]" />

        <div className="mt-10 grid md:grid-cols-2 gap-10 md:gap-16">
          <div>
            <h4 style={{
              fontFamily: "'Anton', sans-serif", fontSize: 20,
              letterSpacing: '0.04em', textTransform: 'uppercase', color: C.gold,
              marginBottom: 12,
            }}>{t.liability_h4_1}</h4>
            <p style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.75,
              color: C.cream, opacity: 0.85,
            }}>
              {t.liability_p1a}
              <br /><br />
              {t.liability_p1b}
            </p>
          </div>

          <div>
            <h4 style={{
              fontFamily: "'Anton', sans-serif", fontSize: 20,
              letterSpacing: '0.04em', textTransform: 'uppercase', color: C.gold,
              marginBottom: 12,
            }}>{t.liability_h4_2}</h4>
            <p style={{
              fontFamily: "'Archivo', sans-serif", fontSize: 14, lineHeight: 1.75,
              color: C.cream, opacity: 0.85,
            }}>
              {t.liability_p2a}
              <br /><br />
              {t.liability_p2b_pre}<strong>{t.liability_p2b_strong}</strong>{t.liability_p2b_post}
              <br /><br />
              {t.liability_p2c}
              <br /><br />
              {t.liability_p2d}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─────────── FOOTER ─────────── */
const PadelFooter = () => {
  const { t } = useT();
  return (
    <footer
      style={{ background: C.cream, color: C.charcoal, padding: '56px 24px' }}
      data-testid="padel-footer"
    >
      <div className="max-w-6xl mx-auto">
        <Pinstripe className="mb-10" />
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div>
            <KickerLabel>{t.presented}</KickerLabel>
            <p className="mt-3" style={{
              fontFamily: "'Anton', sans-serif",
              fontSize: 'clamp(22px, 2.6vw, 30px)',
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: C.ink, lineHeight: 1.2,
            }}>
              <a href="https://thedayrave.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}>The Day Rave</a>
              <span style={{ color: C.gold, margin: '0 0.4em' }}>×</span>
              <a href="https://bailadembow.com"
                style={{ color: 'inherit', textDecoration: 'none' }}>Baila Dembow</a>
              <span style={{ color: C.gold, margin: '0 0.4em' }}>×</span>
              <a href="https://www.housedecoded.com" target="_blank" rel="noopener noreferrer"
                style={{ color: 'inherit', textDecoration: 'none' }}>House Decoded</a>
            </p>
          </div>
          <div className="text-left md:text-right" style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
            letterSpacing: '0.22em', textTransform: 'uppercase', color: C.charcoal,
          }}>
            <a
              href="https://chat.whatsapp.com/GYlKv3pxMwzJ40K7RVglIb"
              target="_blank" rel="noopener noreferrer"
              style={{ color: '#1FB256', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              {t.join_padel}
            </a>
            <br />
            <a href="https://bailadembow.com"
              style={{ color: C.green, textDecoration: 'underline', textUnderlineOffset: 3 }}>
              {t.back_baila}
            </a>
            <br />
            <span style={{ opacity: 0.6 }}>© {new Date().getFullYear()} {t.copyright}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

/* ─────────── SEO ─────────── */
const SeoHead = ({ lang }) => {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = lang === 'nl'
      ? 'Padel × Reggaeton — Waar de baan de dansvloer ontmoet | Baila Dembow'
      : 'Padel × Reggaeton — Where the court meets the dance floor | Baila Dembow';

    const prevLang = document.documentElement.lang;
    document.documentElement.lang = lang;

    const setMeta = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute('name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };
    setMeta('description', lang === 'nl'
      ? 'Padel × Reggaeton — een dagevenement waar de baan de dansvloer ontmoet. Padel open play, mini-toernooien, volleybal en live Reggaeton & Dembow DJs door Baila Dembow. Amsterdam 2026.'
      : 'Padel × Reggaeton — a day event where the court meets the dance floor. Padel open play, mini tournaments, volleyball, live Reggaeton & Dembow DJs by Baila Dembow. Amsterdam 2026.');

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
    canonical.href = 'https://bailadembow.com/#/events/PadelXReggaeton';

    const ldId = 'padel-event-jsonld';
    document.querySelector(`#${ldId}`)?.remove();
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'SportsEvent',
      name: 'PADELDAM — Padel × Reggaeton by Baila Dembow',
      description: 'PADELDAM is a Sunday afternoon padel + reggaeton event at Padeldam Amsterdam. Open play, mini tournaments and a free volleyball court with live Reggaeton, Dembow and Latin hits by Baila Dembow DJs.',
      sport: 'Padel',
      startDate: '2026-06-07T16:00:00+02:00',
      endDate: '2026-06-07T21:30:00+02:00',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      inLanguage: ['en', 'nl'],
      image: 'https://bailadembow.com/images/events/padeldam-poster.png',
      organizer: { '@type': 'Organization', name: 'House Decoded Events', url: 'https://bailadembow.com' },
      performer: { '@type': 'PerformingGroup', name: 'Baila Dembow DJs' },
      offers: {
        '@type': 'Offer',
        url: 'https://weeztix.shop/mqt2ja7s',
        availability: 'https://schema.org/InStock',
        priceCurrency: 'EUR',
        validFrom: '2026-05-01',
      },
      location: {
        '@type': 'Place',
        name: 'Padeldam',
        url: 'https://www.google.com/maps/search/?api=1&query=Padeldam%2C%20Tom%20Schreursweg%2016%2C%201067%20MC%20Amsterdam',
        hasMap: 'https://www.google.com/maps/search/?api=1&query=Padeldam%2C%20Tom%20Schreursweg%2016%2C%201067%20MC%20Amsterdam',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Tom Schreursweg 16',
          addressLocality: 'Amsterdam',
          postalCode: '1067 MC',
          addressRegion: 'North Holland',
          addressCountry: 'NL',
        },
      },
    };
    const s = document.createElement('script');
    s.id = ldId;
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(ld);
    document.head.appendChild(s);

    return () => {
      document.title = prevTitle;
      document.documentElement.lang = prevLang;
      document.querySelector(`#${ldId}`)?.remove();
    };
  }, [lang]);
  return null;
};

/* ─────────── PAGE EXPORT ─────────── */
export const PadelXReggaetonPage = () => {
  const ticketsRef = useRef(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    const stored = window.localStorage.getItem('padel.lang');
    if (stored === 'nl' || stored === 'en') return stored;
    const browserLang = (navigator.language || 'en').toLowerCase();
    return browserLang.startsWith('nl') ? 'nl' : 'en';
  });

  const setLang = (next) => {
    setLangState(next);
    try { window.localStorage.setItem('padel.lang', next); } catch (_) {}
  };

  const ctx = useMemo(() => ({ lang, t: COPY[lang], setLang }), [lang]);

  const scrollToTickets = () => {
    ticketsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <LangCtx.Provider value={ctx}>
      <SeoHead lang={lang} />
      <PadelGlobalAnimations />
      <div style={{ background: C.cream, color: C.ink, minHeight: '100vh' }} data-testid="padel-page">
        <Hero
          onScrollToTickets={scrollToTickets}
          onOpenRegistration={() => setModalOpen(true)}
        />
        <Marquee />
        <About />
        <Included />
        <BringAndPrize />
        <Tickets
          ticketsRef={ticketsRef}
          onOpenRegistration={() => setModalOpen(true)}
        />
        <Venue />
        <Liability />
        <PadelFooter />
        <RegistrationModal open={modalOpen} onClose={() => setModalOpen(false)} />
      </div>
    </LangCtx.Provider>
  );
};

export default PadelXReggaetonPage;
