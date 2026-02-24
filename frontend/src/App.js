import { useEffect, useState, useRef, createContext, useContext } from "react";
import "@/App.css";
import axios from "axios";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Ticket, Instagram, MessageCircle, Mail, MapPin, Calendar, Clock, Users, ArrowRight, Flame, Sparkles, X, Settings, Shield, BarChart3, Target } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Cookie Consent Context
const CookieConsentContext = createContext(null);

const useCookieConsent = () => useContext(CookieConsentContext);

// Cookie Consent Storage Keys
const CONSENT_KEY = 'baila_cookie_consent';
const META_PIXEL_ID = '179511642577064';
const TIKTOK_PIXEL_ID = 'C189G8RC77UBJAEBRS80';

// Get stored consent
const getStoredConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading consent:', e);
  }
  return null;
};

// Save consent
const saveConsent = (consent) => {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({
      ...consent,
      timestamp: new Date().toISOString()
    }));
  } catch (e) {
    console.error('Error saving consent:', e);
  }
};

// Load Meta Pixel
const loadMetaPixel = () => {
  if (window.fbq) return;
  
  !function(f,b,e,v,n,t,s) {
    if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)
  }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
  
  window.fbq('init', META_PIXEL_ID);
  window.fbq('track', 'PageView');
};

// Load TikTok Pixel
const loadTikTokPixel = () => {
  if (window.ttq && window.ttq._i && window.ttq._i[TIKTOK_PIXEL_ID]) return;
  
  !function (w, d, t) {
    w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
    ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
    ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
    for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
    ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
    ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ttq.load(TIKTOK_PIXEL_ID);
    ttq.page();
  }(window, document, 'ttq');
};

// Cookie Consent Banner Component
const CookieConsentBanner = ({ onConsent, showPreferences, setShowPreferences }) => {
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false
  });

  const handleAcceptAll = () => {
    const consent = { necessary: true, analytics: true, marketing: true };
    onConsent(consent);
  };

  const handleRejectAll = () => {
    const consent = { necessary: true, analytics: false, marketing: false };
    onConsent(consent);
  };

  const handleSavePreferences = () => {
    onConsent(preferences);
    setShowPreferences(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none"
        data-testid="cookie-banner"
      >
        <div className="pointer-events-auto w-full max-w-2xl">
          {!showPreferences ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
            >
              {/* Gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-6">
                <div className="flex items-start gap-4 mb-5">
                  <div className="p-2 bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl">
                    <Shield className="w-6 h-6 text-[#FF0080]" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl text-gray-900 mb-1">We value your privacy</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                      You can choose which cookies to accept.
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleRejectAll}
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                    data-testid="cookie-reject-all"
                  >
                    Reject all
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-[#FF0080]/20"
                    data-testid="cookie-accept-all"
                  >
                    Accept all
                  </button>
                </div>
                
                <button
                  onClick={() => setShowPreferences(true)}
                  className="w-full mt-3 px-4 py-2 text-sm text-gray-500 hover:text-[#FF0080] transition-colors flex items-center justify-center gap-2"
                  data-testid="cookie-manage-preferences"
                >
                  <Settings className="w-4 h-4" />
                  Manage preferences
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[80vh] overflow-y-auto"
            >
              {/* Gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-display text-xl text-gray-900">Cookie Preferences</h3>
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                {/* Necessary Cookies */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-green-100 rounded-lg">
                        <Shield className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Necessary</span>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Always active
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Essential for the website to function properly. Cannot be disabled.
                  </p>
                </div>
                
                {/* Analytics Cookies */}
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Analytics</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.analytics}
                        onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="sr-only peer"
                        data-testid="cookie-analytics-toggle"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#FF0080] peer-checked:to-[#8B5CF6]"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Help us understand how visitors interact with our website.
                  </p>
                </div>
                
                {/* Marketing Cookies */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <Target className="w-4 h-4 text-purple-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Marketing</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={preferences.marketing}
                        onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                        className="sr-only peer"
                        data-testid="cookie-marketing-toggle"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-[#FF0080] peer-checked:to-[#8B5CF6]"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600 ml-10">
                    Used to show you relevant ads on other platforms (Meta, TikTok).
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPreferences(false)}
                    className="flex-1 px-5 py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-lg shadow-[#FF0080]/20"
                    data-testid="cookie-save-preferences"
                  >
                    Save preferences
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Cookie Consent Provider Component
const CookieConsentProvider = ({ children }) => {
  const [consent, setConsent] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (stored) {
      setConsent(stored);
      // Load trackers based on stored consent
      if (stored.marketing) {
        loadMetaPixel();
        loadTikTokPixel();
      }
    } else {
      setShowBanner(true);
    }
    setInitialized(true);
  }, []);

  const handleConsent = (newConsent) => {
    setConsent(newConsent);
    saveConsent(newConsent);
    setShowBanner(false);
    
    // Load trackers if marketing consent given
    if (newConsent.marketing) {
      loadMetaPixel();
      loadTikTokPixel();
    }
  };

  const openPreferences = () => {
    setShowPreferences(true);
    setShowBanner(true);
  };

  if (!initialized) return null;

  return (
    <CookieConsentContext.Provider value={{ consent, openPreferences }}>
      {children}
      {showBanner && (
        <CookieConsentBanner 
          onConsent={handleConsent}
          showPreferences={showPreferences}
          setShowPreferences={setShowPreferences}
        />
      )}
    </CookieConsentContext.Provider>
  );
};

// Tracking helper functions - now check for consent
const trackEvent = (eventName, eventData = {}) => {
  // Meta Pixel tracking
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, eventData);
  }
  // TikTok Pixel tracking
  if (typeof window !== 'undefined' && window.ttq) {
    window.ttq.track(eventName, eventData);
  }
};

const trackTicketClick = (eventName, ticketUrl) => {
  trackEvent('InitiateCheckout', {
    content_name: eventName,
    content_category: 'Event Ticket',
    currency: 'EUR',
    value: 10
  });
};

const trackFormSubmission = (formData) => {
  trackEvent('Lead', {
    content_name: 'Community Signup',
    content_category: 'Newsletter',
    city: formData.city,
    country: formData.country
  });
  trackEvent('CompleteRegistration', {
    content_name: 'Baila Dembow Community',
    status: 'subscribed'
  });
};

// User provided images
const GALLERY_IMAGES = [
  {
    id: "gallery-1",
    url: "/gallery/gallery1.jpg",
    alt: "Baila Dembow event crowd"
  },
  {
    id: "gallery-2",
    url: "/gallery/gallery2.jpg",
    alt: "Baila Dembow party atmosphere"
  },
  {
    id: "gallery-3",
    url: "/gallery/gallery3.jpg",
    alt: "Baila Dembow dance floor"
  },
  {
    id: "gallery-4",
    url: "/gallery/gallery4.jpg",
    alt: "Baila Dembow event energy"
  },
  {
    id: "gallery-5",
    url: "/gallery/gallery5.jpg",
    alt: "Baila Dembow club night"
  },
  {
    id: "gallery-6",
    url: "/gallery/gallery6.jpg",
    alt: "Baila Dembow Latin vibes"
  },
  {
    id: "gallery-7",
    url: "/gallery/gallery7.jpg",
    alt: "Baila Dembow crowd experience"
  },
  {
    id: "gallery-8",
    url: "/gallery/gallery8.jpg",
    alt: "Baila Dembow party scene"
  }
];

// YouTube video ID
const YOUTUBE_VIDEO_ID = "wnHQetmyGHQ";

// Logos
const BAILA_LOGO = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/yu24u3j0_White%20Baila%20Logo%20%284%29.png";
const BUNNY_LOGO = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/funee3te_Copy%20of%2029-11-25%20%2826%29.png";
const BUNNY_GLASSES = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/uigi9j0z_bunny%20with%20Baila%20Dembow%20glasses%20.png";

// Generate SEO-friendly event slug
const generateEventSlug = (event) => {
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const year = date.getFullYear();
  const city = event.city.toLowerCase().replace(/\s+/g, '-');
  return `${city}-${day}-${month}-${year}`;
};

// Get event by slug
const getEventBySlug = (slug, events) => {
  return events.find(event => generateEventSlug(event) === slug);
};

