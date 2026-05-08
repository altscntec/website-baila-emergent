import { useState, useCallback } from 'react';

const RED    = '#E63027';
const PINK   = '#F8B3C2';
const CREAM  = '#F4E9CE';
const INK    = '#0B0B0B';
const GREEN  = '#22C55E';
const RED_PIN = '#FF5050';

const AREAS = {
  main: {
    num: '01', label: 'Main Stage', kind: 'Coffee Rave',
    color: RED_PIN, left: '27%', top: '64%',
    detailTitle: ['Coffee', 'Rave'],
    detailArea: 'Area 01 · Main Stage',
    detailKind: 'DJ-led · Live Classes · All Day',
    slots: [
      { time: '12:00–17:00', name: 'Coffee Rave',  note: 'DJ-led all day' },
      { time: '12:30–13:00', name: 'Zumba',        note: 'with Melisa' },
      { time: '13:00–13:30', name: 'Coffee Rave',  note: 'Keep the groove' },
      { time: '13:30–14:00', name: 'HIIT',         note: 'with Simone' },
    ],
  },
  garden: {
    num: '02', label: 'The Garden', kind: 'Cold Plunge · Sauna',
    color: GREEN, left: '29%', top: '32%',
    detailTitle: ['The', 'Garden'],
    detailArea: 'Area 02 · Outdoor',
    detailKind: 'Cold Plunge · Sauna · Contrast Therapy',
    slots: [
      { time: '13:00–14:00', name: 'Session One', note: 'Cold plunge · Sauna · Recover' },
      { time: '14:00–15:00', name: 'Break',        note: 'Garden reset' },
      { time: '15:00–16:00', name: 'Session Two', note: 'Cold plunge · Sauna · Closing' },
    ],
    note: 'Bring appropriate clothing + your own towel.',
  },
  studio: {
    num: '04', label: 'The Studio', kind: 'Classes & Workshops',
    color: PINK, left: '66%', top: '28%',
    detailTitle: ['The', 'Studio'],
    detailArea: 'Area 04 · The Studio',
    detailKind: 'Classes & Workshops',
    items: ['Pilates', 'Booty & Core'],
    note: 'Full timetable announced closer to the day.',
  },
  water: {
    num: '03', label: 'Water Terrace', kind: 'Food · Coffee · Wellness',
    color: CREAM, left: '74%', top: '60%',
    detailTitle: ['Water', 'Terrace'],
    detailArea: 'Area 03 · On the Water',
    detailKind: 'Food · Coffee · Wellness',
    items: ['Specialty Coffee', 'Food Stall', 'Drink Stall', 'Wellness Brand Stalls'],
    note: 'Brands & vendors announced closer to the day.',
  },
  community: {
    num: '—', label: 'Community Deck', kind: 'Sponsors · Waterfront',
    color: `rgba(244,233,206,0.65)`, left: '52%', top: '82%',
    detailTitle: ['Community', 'Deck'],
    detailArea: 'Community Zone · Waterfront',
    detailKind: 'Sponsors · Meet Ups',
    items: ['Meet ups & Networking', 'Sponsor Activations'],
    note: 'Full line-up announced closer to the day.',
  },
};

const LEGEND_ORDER = ['main', 'garden', 'water', 'studio', 'community'];

