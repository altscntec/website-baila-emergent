import { useState, useCallback } from 'react';

/* ─── colour tokens ─────────────────────────────────── */
const RED    = '#E63027';
const PINK   = '#F8B3C2';
const CREAM  = '#F4E9CE';
const INK    = '#0B0B0B';
const GREEN  = '#22C55E';
const RED_PIN = '#FF5050'; // slightly brighter so it reads on the red bg

/* ─── area definitions ──────────────────────────────── */
const AREAS = {
  main: {
    num: '01', label: 'Main Stage', kind: 'Coffee Rave',
    color: RED_PIN, left: '27%', top: '64%',
    detailTitle: 'Coffee\nRave',
    detailArea: 'Area 01 · Main Stage',
    detailKind: 'DJ-led · Live Classes · All Day',
    slots: [
      { time: '12:00 — 17:00', name: 'Coffee Rave',  note: 'DJ-led all day' },
      { time: '12:30 — 13:00', name: 'Zumba',        note: 'with Melisa' },
      { time: '13:00 — 13:30', name: 'Coffee Rave',  note: 'Keep the groove' },
      { time: '13:30 — 14:00', name: 'HIIT',         note: 'with Simone' },
    ],
  },
  garden: {
    num: '02', label: 'The Garden', kind: 'Cold Plunge · Sauna',
    color: GREEN, left: '29%', top: '32%',
    detailTitle: 'The\nGarden',
    detailArea: 'Area 02 · Outdoor Zone',
    detailKind: 'Cold Plunge · Sauna · Contrast Therapy',
    slots: [
      { time: '13:00 — 14:00', name: 'Session One', note: 'Cold plunge · Sauna · Recover' },
      { time: '14:00 — 15:00', name: 'Break',       note: 'Garden reset' },
      { time: '15:00 — 16:00', name: 'Session Two', note: 'Cold plunge · Sauna · Closing' },
    ],
    note: 'Bring appropriate clothing + your own towel.',
  },
  studio: {
    num: '04', label: 'The Studio', kind: 'Classes & Workshops',
    color: PINK, left: '66%', top: '28%',
    detailTitle: 'The\nStudio',
    detailArea: 'Area 04 · The Studio',
    detailKind: 'Classes & Workshops',
    items: ['Pilates', 'Booty & Core'],
    note: 'Full timetable announced closer to the day.',
  },
  water: {
    num: '03', label: 'Water Terrace', kind: 'Food · Coffee · Wellness',
    color: CREAM, left: '74%', top: '60%',
    detailTitle: 'Water\nTerrace',
    detailArea: 'Area 03 · Community Zone',
    detailKind: 'Food · Coffee · Wellness',
    items: ['Specialty Coffee', 'Food Stall', 'Drink Stall', 'Wellness Brand Stalls'],
    note: 'Brands & vendors announced closer to the day.',
  },
  community: {
    num: '—', label: 'Community Deck', kind: 'Sponsors · Waterfront',
    color: `rgba(244,233,206,0.6)`, left: '52%', top: '82%',
    detailTitle: 'Community\nDeck',
    detailArea: 'Community Zone · Waterfront',
    detailKind: 'Sponsors · Meet Ups',
    items: ['Meet ups & Networking', 'Sponsor Activations'],
    note: 'Full line-up announced closer to the day.',
  },
};

const LEGEND_ORDER = ['main', 'garden', 'water', 'studio', 'community'];

/* ─── inline style helpers ──────────────────────────── */
const s = {
  section: {
    background: RED, color: CREAM,
    fontFamily: "'Archivo', sans-serif",
    padding: '80px 32px 72px',
    position: 'relative', overflow: 'hidden',
    WebkitFontSmoothing: 'antialiased',
  },
  gridBg: {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.06,
    backgroundImage: `linear-gradient(${CREAM} 1px,transparent 1px),linear-gradient(90deg,${CREAM} 1px,transparent 1px)`,
    backgroundSize: '60px 60px',
  },
  inner: { maxWidth: 1200, margin: '0 auto', position: 'relative' },
  head: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    flexWrap: 'wrap', gap: 20,
    borderBottom: `1.5px solid rgba(244,233,206,0.25)`,
    paddingBottom: 20, marginBottom: 40,
  },
  title: {
    fontFamily: "'Anton', sans-serif",
    fontSize: 'clamp(54px,9vw,120px)', lineHeight: 0.86,
    textTransform: 'uppercase', letterSpacing: '-0.01em', color: CREAM,
    margin: 0,
  },
  sub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
    maxWidth: 220, opacity: 0.8, lineHeight: 1.9, textAlign: 'right', color: CREAM,
  },
  mapFrame: {
    position: 'relative', width: '100%',
    border: `1.5px solid rgba(244,233,206,0.2)`, overflow: 'hidden',
  },
  mapImg: {
    width: '100%', display: 'block', aspectRatio: '16/9',
    objectFit: 'cover', filter: 'brightness(0.55) saturate(1.1) contrast(1.05)',
  },
  overlay: (style) => ({ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }),
};

