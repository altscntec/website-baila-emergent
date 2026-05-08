import { useState, useCallback } from 'react';
import './VenueMapSection.css';

const RED    = '#E63027';
const PINK   = '#F8B3C2';
const CREAM  = '#F4E9CE';
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
      { time: '12:00–17:00', name: 'Coffee Rave', note: 'DJ-led all day' },
      { time: '12:30–13:00', name: 'Zumba',       note: 'with Melisa' },
      { time: '13:00–13:30', name: 'Coffee Rave', note: 'Keep the groove' },
      { time: '13:30–14:00', name: 'HIIT',        note: 'with Simone' },
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
      { time: '14:00–15:00', name: 'Break',       note: 'Garden reset' },
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
    color: 'rgba(244,233,206,0.65)', left: '52%', top: '82%',
    detailTitle: ['Community', 'Deck'],
    detailArea: 'Community Zone · Waterfront',
    detailKind: 'Sponsors · Meet Ups',
    items: ['Meet ups & Networking', 'Sponsor Activations'],
    note: 'Full line-up announced closer to the day.',
  },
};

const LEGEND_ORDER = ['main', 'garden', 'water', 'studio', 'community'];

function Pin({ areaKey, area, active, onActivate }) {
  const isActive = active === areaKey;
  return (
    <div
      role="button"
      tabIndex={0}
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
      <div
        className="vm-stem"
        style={{ background: `linear-gradient(to bottom,${area.color},transparent)` }}
      />
      <div
        className="vm-dot"
        style={{
          background: area.color,
          boxShadow: `0 0 0 3px rgba(244,233,206,.2),0 0 14px ${area.color}`,
        }}
      />
    </div>
  );
}

function DetailPanel({ areaKey }) {
  const area = AREAS[areaKey];
  return (
    <div className="vm-detail" key={areaKey}>
      {/* left col */}
      <div className="vm-dc-left">
        <span className="vm-dc-area" style={{ color: area.color }}>{area.detailArea}</span>
        <div className="vm-dc-name">
          {area.detailTitle.map((line, i) => <div key={i}>{line}</div>)}
        </div>
        <span className="vm-dc-kind">{area.detailKind}</span>
      </div>

      {/* right col */}
      <div className="vm-dc-right">
        {area.slots && area.slots.map((slot, i) => (
          <div key={i} className="vm-slot">
            <span className="vm-slot-time" style={{ color: area.color }}>{slot.time}</span>
            <div>
              <div className="vm-slot-name">{slot.name}</div>
              <div className="vm-slot-note">{slot.note}</div>
            </div>
          </div>
        ))}
        {area.items && area.items.map((item, i) => (
          <div key={i} className="vm-item">
            {item}
            <span className="vm-item-dot" style={{ background: area.color }} />
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
      <div className="vm-grid-bg" />

      <div className="vm-inner">
        {/* Header */}
        <div className="vm-head">
          <h2 className="vm-title">THE/<br />VENUE.</h2>
          <p className="vm-sub">Four areas.<br />One location.<br />14 Jun · IJland AMS</p>
        </div>

        {/* Map + pins */}
        <div className="vm-map-frame">
          <img
            className="vm-map-img"
            src="/images/venue-aerial.jpg"
            alt="IJland Amsterdam aerial view"
          />
          <div
            className="vm-overlay"
            style={{ background: 'linear-gradient(to bottom,rgba(10,10,10,.45) 0%,transparent 28%,transparent 68%,rgba(10,10,10,.6) 100%)' }}
          />
          <div
            className="vm-overlay"
            style={{ background: 'radial-gradient(ellipse at center,transparent 42%,rgba(10,10,10,.55) 100%)' }}
          />

          {Object.entries(AREAS).map(([key, area]) => (
            <Pin key={key} areaKey={key} area={area} active={active} onActivate={activate} />
          ))}
        </div>

        {/* Detail panel */}
        <DetailPanel areaKey={active} />

        {/* Legend tabs */}
        <div className="vm-legend">
          {LEGEND_ORDER.map((key) => {
            const area = AREAS[key];
            const isActive = active === key;
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                className={`vm-leg${isActive ? ' vm-active' : ''}`}
                onClick={() => activate(key)}
                onMouseEnter={() => activate(key)}
                onKeyDown={(e) => e.key === 'Enter' && activate(key)}
              >
                <span
                  className="vm-leg-num"
                  style={{ color: isActive ? area.color : CREAM }}
                >
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
              target="_blank"
              rel="noopener noreferrer"
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
