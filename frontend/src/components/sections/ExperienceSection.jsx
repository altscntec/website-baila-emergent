import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { GALLERY_IMAGES } from '../../utils/constants';

export const ExperienceSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const galleryImages = GALLERY_IMAGES;

  return (
    <section id="experience" className="py-20 md:py-28 relative overflow-hidden" ref={ref} data-testid="experience-section" style={{ background: '#0A0A0A' }}>
      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="container-custom relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <p className="text-sm tracking-[0.2em] uppercase text-[#FF0080] font-semibold mb-4">The Experience</p>
          <h2 className="font-display text-4xl md:text-6xl text-white">
            YOU DON'T WATCH IT.<br /><span className="gradient-text">YOU LIVE IT.</span>
          </h2>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="gallery-grid"
        >
          {galleryImages.map((image, index) => (
            <motion.div
              key={image.id || index}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              className={`bento-item img-zoom gallery-item-${(index % 5) + 1}`}
              style={{ minHeight: index === 0 ? '400px' : '280px' }}
              data-testid={`gallery-image-${index}`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