/* ─── Pin component ─────────────────────────────────── */
function Pin({ areaKey, area, active, onActivate }) {
  const isActive = active === areaKey;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isActive}
      onClick={() => onActivate(areaKey)}
      onMouseEnter={() => onActivate(areaKey)}
      onKeyDown={(e) => e.key === 'Enter' && onActivate(areaKey)}
      style={{
        position: 'absolute', left: area.left, top: area.top,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        cursor: 'pointer', zIndex: isActive ? 20 : 10,
        transform: `translate(-50%,-100%) scale(${isActive ? 1.07 : 1})`,
        transition: 'transform 0.2s cubic-bezier(.2,.8,.2,1)',
        userSelect: 'none', WebkitTapHighlightColor: 'transparent',
        outline: 'none',
      }}
    >
      {/* bubble */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px',
        background: isActive ? `rgba(11,11,11,0.96)` : `rgba(11,11,11,0.82)`,
        border: `1.5px solid ${isActive ? area.color : 'rgba(244,233,206,0.18)'}`,
        backdropFilter: 'blur(10px)',
        whiteSpace: 'nowrap',
        transition: 'border-color 0.2s, background 0.2s',
        boxShadow: isActive ? `0 0 20px ${area.color}44` : 'none',
      }}>
        <span style={{
          fontFamily: "'Anton', sans-serif", fontSize: 15,
          letterSpacing: '0.05em', color: area.color, lineHeight: 1,
        }}>{area.num}</span>
        <div style={{ width: 1, height: 26, background: 'rgba(244,233,206,0.18)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{
            fontFamily: "'Anton', sans-serif", fontSize: 14,
            letterSpacing: '0.04em', textTransform: 'uppercase', color: CREAM, lineHeight: 1,
          }}>{area.label}</span>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: '0.13em', textTransform: 'uppercase',
            color: 'rgba(244,233,206,0.9)', lineHeight: 1.3,
          }}>{area.kind}</span>
        </div>
      </div>
      {/* stem */}
      <div style={{
        width: 1.5, height: 18,
        background: `linear-gradient(to bottom, ${area.color}, transparent)`,
      }} />
      {/* dot */}
      <div style={{
        width: 9, height: 9, borderRadius: '50%',
        background: area.color,
        boxShadow: `0 0 0 3px rgba(244,233,206,0.2), 0 0 14px ${area.color}`,
        animation: 'venueMapPulse 2.2s infinite',
      }} />
    </div>
  );
}

/* ─── Detail panel ──────────────────────────────────── */
function DetailPanel({ areaKey }) {
  const area = AREAS[areaKey];
  const c = area.color;
  const lines = area.detailTitle.split('\n');

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 32,
      alignItems: 'start', padding: '28px 32px',
      border: `1.5px solid rgba(244,233,206,0.2)`, borderTop: 'none',
      minHeight: 160,
      animation: 'venueMapIn 0.25s cubic-bezier(.2,.8,.2,1)',
    }}>
      {/* left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 180 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
          letterSpacing: '0.3em', textTransform: 'uppercase', color: c,
        }}>{area.detailArea}</span>
        <div style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: 'clamp(40px,5vw,72px)', textTransform: 'uppercase',
          color: CREAM, lineHeight: 0.88, letterSpacing: '-0.01em',
        }}>
          {lines.map((l, i) => <div key={i}>{l}</div>)}
        </div>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: 'rgba(244,233,206,0.7)', marginTop: 8,
        }}>{area.detailKind}</span>
      </div>

      {/* right */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        borderLeft: `1.5px solid rgba(244,233,206,0.2)`,
        paddingLeft: 32,
      }}>
        {/* timed slots */}
        {area.slots && area.slots.map((slot, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16,
            padding: '12px 0',
            borderTop: `1px solid rgba(244,233,206,0.15)`,
            ...(i === area.slots.length - 1 && !area.note ? { borderBottom: `1px solid rgba(244,233,206,0.15)` } : {}),
            alignItems: 'start',
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              letterSpacing: '0.05em', color: c, lineHeight: 1.4,
            }}>{slot.time}</span>
            <div>
              <div style={{
                fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 13,
                textTransform: 'uppercase', color: CREAM, letterSpacing: '0.04em', lineHeight: 1.4,
              }}>{slot.name}</div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
                letterSpacing: '0.06em', color: 'rgba(244,233,206,0.7)', lineHeight: 1.5,
              }}>{slot.note}</div>
            </div>
          </div>
        ))}

        {/* bullet items */}
        {area.items && area.items.map((item, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0',
            borderTop: `1px solid rgba(244,233,206,0.15)`,
            ...(i === area.items.length - 1 ? { borderBottom: `1px solid rgba(244,233,206,0.15)` } : {}),
            fontFamily: "'Archivo', sans-serif", fontWeight: 700, fontSize: 13,
            textTransform: 'uppercase', color: CREAM,
          }}>
            {item}
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
          </div>
        ))}

        {area.note && (
          <p style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
            letterSpacing: '0.08em', color: 'rgba(244,233,206,0.6)',
            marginTop: 12, lineHeight: 1.7,
          }}>{area.note}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────── */
