import { memo, useEffect, useRef, useState } from 'react';

// "El Conejo": Baila Dembow's rabbit (the brand mascot, see the site header) as the Halloween 2027 character.
// Original inline SVG: a flat black cut-out like the poster type, acid-green eyes that blink and follow the pointer,
// one ear that twitches, two fangs, and a drip that grows in on load ("bigger & bloodier"). Transform/opacity
// animations only; everything stops under prefers-reduced-motion. Decorative: aria-hidden, the heading carries meaning.

export const ConejoMark = memo(function ConejoMark({ className = '', follow = true }) {
  const ref = useRef(null);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduce(mq.matches);
    const on = (e) => setReduce(e.matches);
    mq.addEventListener ? mq.addEventListener('change', on) : mq.addListener(on);
    return () => { mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on); };
  }, []);

  useEffect(() => {
    if (!follow || reduce || !window.matchMedia('(pointer: fine)').matches) return undefined;
    let raf = 0;
    const onMove = (e) => {
      if (!ref.current) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = ref.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const dy = (e.clientY - (r.top + r.height * 0.55)) / window.innerHeight;
        setLook({ x: Math.max(-1, Math.min(1, dx * 2.2)) * 5, y: Math.max(-1, Math.min(1, dy * 2.2)) * 4 });
      });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf); };
  }, [follow, reduce]);

  const pupil = { transform: `translate(${look.x}px, ${look.y}px)` };
  return (
    <svg ref={ref} className={`conejo ${className}`} viewBox="0 0 240 260" aria-hidden="true" focusable="false">
      <defs>
        <filter id="conejoGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      {/* ears */}
      <g className="conejo-ear conejo-ear-l" style={{ transformOrigin: '84px 120px' }}>
        <path d="M66 128 C52 86 56 40 78 18 C98 0 118 30 112 70 C108 98 100 122 96 134 Z" fill="#000" />
        <path d="M78 118 C70 88 72 54 84 36 C94 24 104 42 100 70 C97 92 92 110 90 120 Z" fill="#db5089" />
      </g>
      <g className="conejo-ear conejo-ear-r" style={{ transformOrigin: '156px 120px' }}>
        <path d="M174 128 C188 86 184 40 162 18 C142 0 122 30 128 70 C132 98 140 122 144 134 Z" fill="#000" />
        <path d="M162 118 C170 88 168 54 156 36 C146 24 136 42 140 70 C143 92 148 110 150 120 Z" fill="#db5089" />
      </g>
      {/* head */}
      <path d="M120 112 C70 112 44 142 44 182 C44 220 76 244 120 244 C164 244 196 220 196 182 C196 142 170 112 120 112 Z" fill="#000" />
      {/* eyes: glow, white of the eye in green, pupil follows the pointer, lids blink */}
      <g className="conejo-eyes">
        <circle cx="94" cy="178" r="16" fill="#97e52f" filter="url(#conejoGlow)" opacity=".7" />
        <circle cx="146" cy="178" r="16" fill="#97e52f" filter="url(#conejoGlow)" opacity=".7" />
        <circle cx="94" cy="178" r="13" fill="#97e52f" />
        <circle cx="146" cy="178" r="13" fill="#97e52f" />
        <g style={pupil}><circle cx="94" cy="178" r="6" fill="#000" /><circle cx="146" cy="178" r="6" fill="#000" /></g>
        <g className="conejo-lids" style={{ transformOrigin: '120px 178px' }}>
          <rect x="76" y="160" width="36" height="36" fill="#000" /><rect x="128" y="160" width="36" height="36" fill="#000" />
        </g>
      </g>
      {/* nose + mouth + fangs */}
      <path d="M112 200 L128 200 L120 210 Z" fill="#db5089" />
      <path d="M104 214 C112 222 128 222 136 214" stroke="#db5089" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M108 216 L113 232 L118 216 Z" fill="#fff" /><path d="M122 216 L127 232 L132 216 Z" fill="#fff" />
      {/* drip */}
      <g className="conejo-drip" style={{ transformOrigin: '120px 244px' }}>
        <path d="M96 240 C96 252 102 258 108 258 C114 258 118 252 118 244 L118 238 Z" fill="#000" />
        <path d="M128 240 L128 250 C128 256 134 260 140 260 C146 260 150 254 150 246 L150 238 Z" fill="#000" />
      </g>
    </svg>
  );
});

export default ConejoMark;
