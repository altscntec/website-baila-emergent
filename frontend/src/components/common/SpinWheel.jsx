import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Loader2, CheckCircle, X } from 'lucide-react';

const WHEEL_SEGMENTS = [
  { label: 'Free Ticket', color: '#FF6A00', textColor: '#fff' },
  { label: 'Better Luck', color: '#21468B', textColor: '#fff' },
  { label: '10% Discount', color: '#AE1C28', textColor: '#fff' },
  { label: 'Better Luck', color: '#21468B', textColor: '#fff' },
  { label: 'Backstage Pass', color: '#FF6A00', textColor: '#fff' },
  { label: 'Better Luck', color: '#21468B', textColor: '#fff' },
  { label: 'Weekender', color: '#AE1C28', textColor: '#fff' },
  { label: 'Better Luck', color: '#21468B', textColor: '#fff' },
];

export const SpinWheel = ({ onSpin, isSpinning, result, disabled }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef(null);

  const handleSpin = () => {
    if (disabled || isSpinning) return;
    
    // Random rotation between 5-10 full spins plus landing position
    const spins = 5 + Math.random() * 5;
    const newRotation = rotation + (spins * 360) + Math.random() * 360;
    setRotation(newRotation);
    
    onSpin();
  };

  const segmentAngle = 360 / WHEEL_SEGMENTS.length;

  return (
    <div className="relative flex flex-col items-center">
      {/* Wheel Container */}
      <div className="relative w-72 h-72 md:w-96 md:h-96">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[30px] border-l-transparent border-r-transparent border-t-[#FF6A00] drop-shadow-lg" />
        </div>
        
        {/* Wheel */}
        <motion.div
          ref={wheelRef}
          className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-[#FF6A00]"
          style={{ 
            background: `conic-gradient(${WHEEL_SEGMENTS.map((seg, i) => 
              `${seg.color} ${i * segmentAngle}deg ${(i + 1) * segmentAngle}deg`
            ).join(', ')})` 
          }}
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
        >
          {/* Segment Labels */}
          {WHEEL_SEGMENTS.map((segment, index) => {
            const angle = index * segmentAngle + segmentAngle / 2;
            return (
              <div
                key={index}
                className="absolute w-full h-full flex items-center justify-center"
                style={{
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <span
                  className="absolute text-xs md:text-sm font-bold text-white whitespace-nowrap"
                  style={{
                    transform: `translateY(-120px) md:translateY(-150px) rotate(90deg)`,
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                  }}
                >
                  {segment.label}
                </span>
              </div>
            );
          })}
          
          {/* Center Circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-lg flex items-center justify-center z-10">
            <Gift className="w-8 h-8 md:w-10 md:h-10 text-[#FF6A00]" />
          </div>
        </motion.div>
      </div>

      {/* Spin Button */}
      <button
        onClick={handleSpin}
        disabled={disabled || isSpinning}
        className={`mt-8 px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-2 ${
          disabled || isSpinning
            ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
            : 'bg-[#FF6A00] text-white hover:bg-[#e55f00] shadow-lg hover:shadow-xl'
        }`}
        data-testid="spin-button"
      >
        {isSpinning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Spinning...
          </>
        ) : (
          <>
            <Gift className="w-5 h-5" />
            SPIN THE WHEEL
          </>
        )}
      </button>
    </div>
  );
};

export const SpinResultModal = ({ result, couponCode, onClose }) => {
  if (!result) return null;
  
  const isWinner = result !== 'Better Luck Next Time';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden"
        >
          {/* Confetti effect for winners */}
          {isWinner && (
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: ['#FF6A00', '#AE1C28', '#21468B', '#FFD700'][i % 4],
                    left: `${Math.random() * 100}%`,
                    top: '-10px'
                  }}
                  animate={{
                    y: [0, 400],
                    x: [0, (Math.random() - 0.5) * 100],
                    rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                    opacity: [1, 0]
                  }}
                  transition={{
                    duration: 2 + Math.random(),
                    delay: Math.random() * 0.5,
                    repeat: Infinity,
                    repeatDelay: Math.random()
                  }}
                />
              ))}
            </div>
          )}
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
            isWinner ? 'bg-[#FF6A00]' : 'bg-gray-400'
          }`}>
            {isWinner ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : (
              <Gift className="w-10 h-10 text-white" />
            )}
          </div>

          <h3 className="font-display text-2xl mb-2">
            {isWinner ? '🎉 Congratulations!' : 'Better Luck Next Time!'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {isWinner 
              ? `You won: ${result}!`
              : "Don't worry, you can still join the Kingsday Weekender!"
            }
          </p>

          {couponCode && (
            <div className="bg-[#FF6A00]/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-2">Your Coupon Code:</p>
              <p className="font-mono text-xl font-bold text-[#FF6A00]">{couponCode}</p>
              <p className="text-xs text-gray-500 mt-2">Save this code! It will be sent to your email.</p>
            </div>
          )}

          <a
            href="https://linktr.ee/bailadembow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-[#FF6A00] text-white font-bold rounded-full hover:bg-[#e55f00] transition-colors"
          >
            Get Weekender Tickets
          </a>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
