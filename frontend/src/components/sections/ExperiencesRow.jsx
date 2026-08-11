import { motion } from 'framer-motion';

const EXPERIENCES = [
  { title: 'The Latin Halloween Fest', href: '/halloween', bg: '#7F00FF', fg: '#FFE14D' },
  { title: 'Live Tribute Shows', href: '/experiences/live-tribute', bg: '#0A0A0A', fg: '#FFB43C' },
  { title: 'Casa de Baila Dembow', href: '/experiences/casita', bg: '#FF3B30', fg: '#FFE14D' },
];

export const ExperiencesRow = () => (
  <section id="experience" data-testid="experiences-row">
    <div className="py-16 text-center" style={{ background: '#0A0A0A' }}>
      <p className="text-white font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase">
        Our Signature Experiences
      </p>
    </div>
    {EXPERIENCES.map((exp, i) => (
      <motion.a
        key={exp.href}
        href={exp.href}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, delay: 0.1 * i }}
        className="group block py-14 md:py-20 px-5 text-center transition-opacity hover:opacity-90"
        style={{ background: exp.bg }}
        data-testid={`experience-band-${i}`}
      >
        <span className="font-display block text-[clamp(2.2rem,7vw,5.5rem)] leading-[0.95]" style={{ color: exp.fg }}>
          {exp.title}
        </span>
        <span className="inline-block mt-4 text-white font-extrabold tracking-[0.25em] uppercase text-sm group-hover:tracking-[0.4em] transition-all">
          Explore →
        </span>
      </motion.a>
    ))}
  </section>
);