/* injected responsive CSS — avoids needing a .css file */
const CSS = `
  .vm-section {
    background: ${RED};
    color: ${CREAM};
    font-family: 'Archivo', sans-serif;
    padding: 72px 32px 64px;
    position: relative;
    overflow: hidden;
    -webkit-font-smoothing: antialiased;
  }
  .vm-grid-bg {
    position: absolute; inset: 0; pointer-events: none; opacity: .06;
    background-image: linear-gradient(${CREAM} 1px,transparent 1px),linear-gradient(90deg,${CREAM} 1px,transparent 1px);
    background-size: 60px 60px;
  }
  .vm-inner { max-width: 1200px; margin: 0 auto; position: relative; }

  /* ── HEADER ── */
  .vm-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    flex-wrap: wrap; gap: 16px;
    border-bottom: 1.5px solid rgba(244,233,206,.25);
    padding-bottom: 20px; margin-bottom: 36px;
  }
  .vm-title {
    font-family: 'Anton', sans-serif;
    font-size: clamp(52px, 8vw, 110px);
    line-height: .86; text-transform: uppercase;
    letter-spacing: -.01em; color: ${CREAM}; margin: 0;
  }
  .vm-sub {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: .22em; text-transform: uppercase;
    max-width: 200px; opacity: .8; line-height: 1.9;
    text-align: right; color: ${CREAM};
  }

  /* ── MAP ── */
  .vm-map-frame {
    position: relative; width: 100%;
    border: 1.5px solid rgba(244,233,206,.2);
    overflow: hidden;
  }
  .vm-map-img {
    width: 100%; display: block; aspect-ratio: 16/9;
    object-fit: cover;
    filter: brightness(.55) saturate(1.1) contrast(1.05);
  }
  .vm-overlay {
    position: absolute; inset: 0; pointer-events: none;
  }

  /* ── PINS ── */
  .vm-pin {
    position: absolute;
    display: flex; flex-direction: column; align-items: center;
    cursor: pointer; z-index: 10;
    transform: translate(-50%,-100%);
    transition: transform .2s cubic-bezier(.2,.8,.2,1);
    user-select: none; -webkit-tap-highlight-color: transparent;
    outline: none;
  }
  .vm-pin:hover, .vm-pin.vm-active {
    transform: translate(-50%,-100%) scale(1.07); z-index: 20;
  }
  .vm-bubble {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px;
    background: rgba(11,11,11,.82);
    border: 1.5px solid rgba(244,233,206,.18);
    backdrop-filter: blur(10px);
    white-space: nowrap;
    transition: border-color .2s, background .2s, box-shadow .2s;
  }
  .vm-pin:hover .vm-bubble,
  .vm-pin.vm-active .vm-bubble {
    background: rgba(11,11,11,.96);
  }
  .vm-pin-num {
    font-family: 'Anton', sans-serif;
    font-size: 15px; letter-spacing: .05em; line-height: 1;
  }
  .vm-pin-div { width: 1px; height: 26px; background: rgba(244,233,206,.18); flex-shrink:0; }
  .vm-pin-info { display: flex; flex-direction: column; gap: 2px; }
  .vm-pin-name {
    font-family: 'Anton', sans-serif;
    font-size: 14px; letter-spacing: .04em;
    text-transform: uppercase; color: ${CREAM}; line-height: 1;
  }
  .vm-pin-kind {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: .13em;
    text-transform: uppercase; color: rgba(244,233,206,.9); line-height: 1.3;
  }
  .vm-stem {
    width: 1.5px; height: 18px;
  }
  .vm-dot {
    width: 9px; height: 9px; border-radius: 50%;
    animation: venueMapPulse 2.2s infinite;
  }
  @keyframes venueMapPulse {
    0%   { box-shadow: 0 0 0 0 rgba(244,233,206,.5); }
    70%  { box-shadow: 0 0 0 10px transparent; }
    100% { box-shadow: 0 0 0 0 transparent; }
  }

  /* ── DETAIL PANEL ── */
  .vm-detail {
    display: grid; grid-template-columns: auto 1fr; gap: 32px;
    align-items: start; padding: 28px 32px;
    border: 1.5px solid rgba(244,233,206,.2); border-top: none;
    min-height: 160px;
    animation: venueMapIn .25s cubic-bezier(.2,.8,.2,1);
  }
  @keyframes venueMapIn {
    from { opacity:0; transform:translateY(8px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .vm-dc-left { display: flex; flex-direction: column; gap: 6px; min-width: 160px; }
  .vm-dc-area {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; letter-spacing: .3em;
    text-transform: uppercase; line-height: 1;
  }
  .vm-dc-name {
    font-family: 'Anton', sans-serif;
    font-size: clamp(38px, 5vw, 68px);
    text-transform: uppercase; color: ${CREAM};
    line-height: .88; letter-spacing: -.01em;
  }
  .vm-dc-kind {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: .15em;
    text-transform: uppercase; color: rgba(244,233,206,.7); margin-top: 8px;
  }
  .vm-dc-right {
    display: flex; flex-direction: column;
    border-left: 1.5px solid rgba(244,233,206,.2);
    padding-left: 32px;
  }
  .vm-slot {
    display: grid; grid-template-columns: 100px 1fr; gap: 16px;
    padding: 12px 0;
    border-top: 1px solid rgba(244,233,206,.15);
    align-items: start;
  }
  .vm-slot:last-child { border-bottom: 1px solid rgba(244,233,206,.15); }
  .vm-slot-time {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: .05em; line-height: 1.4;
  }
  .vm-slot-name {
    font-family: 'Archivo', sans-serif;
    font-weight: 700; font-size: 13px;
    text-transform: uppercase; color: ${CREAM};
    letter-spacing: .04em; line-height: 1.4;
  }
  .vm-slot-note {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: .06em;
    color: rgba(244,233,206,.7); line-height: 1.5;
  }
  .vm-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 12px 0;
    border-top: 1px solid rgba(244,233,206,.15);
    font-family: 'Archivo', sans-serif;
    font-weight: 700; font-size: 13px;
    text-transform: uppercase; color: ${CREAM};
  }
  .vm-item:last-of-type { border-bottom: 1px solid rgba(244,233,206,.15); }
  .vm-item-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .vm-note {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px; letter-spacing: .08em;
    color: rgba(244,233,206,.6); margin-top: 12px; line-height: 1.7;
  }

  /* ── LEGEND ── */
  .vm-legend {
    display: flex; gap: 0; flex-wrap: wrap;
    border: 1.5px solid rgba(244,233,206,.2);
    margin-top: 20px;
  }
  .vm-leg {
    flex: 1; min-width: 120px;
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px;
    border-right: 1.5px solid rgba(244,233,206,.1);
    transition: background .2s;
    cursor: pointer; outline: none;
  }
  .vm-leg:last-child { border-right: none; }
  .vm-leg:hover, .vm-leg.vm-active { background: rgba(244,233,206,.06); }
  .vm-leg-num {
    font-family: 'Anton', sans-serif;
    font-size: 20px; color: ${CREAM};
    opacity: .6; line-height: 1;
    transition: opacity .2s, color .2s;
  }
  .vm-leg.vm-active .vm-leg-num { opacity: 1; }
  .vm-leg-name {
    font-family: 'Anton', sans-serif;
    font-size: 12px; letter-spacing: .03em;
    text-transform: uppercase; color: ${CREAM}; line-height: 1;
  }
  .vm-leg-kind {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; letter-spacing: .1em;
    text-transform: uppercase; color: rgba(244,233,206,.75);
  }

  /* ── BOTTOM BAR ── */
  .vm-bar {
    display: flex; align-items: stretch; flex-wrap: wrap;
    border-top: 1.5px solid rgba(244,233,206,.2);
    border-bottom: 1.5px solid rgba(244,233,206,.2);
    margin-top: 32px;
  }
  .vm-bar-cell {
    flex: 1; min-width: 120px; padding: 16px 20px;
    border-right: 1.5px solid rgba(244,233,206,.1);
    display: flex; flex-direction: column;
    justify-content: center; gap: 3px;
  }
  .vm-bar-cell:last-child { border-right: none; align-items: flex-end; justify-content: center; }
  .vm-bar-k {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; letter-spacing: .25em;
    text-transform: uppercase; color: ${CREAM}; opacity: .7;
  }
  .vm-bar-v {
    font-family: 'Anton', sans-serif;
    font-size: 20px; letter-spacing: .02em;
    color: ${CREAM}; line-height: 1; white-space: nowrap;
  }
  .vm-btn {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; letter-spacing: .22em;
    text-transform: uppercase; padding: 13px 20px;
    text-decoration: none;
    background: ${CREAM}; color: ${RED};
    font-weight: 700; white-space: nowrap;
    transition: background .2s, transform .15s;
  }
  .vm-btn:hover { background: ${PINK}; transform: translateY(-2px); }

  /* ── MOBILE ── */
  @media (max-width: 640px) {
    .vm-section { padding: 48px 16px 52px; }
    .vm-head { flex-direction: column; align-items: flex-start; gap: 10px; }
    .vm-sub { text-align: left; max-width: 100%; }
    /* hide pins text on mobile — just show dots */
    .vm-bubble { padding: 6px 10px; gap: 6px; }
    .vm-pin-div, .vm-pin-info { display: none; }
    .vm-pin-num { font-size: 11px; }
    /* detail panel stacks */
    .vm-detail {
      grid-template-columns: 1fr; gap: 20px;
      padding: 20px 16px;
    }
    .vm-dc-right {
      border-left: none; padding-left: 0;
      border-top: 1.5px solid rgba(244,233,206,.2);
      padding-top: 16px;
    }
    .vm-slot { grid-template-columns: 80px 1fr; gap: 10px; }
    /* legend scrolls horizontally */
    .vm-legend { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .vm-leg { min-width: 110px; padding: 12px; }
    /* bar stacks 2-col */
    .vm-bar-cell { min-width: 45%; }
    .vm-bar-cell:last-child { min-width: 100%; align-items: flex-start; border-right: none; }
    .vm-btn { width: 100%; justify-content: center; }
  }

  @media (min-width: 641px) and (max-width: 900px) {
    .vm-section { padding: 56px 24px 56px; }
    .vm-detail { gap: 20px; padding: 22px 24px; }
    .vm-slot { grid-template-columns: 90px 1fr; }
  }
`;

