import { memo, useEffect, useRef, useState } from 'react';

// Fixed, purely decorative backdrop for the quiz: the Halloween video (muted, looping, no audio track) under a
// dark shade so the white/red UI stays readable. Under prefers-reduced-motion, or when autoplay is refused
// (low-power mode, data saver), only the still poster frame is shown. aria-hidden: nothing here is content.

const POSTER = '/images/halloween-quiz-bg.jpg';

export const QuizScene = memo(function QuizScene() {
  const [still, setStill] = useState(() => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ref = useRef(null);

  useEffect(() => {
    if (still || !ref.current) return undefined;
    const v = ref.current;
    const p = v.play();
    if (p && p.catch) p.catch(() => setStill(true));     // autoplay refused: fall back to the poster
    return () => { try { v.pause(); } catch (_) {} };
  }, [still]);

  return (
    <div className="bdq-scene" aria-hidden="true">
      {still ? (
        <img className="bdq-video" src={POSTER} alt="" width="720" height="1280" decoding="async" />
      ) : (
        <video ref={ref} className="bdq-video" muted loop playsInline autoPlay preload="auto" poster={POSTER} disablePictureInPicture disableRemotePlayback width="720" height="1280">
          <source src="/videos/halloween-quiz-bg.webm" type="video/webm" />
          <source src="/videos/halloween-quiz-bg.mp4" type="video/mp4" />
        </video>
      )}
      <div className="bdq-shade" />
      <div className="bdq-vignette" />
    </div>
  );
});

export default QuizScene;
