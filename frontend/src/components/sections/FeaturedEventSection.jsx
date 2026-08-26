import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ticket, MapPin, Calendar, Clock, Shirt } from 'lucide-react';
import { CountdownTimer } from '../common/CountdownTimer';
import { trackTicketClick } from '../../utils/tracking';

// XL flagship-event spotlight: poster + live countdown + big ticket CTA.
export const FeaturedEventSection = ({ event }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  if (!event) return null;

  const dateLabel = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <section
      id="featured-event"
      ref={ref}
      className="relative overflow-hidden py-20 md:py-28"
      style={{ background: 'linear-gradient(135deg, #FF7EB3 0%, #A86CE4 55%, #5B1FE8 100%)' }}
      data-testid="featured-event-section"
    >
      {/* soft glow accents */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,225,141,0.45) 0%, transparent 70%)' }} />
      <div className="absolute -bottom-32 -right-24 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,126,179,0.5) 0%, transparent 70%)' }} />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Poster */}
          <motion.a
            href={event.ticket_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTicketClick(`${event.title} - Featured poster`, event.ticket_url)}
            initial={{ opacity: 0, y: 40, rotate: -2 }}
            animate={isInView ? { opacity: 1, y: 0, rotate: -2 } : {}}
            transition={{ duration: 0.7 }}
            whileHover={{ rotate: 0, scale: 1.02 }}
            className="block mx-auto w-full max-w-[380px] rounded-2xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.45)] ring-4 ring-white/30"
            data-testid="featured-poster"
          >
            <img src={event.image_url} alt={event.title} className="w-full h-auto block" />
          </motion.a>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="text-center lg:text-left"
          >
            <span className="inline-block bg-black text-[#FFE14D] font-display text-sm md:text-base tracking-[0.2em] px-4 py-1.5 rounded-full mb-5">
              XL EVENT
            </span>
            <h2 className="font-display text-white text-[clamp(3rem,8vw,6rem)] leading-[0.9] mb-3 drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
              Summer<br />of Love.
            </h2>
            <p className="text-white/90 font-semibold text-base md:text-lg mb-8 max-w-lg mx-auto lg:mx-0">
              Amsterdam, lets do XL !! Dressed in every shade of summer. Reggaeton, dembow and Latin heat all night at IJland
            </p>

            {/* Countdown */}
            <p className="text-white font-extrabold text-xs tracking-[0.3em] uppercase mb-3">Doors open in</p>
            <div className="mb-8">
              <CountdownTimer targetDate={event.date} targetTime={event.time} />
            </div>

            {/* Details */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-white/90 text-sm font-semibold mb-8">
              <span className="inline-flex items-center gap-1.5"><MapPin size={16} /> {event.venue}</span>
              <span className="inline-flex items-center gap-1.5"><Calendar size={16} /> {dateLabel}</span>
              <span className="inline-flex items-center gap-1.5"><Clock size={16} /> {event.time}</span>
              <span className="inline-flex items-center gap-1.5"><Shirt size={16} /> {event.dress_code}</span>
            </div>

            {/* CTA */}
            <a
              href={event.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackTicketClick(`${event.title} - Featured CTA`, event.ticket_url)}
              className="inline-flex items-center gap-3 bg-[#FFE14D] text-black font-extrabold py-5 px-12 rounded-full text-xl hover:bg-white transition-colors duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
              data-testid="featured-cta"
            >
              <Ticket size={22} />
              GET TICKETS
            </a>
            <p className="text-white/80 text-sm mt-4">Early birds pay the least — prices climb as the date nears. 18+, ID required.</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