function Pin({ areaKey, area, active, onActivate }) {
  const isActive = active === areaKey;
  return (
    <div
      role="button" tabIndex={0}
      className={`vm-pin${isActive ? ' vm-active' : ''}`}
      style={{ left: area.left, top: area.top }}
      onClick={() => onActivate(areaKey)}
      onMouseEnter={() => onActivate(areaKey)}
      onKeyDown={(e) => e.key === 'Enter' && onActivate(areaKey)}
    >
      <div
        className="vm-bubble"
        style={{
          borderColor: isActive ? area.color : 'rgba(244,233,206,0.18)',
          boxShadow: isActive ? `0 0 20px ${area.color}44` : 'none',
        }}
      >
        <span className="vm-pin-num" style={{ color: area.color }}>{area.num}</span>
        <div className="vm-pin-div" />
        <div className="vm-pin-info">
          <span className="vm-pin-name">{area.label}</span>
          <span className="vm-pin-kind">{area.kind}</span>
        </div>
      </div>
      <div className="vm-stem" style={{ background: `linear-gradient(to bottom,${area.color},transparent)` }} />
      <div className="vm-dot" style={{ background: area.color, boxShadow: `0 0 0 3px rgba(244,233,206,.2),0 0 14px ${area.color}` }} />
    </div>
  );
}

