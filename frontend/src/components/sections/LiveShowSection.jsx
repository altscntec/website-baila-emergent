import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

const LIVESHOW_VIDEO = {
  url: "/videos/liveshow-1.mp4",
  alt: "Live Tribute Show by Baila Dembow"
};

const LIVESHOW_IMAGES = Array.from({ length: 6 }, (_, i) => ({
  url: `/images/liveshow/liveshow-${i + 1}.jpg`,
  alt: `Live Tribute Show by Baila Dembow — moment ${i + 1}`
}));

export const LiveShowSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="live-tribute-shows"
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: '#0A0A0A' }}
      data-testid="liveshow-section"
    >
      {/* Grain Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Warm gold ambient glow - top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(255, 180, 60, 0.35) 0%, transparent 70%)' }}
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
            LIVE TRIBUTE<br />
            <span className="gradient-text">SHOWS.</span>
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
            Some Baila Dembow nights aren't just club nights. They're full live tribute shows
            where we bring the legends of Latin music back to the stage, performed by world-class
            musicians with real instruments, real horns, real soul. Think Juan Luis Guerra, the
            kings of merengue, the bachata classics, the salsa heavyweights, the reggaeton
            pioneers. The artists that shaped how we dance, how we love, how we grew up.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            This is where Baila Dembow slows down to honor where the culture comes from. A full
            band on stage. A crowd singing every word. The kind of musicianship you don't get
            from a Spotify playlist. After the live set wraps, the venue flips. Our resident DJs
            take over and the night turns into a full Baila Dembow XL takeover, running pure
            dembow and reggaeton until sunrise.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            Two experiences. One night. The roots and the future, back to back.
          </p>
        </motion.div>
      </div>

      {/* Video - single 16:9, full-width */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative rounded-2xl overflow-hidden mx-auto"
          style={{
            aspectRatio: '4/5',
            maxWidth: '700px',
            boxShadow: '0 20px 60px rgba(255, 180, 60, 0.18), 0 0 0 1px rgba(255,255,255,0.05)'
          }}
          data-testid="liveshow-video"
        >
          <video
            src={LIVESHOW_VIDEO.url}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)'
          }} />
        </motion.div>
      </div>

      {/* Photo Grid - 6 images, responsive 2/3 columns */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3"
        >
          {LIVESHOW_IMAGES.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.08 * index + 0.4 }}
              className="relative rounded-xl overflow-hidden group aspect-[4/3]"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              data-testid={`liveshow-image-${index}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* CTA Section - same WhatsApp link */}
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
            data-testid="liveshow-whatsapp-cta"
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
        style={{ background: 'radial-gradient(ellipse, rgba(255, 180, 60, 0.25) 0%, transparent 70%)' }}
      />
    </section>
  );
};