// Event Modal Component
const EventModal = ({ event, isOpen, onClose }) => {
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
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            data-testid="event-modal-close"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Event Poster */}
          <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl">
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Event Content */}
          <div className="p-6 md:p-8">
            {/* City Badge */}
            <div className="flex items-center gap-2 text-[#FF0080] font-semibold mb-3">
              <MapPin size={18} />
              <span>{event.city}, Netherlands</span>
            </div>

            {/* Title */}
            <h2 className="font-display text-2xl md:text-3xl mb-4">{event.title}</h2>

            {/* Event Quick Facts */}
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

            {/* Description */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">About This Event</h3>
              <p className="text-gray-600 leading-relaxed">{event.description}</p>
            </div>

            {/* Pricing */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-gray-500">From</span>
              <span className="font-display text-3xl text-[#FF0080]">{event.price_from}</span>
              <span className="text-sm text-gray-400">| Door: {event.price_door}</span>
            </div>

            {/* CTA Buttons */}
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

// Navigation Component
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleClickOutside = (e) => {
        if (!e.target.closest('[data-mobile-menu]')) {
          setMobileMenuOpen(false);
        }
      };
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    // Check if we're on the homepage
    const isHomePage = window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/';
    
    if (isHomePage) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Navigate to homepage with hash for the section
      window.location.href = `${window.location.origin}/#/?scrollTo=${id}`;
    }
  };

  const handleNavClick = (e, href) => {
    setMobileMenuOpen(false);
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`nav-container`}
      data-testid="main-navigation"
      data-mobile-menu
    >
      <div className={`flex items-center justify-between gap-4 px-4 py-2 rounded-full transition-all duration-300 ${scrolled ? 'bg-white shadow-lg border border-gray-200' : 'bg-white/10 backdrop-blur-sm'}`}>
        <img 
          src={BUNNY_LOGO} 
          alt="Baila Dembow" 
          className="h-10 w-10 cursor-pointer object-contain"
          onClick={() => window.location.href = window.location.origin}
        />
        
        {/* Desktop Navigation */}
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${scrolled ? 'text-black' : 'text-white'}`}>
          <a href="#events" className="hover:text-[#FF0080] transition-colors" data-testid="nav-events">Events</a>
          <a href="#about" className="hover:text-[#FF0080] transition-colors" data-testid="nav-about">About</a>
          <button onClick={() => scrollToSection('experience')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-gallery">Gallery</button>
          <button onClick={() => scrollToSection('community')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-community">Community</button>
          <a href="#press" className="hover:text-[#FF0080] transition-colors" data-testid="nav-press">Press</a>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? 'text-black hover:bg-gray-100' : 'text-white hover:bg-white/20'}`}
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
          data-testid="mobile-menu-button"
          aria-label="Toggle menu"
        >
          <div className="w-6 h-5 flex flex-col justify-between">
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-full rounded-full transition-all duration-300 ${scrolled ? 'bg-black' : 'bg-white'} ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-20 left-4 right-4 z-[101]"
            data-mobile-menu
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
              {/* Gradient accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#FF0080] via-[#FF4D4D] to-[#8B5CF6]" />
              
              <div className="p-4 flex flex-col gap-2">
                <a 
                  href="#events" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-events"
                >
                  <Calendar className="w-5 h-5" />
                  Events
                </a>
                <a 
                  href="#about" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-about"
                >
                  <Users className="w-5 h-5" />
                  About
                </a>
                <button 
                  onClick={() => scrollToSection('experience')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium text-left"
                  data-testid="mobile-nav-gallery"
                >
                  <Sparkles className="w-5 h-5" />
                  Gallery
                </button>
                <button 
                  onClick={() => scrollToSection('community')}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium text-left"
                  data-testid="mobile-nav-community"
                >
                  <MessageCircle className="w-5 h-5" />
                  Community
                </button>
                <a 
                  href="#press" 
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 hover:text-[#FF0080] transition-colors font-medium"
                  data-testid="mobile-nav-press"
                >
                  <Mail className="w-5 h-5" />
                  Press
                </a>
                
                {/* Get Tickets CTA in mobile menu */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <a 
                    href="https://linktr.ee/bailadembow"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold hover:opacity-90 transition-all"
                    data-testid="mobile-nav-tickets"
                  >
                    <Ticket className="w-5 h-5" />
                    Get Tickets
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

// Countdown Timer Component
const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown-container" data-testid="countdown-timer">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="countdown-box">
          <div className="countdown-number">{String(value).padStart(2, '0')}</div>
          <div className="countdown-label">{unit}</div>
        </div>
      ))}
    </div>
  );
};

// Hero Section
const HeroSection = () => {
  const scrollToNextEvent = () => {
    const element = document.getElementById('next-event');
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero" className="hero-section bg-black" data-testid="hero-section">
      {/* Content */}
      <div className="hero-content">
        {/* Logo */}
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

// AI Visibility Section - Latin Event in Amsterdam & Netherlands (SEO Optimized)
const LatinEventSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-16 bg-white" ref={ref} data-testid="latin-event-section">
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
    </section>
  );
};

