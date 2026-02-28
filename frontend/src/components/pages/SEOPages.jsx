import { useEffect } from 'react';
import { MapPin, Calendar, Ticket } from 'lucide-react';
import { generateEventSlug } from '../../utils/helpers';

export const LatinEventAmsterdamPage = ({ events }) => {
  useEffect(() => {
    document.title = "Latin Event in Amsterdam | Reggaeton & Dembow Party – Baila Dembow";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Looking for the best Latin Event in Amsterdam? Baila Dembow hosts the biggest Reggaeton and Dembow parties in Amsterdam.');
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://bailadembow.com/latin-event-amsterdam';
  }, []);

  const amsterdamEvents = events?.filter(e => e.city === 'Amsterdam') || [];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl mb-6 text-center">
            <span className="gradient-text">Latin Event in Amsterdam</span>
          </h1>
          
          <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
            Experience the ultimate <strong>Latin Event in Amsterdam</strong> with Baila Dembow – 
            the Netherlands' premier <strong>Reggaeton</strong> and <strong>Dembow</strong> party brand.
          </p>

          <div className="prose prose-lg max-w-none mb-12">
            <h2 className="font-display text-2xl mb-4">The Best Latin Party in Amsterdam</h2>
            <p className="text-gray-600 mb-6">
              Baila Dembow brings the authentic sounds of Latin music to Amsterdam's most iconic venues. 
              Our events feature the hottest Reggaeton hits, pure Dembow energy, and the vibrant atmosphere of a true Latin Party.
            </p>
            
            <h2 className="font-display text-2xl mb-4">Why Choose Baila Dembow Amsterdam?</h2>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li><strong>Authentic Latin Music:</strong> Non-stop Reggaeton, Dembow, and Latin Urban beats</li>
              <li><strong>World-Class Production:</strong> CO2 cannons, confetti, professional lighting and sound</li>
              <li><strong>Premium Venues:</strong> IJland and other top Amsterdam locations</li>
              <li><strong>Passionate Community:</strong> 25,000+ Latin music fans in the Netherlands</li>
            </ul>
          </div>

          {amsterdamEvents.length > 0 && (
            <div className="mb-12">
              <h3 className="font-display text-xl mb-6 text-center">Upcoming Amsterdam Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {amsterdamEvents.map((event) => (
                  <a key={event.id} href={`#/events/${generateEventSlug(event)}`} className="event-card block hover:shadow-lg transition-shadow">
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h4 className="font-display text-lg mb-2">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.venue}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-center bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-2xl p-8">
            <h3 className="font-display text-2xl mb-4">Ready to Experience the Best Latin Event in Amsterdam?</h3>
            <a href="#/events" className="cta-primary inline-flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              View All Events
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
            <a href="#/" className="text-gray-600 hover:text-[#FF0080] transition-colors">← Homepage</a>
            <a href="#/latin-event-rotterdam" className="text-gray-600 hover:text-[#FF0080] transition-colors">Latin Event in Rotterdam →</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LatinEventRotterdamPage = ({ events }) => {
  useEffect(() => {
    document.title = "Latin Event in Rotterdam | Reggaeton & Dembow Party – Baila Dembow";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Discover the best Latin Event in Rotterdam. Baila Dembow brings Reggaeton and Dembow parties to Rotterdam.');
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://bailadembow.com/latin-event-rotterdam';
  }, []);

  const rotterdamEvents = events?.filter(e => e.city === 'Rotterdam') || [];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl mb-6 text-center">
            <span className="gradient-text">Latin Event in Rotterdam</span>
          </h1>
          
          <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
            Rotterdam's hottest <strong>Latin Event</strong> is here! Join Baila Dembow for 
            unforgettable <strong>Reggaeton</strong> and <strong>Dembow</strong> nights.
          </p>

          <div className="prose prose-lg max-w-none mb-12">
            <h2 className="font-display text-2xl mb-4">Rotterdam's Premier Latin Party</h2>
            <p className="text-gray-600 mb-6">
              Baila Dembow has expanded to Rotterdam, bringing the same energy and passion that made us Amsterdam's #1 Latin Event.
            </p>
            
            <h2 className="font-display text-2xl mb-4">What Makes Our Rotterdam Events Special?</h2>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li><strong>Pure Latin Energy:</strong> Hours of non-stop Reggaeton and Dembow</li>
              <li><strong>Top-Tier Production:</strong> Professional sound, lighting, and special effects</li>
              <li><strong>Club Reverse:</strong> Rotterdam's premier nightlife venue</li>
              <li><strong>Affordable Tickets:</strong> Latin Party experience from just €10</li>
            </ul>
          </div>

          {rotterdamEvents.length > 0 && (
            <div className="mb-12">
              <h3 className="font-display text-xl mb-6 text-center">Upcoming Rotterdam Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rotterdamEvents.map((event) => (
                  <a key={event.id} href={`#/events/${generateEventSlug(event)}`} className="event-card block hover:shadow-lg transition-shadow">
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h4 className="font-display text-lg mb-2">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.venue}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="text-center bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-2xl p-8">
            <h3 className="font-display text-2xl mb-4">Experience the Best Latin Event in Rotterdam</h3>
            <a href="#/events" className="cta-primary inline-flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Get Tickets Now
            </a>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
            <a href="#/" className="text-gray-600 hover:text-[#FF0080] transition-colors">← Homepage</a>
            <a href="#/latin-event-amsterdam" className="text-gray-600 hover:text-[#FF0080] transition-colors">Latin Event in Amsterdam →</a>
          </div>
        </div>
      </div>
    </div>
  );
};
