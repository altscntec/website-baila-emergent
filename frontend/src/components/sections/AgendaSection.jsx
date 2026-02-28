import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Calendar, Clock, ArrowRight, Flame, Sparkles } from 'lucide-react';
import { EventModal } from '../common/EventModal';
import { trackTicketClick } from '../../utils/tracking';

export const AgendaSection = ({ events }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'almost_sold_out':
        return { class: 'status-almost-sold-out urgency-badge', text: 'Almost Sold Out', icon: <Flame size={14} /> };
      case 'sold_out':
        return { class: 'status-sold-out', text: 'Sold Out', icon: null };
      default:
        return { class: 'status-upcoming', text: 'On Sale', icon: <Sparkles size={14} /> };
    }
  };

  return (
    <>
      <section id="agenda" className="section-spacing bg-[#FAFAFA]" ref={ref} data-testid="agenda-section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">Upcoming Events</p>
            <h2 className="font-display text-4xl md:text-6xl">
              <span className="gradient-text">AGENDA</span>
            </h2>
          </motion.div>
          
          <div className="events-grid">
            {events.map((event, index) => {
              const statusBadge = getStatusBadge(event.status);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="event-card"
                  data-testid={`event-card-${index}`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.icon}
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-[#FF0080] font-semibold mb-2">
                      <MapPin size={14} />
                      {event.city}
                    </div>
                    <h3 className="font-display text-xl mb-2">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description.substring(0, 100)}...</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">From <span className="font-bold text-lg">{event.price_from}</span></span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-sm text-gray-500 hover:text-[#FF0080] transition-colors underline underline-offset-2"
                          data-testid={`event-details-${index}`}
                        >
                          More Details
                        </button>
                        <a 
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#FF0080] font-semibold hover:gap-2 transition-all"
                          data-testid={`event-cta-${index}`}
                          onClick={() => trackTicketClick(event.title, event.ticket_url)}
                        >
                          Get Tickets <ArrowRight size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      
      <EventModal 
        event={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </>
  );
};