// Next Event Section
const NextEventSection = ({ events }) => {
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
          {/* Countdown */}
          <div className="bg-gradient-to-br from-[#FF0080] to-[#7F00FF] rounded-3xl p-8 md:p-12 mb-8">
            <div className="text-center text-white mb-8">
              <h3 className="font-display text-2xl md:text-3xl mb-2">{nextEvent.title}</h3>
              <p className="text-white/80 flex items-center justify-center gap-2">
                <MapPin size={16} /> {nextEvent.venue}
              </p>
            </div>
            <CountdownTimer targetDate={nextEvent.date} />
          </div>
          
          {/* Event Details Card */}
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

// Experience Gallery Section
const ExperienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  // Use static local images instead of fetching from API
  const galleryImages = GALLERY_IMAGES;

  return (
    <section id="experience" className="section-spacing" ref={ref} data-testid="experience-section">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">The Experience</p>
          <h2 className="font-display text-4xl md:text-6xl">
            YOU DON'T WATCH IT.<br /><span className="gradient-text">YOU LIVE IT.</span>
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="gallery-grid"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id || index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`bento-item img-zoom gallery-item-${(index % 5) + 1}`}
              style={{ minHeight: index === 0 ? '400px' : '280px' }}
              data-testid={`gallery-image-${index}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// Agenda Section with Modal
const AgendaSection = ({ events }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedEvent, setSelectedEvent] = useState(null);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'almost_sold_out':
        return { class: 'status-almost-sold-out urgency-badge', text: 'Almost Sold Out', icon: <Flame size={14} /> };
      case 'sold_out':
        return { class: 'status-sold-out', text: 'Sold Out', icon: null };
      default:
        return { class: 'status-upcoming', text: 'On Sale', icon: <Sparkles size={14} /> };
    }
  };

  return (
    <>
      <section id="agenda" className="section-spacing bg-[#FAFAFA]" ref={ref} data-testid="agenda-section">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">Upcoming Events</p>
            <h2 className="font-display text-4xl md:text-6xl">
              <span className="gradient-text">AGENDA</span>
            </h2>
          </motion.div>
          
          <div className="events-grid">
            {events.map((event, index) => {
              const statusBadge = getStatusBadge(event.status);
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                  className="event-card"
                  data-testid={`event-card-${index}`}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={event.image_url} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`status-badge ${statusBadge.class}`}>
                        {statusBadge.icon}
                        {statusBadge.text}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-[#FF0080] font-semibold mb-2">
                      <MapPin size={14} />
                      {event.city}
                    </div>
                    <h3 className="font-display text-xl mb-2">{event.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{event.description.substring(0, 100)}...</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">From <span className="font-bold text-lg">{event.price_from}</span></span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setSelectedEvent(event)}
                          className="text-sm text-gray-500 hover:text-[#FF0080] transition-colors underline underline-offset-2"
                          data-testid={`event-details-${index}`}
                        >
                          More Details
                        </button>
                        <a 
                          href={event.ticket_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#FF0080] font-semibold hover:gap-2 transition-all"
                          data-testid={`event-cta-${index}`}
                          onClick={() => trackTicketClick(event.title, event.ticket_url)}
                        >
                          Get Tickets <ArrowRight size={16} />
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </>
  );
};

// Community Section
const CommunitySection = () => {
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
      await axios.post(`${API}/subscribe`, { ...formData, source: "website" });
      trackFormSubmission(formData);
      toast.success("Welcome to the movement! You're now part of Baila Dembow.");
      setFormData({ name: "", email: "", city: "", country: "", age: "" });
    } catch (error) {
      if (error.response?.status === 400) {
        toast.info("You're already part of the family!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
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
          <h2 className="font-display text-4xl md:text-6xl mb-6">
            BECOME PART OF<br /><span className="gradient-text">THE MOVEMENT.</span>
          </h2>
          <p className="text-lg text-gray-600 mb-10 max-w-xl mx-auto">
            This isn't just about events. It's about culture, belonging, and connection. 
            Strangers becoming family. One rhythm, one night, one community.
          </p>
          
          {/* Join Community Form */}
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
          
          {/* Social Links */}
          <div className="flex justify-center gap-4 flex-wrap">
            <a 
              href="https://www.instagram.com/baila.dembow/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-instagram"
              aria-label="Instagram"
            >
              <Instagram size={22} />
            </a>
            <a 
              href="https://www.facebook.com/baila.dembow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-facebook"
              aria-label="Facebook"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            <a 
              href="https://www.tiktok.com/@baila.dembow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-tiktok"
              aria-label="TikTok"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>
            </a>
            <a 
              href="https://www.youtube.com/@baila.dembow" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-youtube"
              aria-label="YouTube"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </a>
            <a 
              href="mailto:ask@housedecoded.com" 
              className="social-link"
              data-testid="social-email"
              aria-label="Email"
            >
              <Mail size={22} />
            </a>
            <a 
              href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-whatsapp"
              aria-label="WhatsApp Community"
            >
              <MessageCircle size={22} />
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="container-custom mt-20 pt-8 border-t border-gray-200">
        {/* Animated Bunny with Glasses */}
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
          <span className="font-display text-xl text-black">BAILA DEMBOW<span className="gradient-text">.</span></span>
          <span>© {new Date().getFullYear()} Baila Dembow. All rights reserved. Part of House Decoded events, Amsterdam KVK 67994725</span>
          <CookieSettingsLink />
        </div>
      </div>
    </section>
  );
};

// Cookie Settings Footer Link Component
const CookieSettingsLink = () => {
  const cookieContext = useCookieConsent();
  
  if (!cookieContext) return null;
  
  return (
    <button
      onClick={cookieContext.openPreferences}
      className="text-gray-400 hover:text-[#FF0080] transition-colors flex items-center gap-1 text-xs"
      data-testid="cookie-settings-link"
    >
      <Settings className="w-3 h-3" />
      Cookie Settings
    </button>
  );
};

// Floating CTA Button
const FloatingCTA = () => {
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

// Fallback events data
const FALLBACK_EVENTS = [
  {
    id: "amsterdam-xl-feb-2026",
    city: "Amsterdam",
    venue: "IJland, Amsterdam Noord",
    date: "2026-02-28",
    time: "23:00 - 05:00",
    title: "BAILA DEMBOW XL // IJLAND - A TRIBUTE TO JUAN LUIS GUERRA",
    description: "A full tribute to the legendary Juan Luis Guerra, performed live by Gerardo Rosales's Combo Mundial. Merengue, bachata, and Latin soul — then a full Baila Dembow XL takeover with reggaeton, dembow, and Latin club music. CO2 blasts, confetti drops, professional dancers. 18+ event - ID required.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "€10",
    price_door: "€35",
    image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/c61u2vl4_1600%20X%20900%20%281920%20x%201005%20px%29%20%282%29.png"
  },
  {
    id: "rotterdam-march-2026",
    city: "Rotterdam",
    venue: "Club Reverse, Rotterdam",
    date: "2026-03-07",
    time: "23:00 - 05:00",
    title: "BAILA DEMBOW // ROTTERDAM",
    description: "A night of pure Latin energy with 6 hours of non-stop dembow, reggaeton, and Latin urban beats. Top DJs, an electric atmosphere, and Latin vibes all night. Full bar service. 18+.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "€10",
    price_door: "€25",
    image_url: "https://customer-assets.emergentagent.com/job_latinevents/artifacts/ww7bm8cu_1600%20X%20900%20%281920%20x%201005%20px%29%20%284%29.png"
  },
  {
    id: "leiden-march-2026",
    city: "Leiden",
    venue: "Wibar Club, Willem Barentszstraat 39",
    date: "2026-03-14",
    time: "23:59 - 05:00",
    title: "BAILA DEMBOW // LEIDEN",
    description: "We're transforming the venue into Santo Domingo, Medellín, and San Juan. Dembow, reggaeton, and Latin urban music for the homesick, students, and those curious about global charts. Ages 18+. Dress Code: Come ready to move.",
    ticket_url: "https://weeztix.shop/qa84k5a6",
    status: "upcoming",
    price_from: "€10",
    price_door: "€25",
    image_url: "https://customer-assets.emergentagent.com/job_latinevents/artifacts/541u3qiq_1600%20X%20900%20%281920%20x%201005%20px%29%20%281%29.png"
  },
  {
    id: "amsterdam-kingsnight-2026",
    city: "Amsterdam",
    venue: "IJland, Amsterdam",
    date: "2026-04-26",
    time: "23:00 - 05:00",
    title: "BAILA DEMBOW XL // KINGSNIGHT 2026",
    description: "The XL edition of Baila Dembow for King's Night. Six hours of dembow, reggaeton, and Latin sounds. Bigger venue, longer night, same energy. Tickets live now. Limited capacity.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "€15",
    price_door: "€30",
    image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/d4cz8fiu_26%3A04%20Amsterdam.png"
  }
];

// Previous Events Data - kept for reference
const PREVIOUS_EVENTS_CITIES = ["Amsterdam", "Rotterdam", "Utrecht", "Tilburg", "London"];

// SEO Landing Page - Latin Event in Amsterdam
const LatinEventAmsterdamPage = ({ events }) => {
  useEffect(() => {
    document.title = "Latin Event in Amsterdam | Reggaeton & Dembow Party – Baila Dembow";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Looking for the best Latin Event in Amsterdam? Baila Dembow hosts the biggest Reggaeton and Dembow parties in Amsterdam. Experience authentic Latin Party vibes in the Netherlands. Get tickets now.');
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://bailadembow.com/latin-event-amsterdam';
  }, []);

  const amsterdamEvents = events?.filter(e => e.city === 'Amsterdam') || [];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl mb-6 text-center">
            <span className="gradient-text">Latin Event in Amsterdam</span>
          </h1>
          
          <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
            Experience the ultimate <strong>Latin Event in Amsterdam</strong> with Baila Dembow – 
            the Netherlands' premier <strong>Reggaeton</strong> and <strong>Dembow</strong> party brand.
          </p>

          {/* SEO Content Section */}
          <div className="prose prose-lg max-w-none mb-12">
            <h2 className="font-display text-2xl mb-4">The Best Latin Party in Amsterdam</h2>
            <p className="text-gray-600 mb-6">
              Baila Dembow brings the authentic sounds of <strong>Latin music</strong> to Amsterdam's most iconic venues. 
              Our events feature the hottest <strong>Reggaeton</strong> hits, pure <strong>Dembow</strong> energy, and the 
              vibrant atmosphere of a true <strong>Latin Party</strong>. Whether you're from Latin America or simply 
              love Latin music, our Amsterdam events deliver an unforgettable experience.
            </p>
            
            <h2 className="font-display text-2xl mb-4">Why Choose Baila Dembow Amsterdam?</h2>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li><strong>Authentic Latin Music:</strong> Non-stop Reggaeton, Dembow, and Latin Urban beats</li>
              <li><strong>World-Class Production:</strong> CO2 cannons, confetti, professional lighting and sound</li>
              <li><strong>Premium Venues:</strong> IJland and other top Amsterdam locations</li>
              <li><strong>Passionate Community:</strong> 25,000+ Latin music fans in the Netherlands</li>
              <li><strong>Regular Events:</strong> Monthly Latin parties throughout the year</li>
            </ul>

            <h2 className="font-display text-2xl mb-4">Upcoming Latin Events in Amsterdam</h2>
            <p className="text-gray-600 mb-6">
              Don't miss our next <strong>Latin Event in Amsterdam</strong>. From intimate club nights to 
              massive XL editions, we have the perfect <strong>Reggaeton</strong> and <strong>Dembow</strong> party for you.
            </p>
          </div>

          {/* Upcoming Amsterdam Events */}
          {amsterdamEvents.length > 0 && (
            <div className="mb-12">
              <h3 className="font-display text-xl mb-6 text-center">Upcoming Amsterdam Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {amsterdamEvents.map((event, index) => (
                  <a 
                    key={event.id}
                    href={`#/events/${generateEventSlug(event)}`}
                    className="event-card block hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h4 className="font-display text-lg mb-2">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.venue}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-2xl p-8">
            <h3 className="font-display text-2xl mb-4">Ready to Experience the Best Latin Event in Amsterdam?</h3>
            <p className="text-gray-600 mb-6">Join thousands of Latin music lovers at our next Reggaeton & Dembow party.</p>
            <a href="#/events" className="cta-primary inline-flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              View All Events
            </a>
          </div>

          {/* Internal Links */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
            <a href="#/" className="text-gray-600 hover:text-[#FF0080] transition-colors">← Homepage</a>
            <a href="#/latin-event-rotterdam" className="text-gray-600 hover:text-[#FF0080] transition-colors">Latin Event in Rotterdam →</a>
            <a href="#/events" className="text-gray-600 hover:text-[#FF0080] transition-colors">All Events</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// SEO Landing Page - Latin Event in Rotterdam
const LatinEventRotterdamPage = ({ events }) => {
  useEffect(() => {
    document.title = "Latin Event in Rotterdam | Reggaeton & Dembow Party – Baila Dembow";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Discover the best Latin Event in Rotterdam. Baila Dembow brings Reggaeton and Dembow parties to Rotterdam. Experience the ultimate Latin Party in the Netherlands. Tickets available now.');
    }
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = 'https://bailadembow.com/latin-event-rotterdam';
  }, []);

  const rotterdamEvents = events?.filter(e => e.city === 'Rotterdam') || [];

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl md:text-6xl mb-6 text-center">
            <span className="gradient-text">Latin Event in Rotterdam</span>
          </h1>
          
          <p className="text-xl text-gray-600 text-center mb-12 leading-relaxed">
            Rotterdam's hottest <strong>Latin Event</strong> is here! Join Baila Dembow for 
            unforgettable <strong>Reggaeton</strong> and <strong>Dembow</strong> nights.
          </p>

          {/* SEO Content Section */}
          <div className="prose prose-lg max-w-none mb-12">
            <h2 className="font-display text-2xl mb-4">Rotterdam's Premier Latin Party</h2>
            <p className="text-gray-600 mb-6">
              Baila Dembow has expanded to Rotterdam, bringing the same energy and passion that made us 
              Amsterdam's #1 <strong>Latin Event</strong>. Our Rotterdam parties feature the best 
              <strong>Reggaeton</strong>, <strong>Dembow</strong>, and Latin Urban music, combined with 
              world-class production that transforms every venue into a Latin paradise.
            </p>
            
            <h2 className="font-display text-2xl mb-4">What Makes Our Rotterdam Events Special?</h2>
            <ul className="text-gray-600 space-y-2 mb-6">
              <li><strong>Pure Latin Energy:</strong> Hours of non-stop Reggaeton and Dembow</li>
              <li><strong>Top-Tier Production:</strong> Professional sound, lighting, and special effects</li>
              <li><strong>Club Reverse:</strong> Rotterdam's premier nightlife venue</li>
              <li><strong>Growing Community:</strong> Thousands of Latin music fans in Rotterdam</li>
              <li><strong>Affordable Tickets:</strong> Latin Party experience from just €10</li>
            </ul>

            <h2 className="font-display text-2xl mb-4">Latin Event Rotterdam – Join the Movement</h2>
            <p className="text-gray-600 mb-6">
              The <strong>Latin Event in Rotterdam</strong> movement is growing fast. Our <strong>Dembow</strong> 
              and <strong>Reggaeton</strong> parties attract fans from across the Netherlands and beyond. 
              Whether you're a Rotterdam local or traveling from Amsterdam, our events promise the 
              ultimate <strong>Latin Party</strong> experience.
            </p>
          </div>

          {/* Upcoming Rotterdam Events */}
          {rotterdamEvents.length > 0 && (
            <div className="mb-12">
              <h3 className="font-display text-xl mb-6 text-center">Upcoming Rotterdam Events</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rotterdamEvents.map((event, index) => (
                  <a 
                    key={event.id}
                    href={`#/events/${generateEventSlug(event)}`}
                    className="event-card block hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="p-5">
                      <h4 className="font-display text-lg mb-2">{event.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {event.venue}</span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-2xl p-8">
            <h3 className="font-display text-2xl mb-4">Experience the Best Latin Event in Rotterdam</h3>
            <p className="text-gray-600 mb-6">Don't miss Rotterdam's hottest Reggaeton & Dembow party.</p>
            <a href="#/events" className="cta-primary inline-flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Get Tickets Now
            </a>
          </div>

          {/* Internal Links */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap gap-4 justify-center">
            <a href="#/" className="text-gray-600 hover:text-[#FF0080] transition-colors">← Homepage</a>
            <a href="#/latin-event-amsterdam" className="text-gray-600 hover:text-[#FF0080] transition-colors">Latin Event in Amsterdam →</a>
            <a href="#/events" className="text-gray-600 hover:text-[#FF0080] transition-colors">All Events</a>
          </div>
        </div>
      </div>
    </div>
  );
};

// About Us Page Component (Separate Page)
const AboutUsPage = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "Booking",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Message sent! We'll get back to you soon.");
    setContactForm({ name: "", email: "", subject: "Booking", message: "" });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white pt-24">
      {/* SEO: #1 Latin Event Netherlands | Latin Event Holland | Reggaeton Netherlands | Latin Party Netherlands | Best Latin Event Holland */}
      <div className="container-custom py-12">
        
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-6xl mb-6">
            BAILA DEMBOW<br /><span className="gradient-text">ABOUT US</span>
          </h1>
          {/* Hidden for SEO - not visible to visitors */}
          <span className="sr-only" aria-hidden="true">The #1 Latin Event in Amsterdam and the Netherlands</span>
        </div>

        {/* Main Story Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="font-display text-3xl md:text-4xl mb-8 text-center">
            WHERE LATIN CULTURE <span className="gradient-text">COMES ALIVE</span>
          </h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              There's a moment — right when the bass drops, the CO2 cannon fires, and confetti rains down on a 
              600-person dance floor — when you realize this isn't just a party. <strong>This is a movement.</strong>
            </p>
            <p>
              Baila Dembow is the #1 Latin event in Amsterdam and the Netherlands, delivering sold-out nights of 
              Reggaeton, Dembow, Latin urban hits, Salsa, Bachata, and Merengue that have turned first-timers into 
              loyal regulars and transformed ordinary venues into pulsating Latin spaces.
            </p>
            <p>
              Born from a deep love of Latin-Caribbean culture and built by <strong>House Decoded Events</strong>, 
              Baila Dembow has grown from a local Amsterdam staple into a multi-city circuit spanning Rotterdam, 
              Utrecht, Tilburg, and London. Every edition is a full-scale production — immersive stage design, 
              headline DJs, live artist moments, and a crowd that shows up ready to dance until the lights come on.
            </p>
            <p className="text-center font-semibold text-xl text-[#FF0080]">
              If you've been searching for a Latin party in the Netherlands that actually delivers on its promise, you've found it.
            </p>
          </div>
        </div>

        {/* Amsterdam Section */}
        <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🇳🇱</span>
            <h3 className="font-display text-3xl md:text-4xl">AMSTERDAM — <span className="gradient-text">HOME OF THE MOVEMENT</span></h3>
          </div>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Amsterdam is where Baila Dembow was born, and it remains the heartbeat of the brand. From the electric 
              floors of <strong>Club Oliva</strong> to the waterfront energy of <strong>IJland</strong>, Latin event Amsterdam nights 
              under the Baila Dembow name consistently hit capacity — 450 to 700 people packed shoulder-to-shoulder, 
              moving to the best Reggaeton and Dembow the city has to offer.
            </p>
            <h4 className="font-display text-xl text-[#FF0080]">The Vibe</h4>
            <p>
              Amsterdam crowds are passionate, diverse, and dressed to move. Expect an electric block-party atmosphere 
              where every corner of the room is alive. CO2 cannons erupt mid-set, confetti showers the dance floor 
              during peak moments, and the lighting rigs transform every venue into a Latin nightlife destination 
              unlike anything else in the city. This is the best Latin party Amsterdam has seen — and the sold-out history proves it.
            </p>
            <p>
              Music spans the full Latin urban spectrum: trap Latino, classic Perreo, Bachata romántica, Merengue breaks, 
              and Dembow rhythms that keep the floor moving from the first track to the last. Guest DJs and surprise 
              live performances elevate the experience from great to unforgettable.
            </p>
          </div>
          <div className="mt-8">
            <h4 className="font-display text-lg mb-4">📸 Amsterdam Photo Gallery</h4>
            <div className="grid grid-cols-3 gap-4">
              <img src="/city-photos/amsterdam1.jpg" alt="Baila Dembow Amsterdam event 1" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/amsterdam2.jpg" alt="Baila Dembow Amsterdam event 2" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/amsterdam3.jpg" alt="Baila Dembow Amsterdam event 3" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Rotterdam Section */}
        <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🔴</span>
            <h3 className="font-display text-3xl md:text-4xl">ROTTERDAM — <span className="gradient-text">RAW ENERGY, LATIN STYLE</span></h3>
          </div>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Rotterdam has its own rhythm — bolder, rawer, and relentless. Baila Dembow tapped into that energy when 
              it brought the Latin event Rotterdam experience to <strong>Club Reverse</strong>, and the result was instant: 
              a sold-out floor every single time. Rotterdam's crowd doesn't hold back, and neither does the production.
            </p>
            <h4 className="font-display text-xl text-[#FF0080]">The Vibe</h4>
            <p>
              Club Reverse becomes a different world on a Baila Dembow night. The sound system hits harder, the crowd 
              moves faster, and the energy between DJ and dance floor is electric. Reggaeton Netherlands fans from 
              across South Holland make Club Reverse their pilgrimage point when Baila Dembow is in town. Expect the 
              same full-production treatment Amsterdam gets — CO2, confetti, immersive visuals — in a venue that 
              amplifies every element.
            </p>
            <p>
              Rotterdam nights often feature special b2b DJ sets and exclusive track premieres that keep the crowd 
              guessing and moving. The Latin nightlife Amsterdam crowd knows about this. Now Rotterdam has its own 
              identity within the movement.
            </p>
          </div>
          <div className="mt-8">
            <h4 className="font-display text-lg mb-4">📸 Rotterdam Photo Gallery</h4>
            <div className="grid grid-cols-3 gap-4">
              <img src="/city-photos/rotterdam1.jpg" alt="Baila Dembow Rotterdam event 1" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/rotterdam2.jpg" alt="Baila Dembow Rotterdam event 2" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/rotterdam3.jpg" alt="Baila Dembow Rotterdam event 3" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Utrecht Section */}
        <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🟡</span>
            <h3 className="font-display text-3xl md:text-4xl">UTRECHT — <span className="gradient-text">THE CITY THAT KEEPS ASKING FOR MORE</span></h3>
          </div>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Utrecht may not be the largest city on the Baila Dembow circuit, but it might be the hungriest. From 
              the moment tickets go on sale, the demand is immediate. Latin party Netherlands culture has found a 
              powerful home in Utrecht, where a tight-knit community of Latin music lovers has been waiting for an 
              event that takes the culture seriously.
            </p>
            <h4 className="font-display text-xl text-[#FF0080]">The Vibe</h4>
            <p>
              Utrecht Baila Dembow nights are intimate in the best possible sense — every person in the room is there 
              because they want to be, and that energy translates directly to the dance floor. Expect a sweat-soaked, 
              euphoric crowd moving through Reggaeton, Bachata, Salsa, and Dembow with the kind of passion that only 
              comes from a city that finally got the event it deserved.
            </p>
            <p>
              Production quality matches every other city on the circuit: CO2, confetti, full lighting rig, and DJs 
              who understand that Utrecht crowds want the culture, not a watered-down version of it.
            </p>
          </div>
          <div className="mt-8">
            <h4 className="font-display text-lg mb-4">📸 Utrecht Photo Gallery</h4>
            <div className="grid grid-cols-3 gap-4">
              <img src="/city-photos/utrecht1.jpg" alt="Baila Dembow Utrecht event 1" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/utrecht2.jpg" alt="Baila Dembow Utrecht event 2" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/utrecht3.jpg" alt="Baila Dembow Utrecht event 3" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Tilburg Section */}
        <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🔵</span>
            <h3 className="font-display text-3xl md:text-4xl">TILBURG — <span className="gradient-text">THE SOUTH'S LATIN HEARTBEAT</span></h3>
          </div>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              Tilburg has been quietly building one of the most passionate Latin music communities in the Netherlands, 
              and Baila Dembow is the event that gives it a stage. Southern Netherlands crowds bring a warmth and 
              directness to the dance floor that makes every Tilburg edition feel special — less polished, more alive.
            </p>
            <h4 className="font-display text-xl text-[#FF0080]">The Vibe</h4>
            <p>
              Tilburg nights have a festival-within-a-club feel. The crowd is multigenerational, the energy is communal, 
              and the music selection reflects that: classic Reggaeton anthems sit alongside current Dembow hits and 
              throwback Bachata tracks that get every age group moving. Caribbean party Amsterdam fans who've been 
              following the brand know the standard. Tilburg delivers the same.
            </p>
            <p>
              With CO2 effects cutting through the smoke-filled air and confetti turning the final hour into pure 
              celebration, Tilburg shows why expanding beyond Amsterdam was always the right move.
            </p>
          </div>
          <div className="mt-8">
            <h4 className="font-display text-lg mb-4">📸 Tilburg Photo Gallery</h4>
            <div className="grid grid-cols-3 gap-4">
              <img src="/city-photos/tilburg1.jpg" alt="Baila Dembow Tilburg event 1" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/tilburg2.jpg" alt="Baila Dembow Tilburg event 2" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/tilburg3.jpg" alt="Baila Dembow Tilburg event 3" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
            </div>
          </div>
        </div>

        {/* London Section */}
        <div className="mb-20 bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🇬🇧</span>
            <h3 className="font-display text-3xl md:text-4xl">LONDON — <span className="gradient-text">BAILA DEMBOW GOES INTERNATIONAL</span></h3>
          </div>
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p>
              London is the proving ground. One of the most competitive nightlife markets in the world, with an audience 
              that has seen everything and settled for nothing. Baila Dembow entered London's <strong>Club Duo</strong> and 
              <strong>Club Fire</strong> with the same philosophy it brought to Amsterdam, Rotterdam, and beyond — and 
              sold out every time.
            </p>
            <h4 className="font-display text-xl text-[#FF0080]">The Vibe</h4>
            <p>
              London crowds are discerning, international, and relentlessly passionate about Latin music. The city's 
              enormous Latin-Caribbean diaspora community showed up from day one and spread the word: this is the real 
              thing. Latin club night Amsterdam veterans who've relocated to London, and London locals who'd never 
              experienced the brand before, packed the venues and didn't leave until the last track dropped.
            </p>
            <p>
              London nights feature the brand's signature production — CO2, confetti, immersive stage design — scaled 
              to match the ambition of a city that doesn't do anything small. Headline DJs deliver extended sets, and 
              the cross-cultural energy between the Netherlands brand and the London crowd creates something entirely unique.
            </p>
          </div>
          <div className="mt-8">
            <h4 className="font-display text-lg mb-4">📸 London Photo Gallery</h4>
            <div className="grid grid-cols-3 gap-4">
              <img src="/city-photos/london1.jpg" alt="Baila Dembow London event 1" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/london2.jpg" alt="Baila Dembow London event 2" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
              <img src="/city-photos/london3.jpg" alt="Baila Dembow London event 3" className="aspect-video object-cover rounded-xl w-full" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Production Section */}
        <div className="mb-20 max-w-4xl mx-auto text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-8">
            THE PRODUCTION: <span className="gradient-text">FESTIVAL-LEVEL ENERGY, EVERY NIGHT</span>
          </h2>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed text-left">
            <p>
              A Baila Dembow night isn't a club night with a Latin playlist. It's a full-scale production experience 
              built around the culture. Every element is intentional — from the CO2 cannons that ignite the room at 
              peak moments, to the confetti that marks the night's climax, to the branded visuals and lighting rigs 
              that transform every venue into something worth remembering.
            </p>
            <p>
              The DJ lineup is curated, not assembled. Headline artists who understand Reggaeton and Dembow at a deep 
              level, who know when to drop a classic and when to push the crowd forward with something new. Occasionally, 
              live artists join the stage for moments that no setlist could predict.
            </p>
            <p className="font-semibold text-center">
              This is why Latin event Holland searches lead here. This is why the brand sells out across five cities. 
              <span className="text-[#FF0080]"> Production, culture, and community — in that order, every time.</span>
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-20 max-w-4xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl mb-8 text-center">
            FREQUENTLY ASKED <span className="gradient-text">QUESTIONS</span>
          </h2>
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-2">What kind of music plays at Baila Dembow events?</h4>
              <p className="text-gray-700">Every night features a curated mix of Reggaeton, Dembow, Latin urban hits, Bachata, Salsa, and Merengue. The selection spans classic anthems and current chart hits, with DJs who know how to read a crowd and keep the energy moving all night.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-2">Where does Baila Dembow host events?</h4>
              <p className="text-gray-700">Baila Dembow runs a multi-city circuit across Amsterdam (Club Oliva, IJland), Rotterdam (Club Reverse), Utrecht, Tilburg, and London (Club Duo, Club Fire). Check the official agenda at bailadembow.com for upcoming dates near you.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-2">Do Baila Dembow events sell out?</h4>
              <p className="text-gray-700">Yes — consistently. Venue capacities run between 450 and 700 people, and demand regularly exceeds availability. Tickets for Latin event Amsterdam and Latin event Rotterdam nights sell out well in advance, particularly for premium editions and holiday weekends.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-2">What makes Baila Dembow different from other Latin nights?</h4>
              <p className="text-gray-700">Production quality and cultural authenticity. CO2 cannons, confetti, immersive lighting, and headline DJ lineups set the brand apart from generic Latin club nights. Baila Dembow treats every edition as a premium experience — not a one-off party, but an ongoing movement with a loyal community behind it.</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6">
              <h4 className="font-bold text-lg mb-2">How do I buy tickets for the next Baila Dembow event?</h4>
              <p className="text-gray-700">Tickets are available through the official website at bailadembow.com/agenda, as well as on Fatsoma, Skiddle, Eventbrite, TicketSwap, Partyflock, and DJ Guide. Early purchase is strongly recommended — these events sell out fast.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mb-20 bg-gradient-to-br from-[#FF0080] to-[#7F00FF] rounded-3xl p-8 md:p-12 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl mb-4">🎟️ SECURE YOUR SPOT BEFORE IT'S GONE</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto opacity-90">
            Baila Dembow doesn't do empty dance floors or second chances. Every event sells out. Every city. Every time. 
            Whether you're looking for a Latin event this weekend in Amsterdam, planning a trip to Rotterdam for the 
            ultimate Reggaeton night, or catching the brand in London for the first time — the only mistake you can make 
            is waiting too long.
          </p>
          <p className="text-xl font-bold mb-8">
            The culture is real. The production is elite. The crowd is everything. And the tickets go fast.
          </p>
          <a 
            href="https://linktr.ee/bailadembow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-[#FF0080] font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-colors duration-300"
          >
            <Ticket size={20} />
            GET YOUR TICKETS NOW
          </a>
          <p className="mt-6 text-sm opacity-80">
            Follow <a href="https://www.instagram.com/baila.dembow/" target="_blank" rel="noopener noreferrer" className="underline">@baila.dembow</a> on Instagram to stay ahead of announcements, ticket drops, and after-movie releases.
          </p>
        </div>

        {/* Work With Us Section */}
        <div className="max-w-2xl mx-auto">
          <h3 className="font-display text-3xl md:text-4xl mb-4 text-center">
            WORK <span className="gradient-text">WITH US</span>
          </h3>
          <p className="text-gray-600 text-center mb-8">
            For bookings, partnerships, venue collaborations and press — reach out to the Baila Dembow team.
          </p>
          
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="name"
                value={contactForm.name}
                onChange={handleContactChange}
                placeholder="Your Name *"
                className="input-styled w-full"
                required
                data-testid="about-contact-name"
              />
              <input
                type="email"
                name="email"
                value={contactForm.email}
                onChange={handleContactChange}
                placeholder="Your Email *"
                className="input-styled w-full"
                required
                data-testid="about-contact-email"
              />
            </div>
            <select
              name="subject"
              value={contactForm.subject}
              onChange={handleContactChange}
              className="input-styled w-full"
              data-testid="about-contact-subject"
            >
              <option value="Booking">Booking</option>
              <option value="Partnership">Partnership</option>
              <option value="Press">Press</option>
              <option value="Other">Other</option>
            </select>
            <textarea
              name="message"
              value={contactForm.message}
              onChange={handleContactChange}
              placeholder="Your Message *"
              rows={5}
              className="input-styled w-full resize-none"
              required
              data-testid="about-contact-message"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300"
              data-testid="about-contact-submit"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
          
          <div className="flex justify-center gap-6 mt-8 text-sm text-gray-600">
            <a href="https://www.instagram.com/baila.dembow/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#FF0080] transition-colors">
              <Instagram size={18} /> @baila.dembow
            </a>
            <span className="flex items-center gap-2">
              <Mail size={18} /> ask@housedecoded.com
            </span>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};

// SEO Content Block Component
const SEOContentBlock = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="section-spacing bg-white" ref={ref} data-testid="seo-content-section">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-5xl mb-6 text-center">
            LATIN EVENT IN AMSTERDAM & NETHERLANDS
          </h2>
          <p className="text-lg text-gray-700 mb-8 text-center leading-relaxed">
            Baila Dembow is the leading Latin Party brand in the Netherlands, specializing in authentic 
            Reggaeton and Dembow experiences. We host Latin Events in Amsterdam, Rotterdam, Leiden, and 
            cities across Europe, bringing Caribbean culture and community-driven experiences to life. 
            Our events feature world-class sound systems, professional dancers, and an unforgettable atmosphere.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Latin Event in Amsterdam</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Latin Event in Rotterdam</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Reggaeton Party</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Dembow Experience</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Latin Party Netherlands</span>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <span className="text-[#FF0080] font-semibold">Latin Event Netherlands</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Admin Page Component
const AdminPage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [galleryImages, setGalleryImages] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageAlt, setNewImageAlt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/verify?password=${password}`);
      setIsAuthenticated(true);
      fetchGallery();
      toast.success("Welcome to Admin Panel!");
    } catch (error) {
      toast.error("Invalid password");
    }
  };

  const fetchGallery = async () => {
    try {
      const response = await axios.get(`${API}/gallery`);
      setGalleryImages(response.data);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    }
  };

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImageUrl) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API}/gallery`, {
        url: newImageUrl,
        alt: newImageAlt || "Baila Dembow Event"
      });
      toast.success("Image added successfully!");
      setNewImageUrl("");
      setNewImageAlt("");
      fetchGallery();
    } catch (error) {
      toast.error("Failed to add image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    
    try {
      await axios.delete(`${API}/gallery/${imageId}`);
      toast.success("Image deleted!");
      fetchGallery();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="max-w-md w-full p-8">
          <h1 className="font-display text-3xl mb-8 text-center">
            ADMIN <span className="gradient-text">LOGIN</span>
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className="input-styled w-full"
              required
              data-testid="admin-password"
            />
            <button
              type="submit"
              className="w-full bg-[#FF0080] text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-[#FF3B30] transition-colors duration-300"
              data-testid="admin-login-btn"
            >
              Login
            </button>
          </form>
          <div className="text-center mt-6">
            <a href="#/" className="text-[#FF0080] hover:underline">← Back to Homepage</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl">
            GALLERY <span className="gradient-text">ADMIN</span>
          </h1>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-500 hover:text-[#FF0080]"
          >
            Logout
          </button>
        </div>

        {/* Add New Image Form */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <h2 className="font-display text-xl mb-4">Add New Image</h2>
          <form onSubmit={handleAddImage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="input-styled w-full"
                required
                data-testid="admin-image-url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Upload images to Google Drive, Imgur, or any image hosting service and paste the direct URL here
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text (optional)</label>
              <input
                type="text"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
                placeholder="Describe the image"
                className="input-styled w-full"
                data-testid="admin-image-alt"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-[#FF0080] text-white font-bold py-3 px-6 rounded-full hover:bg-[#FF3B30] transition-colors duration-300"
              data-testid="admin-add-image-btn"
            >
              {isLoading ? "Adding..." : "Add Image"}
            </button>
          </form>
        </div>

        {/* Current Gallery Images */}
        <div>
          <h2 className="font-display text-xl mb-4">Current Gallery ({galleryImages.length} images)</h2>
          {galleryImages.length === 0 ? (
            <p className="text-gray-500">No images in gallery yet. Add some above!</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image, index) => (
                <div key={image.id} className="relative group">
                  <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                    <button
                      onClick={() => handleDeleteImage(image.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold hover:bg-red-600"
                      data-testid={`admin-delete-${index}`}
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{image.alt}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};

// Press Page Component
const PressPage = () => {
  return (
    <div className="min-h-screen bg-white pt-24">
      <div className="container-custom py-16">
        <h1 className="font-display text-4xl md:text-6xl mb-8 text-center">
          BAILA DEMBOW<br /><span className="gradient-text">PRESS & MEDIA</span>
        </h1>
        
        <div className="max-w-3xl mx-auto">
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">About Baila Dembow</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Baila Dembow is the leading Latin Event organizer in the Netherlands, pioneering the 
              Reggaeton and Dembow party scene in Amsterdam, Rotterdam, and beyond. Founded as a 
              cultural movement, we bring authentic Caribbean music experiences to European audiences.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Our Latin Party events feature world-class sound systems, professional dancers, CO2 blasts, 
              confetti drops, and an atmosphere that transports attendees to the heart of Latin America. 
              We've hosted thousands of party-goers and continue to grow as the premier Latin Event 
              brand in the Netherlands.
            </p>
          </section>
          
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">Key Facts</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Founded:</strong> 2018, Amsterdam</li>
              <li>• <strong>Event Types:</strong> Reggaeton, Dembow, Latin Party</li>
              <li>• <strong>Cities:</strong> Amsterdam, Rotterdam, Leiden, European expansion</li>
              <li>• <strong>Venue Capacity:</strong> 500-2000+ attendees</li>
              <li>• <strong>Community:</strong> 25K+ members</li>
              <li>• <strong>Parent Company:</strong> House Decoded Events (KVK 67994725)</li>
            </ul>
          </section>
          
          <section className="mb-12">
            <h2 className="font-display text-2xl mb-4">Contact</h2>
            <ul className="space-y-2 text-gray-700">
              <li>• <strong>Press Inquiries:</strong> ask@housedecoded.com</li>
              <li>• <strong>Instagram:</strong> @baila.dembow</li>
              <li>• <strong>Facebook:</strong> facebook.com/baila.dembow</li>
              <li>• <strong>TikTok:</strong> @baila.dembow</li>
              <li>• <strong>YouTube:</strong> @baila.dembow</li>
            </ul>
          </section>
          
          <section>
            <h2 className="font-display text-2xl mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {['Latin Event Amsterdam', 'Latin Event Netherlands', 'Latin Party', 'Dembow', 
                'Reggaeton', 'Latin Event Rotterdam', 'Reggaeton Amsterdam', 'Latin Club Amsterdam',
                'Dembow Party', 'Caribbean Party Netherlands'].map((tag, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">{tag}</span>
              ))}
            </div>
          </section>
        </div>
        
        <div className="text-center mt-12">
          <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
            ← Back to Homepage
          </a>
        </div>
      </div>
    </div>
  );
};

// Events Page Component
const EventsPage = ({ events: propEvents }) => {
  const [events, setEvents] = useState(propEvents || FALLBACK_EVENTS);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    if (!propEvents) {
      const fetchEvents = async () => {
        try {
          const response = await axios.get(`${API}/events`);
          if (response.data && response.data.length > 0) {
            setEvents(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch events:", error);
        }
      };
      fetchEvents();
    }
  }, [propEvents]);

  return (
    <>
      <div className="min-h-screen bg-white pt-24">
        <div className="container-custom py-16">
          <h1 className="font-display text-4xl md:text-6xl mb-4 text-center">
            LATIN EVENTS<br /><span className="gradient-text">AMSTERDAM & NETHERLANDS</span>
          </h1>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Experience the best Reggaeton, Dembow, and Latin Party events in the Netherlands. 
            From Amsterdam to Rotterdam, Baila Dembow brings authentic Latin vibes.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event, index) => (
              <div key={event.id} className="event-card" data-testid={`events-page-card-${index}`}>
                <a href={`#/events/${generateEventSlug(event)}`} className="block">
                  <div className="relative h-56 overflow-hidden">
                    <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4">
                      <span className={`status-badge ${event.status === 'almost_sold_out' ? 'status-almost-sold-out' : 'status-upcoming'}`}>
                        {event.status === 'almost_sold_out' ? 'Almost Sold Out' : 'On Sale'}
                      </span>
                    </div>
                  </div>
                </a>
                <div className="p-6">
                  <div className="flex items-center gap-2 text-sm text-[#FF0080] font-semibold mb-2">
                    <MapPin size={14} /> {event.city}
                  </div>
                  <h3 className="font-display text-xl mb-2">{event.title}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Clock size={14} /> {event.time}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{event.description.substring(0, 120)}...</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">From <span className="font-bold text-lg">{event.price_from}</span></span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="text-sm text-gray-500 hover:text-[#FF0080] transition-colors underline underline-offset-2"
                      >
                        Quick View
                      </button>
                      <a 
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#FF0080] font-semibold hover:gap-2 transition-all"
                        onClick={() => trackTicketClick(event.title, event.ticket_url)}
                      >
                        Get Tickets <ArrowRight size={16} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <a href="#/" className="inline-flex items-center gap-2 text-[#FF0080] font-semibold hover:underline">
              ← Back to Homepage
            </a>
          </div>
        </div>
      </div>
      
      {/* Event Modal */}
      <EventModal 
        event={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </>
  );
};

// Single Event Page Component (SEO-Optimized)
const SingleEventPage = ({ eventSlug, events }) => {
  const event = getEventBySlug(eventSlug, events);
  
  useEffect(() => {
    if (event) {
      // Update document title for SEO
      document.title = `Baila Dembow ${event.city} – Latin Event in ${event.city} | Reggaeton & Dembow Party`;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', `Baila Dembow presents the leading Latin Event in ${event.city}. Experience Reggaeton, Dembow, and the ultimate Latin Party in the Netherlands. Tickets available now.`);
      }
      
      // Add canonical link
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = `https://bailadembow.com/events/${eventSlug}`;
      
      // Add JSON-LD structured data
      const existingScript = document.querySelector('#event-jsonld');
      if (existingScript) existingScript.remove();
      
      const eventDate = new Date(event.date);
      const endDate = new Date(eventDate);
      endDate.setHours(endDate.getHours() + 6);
      
      const jsonLD = {
        "@context": "https://schema.org",
        "@type": "MusicEvent",
        "name": event.title,
        "description": event.description,
        "startDate": eventDate.toISOString(),
        "endDate": endDate.toISOString(),
        "eventStatus": "https://schema.org/EventScheduled",
        "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
        "location": {
          "@type": "Place",
          "name": event.venue,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": event.city,
            "addressCountry": "NL"
          }
        },
        "image": event.image_url,
        "offers": {
          "@type": "Offer",
          "url": event.ticket_url,
          "priceCurrency": "EUR",
          "availability": "https://schema.org/InStock"
        },
        "organizer": {
          "@type": "Organization",
          "name": "Baila Dembow",
          "url": "https://bailadembow.com"
        },
        "performer": {
          "@type": "MusicGroup",
          "name": "Baila Dembow DJs"
        }
      };
      
      const script = document.createElement('script');
      script.id = 'event-jsonld';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLD);
      document.head.appendChild(script);
    }
    
    return () => {
      // Cleanup
      const script = document.querySelector('#event-jsonld');
      if (script) script.remove();
    };
  }, [event, eventSlug]);
  
  if (!event) {
    return (
      <div className="min-h-screen bg-white pt-24 flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-display text-4xl mb-4">Event Not Found</h1>
          <p className="text-gray-600 mb-8">The event you're looking for doesn't exist or has ended.</p>
          <a href="#/events" className="cta-primary inline-flex items-center gap-2">
            View All Events
          </a>
        </div>
      </div>
    );
  }
  
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Event Poster */}
      <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
        <img
          src={event.image_url}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="container-custom">
            <div className="flex items-center gap-2 text-[#FF0080] font-semibold mb-3">
              <MapPin size={18} />
              <span>{event.city}, Netherlands</span>
            </div>
            <h1 className="font-display text-3xl md:text-5xl text-white mb-4">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-white/80">
              <span className="flex items-center gap-2"><Calendar size={18} /> {formattedDate}</span>
              <span className="flex items-center gap-2"><Clock size={18} /> {event.time}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* About This Event */}
            <section className="mb-10">
              <h2 className="font-display text-2xl mb-4">About This Event</h2>
              <p className="text-gray-700 leading-relaxed text-lg">{event.description}</p>
            </section>
            
            {/* Event Quick Facts - AI Friendly */}
            <section className="mb-10 bg-gray-50 rounded-2xl p-6">
              <h2 className="font-display text-xl mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#FF0080]" />
                Event Quick Facts
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Date:</strong> {formattedDate}</div>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Time:</strong> {event.time}</div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Venue:</strong> {event.venue}</div>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>City:</strong> {event.city}, Netherlands</div>
                </li>
                <li className="flex items-start gap-3">
                  <Flame className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Music Style:</strong> Reggaeton & Dembow</div>
                </li>
                <li className="flex items-start gap-3">
                  <Users className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Category:</strong> Latin Party</div>
                </li>
                <li className="flex items-start gap-3">
                  <Ticket className="w-5 h-5 text-[#FF0080] mt-0.5" />
                  <div><strong>Ticket Link:</strong> <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="text-[#FF0080] hover:underline">{event.ticket_url}</a></div>
                </li>
              </ul>
            </section>
            
            {/* What to Expect */}
            <section className="mb-10">
              <h2 className="font-display text-2xl mb-4">What to Expect</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">🎵 Music</h3>
                  <p className="text-gray-600 text-sm">Non-stop Reggaeton, Dembow, and Latin Urban beats all night long.</p>
                </div>
                <div className="bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">🎉 Production</h3>
                  <p className="text-gray-600 text-sm">CO2 cannons, confetti drops, immersive lighting, and professional dancers.</p>
                </div>
                <div className="bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">👥 Crowd</h3>
                  <p className="text-gray-600 text-sm">Join thousands of Latin music lovers from across the Netherlands.</p>
                </div>
                <div className="bg-gradient-to-br from-[#FF0080]/10 to-[#8B5CF6]/10 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">📍 Venue</h3>
                  <p className="text-gray-600 text-sm">Premium venue with full bar service and amazing atmosphere.</p>
                </div>
              </div>
            </section>
          </div>
          
          {/* Sidebar - Ticket Box */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
              <div className="text-center mb-6">
                <span className="text-sm text-gray-500">Tickets from</span>
                <div className="font-display text-4xl text-[#FF0080]">{event.price_from}</div>
                <span className="text-sm text-gray-400">Door price: {event.price_door}</span>
              </div>
              
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-[#FF0080] to-[#8B5CF6] text-white font-semibold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[#FF0080]/20 mb-4"
                onClick={() => trackTicketClick(event.title, event.ticket_url)}
              >
                <Ticket className="w-5 h-5" />
                Get Tickets Now
              </a>
              
              <p className="text-xs text-gray-500 text-center">
                18+ Event • ID Required • Limited Capacity
              </p>
              
              <hr className="my-6 border-gray-100" />
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-4 h-4 text-[#FF0080]" />
                  {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Clock className="w-4 h-4 text-[#FF0080]" />
                  {event.time}
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-4 h-4 text-[#FF0080]" />
                  {event.venue}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Back Links */}
        <div className="flex flex-wrap gap-4 mt-12 pt-8 border-t border-gray-100">
          <a href="#/" className="text-gray-600 hover:text-[#FF0080] transition-colors flex items-center gap-2">
            ← Back to Homepage
          </a>
          <a href="#/events" className="text-gray-600 hover:text-[#FF0080] transition-colors flex items-center gap-2">
            View All Events →
          </a>
        </div>
      </div>
    </div>
  );
};

// Home Page Component
const HomePage = ({ events }) => {
  return (
    <>
      <HeroSection />
      <LatinEventSection />
      <NextEventSection events={events} />
      <ExperienceSection />
      <AgendaSection events={events} />
      <CommunitySection />
    </>
  );
};

// Main App Component
function App() {
  const [events, setEvents] = useState(FALLBACK_EVENTS);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API}/events`);
        if (response.data && response.data.length > 0) {
          setEvents(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch events:", error);
      }
    };
    fetchEvents();
  }, []);

  // Use hash-based routing for better compatibility with deployed sites
  const getHashPath = () => {
    const hash = window.location.hash;
    // Remove query params from path
    const pathPart = hash.replace('#', '').split('?')[0];
    return pathPart || '/';
  };

  const [currentPath, setCurrentPath] = useState(getHashPath());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getHashPath());
      
      // Handle scrollTo parameter for navigation from other pages
      const hash = window.location.hash;
      if (hash.includes('scrollTo=')) {
        const scrollToId = hash.split('scrollTo=')[1];
        setTimeout(() => {
          const element = document.getElementById(scrollToId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
          // Clean up the URL
          window.history.replaceState(null, '', window.location.origin + '/#/');
        }, 100);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    
    // Also check on initial load
    const hash = window.location.hash;
    if (hash.includes('scrollTo=')) {
      const scrollToId = hash.split('scrollTo=')[1];
      setTimeout(() => {
        const element = document.getElementById(scrollToId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
        window.history.replaceState(null, '', window.location.origin + '/#/');
      }, 500);
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Also check regular pathname for preview environment
  const pathname = window.location.pathname;
  const effectivePath = currentPath !== '/' ? currentPath : pathname;

  // Check if it's a single event page
  const isEventPage = effectivePath.startsWith('/events/') || effectivePath.startsWith('events/');
  const eventSlug = isEventPage ? effectivePath.replace(/^\/?events\//, '') : null;

  return (
    <CookieConsentProvider>
      <div className="grain-overlay" />
      <Navigation />
      <main>
        {effectivePath === '/press' || effectivePath === 'press' ? (
          <PressPage />
        ) : effectivePath === '/latin-event-amsterdam' || effectivePath === 'latin-event-amsterdam' ? (
          <LatinEventAmsterdamPage events={events} />
        ) : effectivePath === '/latin-event-rotterdam' || effectivePath === 'latin-event-rotterdam' ? (
          <LatinEventRotterdamPage events={events} />
        ) : isEventPage && eventSlug ? (
          <SingleEventPage eventSlug={eventSlug} events={events} />
        ) : effectivePath === '/events' || effectivePath === 'events' ? (
          <EventsPage events={events} />
        ) : effectivePath === '/about' || effectivePath === 'about' ? (
          <AboutUsPage />
        ) : effectivePath === '/admin' || effectivePath === 'admin' ? (
          <AdminPage />
        ) : (
          <HomePage events={events} />
        )}
      </main>
      <FloatingCTA />
      <Toaster position="top-center" richColors />
    </CookieConsentProvider>
  );
}

export default App;
