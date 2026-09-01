import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { trackTicketClick } from '../../utils/tracking';

// Defaults to the general Linktree; pass ticketUrl/eventName to point it at a
// specific event's checkout (e.g. on that event's own landing page).
export const FloatingCTA = ({ ticketUrl = 'https://linktr.ee/bailadembow', eventName = 'Baila Dembow' }) => {
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
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="floating-cta"
          data-testid="floating-cta"
          onClick={() => trackTicketClick(`${eventName} - Floating CTA`, ticketUrl)}
        >
          <div className="absolute inset-0 rounded-full bg-[#FF0080] pulse-ring" />
          <Ticket size={20} />
          <span className="relative z-10">GET TICKETS</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
};