function DetailPanel({ areaKey }) {
  const area = AREAS[areaKey];
  const c = area.color;
  return (
    <div className="vm-detail" key={areaKey}>
      <div className="vm-dc-left">
        <span className="vm-dc-area" style={{ color: c }}>{area.detailArea}</span>
        <div className="vm-dc-name">
          {area.detailTitle.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <span className="vm-dc-kind">{area.detailKind}</span>
      </div>
      <div className="vm-dc-right">
        {area.slots && area.slots.map((slot, i) => (
          <div key={i} className="vm-slot">
            <span className="vm-slot-time" style={{ color: c }}>{slot.time}</span>
            <div>
              <div className="vm-slot-name">{slot.name}</div>
              <div className="vm-slot-note">{slot.note}</div>
            </div>
          </div>
        ))}
        {area.items && area.items.map((item, i) => (
          <div key={i} className="vm-item">
            {item}
            <span className="vm-item-dot" style={{ background: c }} />
          </div>
        ))}
        {area.note && <p className="vm-note">{area.note}</p>}
      </div>
    </div>
  );
}

export default function VenueMapSection() {
  const [active, setActive] = useState('main');
  const activate = useCallback((key) => setActive(key), []);

  return (
    <section className="vm-section">
      <style>{CSS}</style>
      <div className="vm-grid-bg" />

      <div className="vm-inner">
        {/* Header */}
        <div className="vm-head">
          <h2 className="vm-title">THE/<br />VENUE.</h2>
          <p className="vm-sub">Four areas.<br />One location.<br />14 Jun · IJland AMS</p>
        </div>

        {/* Map */}
        <div className="vm-map-frame">
          <img
            className="vm-map-img"
            src="/images/venue-aerial.jpg"
            alt="IJland Amsterdam aerial view"
          />
          <div className="vm-overlay" style={{ background: `linear-gradient(to bottom,rgba(10,10,10,.45) 0%,transparent 28%,transparent 68%,rgba(10,10,10,.6) 100%)` }} />
          <div className="vm-overlay" style={{ background: 'radial-gradient(ellipse at center,transparent 42%,rgba(10,10,10,.55) 100%)' }} />

          {Object.entries(AREAS).map(([key, area]) => (
            <Pin key={key} areaKey={key} area={area} active={active} onActivate={activate} />
          ))}
        </div>

        {/* Detail panel */}
        <DetailPanel areaKey={active} />

        {/* Legend */}
        <div className="vm-legend">
          {LEGEND_ORDER.map((key) => {
            const area = AREAS[key];
            const isActive = active === key;
            return (
              <div
                key={key}
                role="button" tabIndex={0}
                className={`vm-leg${isActive ? ' vm-active' : ''}`}
                onClick={() => activate(key)}
                onMouseEnter={() => activate(key)}
                onKeyDown={(e) => e.key === 'Enter' && activate(key)}
              >
                <span className="vm-leg-num" style={{ color: isActive ? area.color : CREAM }}>
                  {area.num}
                </span>
                <div>
                  <div className="vm-leg-name">{area.label}</div>
                  <div className="vm-leg-kind">{area.kind}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div className="vm-bar">
          {[
            { k: 'Venue', v: 'IJland AMS' },
            { k: 'Date',  v: '14 Jun 2026' },
            { k: 'Time',  v: '12:00–17:00' },
            { k: 'From',  v: '€12' },
          ].map(({ k, v }) => (
            <div key={k} className="vm-bar-cell">
              <span className="vm-bar-k">{k}</span>
              <span className="vm-bar-v">{v}</span>
            </div>
          ))}
          <div className="vm-bar-cell">
            <a
              href="https://www.eventbrite.nl/e/tickets-the-coffee-day-rave-wellness-event-1988484526748?aff=oddtdtcreator"
              target="_blank" rel="noopener noreferrer"
              className="vm-btn"
            >
              Buy Tickets →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
