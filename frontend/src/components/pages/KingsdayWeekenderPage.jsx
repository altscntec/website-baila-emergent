import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { 
  Calendar, Clock, MapPin, Ticket, Crown, Music, Users, 
  Mail, CheckCircle, Loader2, Star, Mic2, PartyPopper,
  Gift, ArrowRight, Sparkles, Check, X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../../utils/constants';

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

// Premium Spin Wheel Component
const PremiumSpinWheel = ({ onSpin, isSpinning, disabled }) => {
  const [rotation, setRotation] = useState(0);

  const handleSpin = () => {
    if (disabled || isSpinning) return;
    const spins = 5 + Math.random() * 5;
    const newRotation = rotation + (spins * 360) + Math.random() * 360;
    setRotation(newRotation);
    onSpin();
  };

  // Premium wheel segments with refined colors
  const segments = [
    { label: 'Free Ticket', color: COLORS.burntOrange },
    { label: 'Try Again', color: COLORS.mutedBlue },
    { label: '10% Off', color: COLORS.mutedRed },
    { label: 'Try Again', color: '#4A4440' },
    { label: 'VIP Pass', color: COLORS.gold },
    { label: 'Try Again', color: COLORS.mutedBlue },
    { label: 'Weekender', color: COLORS.deepOrange },
    { label: 'Try Again', color: '#4A4440' },
  ];

  const segmentAngle = 360 / segments.length;

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel Container with Glow */}
      <div className="relative w-64 h-64 md:w-80 md:h-80">
        {/* Outer Glow */}
        <div 
          className="absolute -inset-4 rounded-full blur-xl opacity-40"
          style={{ background: `radial-gradient(circle, ${COLORS.burntOrange} 0%, transparent 70%)` }}
        />
        
        {/* Pointer - Refined */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
          <div 
            className="w-0 h-0 border-l-[14px] border-r-[14px] border-t-[24px] border-l-transparent border-r-transparent"
            style={{ 
              borderTopColor: COLORS.ivory,
              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
            }}
          />
        </div>
        
        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full overflow-hidden relative"
          style={{ 
            boxShadow: `
              0 0 0 8px ${COLORS.ivory},
              0 0 0 12px ${COLORS.warmBeige},
              0 20px 60px rgba(0,0,0,0.3),
              inset 0 0 40px rgba(0,0,0,0.2)
            `
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {/* SVG Wheel */}
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {segments.map((segment, index) => {
              const startAngle = index * segmentAngle - 90;
              const endAngle = startAngle + segmentAngle;
              const startRad = (startAngle * Math.PI) / 180;
              const endRad = (endAngle * Math.PI) / 180;
              const x1 = 100 + 100 * Math.cos(startRad);
              const y1 = 100 + 100 * Math.sin(startRad);
              const x2 = 100 + 100 * Math.cos(endRad);
              const y2 = 100 + 100 * Math.sin(endRad);
              const labelAngle = startAngle + segmentAngle / 2;
              const labelRad = (labelAngle * Math.PI) / 180;
              const labelX = 100 + 60 * Math.cos(labelRad);
              const labelY = 100 + 60 * Math.sin(labelRad);

              return (
                <g key={index}>
                  <path
                    d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                    fill={segment.color}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={labelX}
                    y={labelY}
                    fill="white"
                    fontSize="7"
                    fontWeight="600"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelAngle + 90}, ${labelX}, ${labelY})`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  >
                    {segment.label}
                  </text>
                </g>
              );
            })}
          </svg>
          
          {/* Center Hub */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center z-10"
            style={{ 
              background: `linear-gradient(135deg, ${COLORS.ivory} 0%, ${COLORS.cream} 100%)`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.2), inset 0 -2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Crown className="w-7 h-7 md:w-8 md:h-8" style={{ color: COLORS.burntOrange }} />
          </div>
        </motion.div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={disabled || isSpinning}
        className={`mt-10 px-10 py-4 rounded-full font-semibold text-base transition-all duration-300 ${
          disabled || isSpinning
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
        }`}
        style={!disabled && !isSpinning ? {
          background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
          boxShadow: `0 4px 24px ${COLORS.softGlow}`
        } : {}}
        data-testid="spin-button"
      >
        {isSpinning ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Spinning...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Spin the Wheel
          </span>
        )}
      </button>
    </div>
  );
};

// Spin Result Modal
const SpinResultModal = ({ result, couponCode, onClose }) => {
  if (!result) return null;
  const isWinner = result !== 'Better Luck Next Time';
  const isDiscount = result === '10% Discount';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      data-testid="spin-result-modal"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="rounded-3xl p-10 max-w-md w-full text-center relative"
        style={{ backgroundColor: COLORS.ivory }}
      >
        <div 
          className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center`}
          style={{ backgroundColor: isWinner ? COLORS.softGlow : COLORS.warmBeige }}
        >
          {isWinner ? (
            <Crown className="w-10 h-10" style={{ color: COLORS.burntOrange }} />
          ) : (
            <Gift className="w-10 h-10" style={{ color: COLORS.warmGray }} />
          )}
        </div>

        <h3 className="font-display text-2xl mb-3" style={{ color: COLORS.espresso }} data-testid="spin-result-title">
          {isWinner ? 'Congratulations!' : 'Not This Time'}
        </h3>
        
        {isDiscount ? (
          <p className="mb-6" style={{ color: COLORS.warmGray }} data-testid="spin-result-message">
            You unlocked a 10% discount. Check your email to claim it.
          </p>
        ) : (
          <p className="mb-6" style={{ color: COLORS.warmGray }}>
            {isWinner ? `You won: ${result}` : "Join us at Kingsday Weekender anyway!"}
          </p>
        )}

        {couponCode && !isDiscount && (
          <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: COLORS.cream }}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: COLORS.warmGray }}>Your Code</p>
            <p className="font-mono text-xl font-bold" style={{ color: COLORS.burntOrange }}>{couponCode}</p>
          </div>
        )}

        {isDiscount && (
          <div className="rounded-2xl p-5 mb-6" style={{ backgroundColor: COLORS.cream }}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-4 h-4" style={{ color: COLORS.burntOrange }} />
              <p className="text-xs uppercase tracking-wider" style={{ color: COLORS.warmGray }}>Sent to your inbox</p>
            </div>
            <p className="text-sm" style={{ color: COLORS.charcoal }}>Your discount code has been emailed to you.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isWinner && (
            <a
              href="#tickets"
              onClick={onClose}
              className="px-8 py-3 rounded-full font-semibold text-white transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)` }}
              data-testid="spin-result-view-tickets"
            >
              <Ticket className="w-4 h-4" />
              View Tickets
            </a>
          )}
          <button
            onClick={onClose}
            className={`px-8 py-3 rounded-full font-semibold transition-all hover:scale-[1.02] ${
              isWinner 
                ? 'border-2 hover:bg-gray-50' 
                : 'text-white'
            }`}
            style={isWinner 
              ? { borderColor: COLORS.warmBeige, color: COLORS.charcoal }
              : { background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)` }
            }
            data-testid="spin-result-close"
          >
            {isWinner ? 'Close' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Premium Spin & Win Section
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

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/kingsday/subscribe`, { email });
      if (response.data.verified) {
        setIsVerified(true);
        setHasSpun(response.data.has_spun);
        toast.success("You're verified! Spin the wheel.");
      } else {
        setTimeout(async () => {
          try {
            await axios.get(`${API}/kingsday/verify/${response.data.verification_token}`);
            setIsVerified(true);
            toast.success("Verified! Spin now.");
          } catch (error) {
            console.error("Verify failed:", error);
          }
        }, 2000);
        toast.success("Check your email to verify.");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpin = async () => {
    if (!isVerified || hasSpun || isSpinning) return;
    setIsSpinning(true);
    
    setTimeout(async () => {
      try {
        const response = await axios.post(`${API}/kingsday/spin`, { email });
        setSpinResult(response.data.prize);
        setCouponCode(response.data.coupon_code);
        setHasSpun(true);
        setShowResult(true);
      } catch (error) {
        toast.error("Spin failed");
      } finally {
        setIsSpinning(false);
      }
    }, 4000);
  };

  return (
    <section 
      id="spin-win"
      ref={ref}
      className="py-24 md:py-32 relative overflow-hidden"
      style={{ backgroundColor: COLORS.ivory }}
      data-testid="spin-win-section"
    >
      {/* Subtle Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(${COLORS.espresso} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="container-custom relative">
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
            Exclusive Activation
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4" style={{ color: COLORS.espresso }}>
            Spin & Win
          </h2>
          <p className="max-w-md mx-auto" style={{ color: COLORS.warmGray }}>
            Enter your email for a chance to win exclusive prizes including free tickets and VIP access.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
            {/* Left Panel - Editorial Email Block */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div 
                className="rounded-3xl p-8 md:p-10 relative overflow-hidden"
                style={{ 
                  backgroundColor: COLORS.cream,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.08)'
                }}
              >
                {/* Decorative Corner */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 opacity-50"
                  style={{ 
                    background: `radial-gradient(circle at top right, ${COLORS.softGlow} 0%, transparent 70%)`
                  }}
                />

                <div className="relative">
                  <Crown className="w-10 h-10 mb-6" style={{ color: COLORS.burntOrange }} />
                  
                  <h3 className="font-display text-2xl mb-3" style={{ color: COLORS.espresso }}>
                    {isVerified ? "You're In" : "Enter to Win"}
                  </h3>
                  
                  <p className="text-sm mb-8 leading-relaxed" style={{ color: COLORS.warmGray }}>
                    {isVerified 
                      ? "Your entry is confirmed. Spin the wheel for your prize."
                      : "Subscribe and verify your email to unlock the wheel. One spin per person."
                    }
                  </p>

                  {!isVerified ? (
                    <form onSubmit={handleSubscribe} className="space-y-4">
                      <div>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-5 py-4 rounded-xl border-2 text-base transition-all duration-300 outline-none"
                          style={{ 
                            backgroundColor: COLORS.ivory,
                            borderColor: COLORS.warmBeige,
                            color: COLORS.espresso
                          }}
                          onFocus={(e) => e.target.style.borderColor = COLORS.burntOrange}
                          onBlur={(e) => e.target.style.borderColor = COLORS.warmBeige}
                          required
                          data-testid="spin-email-input"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                        style={{ 
                          background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
                          boxShadow: `0 4px 20px ${COLORS.softGlow}`
                        }}
                        data-testid="spin-subscribe-btn"
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Mail className="w-5 h-5" />
                            Verify & Unlock
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                      <div 
                        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: COLORS.softGlow }}
                      >
                        <CheckCircle className="w-8 h-8" style={{ color: COLORS.burntOrange }} />
                      </div>
                      <p className="font-semibold mb-1" style={{ color: COLORS.espresso }}>Verified</p>
                      <p className="text-sm" style={{ color: COLORS.warmGray }}>{email}</p>
                      {hasSpun && spinResult && (
                        <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: COLORS.ivory }}>
                          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: COLORS.warmGray }}>Your Result</p>
                          <p className="font-semibold" style={{ color: COLORS.burntOrange }}>{spinResult}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Prize List */}
                  <div className="mt-8 pt-6 border-t" style={{ borderColor: COLORS.warmBeige }}>
                    <p className="text-xs uppercase tracking-wider mb-4 font-medium" style={{ color: COLORS.warmGray }}>
                      Prize Pool
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {['Free Ticket', 'VIP Pass', 'Weekender', '10% Off'].map((prize) => (
                        <div key={prize} className="flex items-center gap-2" style={{ color: COLORS.charcoal }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS.burntOrange }} />
                          {prize}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Panel - Premium Wheel */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center"
            >
              <PremiumSpinWheel
                onSpin={handleSpin}
                isSpinning={isSpinning}
                disabled={!isVerified || hasSpun}
              />
            </motion.div>
          </div>
        </div>
      </div>

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
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    try {
      await axios.post(`${API}/kingsday/subscribe`, { email });
      toast.success("You're on the list!");
      setEmail('');
    } catch (error) {
      toast.info("You're already subscribed!");
    } finally {
      setIsLoading(false);
    }
  };

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
            Get exclusive updates, early access, and special offers.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 px-6 py-4 rounded-full text-base outline-none transition-all"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'white'
              }}
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-4 rounded-full font-semibold text-white transition-all hover:scale-[1.02]"
              style={{ 
                background: `linear-gradient(135deg, ${COLORS.burntOrange} 0%, ${COLORS.deepOrange} 100%)`,
                boxShadow: `0 4px 24px ${COLORS.softGlow}`
              }}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Subscribe'}
            </button>
          </form>
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
      <SpinWinSection />
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
