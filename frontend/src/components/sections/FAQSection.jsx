import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FAQS } from '../../utils/constants';

// Visible FAQ — question-phrased headings with concise answers, kept in
// sync with the FAQPage JSON-LD in public/index.html. Uses <details> so
// every answer is in the DOM for crawlers even when collapsed.
export const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="faq" ref={ref} className="py-24 md:py-32" style={{ background: '#0A0A0A' }} data-testid="faq-section">
      <div className="container-custom max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <p className="text-[#FFE14D] font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-4">FAQ</p>
          <h2 className="font-display text-white text-[clamp(2.6rem,7vw,5rem)] leading-[0.95]">
            Good questions.
          </h2>
        </motion.div>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <motion.details
              key={item.q}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.06 * i }}
              className="group rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden"
              data-testid={`faq-item-${i}`}
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5 [&::-webkit-details-marker]:hidden">
                <h3 className="text-white font-bold text-base md:text-lg leading-snug">{item.q}</h3>
                <ChevronDown size={20} className="shrink-0 text-[#FFE14D] transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="px-6 pb-6 text-gray-400 text-sm md:text-base leading-relaxed">{item.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
};
