import { useEffect } from 'react';
import { MapPin, Calendar, Clock, Ticket, Flame, Users, Sparkles } from 'lucide-react';
import { getEventBySlug, generateEventSlug } from '../../utils/helpers';
import { trackTicketClick } from '../../utils/tracking';
import { SoldOutCta } from '../common/SoldOutCta';
import VenueMapSection from '../sections/VenueMapSection';

// ISO 8601 date-time in Amsterdam local time, e.g. "2026-11-21T23:00:00+01:00".
// (new Date("2026-11-21").toISOString() is midnight UTC, i.e. 01:00 in
// Amsterdam, which told Google every night started at 01:00.)
const amsOffset = (ymd, hh, mm) => {
  try {
    const probe = new Date(`${ymd}T${hh}:${mm}:00Z`);
    const tz = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Amsterdam', timeZoneName: 'shortOffset' })
      .formatToParts(probe)
      .find((p) => p.type === 'timeZoneName').value; // "GMT+1" / "GMT+2"
    const m = tz.match(/GMT([+-])(\d{1,2})/);
    return m ? `${m[1]}${m[2].padStart(2, '0')}:00` : '+01:00';
  } catch {
    return '+01:00';
  }
};
const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
// event.date "2026-11-21" + event.time "23:00 – 04:00" -> { start, end }; an end
// earlier than the start is the next morning.
export const eventTimes = (event) => {
  const m = String(event.time || '').match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
  const [sh, sm, eh, em] = m ? [m[1], m[2], m[3], m[4]].map((x) => x.padStart(2, '0')) : ['23', '00', '05', '00'];
  const endDay = Number(eh) * 60 + Number(em) <= Number(sh) * 60 + Number(sm) ? addDays(event.date, 1) : event.date;
  return {
    start: `${event.date}T${sh}:${sm}:00${amsOffset(event.date, sh, sm)}`,
    end: `${endDay}T${eh}:${em}:00${amsOffset(endDay, eh, em)}`,
  };
};