export default function VenueMapSection() {
  const [active, setActive] = useState('main');
  const activate = useCallback((key) => setActive(key), []);

  return (
    <section style={s.section}>
      {/* keyframe animations injected once */}
      <style>{`
        @keyframes venueMapPulse {
          0%   { box-shadow: 0 0 0 0 rgba(244,233,206,0.5); }
          70%  { box-shadow: 0 0 0 10px transparent; }
          100% { box-shadow: 0 0 0 0 transparent; }
        }
        @keyframes venueMapIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      <div style={s.gridBg} />

      <div style={s.inner}>
        {/* Header */}
        <div style={s.head}>
          <h2 style={s.title}>THE/<br />VENUE.</h2>
          <p style={s.sub}>Four areas.<br />One location.<br />14 Jun · IJland AMS</p>
        </div>

        {/* Map */}
        <div style={s.mapFrame}>
          <img
            src="/images/venue-aerial.jpg"
            alt="IJland Amsterdam aerial view"
            style={s.mapImg}
          />
          {/* overlays */}
          <div style={s.overlay({ background: `linear-gradient(to bottom, rgba(10,10,10,0.45) 0%, transparent 28%, transparent 68%, rgba(10,10,10,0.6) 100%)` })} />
          <div style={s.overlay({ background: 'radial-gradient(ellipse at center, transparent 42%, rgba(10,10,10,0.55) 100%)' })} />
          <div style={s.overlay({ background: `rgba(230,48,39,0.06)`, mixBlendMode: 'multiply' })} />

          {/* Pins */}
          {Object.entries(AREAS).map(([key, area]) => (
            <Pin key={key} areaKey={key} area={area} active={active} onActivate={activate} />
          ))}
        </div>

        {/* Detail panel */}
        <DetailPanel areaKey={active} />

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 0, flexWrap: 'wrap',
          border: `1.5px solid rgba(244,233,206,0.2)`,
          marginTop: 24,
        }}>
          {LEGEND_ORDER.map((key) => {
            const area = AREAS[key];
            const isActive = active === key;
            return (
              <div
                key={key}
                role="button"
                tabIndex={0}
                onClick={() => activate(key)}
                onMouseEnter={() => activate(key)}
                onKeyDown={(e) => e.key === 'Enter' && activate(key)}
                style={{
                  flex: 1, minWidth: 130,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 18px',
                  borderRight: `1.5px solid rgba(244,233,206,0.1)`,
                  background: isActive ? 'rgba(244,233,206,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.2s',
                  outline: 'none',
                }}
              >
                <span style={{
                  fontFamily: "'Anton', sans-serif", fontSize: 20,
                  color: isActive ? area.color : CREAM,
                  opacity: isActive ? 1 : 0.6,
                  lineHeight: 1, transition: 'opacity 0.2s, color 0.2s',
                }}>{area.num}</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{
                    fontFamily: "'Anton', sans-serif", fontSize: 13,
                    letterSpacing: '0.03em', textTransform: 'uppercase', color: CREAM, lineHeight: 1,
                  }}>{area.label}</span>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: 'rgba(244,233,206,0.75)',
                  }}>{area.kind}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex', alignItems: 'stretch', flexWrap: 'wrap',
          borderTop: `1.5px solid rgba(244,233,206,0.2)`,
          borderBottom: `1.5px solid rgba(244,233,206,0.2)`,
          marginTop: 36,
        }}>
          {[
            { k: 'Venue',        v: 'IJland AMS' },
            { k: 'Date',         v: '14 Jun 2026' },
            { k: 'Time',         v: '12:00 — 17:00' },
            { k: 'Tickets from', v: '€12' },
          ].map(({ k, v }) => (
            <div key={k} style={{
              flex: 1, minWidth: 130, padding: '18px 20px',
              borderRight: `1.5px solid rgba(244,233,206,0.1)`,
              display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
            }}>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 8,
                letterSpacing: '0.25em', textTransform: 'uppercase',
                color: CREAM, opacity: 0.7,
              }}>{k}</span>
              <span style={{
                fontFamily: "'Anton', sans-serif", fontSize: 22,
                letterSpacing: '0.02em', color: CREAM, lineHeight: 1,
                whiteSpace: 'nowrap',
              }}>{v}</span>
            </div>
          ))}
          <div style={{
            flex: 1, minWidth: 130, padding: '18px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          }}>
            <a
              href="https://www.eventbrite.nl/e/tickets-the-coffee-day-rave-wellness-event-1988484526748?aff=oddtdtcreator"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                letterSpacing: '0.24em', textTransform: 'uppercase',
                padding: '14px 22px', textDecoration: 'none',
                background: CREAM, color: RED, fontWeight: 700,
                transition: 'background 0.2s, transform 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = PINK; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = CREAM; }}
            >
              Buy Tickets →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
