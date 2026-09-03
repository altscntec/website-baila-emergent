import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { BAILA_LOGO } from '../../utils/constants';

// The world of Baila Dembow — a rendered 3D street scene as the hero,
// with the real logo on top.
export const WorldHero = () => (
  <section id="hero" className="relative min-h-screen overflow-hidden" data-testid="world-hero">
    {/* rendered world — restyled with the real Baila Dembow mascot bunny */}
    <img
      src="/images/world/barrio-hero-real.jpg"
      alt="The world of Baila Dembow — the mascot bunny on a Latin American street at dusk"
      className="absolute inset-0 w-full h-full object-cover"
      data-testid="world-hero-image"
    />
    {/* readability gradients */}
    <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,.45) 0%, transparent 30%, transparent 55%, rgba(0,0,0,.75) 100%)' }} />

    <div className="relative z-10 min-h-screen flex flex-col items-center justify-between text-center px-5 pt-28 pb-16">
      <motion.img
        src={BAILA_LOGO}
        alt="Baila Dembow"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="w-60 sm:w-72 md:w-96 drop-shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
        data-testid="hero-logo"
      />

      <div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-white font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-6 drop-shadow-lg"
        >
          Reggaeton · Dembow · Latin Hits
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => document.getElementById('agenda')?.scrollIntoView({ behavior: 'smooth' })}
            className="relative inline-flex items-center gap-3 bg-[#FFE14D] text-black font-extrabold py-5 px-12 rounded-full text-lg md:text-xl hover:bg-white hover:scale-[1.03] transition-all duration-300 shadow-[0_10px_50px_rgba(255,225,77,0.55)]"
            data-testid="hero-cta-tickets"
          >
            <div className="absolute inset-0 rounded-full bg-[#FFE14D] pulse-ring" />
            <Ticket size={22} className="relative z-10" />
            <span className="relative z-10">GET TICKETS ↓</span>
          </button>
        </motion.div>
      </div>
    </div>
  </section>
);
