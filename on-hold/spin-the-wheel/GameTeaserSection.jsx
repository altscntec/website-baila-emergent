import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const PRIZES = ['FREE TICKET', '75% OFF', '50% OFF', '35% OFF'];

export const GameTeaserSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section
      id="play"
      ref={ref}
      className="py-24 md:py-32"
      style={{ background: '#FFE14D' }}
      data-testid="game-teaser-section"
    >
      <div className="container-custom text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <p className="text-black font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-6">
            One spin per email — a new spin every 30 days
          </p>
          <h2 className="font-display text-black text-[clamp(3rem,9vw,7.5rem)] leading-[0.9] mb-10">
            Spin the wheel.<br />Win the night.
          </h2>

          <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-12">
            {PRIZES.map((p) => (
              <span
                key={p}
                className="font-display text-lg md:text-2xl bg-black text-[#FFE14D] px-6 py-3 rounded-full"
              >
                {p}
              </span>
            ))}
          </div>

          <a
            href="/play.html"
            className="inline-block bg-[#FF0080] text-white font-extrabold py-5 px-14 rounded-full text-xl hover:bg-black transition-colors duration-300"
            data-testid="game-teaser-cta"
          >
            SPIN NOW →
          </a>
          <p className="text-black/60 text-sm mt-6">Winners get their code by email. 18+.</p>
        </motion.div>
      </div>
    </section>
  );
};
