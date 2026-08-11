import { useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Heart, ExternalLink } from 'lucide-react';

const GOFUNDME_URL = 'https://gofund.me/e65297285';
const WIDGET_URL =
  'https://www.gofundme.com/f/todos-por-colombia-4psr8/widget/large?attribution_id=sl%3Ad37d9703-439e-4aa4-80ba-3bf47b13d887';

// Emergency appeal for Colombia.
//
// The GoFundMe widget is embedded directly as an iframe rather than via their
// embed.js (which only scans the DOM once on load and so misses React-rendered
// nodes). GoFundMe's frame-ancestors policy does not list this domain — it is
// currently report-only, so framing works, but if they ever enforce it the
// frame would go blank. To stay safe a branded donation card sits underneath
// and the iframe only fades in once it actually loads; the donate CTA in the
// left column always works regardless.
export const FundraiserSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  return (
    <section
      id="fundraiser"
      ref={ref}
      className="relative py-20 md:py-28 overflow-hidden"
      style={{ background: '#0C0910' }}
      data-testid="fundraiser-section"
    >
      {/* Colombian flag accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex">
        <div className="flex-1" style={{ background: '#FCD116' }} />
        <div className="w-1/4" style={{ background: '#003893' }} />
        <div className="w-1/4" style={{ background: '#CE1126' }} />
      </div>
      <div
        className="absolute -top-24 left-1/4 w-[520px] h-[420px] rounded-full pointer-events-none opacity-25"
        style={{ background: 'radial-gradient(ellipse, rgba(252,209,22,.35) 0%, transparent 70%)' }}
      />

      <div className="container-custom relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Story */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-4" style={{ color: '#FCD116' }}>
              Emergency appeal · Colombia
            </p>
            <h2 className="font-display text-white text-[clamp(2.6rem,7vw,5rem)] leading-[0.95] mb-6">
              Todos por<br />Colombia.
            </h2>
            <div className="space-y-4 text-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl">
              <p>
                Colombia has been hit by a devastating earthquake. Our community is Latin to its core —
                many of us have family, friends and roots there, and right now people on the ground
                need help.
              </p>
              <p>
                We've started a fundraiser to get support directly to the people doing the work:
                emergency supplies, shelter and relief for the families who lost the most. Every
                contribution goes further than you think, and no amount is too small.
              </p>
              <p className="text-white font-semibold">
                If you can give, give. If you can't, share it — that helps too.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <a
                href={GOFUNDME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#FCD116] text-black font-extrabold py-4 px-10 rounded-full text-lg hover:bg-white transition-colors duration-300 shadow-[0_10px_40px_rgba(252,209,22,.28)]"
                data-testid="fundraiser-donate"
              >
                <Heart size={20} />
                DONATE NOW
              </a>
              <a
                href={GOFUNDME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-white/80 font-semibold hover:text-[#FCD116] transition-colors text-sm"
              >
                View the fundraiser on GoFundMe
                <ExternalLink size={15} />
              </a>
            </div>
          </motion.div>

          {/* GoFundMe widget */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="flex justify-center lg:justify-end"
          >
            <div className="relative w-full max-w-[420px]" style={{ minHeight: 540 }}>
              {/* Base layer — always present, always works */}
              <a
                href={GOFUNDME_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-8 text-center hover:border-[#FCD116]/40 transition-colors"
                data-testid="fundraiser-fallback"
              >
                <Heart size={32} className="mb-4 text-[#FCD116]" />
                <p className="font-display text-white text-2xl mb-2">Todos por Colombia</p>
                <p className="text-gray-400 text-sm mb-5 max-w-[260px]">
                  Emergency relief for the families hit by the earthquake in Colombia.
                </p>
                <span className="inline-flex items-center gap-2 text-[#FCD116] font-extrabold">
                  Donate on GoFundMe <ExternalLink size={15} />
                </span>
              </a>

              {/* Live GoFundMe widget — fades in only once it genuinely loads */}
              <iframe
                src={WIDGET_URL}
                title="Todos por Colombia — GoFundMe fundraiser"
                loading="lazy"
                onLoad={() => setWidgetLoaded(true)}
                className="relative w-full rounded-2xl transition-opacity duration-500"
                style={{
                  height: 540,
                  opacity: widgetLoaded ? 1 : 0,
                  pointerEvents: widgetLoaded ? 'auto' : 'none',
                  background: 'transparent',
                }}
                data-testid="fundraiser-widget"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
