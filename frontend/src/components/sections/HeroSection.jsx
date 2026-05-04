import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { BAILA_LOGO } from '../../utils/constants';
import { trackTicketClick } from '../../utils/tracking';

export const HeroSection = () => {
  const scrollToNextEvent = () => {
    const element = document.getElementById('next-event');
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="hero-section bg-black relative overflow-hidden" data-testid="hero-section">
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.35 }}
        data-testid="hero-video"
      >
        <source src="https://customer-assets.emergentagent.com/job_694aaf51-5947-4a3c-b1ec-bff2c9c5c497/artifacts/psrpsc0d_0501%20%281%29%281%29.mp4" type="video/mp4" />
      </video>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
      
      <div className="hero-content relative z-10">
        <motion.img
          src={BAILA_LOGO}
          alt="Baila Dembow"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="w-64 sm:w-80 md:w-96 lg:w-[500px] mx-auto mb-8"
          data-testid="hero-logo"
        />
        
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-white/80 text-sm md:text-base tracking-[0.3em] uppercase mb-6"
        >
          Reggaeton. Dembow & Latin Hits
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl gradient-text mb-8"
          data-testid="hero-headline"
        >
          Perreo Para El Mundo.
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <a 
            href="https://linktr.ee/bailadembow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300"
            data-testid="hero-cta-tickets"
            onClick={() => trackTicketClick('Baila Dembow - Hero CTA', 'https://linktr.ee/bailadembow')}
          >
            <Ticket size={20} />
            GET TICKETS
          </a>
          <button 
            onClick={scrollToNextEvent}
            className="inline-flex items-center gap-2 bg-transparent text-white font-bold py-4 px-8 rounded-full text-lg border-2 border-white hover:bg-white hover:text-black transition-colors duration-300"
            data-testid="hero-cta-events"
          >
            View Upcoming Events
          </button>
        </motion.div>
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
              <a href="#/latin-event-amsterdam" className="px-4 py-2 bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-full text-gray-700 hover:from-[#FF0080]/20 hover:to-[#8B5CF6]/20 transition-colors">Latin Event in Amsterdam</a>
              <a href="#/latin-event-rotterdam" className="px-4 py-2 bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-full text-gray-700 hover:from-[#FF0080]/20 hover:to-[#8B5CF6]/20 transition-colors">Latin Event in Rotterdam</a>
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
