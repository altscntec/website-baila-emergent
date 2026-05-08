import './VenueMapSection.css';

const RED_PIN = '#FF5050';
const PINK    = '#F8B3C2';
const CREAM   = '#F4E9CE';
const GREEN   = '#22C55E';

const LEGEND = [
  { color: RED_PIN, name: 'Main Area',          kind: 'Coffee Rave' },
  { color: GREEN,   name: 'The Garden',         kind: 'Cold Plunge · Sauna' },
  { color: PINK,    name: 'Food & Drinks',      kind: 'Coffee · Food · Wellness' },
  { color: PINK,    name: 'The Studio',         kind: 'Classes & Workshops' },
  { color: CREAM,   name: 'Community Meet Ups', kind: 'Sponsors Deck' },
];

export default function VenueMapSection() {
  return (
    <section className="vm-section">
      <div className="vm-grid-bg" />

      <div className="vm-inner">
        {/* Header */}
        <div className="vm-head">
          <h2 className="vm-title">THE/<br />VENUE.</h2>
          <p className="vm-sub">Four areas.<br />One location.<br />14 Jun · IJland AMS</p>
        </div>

        {/* Map — static image, no pins, no animation */}
        <div className="vm-map-frame">
          <img
            className="vm-map-img"
            src="/images/venue-map.png"
            alt="IJland Amsterdam venue map"
          />
        </div>

        {/* Legend (static) */}
        <div className="vm-legend">
          {LEGEND.map((item, i) => (
            <div key={i} className="vm-leg" style={{ '--c': item.color }}>
              <div>
                <div className="vm-leg-name">{item.name}</div>
                <div className="vm-leg-kind">{item.kind}</div>
              </div>
            </div>
          ))}
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
