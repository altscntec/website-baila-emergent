import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MapPin, Calendar, Clock, Ticket, Flame } from 'lucide-react';
import { CountdownTimer } from '../common/CountdownTimer';

export const NextEventSection = ({ events }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const nextEvent = events[0];
  
  if (!nextEvent) return null;

  return (
    <section id="next-event" className="section-spacing bg-[#FAFAFA]" ref={ref} data-testid="next-event-section">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">Next Experience</p>
          <h2 className="font-display text-4xl md:text-6xl mb-4" data-testid="next-event-title">
            THE UPCOMING GATHERING<br />STARTS HERE.
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-gradient-to-br from-[#FF0080] to-[#7F00FF] rounded-3xl p-8 md:p-12 mb-8">
            <div className="text-center text-white mb-8">
              <h3 className="font-display text-2xl md:text-3xl mb-2">{nextEvent.title}</h3>
              <p className="text-white/80 flex items-center justify-center gap-2">
                <MapPin size={16} /> {nextEvent.venue}
              </p>
            </div>
            <CountdownTimer targetDate={nextEvent.date} targetTime={nextEvent.time} />
          </div>
          
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`status-badge ${nextEvent.status === 'almost_sold_out' ? 'status-almost-sold-out urgency-badge' : 'status-upcoming'}`}>
                    <Flame size={14} />
                    {nextEvent.status === 'almost_sold_out' ? 'Selling Fast' : 'On Sale'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(nextEvent.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className="flex items-center gap-2"><Clock size={16} /> {nextEvent.time}</span>
                </div>
                <p className="mt-4 text-gray-600 max-w-xl">{nextEvent.description.substring(0, 150)}...</p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-sm">From <span className="font-bold text-xl text-[#FF0080]">{nextEvent.price_from}</span></span>
                  <span className="text-xs text-gray-400">Door: {nextEvent.price_door}</span>
                </div>
              </div>
              <a 
                href={nextEvent.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="cta-primary whitespace-nowrap flex items-center gap-2"
                data-testid="next-event-cta"
              >
                <Ticket size={18} />
                Get Tickets
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
