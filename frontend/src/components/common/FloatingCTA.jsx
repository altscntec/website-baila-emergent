import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { trackTicketClick } from '../../utils/tracking';

export const FloatingCTA = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="https://linktr.ee/bailadembow"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="floating-cta"
          data-testid="floating-cta"
          onClick={() => trackTicketClick('Baila Dembow - Floating CTA', 'https://linktr.ee/bailadembow')}
        >
          <div className="absolute inset-0 rounded-full bg-[#FF0080] pulse-ring" />
          <Ticket size={20} />
          <span className="relative z-10">GET TICKETS</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};
