import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Instagram, MessageCircle, Mail, Users } from 'lucide-react';
import { toast } from 'sonner';
import { BUNNY_GLASSES } from '../../utils/constants';
import { trackFormSubmission } from '../../utils/tracking';
import { CookieSettingsLink } from '../../context/CookieConsentContext';

export const CommunitySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    city: "",
    country: "",
    age: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.city || !formData.country || !formData.age) return;
    
    setIsSubmitting(true);
    try {
      trackFormSubmission(formData);
      toast.success("Welcome to the movement! You're now part of Baila Dembow.");
      setFormData({ name: "", email: "", city: "", country: "", age: "" });
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="community" className="section-spacing footer-gradient" ref={ref} data-testid="community-section">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">Join Us</p>
          <h2 className="font-display text-4xl md:text-6xl mb-6 text-white">
            BECOME PART OF<br /><span className="gradient-text">THE MOVEMENT.</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            This isn't just about events. It's about culture, belonging, and connection. 
            Strangers becoming family. One rhythm, one night, one community.
          </p>
          
          <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12 space-y-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name *"
              className="input-styled w-full"
              required
              data-testid="name-input"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address *"
              className="input-styled w-full"
              required
              data-testid="email-input"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City *"
                className="input-styled w-full"
                required
                data-testid="city-input"
              />
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country *"
                className="input-styled w-full"
                required
                data-testid="country-input"
              />
            </div>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Age *"
              className="input-styled w-full"
              required
              min="18"
              max="99"
              data-testid="age-input"
            />
            <button 
              type="submit" 
              className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300 flex items-center justify-center gap-2"
              disabled={isSubmitting}
              data-testid="subscribe-btn"
            >
              <Users size={18} />
              {isSubmitting ? "Joining..." : "Join Community"}
            </button>
          </form>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <a href="https://www.instagram.com/baila.dembow/" target="_blank" rel="noopener noreferrer" className="social-link" data-testid="social-instagram" aria-label="Instagram">
              <Instagram size={22} />
            </a>
            <a href="https://www.facebook.com/baila.dembow" target="_blank" rel="noopener noreferrer" className="social-link" data-testid="social-facebook" aria-label="Facebook">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a href="https://www.tiktok.com/@baila.dembow" target="_blank" rel="noopener noreferrer" className="social-link" data-testid="social-tiktok" aria-label="TikTok">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <a href="https://www.youtube.com/@baila.dembow" target="_blank" rel="noopener noreferrer" className="social-link" data-testid="social-youtube" aria-label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </a>
            <a href="mailto:ask@housedecoded.com" className="social-link" data-testid="social-email" aria-label="Email">
              <Mail size={22} />
            </a>
            <a href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6" target="_blank" rel="noopener noreferrer" className="social-link" data-testid="social-whatsapp" aria-label="WhatsApp Community">
              <MessageCircle size={22} />
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="container-custom mt-20 pt-8 border-t border-white/10">
        <motion.div 
          className="flex justify-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <motion.img 
            src={BUNNY_GLASSES}
            alt="Baila Dembow Bunny"
            className="h-32 md:h-40 w-auto"
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
        
        <div className="flex flex-col items-center gap-4 text-sm text-gray-500 text-center">
          <span className="font-display text-xl text-white">BAILA DEMBOW<span className="gradient-text">.</span></span>
          <span>© {new Date().getFullYear()} Baila Dembow. All rights reserved. Part of House Decoded events, Amsterdam KVK 67994725</span>
          <CookieSettingsLink />
        </div>
      </div>
    </section>
  );
};
