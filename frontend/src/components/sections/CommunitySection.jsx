import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Instagram, MessageCircle, Mail, Send } from 'lucide-react';
import { toast } from 'sonner';
import { BUNNY_GLASSES } from '../../utils/constants';
import { CookieSettingsLink } from '../../context/CookieConsentContext';

// Personal / generic email domains — company emails only
const BLOCKED_DOMAINS = [
  'gmail.com', 'googlemail.com',
  'hotmail.com', 'hotmail.co.uk', 'hotmail.fr', 'hotmail.de', 'hotmail.nl',
  'outlook.com', 'outlook.co.uk', 'outlook.fr', 'outlook.de', 'outlook.nl',
  'live.com', 'live.co.uk', 'live.fr', 'live.de', 'live.nl',
  'yahoo.com', 'yahoo.co.uk', 'yahoo.fr', 'yahoo.de', 'yahoo.nl', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com', 'msn.com',
  'protonmail.com', 'proton.me',
];

const isGenericEmail = (email) => {
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return true;
  return BLOCKED_DOMAINS.includes(domain);
};

export const CommunitySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [formData, setFormData] = useState({
    fullName: '',
    companyName: '',
    companyEmail: '',
    message: '',
  });
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'companyEmail') setEmailError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { fullName, companyName, companyEmail, message } = formData;
    if (!fullName || !companyName || !companyEmail || !message) return;

    if (isGenericEmail(companyEmail)) {
      setEmailError(
        'Please use your company email address. Generic providers such as Gmail, Hotmail, Yahoo, and iCloud are not accepted.'
      );
      return;
    }

    setIsSubmitting(true);

    // Open email client with pre-filled content
    try {
      const subject = encodeURIComponent(`Collab Inquiry — ${companyName}`);
      const body = encodeURIComponent(
        `Full Name: ${fullName}\nCompany: ${companyName}\nEmail: ${companyEmail}\n\nHow we'd like to collab:\n${message}`
      );
      const link = document.createElement('a');
      link.href = `mailto:ask@housedecoded.com?subject=${subject}&body=${body}`;
      link.click();
      setSubmitted(true);
      toast.success("Your email client is opening. We'll get back to you within 48 hours.");
      setFormData({ fullName: '', companyName: '', companyEmail: '', message: '' });
    } catch {
      toast.error('Something went wrong. Please try again.');
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
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">Work With Us</p>
          <h2 className="font-display text-4xl md:text-6xl mb-6 text-white">
            BRANDS &amp; CLUBS,<br /><span className="gradient-text">LET'S BUILD TOGETHER.</span>
          </h2>
          <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
            We're open to partnerships, venue takeovers, brand activations, and creative
            collaborations. If you want to be part of what Baila Dembow is building across
            Europe, reach out below.
          </p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-10 mb-12 text-center"
            >
              <p className="text-2xl font-display text-white mb-2">Message sent.</p>
              <p className="text-gray-400">We'll review your proposal and get back to you within 48 hours.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12 space-y-4 text-left">
              <div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Full Name *"
                  className="input-styled w-full"
                  required
                  data-testid="fullname-input"
                />
              </div>
              <div>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Company Name *"
                  className="input-styled w-full"
                  required
                  data-testid="company-input"
                />
              </div>
              <div>
                <input
                  type="email"
                  name="companyEmail"
                  value={formData.companyEmail}
                  onChange={handleChange}
                  placeholder="Company Email *"
                  className="input-styled w-full"
                  style={emailError ? { borderColor: '#ef4444' } : undefined}
                  required
                  data-testid="company-email-input"
                />
                {emailError && (
                  <p className="mt-2 text-sm text-red-400">{emailError}</p>
                )}
              </div>
              <div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How would you like to collab? *"
                  rows={5}
                  className="input-styled w-full resize-none"
                  required
                  data-testid="message-input"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60"
                disabled={isSubmitting}
                data-testid="collab-submit-btn"
              >
                <Send size={18} />
                {isSubmitting ? 'Sending…' : 'Send Proposal'}
              </button>
            </form>
          )}

          {/* Social links */}
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
              rotate: [0, 2, -2, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>

        <div className="flex flex-col items-center gap-4 text-sm text-gray-500 text-center">
          <span className="font-display text-xl text-white">BAILA DEMBOW<span className="gradient-text">.</span></span>
          <span>© {new Date().getFullYear()} Baila Dembow. All rights reserved. Part of House Decoded Events, Amsterdam — KVK 67994725</span>
          <CookieSettingsLink />
        </div>
      </div>
    </section>
  );
};