export const SingleEventPage = ({ eventSlug, events }) => {
  const event = getEventBySlug(eventSlug, events);
  
  useEffect(() => {
    if (event) {
      // Title, description and canonical are set centrally by <Seo> in App.js
      // Remove existing schemas
      const existingEventScript = document.querySelector('#event-jsonld');
      if (existingEventScript) existingEventScript.remove();
      const existingBreadcrumbScript = document.querySelector('#breadcrumb-jsonld');
      if (existingBreadcrumbScript) existingBreadcrumbScript.remove();
      
      const { start, end } = eventTimes(event);
      const [venueName, ...venueRest] = String(event.venue || '').split(',').map((x) => x.trim());
      const offers = (event.schema_offers && event.schema_offers.length
        ? event.schema_offers
        : [{ name: 'Tickets', ...(event.price_from ? { price: event.price_from.replace('€', '') } : {}) }]
      ).map((o) => ({
        "@type": "Offer",
        "name": o.name,
        ...(o.price ? { "price": o.price, "priceCurrency": "EUR" } : {}),
        "availability": `https://schema.org/${event.sold_out ? 'SoldOut' : o.availability || 'InStock'}`,
        "url": event.ticket_url,
      }));
      
      const musicEventSchema = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        "name": `${event.title} - Latin Event in ${event.city}`,
        "description": `${event.description} Experience the best Reggaeton, Dembow, and Latin Party vibes in the Netherlands.`,
        "image": [event.image_url],
        "startDate": start,
        "endDate": end,
        "doorTime": start,
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": venueName,
          "address": {
            "@type": "PostalAddress",
            ...(event.schema_address || (venueRest.length ? { "streetAddress": venueRest.join(', ') } : {})),
            "addressLocality": event.city,
            "addressCountry": "NL"
          }
        },
        "offers": offers,
        "performer": { "@type": "MusicGroup", "name": "Baila Dembow Resident DJs" },
        "organizer": {
          "@type": "Organization",
          "name": "Baila Dembow",
          "url": "https://bailadembow.com",
          "logo": "https://bailadembow.com/images/branding/baila-dembow-logo-512.png"
        }
      };
      
      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://bailadembow.com/" },
          { "@type": "ListItem", "position": 2, "name": "Events", "item": "https://bailadembow.com/events" },
          { "@type": "ListItem", "position": 3, "name": `Latin Event ${event.city}`, "item": `https://bailadembow.com/events/${eventSlug}` }
        ]
      };
      
      // public/index.html already carries a hand-maintained MusicEvent (with
      // exact times and ticket prices) for upcoming events; <Seo> keeps it on
      // this page. Only fall back to the generated one when there is none.
      // A curated block may be keyed on the /events/<slug> URL or, for events
      // with a dedicated landing page (Halloween -> /halloween), on that URL.
      const curatedUrls = new Set([`https://bailadembow.com/events/${eventSlug}`]);
      if (event.landing_page) curatedUrls.add(`https://bailadembow.com${event.landing_page}`);
      const hasCurated = [...document.head.querySelectorAll('script[type="application/ld+json"]:not([id])')].some((el) => {
        try {
          const j = JSON.parse(el.textContent || '{}');
          return j['@type'] === 'MusicEvent' && curatedUrls.has(j.url);
        } catch {
          return false;
        }
      });
      if (!hasCurated) {
        const eventScript = document.createElement('script');
        eventScript.id = 'event-jsonld';
        eventScript.type = 'application/ld+json';
        eventScript.textContent = JSON.stringify(musicEventSchema);
        document.head.appendChild(eventScript);
      }
      
      const breadcrumbScript = document.createElement('script');
      breadcrumbScript.id = 'breadcrumb-jsonld';
      breadcrumbScript.type = 'application/ld+json';
      breadcrumbScript.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(breadcrumbScript);
    }
    
    return () => {
      const eventScript = document.querySelector('#event-jsonld');
      if (eventScript) eventScript.remove();
      const breadcrumbScript = document.querySelector('#breadcrumb-jsonld');
      if (breadcrumbScript) breadcrumbScript.remove();
    };
  }, [event, eventSlug]);
  
  if (!event) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has ended.</p>
          <a href="/events" className="cta-primary inline-flex items-center gap-2">View All Events</a>
        </div>
      </div>
    );
  }
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero Section — full poster, no crop, padded below the fixed nav */}
      <div className="relative bg-black overflow-hidden">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-auto max-h-[80vh] object-contain mx-auto"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/70 to-transparent pt-20 pb-6 md:pb-10">
          <div className="container-custom px-6 md:px-12">
            <div className="flex items-center gap-2 text-[#FF0080] font-semibold mb-3">
              <MapPin size={18} />
              <span>{event.city}, Netherlands</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-white mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/80">
              <span className="flex items-center gap-2"><Calendar size={18} /> {formattedDate}</span>
              <span className="flex items-center gap-2"><Clock size={18} /> {event.time}</span>
            </div>
          </div>
        </div>
      </div>

      {/* .container-custom sets its own padding shorthand, so vertical spacing lives on an inner wrapper */}
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
          <div className="lg:col-span-2">
            <section className="mb-10">
              <h2 className="font-display text-2xl mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
            </section>
            
            <section className="mb-10 bg-gray-50 rounded-2xl p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF0080]" />
                Event Quick Facts
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3"><Calendar className="w-5 h-5 text-[#FF0080] mt-0.5" /><div><strong>Date:</strong> {formattedDate}</div></li>
                <li className="flex items-start gap-3"><Clock className="w-5 h-5 text-[#FF0080] mt-0.5" /><div><strong>Time:</strong> {event.time}</div></li>
                <li className="flex items-start gap-3"><MapPin className="w-5 h-5 text-[#FF0080] mt-0.5" /><div><strong>Venue:</strong> {event.venue}</div></li>
                <li className="flex items-start gap-3"><Flame className="w-5 h-5 text-[#FF0080] mt-0.5" /><div><strong>Music Style:</strong> Reggaeton & Dembow</div></li>
                <li className="flex items-start gap-3"><Users className="w-5 h-5 text-[#FF0080] mt-0.5" /><div><strong>Category:</strong> Latin Party</div></li>
              </ul>
            </section>
            
            <section className="mb-10">
              <h2 className="font-display text-2xl mb-4">What to Expect</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { emoji: "🎵", title: "Music", desc: "Non-stop Reggaeton, Dembow, and Latin Urban beats all night long." },
                  { emoji: "🎉", title: "Production", desc: "CO2 cannons, confetti drops, immersive lighting, and professional dancers." },
                  { emoji: "👥", title: "Crowd", desc: "Join thousands of Latin music lovers from across the Netherlands." },
                  { emoji: "📍", title: "Venue", desc: "Premium venue with full bar service and amazing atmosphere." }
                ].map((item, i) => (
                  <div key={i} className="bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.emoji} {item.title}</h3>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              {event.price_from && (
                <div className="text-center mb-6">
                  <span className="text-sm text-gray-500">Tickets from</span>
                  <div className="font-display text-4xl text-[#FF0080]">{event.price_from}</div>
                  {event.price_door && <span className="text-sm text-gray-400">Door price: {event.price_door}</span>}
                </div>
              )}
              
              {event.sold_out ? (
                <div className="mb-4"><SoldOutCta tone="light" align="center" testId="single-event-sold-out" /></div>
              ) : (
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF0080]/20 mb-4"
                  onClick={() => trackTicketClick(event.title, event.ticket_url)}
                >
                  <Ticket className="w-5 h-5" />
                  Get Tickets Now
                </a>
              )}
              
              <p className="text-xs text-gray-500 text-center">18+ Event • ID Required • {event.sold_out ? 'Sold Out' : 'Limited Capacity'}</p>
              
              <hr className="my-6 border-gray-100" />
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600"><Calendar className="w-4 h-4 text-[#FF0080]" />{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                <div className="flex items-center gap-3 text-gray-600"><Clock className="w-4 h-4 text-[#FF0080]" />{event.time}</div>
                <div className="flex items-center gap-3 text-gray-600"><MapPin className="w-4 h-4 text-[#FF0080]" />{event.venue}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-gray-100">
          <a href="/" className="text-gray-600 hover:text-[#FF0080] transition-colors">← Back to Homepage</a>
          <a href="/events" className="text-gray-600 hover:text-[#FF0080] transition-colors">View All Events →</a>
        </div>
      </div>

      {/* Venue Map — Coffee Day Rave only — placed at end so the red→white transition isn't mid-content */}
      {eventSlug === 'amsterdam-14-june-2026' && <VenueMapSection />}
    </div>
  );
};
