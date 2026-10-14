import { memo } from 'react';

// Fixed, purely decorative backdrop for the quiz: a paper-cut castle on the horizon with smoke drifting from its
// towers and lit windows. Inline SVG + CSS only (no image downloads), animates with transform/opacity, is
// aria-hidden, and goes still under prefers-reduced-motion (see quiz.css).

export const QuizScene = memo(function QuizScene() {
  return (
    <div className="bdq-scene" aria-hidden="true">
      <div className="bdq-smoke bdq-smoke-a" />
      <div className="bdq-smoke bdq-smoke-b" />
      <div className="bdq-smoke bdq-smoke-c" />
      <svg className="bdq-castle" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="bdqGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b0b0b" /><stop offset="1" stopColor="#000" /></linearGradient>
        </defs>
        {/* distant hills */}
        <path d="M0 330 C180 300 300 320 420 290 C560 255 640 300 760 285 C900 266 980 300 1120 280 C1250 262 1330 300 1440 285 V420 H0 Z" fill="#0a0a0a" />
        {/* castle silhouette */}
        <g fill="#000">
          <rect x="430" y="170" width="46" height="170" />
          <path d="M430 170 h46 l-23 -58 z" />
          <path d="M416 210 h12 v-18 h12 v18 h12 v-18 h12 v18 h12 v-18 h12 v26 h-72 z" />
          <rect x="520" y="200" width="400" height="140" />
          <path d="M520 200 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h18 v22 h18 v-22 h10 v40 h-400 z" />
          <rect x="660" y="110" width="110" height="110" />
          <path d="M650 112 h12 v-20 h12 v20 h12 v-20 h12 v20 h12 v-20 h12 v20 h12 v-20 h12 v20 h12 v-20 h12 v20 h12 v30 h-130 z" />
          <rect x="702" y="40" width="28" height="80" />
          <path d="M702 40 h28 l-14 -34 z" />
          <rect x="955" y="150" width="56" height="190" />
          <path d="M955 150 h56 l-28 -70 z" />
          <path d="M940 196 h14 v-18 h14 v18 h14 v-18 h14 v18 h14 v-18 h14 v18 h14 v26 h-84 z" />
          <path d="M490 342 H960 V330 c-40 0 -60 -14 -120 -14 s-80 14 -120 14 s-70 -14 -115 -14 S540 330 490 330 z" />
        </g>
        {/* lit windows (slow flicker) */}
        <g className="bdq-windows" fill="#FF6B00">
          <rect x="448" y="235" width="8" height="14" rx="4" />
          <rect x="600" y="250" width="8" height="14" rx="4" />
          <rect x="700" y="150" width="8" height="14" rx="4" />
          <rect x="730" y="150" width="8" height="14" rx="4" />
          <rect x="840" y="250" width="8" height="14" rx="4" />
          <rect x="978" y="220" width="8" height="14" rx="4" />
        </g>
        <rect x="0" y="340" width="1440" height="80" fill="url(#bdqGround)" />
      </svg>
      <div className="bdq-vignette" />
    </div>
  );
});

export default QuizScene;
