import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ticket, Calendar, Clock, MapPin } from 'lucide-react';
import { CountdownTimer } from '../common/CountdownTimer';
import { trackTicketClick } from '../../utils/tracking';
import { SoldOutCta } from '../common/SoldOutCta';

// Compact second spotlight under the XL one: for a flagship that is close but no longer the headline
// (e.g. Halloween once NYE became primary). Poster thumbnail, countdown, one ticket CTA. No sales figures.
export const SecondaryEventSection = ({ event }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  if (!event) return null;
  const dateLabel = new Date(event.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <section id="secondary-event" ref={ref} className="bg-black text-white py-12 md:py-16" data-testid="secondary-event-section">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto] gap-8 items-center"
        >
          <a href={event.landing_page || event.ticket_url} className="relative block mx-auto md:mx-0 w-[170px] md:w-[210px] rounded-xl overflow-hidden ring-2 ring-white/20 shadow-2xl" data-testid="secondary-poster">
            <img src={event.image_url} alt={event.title} className="w-full h-auto block" loading="lazy" />
            {event.sold_out && (
              <span className="absolute top-5 -left-12 -rotate-[32deg] bg-[#FF3B30] text-white font-extrabold tracking-[0.25em] text-xs px-14 py-1.5 shadow-lg">SOLD OUT</span>
            )}
          </a>
          <div className="text-center md:text-left">
            <p className="text-xs tracking-[0.25em] uppercase text-[#FF0080] font-semibold mb-3">{event.sold_out ? 'Sold out · Muchas gracias' : 'Also coming up'}</p>
            <h2 className="font-display text-3xl md:text-4xl leading-none mb-3">
              {event.sold_out && <span className="block text-[#FF3B30] mb-1">SOLD OUT.</span>}
              {event.title}
            </h2>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 text-sm text-white/80 mb-5">
              <span className="flex items-center gap-2"><Calendar size={16} /> {dateLabel}</span>
              <span className="flex items-center gap-2"><Clock size={16} /> {event.time}</span>
              <span className="flex items-center gap-2"><MapPin size={16} /> {event.venue}</span>
            </div>
            <div className="scale-90 origin-center md:origin-left"><CountdownTimer targetDate={event.date} targetTime={event.time} /></div>
          </div>
          <div className="flex flex-col items-center md:items-end gap-3">
            {event.sold_out ? (
              <SoldOutCta tone="dark" align="right" testId="secondary-cta-sold-out" />
            ) : (
              <a
                href={event.ticket_url} target="_blank" rel="noopener noreferrer"
                onClick={() => trackTicketClick(`${event.title} - Secondary spotlight`, event.ticket_url)}
                className="inline-flex items-center gap-3 bg-white text-black font-extrabold py-4 px-8 rounded-full hover:bg-[#FF0080] hover:text-white transition-colors"
                data-testid="secondary-cta"
              >
                <Ticket size={18} /> GET TICKETS
              </a>
            )}
            {event.landing_page && <a href={event.landing_page} className="text-sm underline text-white/80 hover:text-white">More about this night</a>}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
