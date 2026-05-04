import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

const CASITA_IMAGES = [
  { url: "/images/casita/casita-stage.jpg", alt: "La Casita stage with crowd and straw hats" },
  { url: "/images/casita/casita-crowd.jpg", alt: "Crowd facing La Casita with plastic chair hanging from ceiling" },
  { url: "/images/casita/casita-girls.jpg", alt: "Girls posing in front of casita wall" },
  { url: "/images/casita/casita-mc-brady.jpg", alt: "MC in Brady jersey with straw hat" },
  { url: "/images/casita/casita-girl-glasses.jpg", alt: "Girl with red glasses and orange bandana" },
  { url: "/images/casita/casita-confetti.jpg", alt: "Red confetti crowd moment" },
  { url: "/images/casita/casita-mcs-stage.jpg", alt: "MCs on La Casita stage with arches and lights" },
  { url: "/images/casita/casita-mc-sign.jpg", alt: "MC with mic under Baila Dembow sign" }
];

const CASITA_VIDEOS = [
  { url: "/videos/kingsnight-baila-dembow.mp4", alt: "Kingsnight Baila Dembow" },
  { url: "/videos/superbowl-baila-dembow.mp4", alt: "Super Bowl edition Baila Dembow" }
];

export const CasitaSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="casita"
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: '#0A0A0A' }}
      data-testid="casita-section"
    >
      {/* Grain Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm ambient glow - top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255, 60, 0, 0.4) 0%, transparent 70%)' }}
      />

      {/* Section Header */}
      <div className="container-custom pt-24 md:pt-32 pb-16 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-4xl"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">
            Our Signature
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl text-white mb-8 leading-[0.95]">
            CASA DE<br />
            <span className="gradient-text">BAILA DEMBOW.</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
            Some Baila Dembow events are built around La Casita - a full-scale house that transforms
            any venue into a Latin American street party. Think orange-and-red archways, tropical
            plants, festoon lights, pennant bunting, Latin American flags overhead, and the iconic
            Baila Dembow neon sign glowing above the DJ booth.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            Everyone gets a straw hat - the signature look that ties the whole crowd together.
            And yes, there's a plastic chair hanging from the ceiling. If you know, you know.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            The casita isn't just a stage - it's where the action happens. The MC hosts look-alike
            competitions, the DJs spin from inside the set, and themed editions (like our Super Bowl
            night with Brady jerseys and straw hats) keep every event fresh while the core vibe stays
            the same: loud, sweaty, and unmistakably Baila Dembow.
          </p>
        </motion.div>
      </div>

      {/* Video Section - Cinematic */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
          {CASITA_VIDEOS.map((video, index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden group"
              style={{
                aspectRatio: '16/9',
                boxShadow: '0 20px 60px rgba(255, 60, 0, 0.15), 0 0 0 1px rgba(255,255,255,0.05)'
              }}
              data-testid={`casita-video-${index}`}
            >
              <video
                src={video.url}
                poster={index === 0 
                  ? "/images/casita/casita-crowd.jpg"
                  : "/images/casita/casita-stage.jpg"
                }
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Subtle vignette */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)'
              }} />
            </div>
          ))}
        </motion.div>
      </div>

      {/* Photo Grid - Event Recap Style */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="casita-grid"
        >
          {CASITA_IMAGES.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index + 0.4 }}
              className={`relative rounded-xl overflow-hidden group casita-grid-item-${index + 1}`}
              style={{
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
              }}
              data-testid={`casita-image-${index}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              {/* Warm overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section */}
      <div className="container-custom py-16 md:py-24 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <p className="text-gray-500 text-sm mb-6 tracking-wide">
            Want to be part of this? Join the community.
          </p>
          <a
            href="https://chat.whatsapp.com/EvqrDDkud6eB7JSRzPEpj6"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#FF0080] text-white font-bold py-4 px-10 rounded-full text-lg hover:bg-[#FF3B30] transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_8px_30px_rgba(255,0,128,0.3)]"
            data-testid="casita-whatsapp-cta"
          >
            <MessageCircle size={20} />
            Join WhatsApp Community
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>

      {/* Bottom warm glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255, 0, 128, 0.3) 0%, transparent 70%)' }}
      />
    </section>
  );
};
