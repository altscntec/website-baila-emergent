import { useEffect, useState, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Ticket, ChevronDown, Instagram, MessageCircle, Mail, MapPin, Calendar, Clock, Users, ArrowRight, Flame, Sparkles } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

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
      className={`nav-container ${scrolled ? 'glass-nav' : 'bg-transparent'}`}
      data-testid="main-navigation"
    >
      <div className={`flex items-center gap-6 px-6 py-3 rounded-full transition-all duration-300 ${scrolled ? 'glass-nav shadow-lg' : ''}`}>
        <span className="font-display text-xl tracking-tight cursor-pointer" onClick={() => scrollToSection('hero')}>
          BAILA<span className="gradient-text">.</span>
        </span>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button onClick={() => scrollToSection('next-event')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-events">Events</button>
          <button onClick={() => scrollToSection('experience')} className="hover:text-[#FF0080] transition-colors" data-testid="nav-experience">Experience</button>
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
    <section id="hero" className="hero-section" data-testid="hero-section">
      {/* Video Background */}
      <div className="hero-video-container">
        <iframe
          src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1&origin=${window.location.origin}`}
          title="Baila Dembow Background"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 'none' }}
        />
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 video-overlay z-[1]" />
      
      {/* Content */}
      <div className="hero-content">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/80 text-sm md:text-base tracking-[0.3em] uppercase mb-6"
        >
          Latin Culture • Raw Energy • One Unforgettable Night
        </motion.p>
        
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white hero-text-shadow mb-4"
          data-testid="hero-headline"
        >
          THIS IS NOT A PARTY.
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl gradient-text mb-8"
        >
          THIS IS BAILA DEMBOW.
        </motion.h2>
        
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
            className="cta-primary flex items-center gap-2 text-lg"
            data-testid="hero-cta-tickets"
          >
            <Ticket size={20} />
            GET TICKETS
          </a>
          <button 
            onClick={scrollToNextEvent}
            className="cta-secondary text-white border-white hover:bg-white hover:text-black"
            data-testid="hero-cta-events"
          >
            View Upcoming Events
          </button>
        </motion.div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="scroll-indicator"
        onClick={scrollToNextEvent}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <ChevronDown size={20} />
        <div className="scroll-indicator-line" />
      </motion.div>
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
            YOUR NEXT EXPERIENCE<br />STARTS HERE.
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
            ALL UPCOMING<br /><span className="gradient-text">EXPERIENCES</span>
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
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      await axios.post(`${API}/subscribe`, { email, source: "website" });
      toast.success("Welcome to the movement! You're now part of Baila Dembow.");
      setEmail("");
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
          
          {/* Email Signup */}
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-12">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="input-styled flex-1"
              required
              data-testid="email-input"
            />
            <button 
              type="submit" 
              className="cta-primary whitespace-nowrap flex items-center justify-center gap-2"
              disabled={isSubmitting}
              data-testid="subscribe-btn"
            >
              <Users size={18} />
              {isSubmitting ? "Joining..." : "Join Community"}
            </button>
          </form>
          
          {/* Social Links */}
          <div className="flex justify-center gap-4">
            <a 
              href="https://instagram.com/baila.dembw" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-instagram"
              aria-label="Instagram"
            >
              <Instagram size={22} />
            </a>
            <a 
              href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6?mode=gi_c" 
              target="_blank" 
              rel="noopener noreferrer"
              className="social-link"
              data-testid="social-whatsapp"
              aria-label="WhatsApp"
            >
              <MessageCircle size={22} />
            </a>
            <a 
              href="mailto:info@bailadembow.com" 
              className="social-link"
              data-testid="social-email"
              aria-label="Email"
            >
              <Mail size={22} />
            </a>
          </div>
        </motion.div>
      </div>
      
      {/* Footer */}
      <div className="container-custom mt-20 pt-8 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
          <span className="font-display text-xl text-black">BAILA DEMBOW<span className="gradient-text">.</span></span>
          <span>© {new Date().getFullYear()} Baila Dembow. All rights reserved.</span>
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
          {
            id: "amsterdam-xl-feb-2026",
            city: "Amsterdam",
            venue: "IJland, Amsterdam Noord",
            date: "2026-02-28",
            time: "23:00 - 05:00",
            title: "BAILA DEMBOW XL // IJLAND",
            description: "¡QUÉ CLASE AMSTERDAM - LLEGÓ LA LEYENDA! For the first time ever, a full tribute to legendary Juan Luis Guerra.",
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
            description: "LEIDEN, WE'RE COMING FOR YOU. Six hours. One warehouse. Zero rules.",
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
            title: "BAILA DEMBOW XL // KINGSNIGHT",
            description: "We're taking over IJland for King's Night with six hours of dembow, reggaeton, and Latin sounds.",
            ticket_url: "https://weeztix.shop/v9f38e5c",
            status: "upcoming",
            price_from: "€15",
            price_door: "€30",
            image_url: "https://customer-assets.emergentagent.com/job_baila-dembow/artifacts/3jggmoj3_DSC03325%202.JPG"
          }
        ]);
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
