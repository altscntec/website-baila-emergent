import { useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Ghost, Sparkles, Music, Ticket } from 'lucide-react';
import { CommunitySection } from '../sections/CommunitySection';
import { CountdownTimer } from '../common/CountdownTimer';
import { trackTicketClick } from '../../utils/tracking';

const TICKET_URL = 'https://weeztix.shop/nxaqrkdz';
const EVENT_NAME = 'Latin Halloween Festival 2026';
const EVENT_DATE = '2026-10-31';
const EVENT_TIME = '23:00 – 05:00';
const TEASER_VIDEO = '/videos/halloween-teaser.mp4';
const POSTER_IMG = '/images/events/halloween-ijland-oct31-2026.png';

const PERKS = [
  'Cash prize for best costume',
  'Full haunted club transformation',
  'Free trick-and-treat sweets',
  'Spooky photobooth',
  '2 areas',
  'Food trucks on site',
];

// Curated from the Halloween 2025 shoot (no-logo originals, web-optimised)
const HERO_IMG = '/images/halloween/hw-crowd-hero.jpg';   // the packed room
const CROWD_WIDE = '/images/halloween/hw-crowd-1.jpg';
const CROWD_BAND = '/images/halloween/hw-crowd-2.jpg';
const VENUE_IMG = '/images/halloween/hw-hero.jpg';
const COSTUMES = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/images/halloween/hw-costume-${n}.jpg`);
const DANCEFLOOR = [1, 7, 2, 8, 3, 9, 4, 10, 5, 6].map((n) => `/images/halloween/hw-dance-${n}.jpg`);
const DECOR = {
  room: '/images/halloween/hw-decor-2.jpg',   // the haunted room, chandeliers + neon
  props: '/images/halloween/hw-decor-4.jpg',  // the doll on the swing
  wide: ['/images/halloween/hw-decor-3.jpg', '/images/halloween/hw-decor-1.jpg', VENUE_IMG],
};

const STATS = [
  { value: '4', label: 'Years running' },
  { value: '1500+', label: 'Capacity' },
  { value: '100%', label: 'Sold out, every time' },
  { value: '2×', label: 'Bigger in 2026' },
];

// Reusable animated block
const Reveal = ({ children, delay = 0, className = '', ...rest }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay }}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

const SectionHeading = ({ kicker, title, accent, children }) => (
  <Reveal className="max-w-3xl">
    <p className="font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-4" style={{ color: accent }}>
      {kicker}
    </p>
    <h2 className="font-display text-white text-[clamp(2.6rem,7vw,5.5rem)] leading-[0.92] mb-6">{title}</h2>
    {children && <p className="text-gray-400 text-base md:text-lg leading-relaxed">{children}</p>}
  </Reveal>
);

export const HalloweenPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ background: '#08060B' }} data-testid="halloween-page">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" data-testid="halloween-hero">
        <img
          src={HERO_IMG}
          alt="The Latin Halloween Festival by Baila Dembow"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'saturate(1.15)' }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(8,6,11,.75) 0%, rgba(8,6,11,.35) 35%, rgba(8,6,11,.85) 75%, #08060B 100%)' }}
        />
        {/* eerie glows */}
        <div className="absolute top-1/4 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(150,0,200,.45) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 -right-32 w-[520px] h-[520px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,107,0,.35) 0%, transparent 70%)' }} />

        <div className="container-custom relative z-10 text-center pt-32 pb-20">
          <motion.img
            src="/images/halloween/mrbadbunny.png"
            alt="Mr Bad Bunny"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0, rotate: [0, -6, 0, 6, 0] }}
            transition={{ opacity: { duration: 0.6 }, y: { duration: 0.6 }, rotate: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
            className="h-24 md:h-32 w-auto mx-auto mb-6 drop-shadow-[0_0_40px_rgba(255,107,0,.5)]"
          />
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
            className="font-extrabold text-xs md:text-sm tracking-[0.4em] uppercase mb-5 text-[#FF6B00]"
          >
            Sat 31 October 2026 · IJLAND Amsterdam · 23:00–05:00
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
            className="font-display text-[clamp(3.2rem,12vw,10rem)] leading-[0.85] mb-6"
            style={{ color: '#FF6B00', textShadow: '0 0 60px rgba(255,107,0,.45)' }}
            data-testid="halloween-title"
          >
            The Latin<br />Halloween.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/85 text-base md:text-xl font-semibold max-w-2xl mx-auto mb-10"
          >
            The nightmare wakes up all over again. Vampires, ghouls and restless spirits take over
            every dark corner while our DJs run reggaeton, dembow and Caribbean heat till sunrise.
          </motion.p>

          {/* Countdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-10"
          >
            <p className="text-white font-extrabold text-xs tracking-[0.3em] uppercase mb-4">The gates open in</p>
            <CountdownTimer targetDate={EVENT_DATE} targetTime={EVENT_TIME} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <a
              href={TICKET_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackTicketClick(`${EVENT_NAME} — Hero CTA`, TICKET_URL)}
              className="inline-flex items-center gap-3 bg-[#FF6B00] text-black font-extrabold py-5 px-12 rounded-full text-lg hover:bg-white transition-colors duration-300 shadow-[0_10px_50px_rgba(255,107,0,.45)]"
              data-testid="halloween-hero-cta"
            >
              <Ticket size={22} />
              GET TICKETS
            </a>
          </motion.div>
          <p className="text-white/50 text-sm mt-4">Early birds pay the least. It sells out — every time.</p>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────── */}
      <section className="py-14 border-y border-white/10" style={{ background: '#0C0910' }}>
        <div className="container-custom grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.08}>
              <p className="font-display text-[#FF6B00] text-[clamp(2.2rem,5vw,3.5rem)] leading-none mb-2">{s.value}</p>
              <p className="text-gray-400 text-xs md:text-sm uppercase tracking-wider font-semibold">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── TEASER + POSTER ──────────────────────────────── */}
      <section className="py-20 md:py-28" style={{ background: '#08060B' }} data-testid="halloween-teaser">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
            {/* teaser video */}
            <Reveal>
              <div
                className="relative rounded-2xl overflow-hidden mx-auto w-full max-w-[420px]"
                style={{ aspectRatio: '9/16', boxShadow: '0 25px 70px rgba(255,107,0,.18), 0 0 0 1px rgba(255,255,255,.07)' }}
                data-testid="halloween-teaser-video"
              >
                <video
                  src={TEASER_VIDEO}
                  poster={POSTER_IMG}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              </div>
            </Reveal>

            {/* poster + perks */}
            <Reveal delay={0.15} className="text-center lg:text-left">
              <p className="font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-4 text-[#FF6B00]">
                Most awaited event
              </p>
              <h2 className="font-display text-white text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] mb-6">
                What to expect.
              </h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mb-8 text-left">
                {PERKS.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-gray-300 text-sm md:text-base">
                    <Ghost size={17} className="text-[#FF6B00] shrink-0 mt-0.5" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <a
                href={TICKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackTicketClick(`${EVENT_NAME} — Teaser CTA`, TICKET_URL)}
                className="inline-flex items-center gap-3 bg-[#FF6B00] text-black font-extrabold py-4 px-10 rounded-full text-lg hover:bg-white transition-colors duration-300"
                data-testid="halloween-teaser-cta"
              >
                <Ticket size={20} />
                GET TICKETS
              </a>
              <p className="text-gray-500 text-sm mt-4">
                Early Death is the lowest price of the whole event — every tier climbs from there.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── PACKED ROOM BAND ─────────────────────────────── */}
      <section className="relative h-[55vh] md:h-[70vh] overflow-hidden" data-testid="halloween-room-band">
        <img src={CROWD_WIDE} alt="A packed room at the Latin Halloween Festival" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #08060B 0%, rgba(8,6,11,.25) 30%, rgba(8,6,11,.55) 70%, #08060B 100%)' }} />
        <div className="relative z-10 h-full flex items-end justify-center pb-14 md:pb-20 px-5">
          <Reveal className="text-center max-w-3xl">
            <p className="font-display text-white text-[clamp(1.8rem,5vw,3.6rem)] leading-[1.05] drop-shadow-[0_4px_24px_rgba(0,0,0,.8)]">
              1500 people. One room.<br />
              <span className="text-[#FF6B00]">Wall to wall, every year.</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── COSTUMES ─────────────────────────────────────── */}
      <section className="py-24 md:py-32" data-testid="halloween-costumes">
        <div className="container-custom">
          <SectionHeading kicker="Chapter I" title={<>The costumes.</>} accent="#FF6B00">
            This isn't a last-minute cat-ears situation. Amsterdam genuinely dresses up for this one —
            full builds, months of planning, and a crowd that treats the door like a runway. Every year
            the bar moves, and every year somebody clears it.
          </SectionHeading>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-14">
            {COSTUMES.map((src, i) => (
              <Reveal key={src} delay={0.05 * i}>
                <div
                  className="relative rounded-xl overflow-hidden group aspect-[3/4]"
                  style={{ boxShadow: '0 8px 30px rgba(0,0,0,.6)' }}
                  data-testid={`costume-${i + 1}`}
                >
                  <img
                    src={src}
                    alt={`Halloween costume at Baila Dembow — ${i + 1}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(to top, rgba(255,107,0,.35), transparent 60%)' }} />
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ── DECOR ────────────────────────────────────────── */}
      <section className="py-24 md:py-32 relative overflow-hidden" style={{ background: '#0C0910' }} data-testid="halloween-decor">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(150,0,200,.6) 0%, transparent 70%)' }} />
        <div className="container-custom relative z-10">
          <SectionHeading kicker="Chapter II" title={<>The set.</>} accent="#B565FF">
            We build a different world in the venue every year. A haunted castle inside the room.
            Dining tables placed on the stage, wine served to a chosen few while the dancefloor raged
            around them. Chandeliers, pyro, and a DJ booth swallowed by the decor.
          </SectionHeading>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 md:gap-4 mt-14">
            <Reveal className="md:col-span-4">
              <div className="relative rounded-2xl overflow-hidden aspect-[16/10] group" data-testid="decor-main">
                <img src={DECOR.room} alt="The haunted room — chandeliers and neon" loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/85 to-transparent">
                  <p className="font-display text-white text-2xl md:text-3xl">The haunted room</p>
                  <p className="text-gray-300 text-sm">Chandeliers, castle walls, and the neon sign above it all</p>
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1} className="md:col-span-2">
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] md:aspect-auto md:h-full group" data-testid="decor-props">
                <img src={DECOR.props} alt="Haunted doll prop hanging on a swing" loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/85 to-transparent">
                  <p className="font-display text-white text-xl">The props</p>
                  <p className="text-gray-300 text-sm">Down to the doll on the swing</p>
                </div>
              </div>
            </Reveal>
            {DECOR.wide.map((src, i) => (
              <Reveal key={src} delay={0.15 + i * 0.08} className="md:col-span-2">
                <div className="relative rounded-2xl overflow-hidden aspect-[16/10] group" data-testid={`decor-wide-${i + 1}`}>
                  <img src={src} alt="Venue decor and lighting" loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── DANCEFLOOR ───────────────────────────────────── */}
      <section className="py-24 md:py-32" data-testid="halloween-dancefloor">
        <div className="container-custom">
          <SectionHeading kicker="Chapter III" title={<>The dancefloor.</>} accent="#FF0080">
            Once the lights drop it stops being a costume party and becomes a Baila Dembow night.
            Reggaeton, dembow and Latin hits until close, 1500+ people who all decided to go all in
            on the same night.
          </SectionHeading>

          {/* wide crowd lead-in */}
          <Reveal delay={0.1} className="mt-14">
            <div className="relative rounded-2xl overflow-hidden aspect-[21/9] group" data-testid="dance-wide">
              <img src={CROWD_BAND} alt="The full room dancing at the Latin Halloween" loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(8,6,11,.75), transparent 55%)' }} />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <p className="font-display text-white text-2xl md:text-4xl">Sold out. Every single year.</p>
              </div>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mt-4">
            {DANCEFLOOR.map((src, i) => (
              <Reveal key={src} delay={0.08 * i}>
                <div className="relative rounded-xl overflow-hidden group aspect-[4/5]"
                  style={{ boxShadow: '0 8px 30px rgba(0,0,0,.6)' }} data-testid={`dance-${i + 1}`}>
                  <img src={src} alt={`Dancing at the Latin Halloween — ${i + 1}`} loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: 'linear-gradient(to top, rgba(255,0,128,.35), transparent 60%)' }} />
                </div>
              </Reveal>
            ))}
          </div>

          {/* Recap videos */}
          <Reveal delay={0.2} className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {['/videos/halloween-1.mp4', '/videos/halloween-2.mp4'].map((src, i) => (
                <div key={src} className="relative rounded-2xl overflow-hidden"
                  style={{ aspectRatio: '4/5', boxShadow: '0 20px 60px rgba(150,0,200,.2), 0 0 0 1px rgba(255,255,255,.06)' }}
                  data-testid={`halloween-video-${i}`}>
                  <video src={src} autoPlay muted loop playsInline preload="metadata" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,.45) 0%, transparent 40%)' }} />
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.2} className="mt-10 flex flex-wrap gap-3">
            {[
              { icon: Music, t: 'Reggaeton · Dembow · Latin hits' },
              { icon: Sparkles, t: 'CO₂ blasts & confetti' },
              { icon: Ghost, t: 'Doors till late' },
            ].map(({ icon: Icon, t }) => (
              <span key={t} className="inline-flex items-center gap-2 text-sm font-bold text-white bg-white/[0.07] border border-white/10 rounded-full px-5 py-2.5">
                <Icon size={15} className="text-[#FF0080]" /> {t}
              </span>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ── 2026 CTA ─────────────────────────────────────── */}
      <section className="relative py-24 md:py-32 overflow-hidden" data-testid="halloween-cta">
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #FF6B00 0%, #B10E5C 55%, #7F00FF 100%)' }} />
        <div className="absolute inset-0 opacity-25"
          style={{ background: `url(${DECOR.room}) center/cover`, mixBlendMode: 'overlay' }} />
        <div className="container-custom relative z-10 text-center">
          <Reveal>
            <p className="font-extrabold text-xs md:text-sm tracking-[0.35em] uppercase mb-5 text-black/70">
              Halloween 2026
            </p>
            <h2 className="font-display text-white text-[clamp(2.8rem,9vw,7rem)] leading-[0.9] mb-6 drop-shadow-[0_4px_30px_rgba(0,0,0,.35)]">
              2× bigger.
            </h2>
            <p className="text-white/90 font-semibold text-base md:text-xl max-w-2xl mx-auto mb-10">
              This year's edition is our biggest yet. Tickets start low and climb as the date gets
              closer, and the cheap tiers never survive the week. Lock yours in now.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={TICKET_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackTicketClick(`${EVENT_NAME} — Bottom CTA`, TICKET_URL)}
                className="inline-flex items-center gap-3 bg-black text-white font-extrabold py-5 px-12 rounded-full text-lg hover:bg-white hover:text-black transition-colors duration-300 shadow-[0_12px_40px_rgba(0,0,0,.4)]"
                data-testid="halloween-cta-tickets"
              >
                <Ticket size={22} />
                GET TICKETS
              </a>
            </div>
            <p className="text-white/70 text-sm mt-6">18+ · ID required · Amsterdam</p>
          </Reveal>
        </div>
      </section>

      <CommunitySection />
    </div>
  );
};
