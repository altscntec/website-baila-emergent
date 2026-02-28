import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Calendar, Clock, Flame, Users, Ticket, ArrowRight, Sparkles } from 'lucide-react';
import { generateEventSlug } from '../../utils/helpers';
import { trackTicketClick } from '../../utils/tracking';

export const EventModal = ({ event, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleEscape = (e) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !event) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
        data-testid="event-modal-backdrop"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 50 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl"
          data-testid="event-modal"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            data-testid="event-modal-close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-center gap-2 text-[#FF0080] font-semibold mb-3">
              <MapPin size={18} />
              <span>{event.city}, Netherlands</span>
            </div>

            <h2 className="font-display text-2xl md:text-3xl mb-4">{event.title}</h2>

            <div className="bg-gray-50 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF0080]" />
                Event Quick Facts
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span><strong>Date:</strong> {formattedDate}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span><strong>Time:</strong> {event.time}</span>
                </li>
                <li className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span><strong>Venue:</strong> {event.venue}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Flame className="w-4 h-4 text-gray-400" />
                  <span><strong>Music Style:</strong> Reggaeton & Dembow</span>
                </li>
                <li className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span><strong>Category:</strong> Latin Party</span>
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">About This Event</h3>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-gray-500">From</span>
              <span className="font-display text-3xl text-[#FF0080]">{event.price_from}</span>
              <span className="text-sm text-gray-400">| Door: {event.price_door}</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF0080]/20"
                onClick={() => trackTicketClick(event.title, event.ticket_url)}
                data-testid="event-modal-tickets"
              >
                <Ticket className="w-5 h-5" />
                Get Tickets
              </a>
              <a
                href={`/#/events/${generateEventSlug(event)}`}
                className="flex items-center justify-center gap-2 px-6 py-4 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-[#FF0080] hover:text-[#FF0080] transition-all"
                data-testid="event-modal-page-link"
              >
                <ArrowRight className="w-5 h-5" />
                View Event Page
              </a>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
