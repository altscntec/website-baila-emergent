import { useEffect, useRef, useState } from 'react';

// Supplied track goes in REACT_APP_QUIZ_MUSIC_URL (a file under /public or a CDN URL you have the rights to use).
// No track is bundled, none is downloaded, and nothing is invented here. With no URL set the control renders
// nothing at all. Playback only ever starts from a tap on the Play button, and the page works fully without it.
export const MUSIC_SRC = process.env.REACT_APP_QUIZ_MUSIC_URL || '';
const MUTE_KEY = 'bdq_music_muted';

export const MusicControl = ({ t }) => {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);
  if (!MUSIC_SRC) return null;

  const ensure = () => {
    if (!audioRef.current) {
      const a = new Audio(MUSIC_SRC);
      a.loop = true; a.preload = 'none'; a.volume = 0.5;
      try { a.muted = localStorage.getItem(MUTE_KEY) === '1'; setMuted(a.muted); } catch (_) { /* storage blocked */ }
      audioRef.current = a;
    }
    return audioRef.current;
  };

  const start = async () => {
    const a = ensure();
    try { await a.play(); setPlaying(true); } catch (_) { setPlaying(false); }   // blocked or failed: stay silent, never an error
  };
  const toggleMute = () => {
    const a = ensure();
    a.muted = !a.muted; setMuted(a.muted);
    try { localStorage.setItem(MUTE_KEY, a.muted ? '1' : '0'); } catch (_) { /* ignore */ }
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label={t('music.label')}>
      {!playing ? (
        <button type="button" onClick={start} className="bdq-chip" data-testid="quiz-music-play">{t('music.play')}</button>
      ) : (
        <button type="button" onClick={toggleMute} aria-pressed={muted} className="bdq-chip" data-testid="quiz-music-mute">
          {muted ? t('music.unmute') : t('music.mute')}
        </button>
      )}
    </div>
  );
};
