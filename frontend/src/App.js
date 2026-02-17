import { useEffect, useState, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Ticket, Instagram, MessageCircle, Mail, MapPin, Calendar, Clock, Users, ArrowRight, Flame, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Tracking helper functions
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
    url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/3jggmoj3_DSC03325%202.JPG",
    alt: "Baila Dembow crowd energy"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/7x9ijnic_DSC03865%202.JPG",
    alt: "Atmospheric club lighting"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/9jxy50ay_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20INSTA-66%202.JPG",
    alt: "Halloween event energy"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/491ta7ee_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20NL-282%202.JPG",
    alt: "DJ performing"
  },
  {
    url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/cad4fk12_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20NL-220%202.JPG",
    alt: "Crowd interaction"
  }
];

// YouTube video ID
const YOUTUBE_VIDEO_ID = "wnHQetmyGHQ";

// Logos
const BAILA_LOGO = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/yu24u3j0_White%20Baila%20Logo%20%284%29.png";
const BUNNY_LOGO = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/funee3te_Copy%20of%2029-11-25%20%2826%29.png";
const BUNNY_GLASSES = "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/uigi9j0z_bunny%20with%20Baila%20Dembow%20glasses%20.png";

// Navigation Component
const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className={`nav-container`}
      data-testid="main-navigation"
    >
      <div className={`flex items-center gap-6 px-4 py-2 rounded-full transition-all duration-300 ${scrolled ? 'bg-white shadow-lg border border-gray-200' : 'bg-white/10 backdrop-blur-sm'}`}>
        <img 
          src={BUNNY_LOGO} 
          alt="Baila Dembow" 
          className="h-10 w-10 cursor-pointer object-contain"
          onClick={() => scrollToSection('hero')}
        />
        <div className={`hidden md:flex items-center gap-6 text-sm font-medium ${scrolled ? 'text-black' : 'text-white'}`}>
          <button onClick={() => scrollToSection('next-event')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-events">Events</button>
          <button onClick={() => scrollToSection('experience')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-gallery">Gallery</button>
          <button onClick={() => scrollToSection('community')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-community">Community</button>
        </div>
      </div>
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
          {GALLERY_IMAGES.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`bento-item img-zoom gallery-item-${index + 1}`}
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

// Agenda Section
const AgendaSection = ({ events }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
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
        </div>
      </div>
    </section>
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
    title: "BAILA DEMBOW XL // IJLAND",
    description: "¡QUÉ CLASE AMSTERDAM - LLEGÓ LA LEYENDA! For the first time ever, a full tribute to legendary Juan Luis Guerra, performed live by Gerardo Rosales's Combo Mundial. After the tribute, pure reggaeton, dembow, and Latin club heat until the early morning.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "€10",
    price_door: "€35",
    image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/9jxy50ay_BAILA%20DEMBOW%20HALLOWEEN%2031-10-2025%20INSTA-66%202.JPG"
  },
  {
    id: "leiden-march-2026",
    city: "Leiden",
    venue: "Wibar Club",
    date: "2026-03-14",
    time: "23:59 - 05:00",
    title: "BAILA DEMBOW // LEIDEN",
    description: "LEIDEN, WE'RE COMING FOR YOU. After conquering Amsterdam, London, and dance floors across Europe, Baila Dembow makes history in the Netherlands' oldest university city. Six hours. One warehouse. Zero rules.",
    ticket_url: "https://weeztix.shop/erxqk52c",
    status: "almost_sold_out",
    price_from: "€10",
    price_door: "€25",
    image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/7x9ijnic_DSC03865%202.JPG"
  },
  {
    id: "amsterdam-kingsnight-2026",
    city: "Amsterdam",
    venue: "IJland, Amsterdam",
    date: "2026-04-26",
    time: "23:00 - 05:00",
    title: "BAILA DEMBOW XL // KINGSNIGHT 2026",
    description: "We're taking over IJland for King's Night with six hours of dembow, reggaeton, and the Latin sounds that fill our dancefloors every time. This is the XL edition. Bigger venue, longer night, same energy.",
    ticket_url: "https://weeztix.shop/v9f38e5c",
    status: "upcoming",
    price_from: "€15",
    price_door: "€30",
    image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/3jggmoj3_DSC03325%202.JPG"
  }
];

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
        // Keep fallback events
      }
    };
    fetchEvents();
  }, []);

  return (
    <>
      {/* Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Navigation */}
      <Navigation />
      
      {/* Main Content */}
      <main>
        <HeroSection />
        <NextEventSection events={events} />
        <ExperienceSection />
        <AgendaSection events={events} />
        <CommunitySection />
      </main>
      
      {/* Floating CTA */}
      <FloatingCTA />
      
      {/* Toast Notifications */}
      <Toaster position="top-center" richColors />
    </>
  );
}

export default App;
