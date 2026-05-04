import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Ticket, Crown, Music, Users, 
  Mail, CheckCircle, Star, Mic2, PartyPopper,
  Gift, ArrowRight, Sparkles, Check
} from 'lucide-react';

// Premium Color Palette
const COLORS = {
  // Primary
  burntOrange: '#D4622A',
  deepOrange: '#B8501F',
  // Neutrals
  ivory: '#FAF8F5',
  cream: '#F5F0E8',
  warmBeige: '#E8E0D5',
  // Text
  espresso: '#2C2420',
  charcoal: '#3D3631',
  warmGray: '#6B5E54',
  // Accents (Dutch flag - muted)
  mutedRed: '#8B3A3A',
  mutedBlue: '#3A4A6B',
  // Special
  gold: '#C4A052',
  softGlow: 'rgba(212, 98, 42, 0.15)'
};

// Premium Countdown Timer
const KingsdayCountdown = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const eventDateTime = new Date(targetDate);
      eventDateTime.setHours(23, 0, 0, 0);
      const difference = eventDateTime - new Date();
      
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
    <div className="flex gap-4 md:gap-6 justify-center" data-testid="kingsday-countdown">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center group">
          <div 
            className="relative bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 md:px-6 md:py-4 min-w-[70px] md:min-w-[90px] border border-white/20 shadow-lg"
            style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)' }}
          >
            <div className="text-3xl md:text-5xl font-display text-white tracking-tight">{String(value).padStart(2, '0')}</div>
          </div>
          <div className="text-[10px] md:text-xs text-white/60 mt-2 uppercase tracking-[0.2em] font-medium">{unit}</div>
        </div>
      ))}
    </div>
  );
};

