import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { MessageCircle, ArrowRight } from 'lucide-react';

const HALLOWEEN_VIDEOS = [
  { url: "/videos/halloween-1.mp4", alt: "Halloween Baila Dembow recap" },
  { url: "/videos/halloween-2.mp4", alt: "Halloween party highlights" }
];

const HALLOWEEN_IMAGES = Array.from({ length: 15 }, (_, i) => ({
  url: `/images/halloween/halloween-${i + 1}.jpg`,
  alt: `Latin Halloween Festival by Baila Dembow — moment ${i + 1}`
}));

export const HalloweenSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="halloween"
      ref={ref}
      className="relative overflow-hidden"
      style={{ background: '#0A0A0A' }}
      data-testid="halloween-section"
    >
      {/* Grain Texture Overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Eerie purple/orange ambient glow - top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-30 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(150, 0, 200, 0.4) 0%, transparent 70%)' }}
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
          <h2 className="font-display text-4xl sm:text-5xl md:text-7xl text-white mb-8 leading-[0.95] flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>THE LATIN</span>
            <span className="gradient-text">HALLOWEEN FEST.</span>
            <motion.img
              src="/images/halloween/mrbadbunny.png"
              alt="Mr Bad Bunny mascot"
              className="inline-block align-middle"
              style={{ height: '1em', width: 'auto' }}
              animate={{ rotate: [0, -10, 0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
            The one night Amsterdam goes full spooky for Latin music. Three years running,
            1400+ people, sold out every single time.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            Every year we raise the bar. We've built a haunted castle inside the venue.
            We've placed dining tables on the stage and served wine to a chosen few while
            the dancefloor raged around them. The costumes go hard — this isn't a
            last-minute cat-ears situation. Amsterdam genuinely dresses up for this one.
          </p>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed mt-4">
            The Latin Halloween by Baila Dembow is our biggest night of the year. And this
            year, we're going even bigger.
          </p>
          <p className="text-base md:text-lg text-white max-w-2xl leading-relaxed mt-4 font-semibold">
            For those waiting on 2026 — it will be 1.5× bigger than our last Halloween. You're
            in for a great surprise. And for those who haven't been yet — your first one will
            tell you everything.
          </p>
        </motion.div>
      </div>

      {/* Video Grid - 4 portrait videos (1080x1350) */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        >
          {HALLOWEEN_VIDEOS.map((video, index) => (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden group"
              style={{
                aspectRatio: '4/5',
                boxShadow: '0 20px 60px rgba(150, 0, 200, 0.18), 0 0 0 1px rgba(255,255,255,0.05)'
              }}
              data-testid={`halloween-video-${index}`}
            >
              <video
                src={video.url}
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
            </div>
          ))}
        </motion.div>
      </div>

      {/* Photo Grid - 15 images, responsive */}
      <div className="container-custom pb-10 relative z-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-3"
        >
          {HALLOWEEN_IMAGES.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.04 * index + 0.4 }}
              className="relative rounded-xl overflow-hidden group aspect-square"
              style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
              data-testid={`halloween-image-${index}`}
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

      {/* CTA Section - same WhatsApp link as Casita */}
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
            data-testid="halloween-whatsapp-cta"
          >
            <MessageCircle size={20} />
            Join WhatsApp Community
            <ArrowRight size={18} />
          </a>
        </motion.div>
      </div>

      {/* Bottom purple glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(150, 0, 200, 0.3) 0%, transparent 70%)' }}
      />
    </section>
  );
};
