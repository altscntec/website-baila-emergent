import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { trackTicketClick } from '../../utils/tracking';

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

export const AgendaSection = ({ events }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="agenda" className="py-24 md:py-32" ref={ref} data-testid="agenda-section" style={{ background: '#0A0A0A' }}>
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p className="text-[#FFE14D] font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-4">Upcoming Events</p>
          <h2 className="font-display text-white text-[clamp(3.5rem,10vw,8rem)] leading-[0.9]">Agenda.</h2>
        </motion.div>

        {events.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            data-testid="agenda-empty-state"
            className="max-w-xl mx-auto text-center border border-white/10 rounded-2xl py-12 px-8 bg-white/[0.02]"
          >
            <div className="text-5xl mb-4">🐰</div>
            <h3 className="font-display text-2xl md:text-3xl text-white mb-3">New dates dropping soon</h3>
            <p className="text-gray-400 mb-6">
              The next Baila Dembow edition is being announced. Follow along
              so you're the first to know when tickets open.
            </p>
            <a
              href="https://www.instagram.com/baila.dembow/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#FF0080] text-white font-semibold hover:opacity-90 transition"
            >
              Follow @baila.dembow
            </a>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {[...events].sort((a, b) => a.date.localeCompare(b.date)).map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="rounded-2xl overflow-hidden bg-[#141414]"
              data-testid={`event-card-${index}`}
            >
              {/* Full poster, no crop */}
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-auto"
                loading="lazy"
              />
              <div className="p-6 md:p-8">
                <h3 className="font-display text-white text-3xl md:text-4xl mb-2">{event.city}.</h3>
                <p className="text-[#FFE14D] font-extrabold uppercase tracking-wider text-sm mb-1">
                  {formatDate(event.date)} · {event.time}
                </p>
                <p className="text-gray-400 text-sm mb-6">{event.venue}</p>
                <a
                  href={event.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-[#FFE14D] text-black font-extrabold py-4 rounded-full text-lg hover:bg-white transition-colors duration-300"
                  data-testid={`event-cta-${index}`}
                  onClick={() => trackTicketClick(event.title, event.ticket_url)}
                >
                  GET TICKETS
                </a>
                {event.landing_page && (
                  <a
                    href={event.landing_page}
                    className="block w-full text-center mt-3 border-2 border-white/25 text-white font-extrabold py-3.5 rounded-full text-base hover:bg-white hover:text-black hover:border-white transition-colors duration-300"
                    data-testid={`event-more-info-${index}`}
                  >
                    MORE INFO
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
