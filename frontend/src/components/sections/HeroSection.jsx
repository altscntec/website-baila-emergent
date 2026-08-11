import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { EVENTS, BUNNY_GLASSES } from '../../utils/constants';
import { trackTicketClick } from '../../utils/tracking';

// Next upcoming event drives the hero's dominant date line
const getNextEvent = () => {
  const today = new Date().toISOString().slice(0, 10);
  return [...EVENTS]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
};

export const HeroSection = () => {
  const next = getNextEvent();
  const nextDate = next
    ? new Date(next.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'long' })
    : null;

  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: '#5B1FE8' }}
      data-testid="hero-section"
    >
      <div className="container-custom relative z-10 text-center" style={{ paddingTop: '11rem', paddingBottom: '6rem' }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-6"
        >
          Reggaeton · Dembow · Latin Hits
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-display text-[#FFE14D] text-[clamp(4.5rem,15vw,13rem)] leading-[0.85]"
          data-testid="hero-headline"
        >
          Baila<br />Dembow.
        </motion.h1>

        <motion.img
          src={BUNNY_GLASSES}
          alt="Baila Dembow bunny mascot"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="h-24 md:h-32 w-auto mx-auto my-8"
          data-testid="hero-bunny"
        />

        {next && (
          <motion.a
            href="/events"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="block font-display text-white text-[clamp(1.8rem,5vw,4rem)] mb-10 hover:text-[#FFE14D] transition-colors"
            data-testid="hero-next-event"
          >
            Next up — {nextDate} · {next.city}
          </motion.a>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          {next && (
            <a
              href={next.ticket_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#FFE14D] text-black font-extrabold py-4 px-10 rounded-full text-lg hover:bg-white transition-colors duration-300"
              data-testid="hero-cta-tickets"
              onClick={() => trackTicketClick(`${next.title} - Hero CTA`, next.ticket_url)}
            >
              <Ticket size={20} />
              GET TICKETS
            </a>
          )}
          <a
            href="/play.html"
            className="inline-flex items-center gap-2 text-white font-extrabold py-4 px-6 text-lg underline underline-offset-4 decoration-2 hover:text-[#FFE14D] transition-colors"
            data-testid="hero-cta-play"
          >
            PLAY & WIN →
          </a>
        </motion.div>

        {/* SEO line (keeps homepage keyword presence after LatinEventSection moved off) */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.1 }}
          className="text-white/60 text-sm mt-14 max-w-xl mx-auto"
        >
          The leading Latin event in Amsterdam &amp; the Netherlands — 25,000+ dancers since 2023.
        </motion.p>
      </div>
    </section>
  );
};

export const LatinEventSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative" ref={ref} data-testid="latin-event-section">
      {/* Gradient transition from dark hero to white */}
      <div className="absolute top-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, #000000, #ffffff)' }} />
      {/* White content area */}
      <div className="bg-white pt-20 pb-16">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h1 className="font-display text-3xl md:text-5xl mb-6">
              <span className="gradient-text">Latin Event in Amsterdam</span> & Netherlands
            </h1>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Baila Dembow is the leading <strong>Latin Event in Amsterdam</strong> and the <strong>Netherlands</strong>.
              We bring the authentic sounds of <strong>Reggaeton</strong> and <strong>Dembow</strong> to Dutch dance floors,
              creating the ultimate <strong>Latin Party</strong> experience. From <strong>Amsterdam</strong> to <strong>Rotterdam</strong>,
              our events unite thousands of Latin music lovers for nights of non-stop dancing, world-class production,
              and unforgettable energy.
            </p>
            <p className="text-gray-500 text-base leading-relaxed mb-8">
              Whether you're looking for a <strong>Latin Event in Rotterdam</strong>, a <strong>Reggaeton</strong> party in Amsterdam,
              or the biggest <strong>Dembow</strong> nights in the Netherlands, Baila Dembow delivers.
              Join our community of 25,000+ Latin music fans and experience why we're the #1 <strong>Latin Party</strong> brand in the country.
            </p>
            <div className="flex flex-wrap justify-center gap-3 text-sm mb-8">
              <a href="/latin-event-amsterdam" className="px-4 py-2 bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-full text-gray-700 hover:from-[#FF0080]/20 hover:to-[#8B5CF6]/20 transition-colors">Latin Event in Amsterdam</a>
              <a href="/latin-event-rotterdam" className="px-4 py-2 bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-full text-gray-700 hover:from-[#FF0080]/20 hover:to-[#8B5CF6]/20 transition-colors">Latin Event in Rotterdam</a>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700">Latin Party Netherlands</span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700">Reggaeton Events</span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700">Dembow Party</span>
            </div>
          </motion.div>
        </div>
      </div>
      {/* Gradient transition from white to dark experience section */}
      <div className="h-16" style={{ background: 'linear-gradient(to bottom, #ffffff, #0A0A0A)' }} />
    </section>
  );
};
