import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Ticket, Crown, Music, Users, 
  Mail, CheckCircle, Loader2, Star, Mic2, PartyPopper,
  Gift, ArrowRight
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { SpinWheel, SpinResultModal } from '../common/SpinWheel';
import { API } from '../../utils/constants';

// Kingsday Color Palette
const COLORS = {
  orange: '#FF6A00',
  red: '#AE1C28',
  white: '#FFFFFF',
  blue: '#21468B'
};

// Countdown Timer Component
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
    <div className="flex gap-3 md:gap-4 justify-center" data-testid="kingsday-countdown">
      {Object.entries(timeLeft).map(([unit, value]) => (
        <div key={unit} className="text-center">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 md:px-5 md:py-3 min-w-[60px] md:min-w-[80px]">
            <div className="text-2xl md:text-4xl font-bold text-white">{String(value).padStart(2, '0')}</div>
          </div>
          <div className="text-xs md:text-sm text-white/80 mt-1 uppercase tracking-wider">{unit}</div>
        </div>
      ))}
    </div>
  );
};

// Hero Section
const HeroSection = () => {
  return (
    <section 
      className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${COLORS.orange} 0%, #FF8C00 50%, ${COLORS.red} 100%)` }}
      data-testid="kingsday-hero"
    >
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-white/10 rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-[#21468B]/20 rounded-full blur-lg" />
        
        {/* Crown Icons */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-white/10"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 10, -10, 0],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Crown size={40 + i * 10} />
          </motion.div>
        ))}
      </div>

      <div className="container-custom relative z-10 text-center py-20">
        {/* Dutch Flag Stripe */}
        <div className="flex justify-center gap-1 mb-8">
          <div className="w-8 h-2 rounded-full" style={{ backgroundColor: COLORS.red }} />
          <div className="w-8 h-2 rounded-full" style={{ backgroundColor: COLORS.white }} />
          <div className="w-8 h-2 rounded-full" style={{ backgroundColor: COLORS.blue }} />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white/90 text-sm md:text-base tracking-[0.3em] uppercase mb-4"
        >
          April 26-27, 2026
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="font-display text-4xl sm:text-5xl md:text-7xl text-white mb-4"
          data-testid="kingsday-title"
        >
          BAILA DEMBOW
        </motion.h1>
        
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="font-display text-2xl sm:text-3xl md:text-5xl text-white/90 mb-8"
        >
          KINGSDAY WEEKENDER 2026
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          Celebrate Kingsday across Amsterdam and Rotterdam with the ultimate Latin party weekender.
        </motion.p>

        {/* Countdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-10"
        >
          <p className="text-white/70 text-sm mb-4 uppercase tracking-wider">Kingsnight Starts In</p>
          <KingsdayCountdown targetDate="2026-04-26" />
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          href="#tickets"
          className="inline-flex items-center gap-2 bg-white text-[#FF6A00] font-bold py-4 px-8 rounded-full text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl"
          data-testid="kingsday-cta"
        >
          <Ticket size={20} />
          VIEW WEEKENDER TICKETS
        </motion.a>
      </div>
    </section>
  );
};

// Spin & Win Section
const SpinWinSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [couponCode, setCouponCode] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [verificationToken, setVerificationToken] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/kingsday/subscribe`, { email });
      
      if (response.data.verified) {
        setIsVerified(true);
        setHasSpun(response.data.has_spun);
        toast.success("You're already verified! Spin the wheel!");
      } else {
        setVerificationToken(response.data.verification_token);
        toast.success("Check your email for verification link!");
        // For demo, auto-verify after 2 seconds
        setTimeout(async () => {
          try {
            await axios.get(`${API}/kingsday/verify/${response.data.verification_token}`);
            setIsVerified(true);
            toast.success("Email verified! You can now spin!");
          } catch (error) {
            console.error("Auto-verify failed:", error);
          }
        }, 2000);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpin = async () => {
    if (!isVerified || hasSpun || isSpinning) return;
    
    setIsSpinning(true);
    
    // Wait for wheel animation
    setTimeout(async () => {
      try {
        const response = await axios.post(`${API}/kingsday/spin`, { email });
        setSpinResult(response.data.prize);
        setCouponCode(response.data.coupon_code);
        setHasSpun(true);
        setShowResult(true);
      } catch (error) {
        toast.error(error.response?.data?.detail || "Spin failed");
      } finally {
        setIsSpinning(false);
      }
    }, 4000);
  };

  return (
    <section 
      id="spin-win"
      ref={ref}
      className="py-20 bg-gradient-to-b from-gray-50 to-white"
      data-testid="spin-win-section"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full text-[#FF6A00] font-semibold text-sm mb-4">
            <Gift size={16} />
            WIN PRIZES
          </div>
          <h2 className="font-display text-3xl md:text-5xl mb-4">
            SPIN & WIN
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Enter your email, verify, and spin the wheel for a chance to win free tickets, backstage passes, and more!
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Email Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl p-6 md:p-8"
            >
              <h3 className="font-display text-xl mb-4">Enter to Spin</h3>
              
              {!isVerified ? (
                <form onSubmit={handleSubscribe} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20 outline-none transition-all"
                      required
                      data-testid="spin-email-input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-6 bg-[#FF6A00] text-white font-bold rounded-xl hover:bg-[#e55f00] transition-colors flex items-center justify-center gap-2"
                    data-testid="spin-subscribe-btn"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Subscribe & Verify
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-600 font-semibold mb-2">Email Verified!</p>
                  <p className="text-gray-600 text-sm">{email}</p>
                  {hasSpun && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">You already spun:</p>
                      <p className="font-bold text-[#FF6A00]">{spinResult}</p>
                      {couponCode && (
                        <p className="font-mono text-sm mt-2">{couponCode}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 pt-6 border-t border-gray-100">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">Prize Pool:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-[#FF6A00]" />
                    Free Ticket
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-[#FF6A00]" />
                    Backstage Pass
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-[#FF6A00]" />
                    Weekender Ticket
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Star className="w-4 h-4 text-[#FF6A00]" />
                    10% Discount
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Spin Wheel */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <SpinWheel
                onSpin={handleSpin}
                isSpinning={isSpinning}
                result={spinResult}
                disabled={!isVerified || hasSpun}
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && (
        <SpinResultModal
          result={spinResult}
          couponCode={couponCode}
          onClose={() => setShowResult(false)}
        />
      )}
    </section>
  );
};

