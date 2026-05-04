import { useState, useEffect } from 'react';
import axios from 'axios';
import { MapPin, Calendar, Clock, ArrowRight } from 'lucide-react';
import { EventModal } from '../common/EventModal';
import { API, FALLBACK_EVENTS } from '../../utils/constants';
import { generateEventSlug } from '../../utils/helpers';
import { trackTicketClick } from '../../utils/tracking';

export const EventsPage = ({ events: propEvents }) => {
  const [events, setEvents] = useState(propEvents || FALLBACK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!propEvents) {
      const fetchEvents = async () => {
        try {
          const response = await axios.get(`${API}/events`);
          if (response.data && response.data.length > 0) {
            setEvents(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      };
      fetchEvents();
    }
  }, [propEvents]);

  return (
    <>
      <div className="min-h-screen bg-[#0A0A0A] pt-24">
        <div className="container-custom py-16">
          <h1 className="font-display text-4xl md:text-6xl mb-4 text-center text-white">
            LATIN EVENTS<br /><span className="gradient-text">AMSTERDAM & NETHERLANDS</span>
          </h1>
          <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            Experience the best Reggaeton, Dembow, and Latin Party events in the Netherlands.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div key={event.id} className="event-card" data-testid={`events-page-card-${index}`}>
                <a href={`#/events/${generateEventSlug(event)}`} className="block">
                  <div className="relative h-56 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`status-badge ${event.status === 'almost_sold_out' ? 'status-almost-sold-out' : 'status-upcoming'}`}>
                        {event.status === 'almost_sold_out' ? 'Almost Sold Out' : 'On Sale'}
                      </span>
                    </div>
                  </div>
                </a>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#FF0080] font-semibold mb-2">
                    <MapPin size={14} /> {event.city}
                  </div>
                  <h3 className="font-display text-xl mb-2 text-white">{event.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">{event.description.substring(0, 120)}...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">From <span className="font-bold text-lg text-white">{event.price_from}</span></span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-sm text-gray-400 hover:text-[#FF0080] transition-colors underline underline-offset-2"
                      >
                        Quick View
                      </button>
                      <a 
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#FF0080] font-semibold hover:gap-2 transition-all"
                        onClick={() => trackTicketClick(event.title, event.ticket_url)}
                      >
                        Get Tickets <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
      
      <EventModal 
        event={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </>
  );
};