// Hero Section - Cinematic
const HeroSection = () => {
  return (
    <section 
      className="relative min-h-[95vh] flex items-center justify-center overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.espresso} 0%, #1a1512 50%, ${COLORS.charcoal} 100%)`
      }}
      data-testid="kingsday-hero"
    >
      {/* Ambient Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-30"
          style={{ background: `radial-gradient(circle, ${COLORS.burntOrange} 0%, transparent 70%)` }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20"
          style={{ background: `radial-gradient(circle, ${COLORS.gold} 0%, transparent 70%)` }}
        />
      </div>

      {/* Subtle Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container-custom relative z-10 text-center py-20 px-4">
        {/* Dutch Accent - Minimal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex justify-center gap-2 mb-10"
        >
          <div className="w-12 h-[2px] rounded-full" style={{ backgroundColor: COLORS.mutedRed }} />
          <div className="w-12 h-[2px] rounded-full bg-white/80" />
          <div className="w-12 h-[2px] rounded-full" style={{ backgroundColor: COLORS.mutedBlue }} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-white/50 text-xs md:text-sm tracking-[0.4em] uppercase mb-6 font-medium"
        >
          April 26 – 27, 2026 · Amsterdam & Rotterdam
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-display text-5xl sm:text-6xl md:text-8xl text-white mb-3 tracking-tight"
          data-testid="kingsday-title"
        >
          KINGSDAY
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="font-display text-2xl sm:text-3xl md:text-4xl mb-10"
          style={{ color: COLORS.burntOrange }}
        >
          WEEKENDER 2026
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-white/60 text-base md:text-lg max-w-xl mx-auto mb-12 leading-relaxed"
        >
          The ultimate Latin celebration across two cities. Four nights. One unforgettable experience.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <p className="text-white/40 text-xs mb-5 uppercase tracking-[0.3em]">Kingsnight begins in</p>
          <KingsdayCountdown targetDate="2026-04-26" />
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          href="#tickets"
          className="group inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold transition-all duration-500"
          style={{ 
            background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
            boxShadow: `0 4px 24px ${COLORS.softGlow}, 0 0 0 1px rgba(255,255,255,0.1)`
          }}
          data-testid="kingsday-cta"
        >
          <span className="text-white">View Weekender Passes</span>
          <ArrowRight className="w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform" />
        </motion.a>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
    </section>
  );
};

// Static Promo Section (replaces interactive Spin & Win - backend removed)
const PromoSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      id="spin-win"
      ref={ref}
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: COLORS.ivory }}
      data-testid="promo-section"
    >
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(${COLORS.espresso} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center max-w-2xl mx-auto"
        >
          <p 
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: COLORS.burntOrange }}
          >
            Don't Miss Out
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: COLORS.espresso }}>
            Get Your Tickets Now
          </h2>
          <p className="max-w-md mx-auto mb-8" style={{ color: COLORS.warmGray }}>
            The Kingsday Weekender is the ultimate Latin celebration. Grab your tickets before they sell out.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="#tickets"
              className="px-10 py-4 rounded-full font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)` }}
            >
              <span className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                View Tickets
              </span>
            </a>
            <a
              href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6"
              target="_blank"
              rel="noopener noreferrer"
              className="px-10 py-4 rounded-full font-semibold border-2 transition-all hover:scale-[1.02]"
              style={{ borderColor: COLORS.warmBeige, color: COLORS.charcoal }}
            >
              Join Community
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};


// Premium Ticket Card Component
const TicketCard = ({ ticket, index, isInView, isHero = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.1 * index }}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${
        isHero ? 'md:col-span-2 lg:col-span-1' : ''
      }`}
      style={{
        backgroundColor: isHero ? 'transparent' : COLORS.ivory,
        boxShadow: isHero 
          ? 'none' 
          : '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03)'
      }}
      data-testid={`ticket-${ticket.id}`}
    >
      {isHero ? (
        // WEEKENDER PASS - Premium Hero Card
        <div 
          className="relative p-8 md:p-10 rounded-2xl overflow-hidden"
          style={{
            background: `linear-gradient(145deg, ${COLORS.cream} 0%, ${COLORS.ivory} 50%, ${COLORS.warmBeige} 100%)`,
            boxShadow: `0 8px 40px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.8), 0 0 0 1px ${COLORS.warmBeige}`
          }}
        >
          {/* Subtle Glow */}
          <div 
            className="absolute top-0 right-0 w-64 h-64 opacity-60"
            style={{ 
              background: `radial-gradient(circle at top right, ${COLORS.softGlow} 0%, transparent 60%)`
            }}
          />
          
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{ 
              backgroundColor: COLORS.softGlow,
              color: COLORS.deepOrange
            }}
          >
            <Crown className="w-3.5 h-3.5" />
            Best Value
          </div>

          <div className="relative">
            <h3 className="font-display text-3xl md:text-4xl mb-2" style={{ color: COLORS.espresso }}>
              {ticket.title}
            </h3>
            <p className="text-sm mb-6 max-w-sm" style={{ color: COLORS.warmGray }}>
              {ticket.description}
            </p>

            {/* Refined Checklist */}
            <div className="space-y-3 mb-8">
              {ticket.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: COLORS.softGlow }}
                  >
                    <Check className="w-3 h-3" style={{ color: COLORS.burntOrange }} />
                  </div>
                  <span className="text-sm" style={{ color: COLORS.charcoal }}>{feature}</span>
                </div>
              ))}
            </div>

            {/* Price & CTA */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.warmGray }}>From</p>
                <p className="font-display text-4xl" style={{ color: COLORS.burntOrange }}>{ticket.price}</p>
              </div>
              <a
                href={ticket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 hover:scale-[1.02]"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
                  boxShadow: `0 4px 20px ${COLORS.softGlow}`
                }}
              >
                Get Pass
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      ) : (
        // Regular Event Cards
        <div className="p-6 h-full flex flex-col">
          {/* Date Badge */}
          <div className="flex items-center justify-between mb-4">
            <div 
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ 
                backgroundColor: ticket.isFree ? '#E8F5E9' : COLORS.cream,
                color: ticket.isFree ? '#2E7D32' : COLORS.charcoal
              }}
            >
              {ticket.date}
            </div>
            {ticket.isFree && (
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#2E7D32' }}>
                Free Entry
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4 className="font-display text-xl mb-1" style={{ color: COLORS.espresso }}>
              {ticket.title}
            </h4>
            <p className="text-sm mb-3" style={{ color: COLORS.burntOrange }}>
              {ticket.subtitle}
            </p>
            
            <div className="flex items-center gap-2 text-xs mb-4" style={{ color: COLORS.warmGray }}>
              <Clock className="w-3.5 h-3.5" />
              {ticket.time}
            </div>
          </div>

          {/* Footer */}
          <div 
            className="pt-4 mt-auto border-t flex items-center justify-between"
            style={{ borderColor: COLORS.warmBeige }}
          >
            <span className="font-display text-2xl" style={{ color: ticket.isFree ? '#2E7D32' : COLORS.espresso }}>
              {ticket.price}
            </span>
            {ticket.url ? (
              <a
                href={ticket.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/btn inline-flex items-center gap-1.5 text-sm font-semibold transition-all"
                style={{ color: COLORS.burntOrange }}
              >
                Get Tickets
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </a>
            ) : (
              <span className="text-sm" style={{ color: COLORS.warmGray }}>No ticket needed</span>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Premium Tickets Section
const TicketsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const weekenderPass = {
    id: 'weekender-pass',
    title: 'Weekender Pass',
    description: 'Complete access to all paid Kingsday Weekender events. The ultimate experience.',
    price: '€45',
    features: ['Kingsnight @ IJland Amsterdam', 'Koningsnacht @ Rotterdam', 'Koningsdag @ Oliva', 'Priority Entry at All Venues'],
    url: 'https://weeztix.shop/v9f38e5c'
  };

  const eventTickets = [
    {
      id: 'kingsnight',
      title: 'Kingsnight Main Event',
      subtitle: 'IJland, Amsterdam',
      date: 'Apr 26',
      time: '23:00 – 05:00',
      price: '€15',
      url: 'https://weeztix.shop/v9f38e5c'
    },
    {
      id: 'rotterdam-kingsnight',
      title: 'Koningsnacht',
      subtitle: 'Reverse, Rotterdam',
      date: 'Apr 26',
      time: '23:00 – 05:00',
      price: '€12',
      url: 'https://weeztix.shop/b6a5k7b6'
    },
    {
      id: 'oliva',
      title: 'Koningsdag Party',
      subtitle: 'Oliva, Rembrandtplein',
      date: 'Apr 27',
      time: '20:00 – Late',
      price: '€15',
      url: 'https://ticketapp.shop/jvgfntofbe'
    },
    {
      id: 'block-party',
      title: 'Latin Block Party',
      subtitle: 'Ferdinand Bolstraat',
      date: 'Apr 27',
      time: '16:00 – 20:00',
      price: 'FREE',
      isFree: true,
      url: ''
    }
  ];

  return (
    <section 
      id="tickets"
      ref={ref}
      className="py-24 md:py-32"
      style={{ backgroundColor: COLORS.cream }}
      data-testid="tickets-section"
    >
      <div className="container-custom">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p 
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: COLORS.burntOrange }}
          >
            Secure Your Spot
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: COLORS.espresso }}>
            Weekender Passes
          </h2>
          <p className="max-w-md mx-auto" style={{ color: COLORS.warmGray }}>
            Choose your experience. Multiple events, one unforgettable weekend.
          </p>
        </motion.div>

        {/* Hero Card - Weekender Pass */}
        <div className="max-w-xl mx-auto mb-12">
          <TicketCard ticket={weekenderPass} index={0} isInView={isInView} isHero={true} />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-xl mx-auto mb-12">
          <div className="flex-1 h-px" style={{ backgroundColor: COLORS.warmBeige }} />
          <span className="text-xs uppercase tracking-wider" style={{ color: COLORS.warmGray }}>
            Or choose individual events
          </span>
          <div className="flex-1 h-px" style={{ backgroundColor: COLORS.warmBeige }} />
        </div>

        {/* Event Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {eventTickets.map((ticket, index) => (
            <TicketCard key={ticket.id} ticket={ticket} index={index + 1} isInView={isInView} />
          ))}
        </div>
      </div>
    </section>
  );
};

// Experience Section - Refined
const ExperienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const experiences = [
    {
      id: 'dj-contest',
      icon: Mic2,
      title: 'DJ Contest',
      subtitle: 'Kingsday Street Party',
      description: 'Emerging DJs compete live during the Kingsday street celebration.',
      cta: 'Apply Now',
      ctaUrl: 'mailto:ask@housedecoded.com?subject=DJ Contest Application'
    },
    {
      id: 'bad-bunny',
      icon: Star,
      title: 'Bad Bunny Look-Alike',
      subtitle: 'Kingsnight @ IJland',
      description: 'Compete for the most iconic Bad Bunny look. Prizes for best costume.',
      cta: 'Sign Up',
      ctaUrl: 'mailto:ask@housedecoded.com?subject=Bad Bunny Competition'
    },
    {
      id: 'la-casita',
      icon: PartyPopper,
      title: 'La Casita del Baile',
      subtitle: 'Kingsnight @ IJland',
      description: 'Latin house-style stage inspired by Caribbean street culture.',
      cta: 'Learn More',
      ctaUrl: '#tickets'
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-24 md:py-32"
      style={{ backgroundColor: COLORS.ivory }}
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p 
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: COLORS.burntOrange }}
          >
            Beyond the Music
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: COLORS.espresso }}>
            Special Experiences
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="group p-8 rounded-2xl transition-all duration-500 hover:shadow-lg"
              style={{ 
                backgroundColor: COLORS.cream,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
              }}
            >
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: COLORS.softGlow }}
              >
                <exp.icon className="w-6 h-6" style={{ color: COLORS.burntOrange }} />
              </div>
              
              <h3 className="font-display text-xl mb-1" style={{ color: COLORS.espresso }}>{exp.title}</h3>
              <p className="text-sm font-medium mb-4" style={{ color: COLORS.burntOrange }}>{exp.subtitle}</p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: COLORS.warmGray }}>{exp.description}</p>
              
              <a
                href={exp.ctaUrl}
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all group-hover:gap-2.5"
                style={{ color: COLORS.burntOrange }}
              >
                {exp.cta}
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Schedule Section - Refined
const ScheduleSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const schedule = [
    {
      date: '26',
      month: 'Apr',
      day: 'Sunday',
      label: 'Kingsnight',
      events: [
        { time: '23:00 – 05:00', title: 'Kingsnight Main Event', venue: 'IJland, Amsterdam', url: 'https://weeztix.shop/v9f38e5c' },
        { time: '23:00 – 05:00', title: 'Koningsnacht', venue: 'Reverse, Rotterdam', url: 'https://weeztix.shop/b6a5k7b6' }
      ]
    },
    {
      date: '27',
      month: 'Apr',
      day: 'Monday',
      label: 'Kingsday',
      events: [
        { time: '16:00 – 20:00', title: 'Latin Block Party', venue: 'Ferdinand Bolstraat', isFree: true },
        { time: '20:00 – Late', title: 'Koningsdag Party', venue: 'Oliva, Rembrandtplein', url: 'https://ticketapp.shop/jvgfntofbe' }
      ]
    }
  ];

  return (
    <section 
      ref={ref}
      className="py-24 md:py-32"
      style={{ backgroundColor: COLORS.cream }}
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <p 
            className="text-xs tracking-[0.3em] uppercase mb-4 font-medium"
            style={{ color: COLORS.burntOrange }}
          >
            Plan Your Weekend
          </p>
          <h2 className="font-display text-4xl md:text-5xl" style={{ color: COLORS.espresso }}>
            Event Schedule
          </h2>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-8">
          {schedule.map((day, dayIndex) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 * dayIndex }}
            >
              <div className="flex items-start gap-6">
                {/* Date Block */}
                <div 
                  className="flex-shrink-0 w-20 text-center rounded-xl p-3"
                  style={{ 
                    background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
                    boxShadow: `0 4px 16px ${COLORS.softGlow}`
                  }}
                >
                  <div className="text-3xl font-display text-white">{day.date}</div>
                  <div className="text-xs text-white/70 uppercase">{day.month}</div>
                </div>

                {/* Events */}
                <div className="flex-1 space-y-3">
                  <div className="mb-4">
                    <span className="text-sm font-medium" style={{ color: COLORS.warmGray }}>{day.day}</span>
                    <span className="mx-2" style={{ color: COLORS.warmBeige }}>·</span>
                    <span className="text-sm font-semibold" style={{ color: COLORS.burntOrange }}>{day.label}</span>
                  </div>
                  
                  {day.events.map((event, eventIndex) => (
                    <div 
                      key={eventIndex}
                      className="p-5 rounded-xl transition-all hover:shadow-md"
                      style={{ backgroundColor: COLORS.ivory }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-xs mb-2" style={{ color: COLORS.warmGray }}>
                            <Clock className="w-3.5 h-3.5" />
                            {event.time}
                          </div>
                          <h4 className="font-semibold mb-1" style={{ color: COLORS.espresso }}>{event.title}</h4>
                          <div className="flex items-center gap-1.5 text-sm" style={{ color: COLORS.warmGray }}>
                            <MapPin className="w-3.5 h-3.5" />
                            {event.venue}
                          </div>
                        </div>
                        {event.url ? (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.02]"
                            style={{ 
                              background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`
                            }}
                          >
                            Tickets
                          </a>
                        ) : (
                          <span 
                            className="px-5 py-2.5 rounded-full text-sm font-semibold"
                            style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
                          >
                            Free Entry
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Email Capture - Refined
const EmailCaptureSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section 
      ref={ref}
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ 
        background: `linear-gradient(135deg, ${COLORS.espresso} 0%, #1a1512 100%)`
      }}
    >
      {/* Ambient Light */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[150px] opacity-20"
        style={{ background: `radial-gradient(circle, ${COLORS.burntOrange} 0%, transparent 70%)` }}
      />

      <div className="container-custom relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-xl mx-auto text-center"
        >
          <Crown className="w-12 h-12 mx-auto mb-6" style={{ color: COLORS.burntOrange }} />
          <h2 className="font-display text-3xl md:text-4xl text-white mb-4">
            Stay in the Loop
          </h2>
          <p className="text-white/50 mb-10">
            Follow us for exclusive updates, early access, and special offers.
          </p>

          <a
            href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full text-white font-semibold transition-all hover:scale-[1.02]"
            style={{ background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)` }}
          >
            Join WhatsApp Community
          </a>
        </motion.div>
      </div>
    </section>
  );
};

// Main Page Export
export const KingsdayWeekenderPage = () => {
  useEffect(() => {
    document.title = "Kingsday Weekender 2026 | Baila Dembow – Amsterdam & Rotterdam";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'The ultimate Kingsday Latin party experience. Amsterdam & Rotterdam. April 26-27, 2026. Reggaeton, Dembow, and Dutch festivities.');
    }

    // Structured Data
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Baila Dembow Kingsday Weekender 2026",
      "description": "The ultimate Kingsday Latin party weekender across Amsterdam and Rotterdam.",
      "startDate": "2026-04-26T23:00:00+02:00",
      "endDate": "2026-04-28T05:00:00+02:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": [
        { "@type": "Place", "name": "IJland", "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" } },
        { "@type": "Place", "name": "Club Reverse", "address": { "@type": "PostalAddress", "addressLocality": "Rotterdam", "addressCountry": "NL" } }
      ],
      "organizer": { "@type": "Organization", "name": "Baila Dembow", "url": "https://bailadembow.com" },
      "offers": { "@type": "AggregateOffer", "lowPrice": "12", "highPrice": "45", "priceCurrency": "EUR", "availability": "https://schema.org/InStock" }
    };

    let script = document.querySelector('#kingsday-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'kingsday-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(eventSchema);

    return () => {
      const s = document.querySelector('#kingsday-jsonld');
      if (s) s.remove();
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.ivory }} data-testid="kingsday-page">
      <HeroSection />
      <PromoSection />
      <TicketsSection />
      <ExperienceSection />
      <ScheduleSection />
      <EmailCaptureSection />
      
      {/* Footer */}
      <footer className="py-12" style={{ backgroundColor: COLORS.espresso }}>
        <div className="container-custom text-center">
          <div className="flex justify-center gap-2 mb-4">
            <div className="w-8 h-[2px] rounded-full" style={{ backgroundColor: COLORS.mutedRed }} />
            <div className="w-8 h-[2px] rounded-full bg-white/60" />
            <div className="w-8 h-[2px] rounded-full" style={{ backgroundColor: COLORS.mutedBlue }} />
          </div>
          <p className="font-display text-lg text-white/80 mb-2">BAILA DEMBOW</p>
          <p className="text-white/40 text-sm mb-4">© 2026 House Decoded Events</p>
          <a href="#/" className="text-sm transition-colors hover:opacity-80" style={{ color: COLORS.burntOrange }}>
            ← Back to Main Site
          </a>
        </div>
      </footer>
    </div>
  );
};