// Weekender Tickets Section
const TicketsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const tickets = [
    {
      id: 'weekender-pass',
      title: 'Weekender Pass',
      description: 'Access to ALL paid Kingsday events. The ultimate experience.',
      price: '€45',
      features: ['Kingsnight IJland', 'Rotterdam Party', 'Oliva Kingsday Party', 'Priority Entry'],
      highlight: true,
      url: 'https://weeztix.shop/v9f38e5c'
    },
    {
      id: 'kingsnight',
      title: 'Kingsnight Main Event',
      subtitle: 'IJland Amsterdam',
      date: 'April 26, 2026',
      time: '23:00 - 05:00',
      price: '€15',
      url: 'https://weeztix.shop/v9f38e5c'
    },
    {
      id: 'rotterdam',
      title: 'Rotterdam Party',
      subtitle: 'Club Reverse',
      date: 'April 27, 2026',
      time: '22:00 - 05:00',
      price: '€12',
      url: 'https://weeztix.shop/qa84k5a6'
    },
    {
      id: 'oliva',
      title: 'Amsterdam Oliva Party',
      subtitle: 'Rembrandtplein',
      date: 'April 27, 2026',
      time: '23:00 - 05:00',
      price: '€15',
      url: 'https://shop.ticketapp.com/jvgfntzixg'
    },
    {
      id: 'street',
      title: 'Street Party',
      subtitle: 'Amsterdam City',
      date: 'April 27, 2026',
      time: '12:00 - 20:00',
      price: 'FREE',
      isFree: true,
      url: ''
    }
  ];

  return (
    <section 
      id="tickets"
      ref={ref}
      className="py-20 bg-white"
      data-testid="tickets-section"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full text-[#FF6A00] font-semibold text-sm mb-4">
            <Ticket size={16} />
            TICKETS
          </div>
          <h2 className="font-display text-3xl md:text-5xl mb-4">
            WEEKENDER TICKETS
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Choose your Kingsday experience. Multiple events, one unforgettable weekend.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {tickets.map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`rounded-2xl overflow-hidden ${
                ticket.highlight 
                  ? 'bg-gradient-to-br from-[#FF6A00] to-[#e55f00] text-white md:col-span-2 lg:col-span-1'
                  : 'bg-white border border-gray-200'
              } ${ticket.highlight ? 'shadow-xl' : 'shadow-lg'}`}
              data-testid={`ticket-${ticket.id}`}
            >
              {ticket.highlight && (
                <div className="bg-white/20 py-2 text-center text-sm font-semibold">
                  🔥 BEST VALUE
                </div>
              )}
              
              <div className="p-6">
                <h3 className={`font-display text-xl mb-1 ${ticket.highlight ? 'text-white' : 'text-gray-900'}`}>
                  {ticket.title}
                </h3>
                {ticket.subtitle && (
                  <p className={`text-sm mb-3 ${ticket.highlight ? 'text-white/80' : 'text-gray-500'}`}>
                    {ticket.subtitle}
                  </p>
                )}
                
                {ticket.description && (
                  <p className={`text-sm mb-4 ${ticket.highlight ? 'text-white/90' : 'text-gray-600'}`}>
                    {ticket.description}
                  </p>
                )}

                {ticket.features && (
                  <ul className="space-y-2 mb-4">
                    {ticket.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-white/90">
                        <CheckCircle className="w-4 h-4" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}

                {ticket.date && (
                  <div className={`flex flex-wrap gap-3 text-sm mb-4 ${ticket.highlight ? 'text-white/80' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {ticket.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {ticket.time}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100/20">
                  <span className={`font-display text-2xl ${ticket.highlight ? 'text-white' : ticket.isFree ? 'text-green-600' : 'text-[#FF6A00]'}`}>
                    {ticket.price}
                  </span>
                  {ticket.url ? (
                    <a
                      href={ticket.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-1 font-semibold ${
                        ticket.highlight 
                          ? 'bg-white text-[#FF6A00] px-4 py-2 rounded-full hover:bg-gray-100'
                          : 'text-[#FF6A00] hover:gap-2'
                      } transition-all`}
                    >
                      Get Tickets <ArrowRight className="w-4 h-4" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-500">No ticket needed</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Experience Sections
const ExperienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const experiences = [
    {
      id: 'dj-contest',
      icon: Mic2,
      title: 'DJ Contest',
      subtitle: 'Kingsday Street Party',
      description: 'Emerging DJs compete live during the Kingsday street celebration. Show your skills and win a spot at our main events.',
      cta: 'Apply to DJ',
      ctaUrl: 'mailto:ask@housedecoded.com?subject=DJ Contest Application',
      color: COLORS.blue
    },
    {
      id: 'bad-bunny',
      icon: Star,
      title: 'Bad Bunny Look-Alike Competition',
      subtitle: 'Kingsnight – IJland Amsterdam',
      description: 'Fans compete for the most iconic Bad Bunny look. Prizes for the best costume, style, and energy.',
      cta: 'Sign Up',
      ctaUrl: 'mailto:ask@housedecoded.com?subject=Bad Bunny Competition Signup',
      color: COLORS.red
    },
    {
      id: 'la-casita',
      icon: PartyPopper,
      title: 'La Casita del Baile',
      subtitle: 'Kingsnight – IJland Amsterdam',
      description: 'Latin house-style stage experience inspired by Caribbean street culture. Authentic vibes, unforgettable moments.',
      cta: 'Learn More',
      ctaUrl: '#tickets',
      color: COLORS.orange
    }
  ];

  return (
    <section 
      id="experiences"
      ref={ref}
      className="py-20 bg-gray-50"
      data-testid="experiences-section"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full text-[#FF6A00] font-semibold text-sm mb-4">
            <PartyPopper size={16} />
            EXPERIENCES
          </div>
          <h2 className="font-display text-3xl md:text-5xl mb-4">
            SPECIAL EXPERIENCES
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            More than just a party – interactive experiences that make Kingsday unforgettable.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {experiences.map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              data-testid={`experience-${exp.id}`}
            >
              <div 
                className="w-14 h-14 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${exp.color}20` }}
              >
                <exp.icon className="w-7 h-7" style={{ color: exp.color }} />
              </div>
              
              <h3 className="font-display text-xl mb-1">{exp.title}</h3>
              <p className="text-sm text-[#FF6A00] font-semibold mb-3">{exp.subtitle}</p>
              <p className="text-gray-600 text-sm mb-4">{exp.description}</p>
              
              <a
                href={exp.ctaUrl}
                className="inline-flex items-center gap-1 font-semibold text-sm hover:gap-2 transition-all"
                style={{ color: exp.color }}
              >
                {exp.cta} <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Event Schedule Section
const ScheduleSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const schedule = [
    {
      date: 'April 26',
      day: 'Sunday',
      label: 'Kingsnight',
      events: [
        {
          time: '23:00 - 05:00',
          title: 'Kingsnight Main Event',
          venue: 'IJland, Amsterdam',
          url: 'https://weeztix.shop/v9f38e5c'
        }
      ]
    },
    {
      date: 'April 27',
      day: 'Monday',
      label: 'Kingsday',
      events: [
        {
          time: '12:00 - 20:00',
          title: 'Kingsday Street Party',
          venue: 'Amsterdam City Center',
          isFree: true
        },
        {
          time: '22:00 - 05:00',
          title: 'Rotterdam Party',
          venue: 'Club Reverse, Rotterdam',
          url: 'https://weeztix.shop/qa84k5a6'
        },
        {
          time: '23:00 - 05:00',
          title: 'Amsterdam Oliva Party',
          venue: 'Oliva, Rembrandtplein',
          url: 'https://shop.ticketapp.com/jvgfntzixg'
        }
      ]
    }
  ];

  return (
    <section 
      id="schedule"
      ref={ref}
      className="py-20 bg-white"
      data-testid="schedule-section"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FF6A00]/10 rounded-full text-[#FF6A00] font-semibold text-sm mb-4">
            <Calendar size={16} />
            SCHEDULE
          </div>
          <h2 className="font-display text-3xl md:text-5xl mb-4">
            EVENT SCHEDULE
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
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-[#FF6A00] text-white px-4 py-2 rounded-xl">
                  <div className="text-2xl font-bold">{day.date.split(' ')[1]}</div>
                  <div className="text-xs uppercase">April</div>
                </div>
                <div>
                  <div className="font-display text-xl">{day.day}</div>
                  <div className="text-[#FF6A00] font-semibold">{day.label}</div>
                </div>
              </div>

              <div className="space-y-3 ml-4 pl-8 border-l-2 border-[#FF6A00]/20">
                {day.events.map((event, eventIndex) => (
                  <div 
                    key={eventIndex}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                          <Clock className="w-4 h-4" />
                          {event.time}
                        </div>
                        <h4 className="font-semibold">{event.title}</h4>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          {event.venue}
                        </div>
                      </div>
                      {event.url ? (
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-4 py-2 bg-[#FF6A00] text-white font-semibold rounded-full text-sm hover:bg-[#e55f00] transition-colors"
                        >
                          <Ticket className="w-4 h-4" />
                          Tickets
                        </a>
                      ) : event.isFree ? (
                        <span className="px-4 py-2 bg-green-100 text-green-700 font-semibold rounded-full text-sm">
                          FREE
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Email Capture Section
const EmailCaptureSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      await axios.post(`${API}/kingsday/subscribe`, { email });
      toast.success("You're in! Check your email for updates.");
      setEmail('');
    } catch (error) {
      if (error.response?.data?.detail?.includes('already')) {
        toast.info("You're already subscribed!");
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section 
      ref={ref}
      className="py-20"
      style={{ background: `linear-gradient(135deg, ${COLORS.orange} 0%, ${COLORS.red} 100%)` }}
      data-testid="email-capture-section"
    >
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Crown className="w-16 h-16 text-white/80 mx-auto mb-6" />
          <h2 className="font-display text-3xl md:text-5xl text-white mb-4">
            JOIN THE KINGSDAY WEEKENDER
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Get exclusive updates, early access to tickets, and spin results delivered to your inbox.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-5 py-4 rounded-full text-gray-900 placeholder-gray-500 outline-none focus:ring-4 focus:ring-white/30"
              required
              data-testid="email-capture-input"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 bg-white text-[#FF6A00] font-bold rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              data-testid="email-capture-btn"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
              Subscribe
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

// Main Kingsday Weekender Page
export const KingsdayWeekenderPage = () => {
  useEffect(() => {
    // SEO Meta Tags
    document.title = "Kingsday Weekender 2026 | Latin Party Amsterdam & Rotterdam – Baila Dembow";
    
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', 'Celebrate Kingsday 2026 with Baila Dembow! The ultimate Latin party weekender in Amsterdam and Rotterdam. Reggaeton, Dembow, and Dutch festivities combined.');
    }

    // Open Graph Tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', 'Baila Dembow Kingsday Weekender 2026');
    
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', 'The ultimate Kingsday Latin party experience. Amsterdam & Rotterdam. April 26-27, 2026.');

    // Structured Data
    const eventSchema = {
      "@context": "https://schema.org",
      "@type": "Event",
      "name": "Baila Dembow Kingsday Weekender 2026",
      "description": "Celebrate Kingsday across Amsterdam and Rotterdam with the ultimate Latin party weekender. Multiple events, one unforgettable experience.",
      "startDate": "2026-04-26T23:00:00+02:00",
      "endDate": "2026-04-28T05:00:00+02:00",
      "eventStatus": "https://schema.org/EventScheduled",
      "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
      "location": [
        {
          "@type": "Place",
          "name": "IJland",
          "address": { "@type": "PostalAddress", "addressLocality": "Amsterdam", "addressCountry": "NL" }
        },
        {
          "@type": "Place",
          "name": "Club Reverse",
          "address": { "@type": "PostalAddress", "addressLocality": "Rotterdam", "addressCountry": "NL" }
        }
      ],
      "organizer": {
        "@type": "Organization",
        "name": "Baila Dembow",
        "url": "https://bailadembow.com"
      },
      "offers": {
        "@type": "AggregateOffer",
        "lowPrice": "12",
        "highPrice": "45",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock"
      }
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
    <div className="min-h-screen" data-testid="kingsday-page">
      <HeroSection />
      <SpinWinSection />
      <TicketsSection />
      <ExperienceSection />
      <ScheduleSection />
      <EmailCaptureSection />
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container-custom text-center">
          <div className="flex justify-center gap-1 mb-4">
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: COLORS.red }} />
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: COLORS.white }} />
            <div className="w-6 h-1 rounded-full" style={{ backgroundColor: COLORS.blue }} />
          </div>
          <p className="font-display text-xl mb-2">BAILA DEMBOW</p>
          <p className="text-gray-400 text-sm">© 2026 Baila Dembow. Part of House Decoded Events.</p>
          <a href="#/" className="text-[#FF6A00] hover:underline text-sm mt-4 inline-block">
            ← Back to Main Site
          </a>
        </div>
      </footer>
    </div>
  );
};
