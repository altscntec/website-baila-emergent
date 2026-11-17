import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './moments.css';
import { deletePhoto, listMoments, prettyDate, readKey, verifyOwner, writeKey } from './api';
import { IG_HANDLE, renderInstagram } from './instagram';

// Moments: the unlisted photo library at /moments (link only, noindex). Built to feel like the iPhone Photos app:
//   - one section per night, newest first, with a sticky date + venue header
//   - square grid; pinch in/out (two fingers, or trackpad pinch / ctrl+wheel) steps through the zoom levels,
//     the grid re-lays out with a continuous zoom and keeps the photo under your fingers in place
//   - Months (one cover card per night) · Days (3 across) · All (dense), also on the bottom pill like iOS
//   - tap a photo: it grows out of its thumbnail into the full-screen viewer; swipe between photos, pinch and
//     double-tap to zoom, scrub the filmstrip, pull down to dismiss (it shrinks back into the grid),
//     share the link or an Instagram story/post version (view-only: no save/download), back gesture / Escape
//   - owner mode (Hari only): /moments?owner asks for the owner key once per tab; then Select → tap photos → Delete,
//     or Delete inside the viewer. Public visitors never see any of it.
// Performance: every gesture writes transforms straight to the DOM (refs), React only re-renders on real state
// changes (photo index, level, selection), and the 200+ item filmstrip is memoised. Photos come from
// /api/moments/list (Vercel Blob behind it); the page itself holds no photos.

const LOGO = '/images/branding/baila-logo-white.png';
const LEVELS = ['months', 'days', 'all'];
const COLS = { days: [3, 5, 6], all: [5, 8, 10], months: [1, 2, 3] };
const bp = (w) => (w >= 1200 ? 2 : w >= 768 ? 1 : 0);
const EASE = 'cubic-bezier(.22,.9,.3,1)';
const reduced = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fitBox = (ar) => { const W = window.innerWidth; const H = window.innerHeight; let w = W; let h = w / ar; if (h > H) { h = H; w = h * ar; } return { left: (W - w) / 2, top: (H - h) / 2, width: w, height: h }; };
const setBox = (el, b) => { el.style.left = `${b.left}px`; el.style.top = `${b.top}px`; el.style.width = `${b.width}px`; el.style.height = `${b.height}px`; };
const BOX_T = (ms) => ['left', 'top', 'width', 'height'].map((p) => `${p} ${ms}ms ${EASE}`).join(',');
// Load an image (usually already cached by the strip's warm-up) and report its aspect ratio, or null after `ms`.
const loadRatio = (src, ms) => new Promise((res) => { const im = new Image(); let done = false; const t = setTimeout(() => { if (!done) { done = true; res(null); } }, ms); im.onload = () => { if (!done) { done = true; clearTimeout(t); res(im.naturalWidth / im.naturalHeight); } }; im.onerror = () => { if (!done) { done = true; clearTimeout(t); res(null); } }; im.src = src; });
const esc = (s) => (window.CSS && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'));

const Icon = ({ d }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>);
const I = {
  back: 'M15 18l-6-6 6-6',
  share: 'M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5',
  ig: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zM12 8.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM17.5 6.5h.01',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 6l6 6-6 6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5L20 7',
  lock: 'M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z',
};

const Thumb = memo(({ id, src, alt, onTap, selecting, selected }) => {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" data-id={id} className={`mo-ph${selecting ? ' pick' : ''}${selected ? ' sel' : ''}`} onClick={(e) => onTap(id, e.currentTarget)} aria-label={alt} aria-pressed={selecting ? selected : undefined}>
      <img src={src} alt="" loading="lazy" decoding="async" className={ok ? 'in' : ''} onLoad={() => setOk(true)} />
      {selecting && <span className="ck"><Icon d={I.check} /></span>}
    </button>
  );
});

// Filmstrip: memoised (hundreds of thumbs), scrub with a finger like iOS, tap to jump.
const Film = memo(({ flat, at, jump }) => {
  const ref = useRef(null);
  const scrubbing = useRef(false);
  useEffect(() => { const el = ref.current && ref.current.children[at]; if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: scrubbing.current ? 'auto' : 'smooth' }); }, [at]);
  const scrub = (e) => { scrubbing.current = true; const t = e.touches[0]; const el = document.elementFromPoint(t.clientX, t.clientY); const b = el && el.closest('[data-i]'); if (b) { const i = Number(b.dataset.i); if (i !== at) jump(i); } };
  return (
    <div className="mo-film" ref={ref} onTouchMove={scrub} onTouchEnd={() => { scrubbing.current = false; }}>
      {flat.map((p, i) => (<button type="button" key={p.id} data-i={i} className={i === at ? 'on' : ''} onClick={() => jump(i)} aria-label={`Photo ${i + 1}`}><img src={p.thumb} alt="" loading="lazy" decoding="async" /></button>))}
    </div>
  );
});

// Full-screen viewer. `flat` is every photo of every night in page order; `at` is the index into it.
// `fromRect` (optional) is the tapped thumbnail's rect: the photo grows out of it, and shrinks back on dismiss.
const Viewer = ({ flat, at, setAt, onClose, onDelete, fromRect }) => {
  const [chrome, setChrome] = useState(true);
  const [ready, setReady] = useState(!fromRect || reduced());
  const [ig, setIg] = useState(null); // null | 'pick' | 'busy'
  const [toast, setToast] = useState('');
  const root = useRef(null); const stripRef = useRef(null); const flyRef = useRef(null); const imgRef = useRef(null); const stageRef = useRef(null);
  const g = useRef({}); // the gesture in progress
  const z = useRef({ s: 1, x: 0, y: 0 }); // zoom of the current photo
  const anim = useRef(false); // strip is sliding
  const igCache = useRef({});
  const cur = flat[at];
  const n = flat.length;
  const slides = [at - 1, at, at + 1].filter((i) => flat[i]);
  const base = -(at - slides[0]) * 100;

  const dim = (v, animate) => { const el = root.current; if (!el) return; el.style.transition = animate ? 'background-color .3s ease' : 'none'; el.style.backgroundColor = `rgba(0,0,0,${v})`; };
  const applyZoom = (animate) => { const im = imgRef.current; if (!im) return; im.style.transition = animate ? `transform .28s ${EASE}` : 'none'; im.style.transform = `translate(${z.current.x}px, ${z.current.y}px) scale(${z.current.s})`; };
  const setStrip = (dx, animate, ms) => { const el = stripRef.current; if (!el) return; el.style.transition = animate ? `transform ${ms || 320}ms ${EASE}` : 'none'; el.style.transform = `translate3d(calc(${base}% + ${dx}px), 0, 0)`; };
  const clampPan = (animate) => {
    const im = imgRef.current; const st = stageRef.current; if (!im || !st) return;
    const s = z.current.s; const w = im.offsetWidth * s; const h = im.offsetHeight * s;
    const mx = Math.max(0, (w - st.clientWidth) / 2); const my = Math.max(0, (h - st.clientHeight) / 2);
    z.current.x = clamp(z.current.x, -mx, mx); z.current.y = clamp(z.current.y, -my, my); applyZoom(animate);
  };

  // New photo: reset zoom and the strip, no animation (the slide already happened).
  useLayoutEffect(() => { z.current = { s: 1, x: 0, y: 0 }; applyZoom(false); setStrip(0, false); anim.current = false; }, [at]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { [at - 1, at + 1].forEach((i) => { if (flat[i]) { const im = new Image(); im.src = flat[i].web; } }); }, [at, flat]);
  useEffect(() => { const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prevOv; }; }, []);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 4500); return () => clearTimeout(t); }, [toast]);

  // Grow out of the thumbnail.
  useLayoutEffect(() => {
    if (!fromRect || reduced()) return undefined;
    const fly = flyRef.current; let alive = true;
    fly.src = cur.thumb; fly.style.display = 'block'; fly.style.opacity = '1'; fly.style.transition = 'none'; setBox(fly, fromRect); dim(0, false);
    (async () => {
      const ar = await loadRatio(cur.web, 240);
      if (!alive) return;
      if (ar) fly.src = cur.web; // same framing as the fitted photo, so the hand-over is invisible
      fly.getBoundingClientRect();
      fly.style.transition = BOX_T(360); setBox(fly, fitBox(ar || 1)); dim(1, true);
      setTimeout(() => { if (!alive) return; setReady(true); fly.style.transition = 'opacity .18s ease'; fly.style.opacity = '0'; setTimeout(() => { if (alive) fly.style.display = 'none'; }, 200); }, 370);
    })();
    return () => { alive = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Shrink back into the grid (or fade if the thumbnail is off screen), then close.
  const dismiss = useCallback(() => {
    if (reduced() || !flyRef.current || !imgRef.current) { onClose(); return; }
    const fly = flyRef.current; const from = imgRef.current.getBoundingClientRect();
    const th = document.querySelector(`.mo-ph[data-id="${esc(cur.id)}"]`);
    let to = th ? th.getBoundingClientRect() : null;
    if (to && (to.bottom < 60 || to.top > window.innerHeight - 20)) to = null;
    fly.src = cur.web; fly.style.transition = 'none'; fly.style.display = 'block'; fly.style.opacity = '1'; setBox(fly, from);
    if (stripRef.current) stripRef.current.style.opacity = '0';
    root.current.classList.add('pulling');
    fly.getBoundingClientRect();
    fly.style.transition = `${BOX_T(300)},opacity 300ms ease`;
    if (to) setBox(fly, to); else { setBox(fly, { left: from.left + from.width * .1, top: from.top + from.height * .15, width: from.width * .8, height: from.height * .8 }); fly.style.opacity = '0'; }
    dim(0, true);
    setTimeout(onClose, 300);
  }, [cur, onClose]);

  // Slide to a neighbour with a real transition, then commit the index.
  const slide = useCallback((dir) => {
    const ni = at + dir;
    if (ni < 0 || ni >= n || anim.current) { setStrip(0, true, 260); return; }
    anim.current = true; setStrip(-dir * window.innerWidth, true, 300);
    setTimeout(() => { anim.current = false; setAt(ni); }, 300);
  }, [at, n, setAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const jump = useCallback((i) => { if (i !== at && !anim.current) setAt(i); }, [at, setAt]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dismiss(); else if (e.key === 'ArrowLeft') slide(-1); else if (e.key === 'ArrowRight') slide(1); else if (onDelete && (e.key === 'Delete' || e.key === 'Backspace')) onDelete(cur.id); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [dismiss, slide, onDelete, cur.id]);

  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onStart = (e) => {
    const ts = e.touches; const c = g.current;
    if (ts.length === 2) {
      const r = stageRef.current.getBoundingClientRect();
      Object.assign(c, { mode: 'pinch', d0: dist(ts[0], ts[1]), s0: z.current.s, x0: z.current.x, y0: z.current.y, cx: (ts[0].clientX + ts[1].clientX) / 2 - (r.left + r.width / 2), cy: (ts[0].clientY + ts[1].clientY) / 2 - (r.top + r.height / 2) });
      return;
    }
    const p = ts[0]; const now = Date.now();
    const dbl = !!(c.lastTap && now - c.lastTap < 280 && Math.abs(p.clientX - c.lx) < 24 && Math.abs(p.clientY - c.ly) < 24);
    Object.assign(c, { mode: null, dbl, sx: p.clientX, sy: p.clientY, px: z.current.x, py: z.current.y, dx: 0, dy: 0, vx: 0, vy: 0, lt: now, lastTap: now, lx: p.clientX, ly: p.clientY });
  };
  const onMove = (e) => {
    const ts = e.touches; const c = g.current;
    if (c.mode === 'pinch') {
      if (ts.length < 2) return;
      const s = clamp(c.s0 * (dist(ts[0], ts[1]) / c.d0), 1, 5); const k = s / c.s0;
      z.current = { s, x: c.cx - (c.cx - c.x0) * k, y: c.cy - (c.cy - c.y0) * k }; applyZoom(false); return;
    }
    if (ts.length !== 1 || anim.current || c.mode === 'none') return;
    const p = ts[0]; const dx = p.clientX - c.sx; const dy = p.clientY - c.sy; const now = Date.now(); const dt = Math.max(1, now - c.lt);
    c.vx = (dx - c.dx) / dt; c.vy = (dy - c.dy) / dt; c.dx = dx; c.dy = dy; c.lt = now;
    if (!c.mode) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (z.current.s > 1) c.mode = 'pan';
      else if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2) { c.mode = 'pull'; root.current.classList.add('pulling'); }
      else c.mode = Math.abs(dx) >= Math.abs(dy) ? 'swipe' : 'none';
    }
    if (c.mode === 'pan') { z.current.x = c.px + dx; z.current.y = c.py + dy; applyZoom(false); }
    else if (c.mode === 'swipe') { const edge = (dx > 0 && at === 0) || (dx < 0 && at === n - 1); setStrip(edge ? dx * 0.3 : dx, false); }
    else if (c.mode === 'pull') { const k = Math.max(0, dy); const im = imgRef.current; im.style.transition = 'none'; im.style.transform = `translate(${dx * 0.45}px, ${k}px) scale(${Math.max(.5, 1 - k / 800)})`; dim(Math.max(0, 1 - k / 420), false); }
  };
  const onEnd = (e) => {
    const c = g.current;
    if (c.mode === 'pinch') { if (e.touches.length === 0) { c.mode = null; if (z.current.s <= 1.05) { z.current = { s: 1, x: 0, y: 0 }; applyZoom(true); } else clampPan(true); } return; }
    if (e.touches.length) return;
    const mode = c.mode; c.mode = null;
    if (!mode) {
      if (c.dbl) {
        c.lastTap = 0;
        if (z.current.s > 1) z.current = { s: 1, x: 0, y: 0 };
        else { const r = stageRef.current.getBoundingClientRect(); const cx = c.sx - (r.left + r.width / 2); const cy = c.sy - (r.top + r.height / 2); z.current = { s: 2.5, x: cx * -1.5, y: cy * -1.5 }; }
        applyZoom(true); setTimeout(() => clampPan(true), 0);
      } else setChrome((v) => !v);
      return;
    }
    if (mode === 'pan') { clampPan(true); return; }
    if (mode === 'swipe') {
      const w = window.innerWidth; const fast = Math.abs(c.vx) > 0.45;
      if ((c.dx < -w * 0.22 || (fast && c.vx < 0)) && at < n - 1) slide(1);
      else if ((c.dx > w * 0.22 || (fast && c.vx > 0)) && at > 0) slide(-1);
      else setStrip(0, true, 260);
      return;
    }
    if (mode === 'pull') {
      if (c.dy > 110 || c.vy > 0.7) dismiss();
      else { const im = imgRef.current; im.style.transition = `transform .3s ${EASE}`; im.style.transform = ''; dim(1, true); root.current.classList.remove('pulling'); }
    }
  };
  useEffect(() => { const el = stageRef.current; if (!el) return undefined; const onWheel = (e) => { if (!e.ctrlKey) return; e.preventDefault(); z.current.s = clamp(z.current.s - e.deltaY * 0.01, 1, 5); if (z.current.s === 1) { z.current.x = 0; z.current.y = 0; } clampPan(false); }; el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Share the link to this photo (never the file: the album is view-only).
  const share = async () => {
    const url = `${window.location.origin}/moments#p=${cur.id}`;
    try { if (navigator.share) await navigator.share({ title: 'Baila Dembow', url }); else if (navigator.clipboard) { await navigator.clipboard.writeText(url); setToast('Link copied'); } } catch (_) { /* cancelled */ }
  };
  // Instagram: a branded story/post version with @handle baked in. Both sizes start rendering the moment the
  // picker opens, so the share call itself still sits inside the tap (iOS needs that).
  const d = prettyDate(cur.ev.date);
  const prepIg = (kind) => { const k = `${cur.id}:${kind}`; if (!igCache.current[k]) igCache.current[k] = renderInstagram({ src: cur.web, kind, logo: LOGO, line: `${cur.ev.city} · ${cur.ev.venue} · ${d.date} ${d.year}` }).catch(() => null); return igCache.current[k]; };
  const openIg = () => { setIg('pick'); prepIg('story'); prepIg('post'); };
  const shareIg = async (kind) => {
    setIg('busy');
    try {
      const blob = await prepIg(kind);
      if (!blob) throw new Error('render');
      const file = new File([blob], `baila-dembow-${kind}.jpg`, { type: 'image/jpeg' });
      try { await navigator.clipboard.writeText(`@${IG_HANDLE}`); } catch (_) { /* no clipboard: the tag is on the image anyway */ }
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Baila Dembow' }); setToast(`In Instagram, paste to mention @${IG_HANDLE}`); }
      else setToast('Open this on your phone to share to Instagram.');
    } catch (er) { if (!er || er.name !== 'AbortError') setToast('Could not prepare the image. Try again.'); }
    setIg(null);
  };

  return (
    <div className={`mo-view${chrome ? '' : ' chrome-off'}${ready ? '' : ' unready'}`} ref={root} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="mo-vtop">
        <button type="button" className="mo-back" onClick={dismiss} aria-label="Back"><Icon d={I.back} /></button>
        <div className="mo-ttl"><b>{d.day} {d.date} {d.year}</b><span>{cur.ev.city} · {cur.ev.venue}</span></div>
        <div className="mo-pos">{at + 1} / {n}</div>
      </div>
      <div className="mo-stage" ref={stageRef} onContextMenu={(e) => e.preventDefault()} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}>
        <div className="mo-strip" ref={stripRef} style={{ transform: `translate3d(${base}%, 0, 0)` }}>
          {slides.map((i) => (
            <div className="mo-slide" key={flat[i].id}>
              <img src={flat[i].web} alt="" draggable="false" ref={i === at ? imgRef : undefined} />
            </div>
          ))}
        </div>
      </div>
      <img className="mo-fly" ref={flyRef} alt="" aria-hidden="true" draggable="false" />
      {at > 0 && <button type="button" className="mo-nav l" onClick={() => slide(-1)} aria-label="Previous"><Icon d={I.left} /></button>}
      {at < n - 1 && <button type="button" className="mo-nav r" onClick={() => slide(1)} aria-label="Next"><Icon d={I.right} /></button>}
      <div className="mo-vbot">
        <Film flat={flat} at={at} jump={jump} />
        {ig && (
          <div className="mo-ig" role="group" aria-label="Share to Instagram">
            <span>{ig === 'busy' ? 'Preparing…' : 'Instagram'}</span>
            <button type="button" disabled={ig === 'busy'} onClick={() => shareIg('story')}>Story</button>
            <button type="button" disabled={ig === 'busy'} onClick={() => shareIg('post')}>Post</button>
            <button type="button" className="x" onClick={() => setIg(null)} aria-label="Close">✕</button>
          </div>
        )}
        <div className="mo-acts">
          <button type="button" onClick={share}><Icon d={I.share} />Share</button>
          <button type="button" onClick={openIg}><Icon d={I.ig} />Instagram</button>
          {onDelete && <button type="button" className="danger" onClick={() => onDelete(cur.id)}><Icon d={I.trash} />Delete</button>}
          <button type="button" onClick={dismiss}><Icon d={I.grid} />Grid</button>
        </div>
      </div>
      {toast && <div className="mo-toast" role="status">{toast}</div>}
    </div>
  );
};

export const MomentsPage = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [level, setLevel] = useState(() => { try { return LEVELS.includes(localStorage.getItem('bd_moments_zoom')) ? localStorage.getItem('bd_moments_zoom') : 'days'; } catch (_) { return 'days'; } });
  const [w, setW] = useState(() => window.innerWidth);
  const [hint, setHint] = useState(false);
  const [at, setAt] = useState(-1);
  const [fly, setFly] = useState(null);
  const zoomEl = useRef(null);
  const pinch = useRef(null);
  const wheelAcc = useRef(0);
  const trans = useRef(null); // pending level transition: { from, ox, oy, anchor, lv }
  const levelRef = useRef(level); levelRef.current = level;
  // Owner mode (delete). Key in sessionStorage; asked for via /moments?owner.
  const [key, setKey] = useState(readKey);
  const [ask, setAsk] = useState(() => !readKey() && /(^|[?&#])owner(=|&|$)/.test(window.location.search + window.location.hash));
  const [askMsg, setAskMsg] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const owner = !!key;
  const selectingRef = useRef(false); selectingRef.current = selecting;

  useEffect(() => { listMoments().then(setData).catch(() => setErr(true)); }, []);
  useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  useEffect(() => { try { localStorage.setItem('bd_moments_zoom', level); } catch (_) { /* private mode */ } }, [level]);

  const events = useMemo(() => (data && data.events) || [], [data]);
  const flat = useMemo(() => events.flatMap((ev) => ev.photos.map((p) => ({ ...p, ev }))), [events]);
  const total = flat.length;
  const indexById = useMemo(() => new Map(flat.map((p, i) => [p.id, i])), [flat]);
  const indexRef = useRef(indexById); indexRef.current = indexById;

  const unlock = async (e) => {
    e.preventDefault();
    const k = new FormData(e.target).get('key').trim();
    if (!k) return;
    setAskMsg('Checking…');
    try { await verifyOwner(k); writeKey(k); setKey(k); setAsk(false); setAskMsg(''); window.history.replaceState(null, '', window.location.pathname + window.location.hash.replace(/#?owner/, '')); }
    catch (er) { setAskMsg(er.status === 401 ? 'Owner key refused.' : er.status === 429 ? 'Too many tries. Wait 15 minutes.' : 'Could not check the key. Try again.'); }
  };
  const lock = () => { writeKey(''); setKey(''); setSelecting(false); setSel(new Set()); };
  const dropPhotos = (ids) => setData((d) => { const gone = new Set(ids); return { ...d, events: d.events.map((ev) => { const photos = ev.photos.filter((p) => !gone.has(p.id)); return { ...ev, photos, count: photos.length, cover: photos[0] ? photos[0].web : ev.cover }; }).filter((ev) => ev.photos.length) }; });
  const removePhotos = async (ids) => {
    if (!ids.length || busy) return [];
    if (!window.confirm(ids.length === 1 ? 'Delete this photo from Moments? This cannot be undone.' : `Delete ${ids.length} photos from Moments? This cannot be undone.`)) return [];
    setBusy(true);
    const done = [];
    try { for (const id of ids) { await deletePhoto(key, id); done.push(id); } }
    catch (er) { if (er.status === 401) { lock(); window.alert('Owner key refused. Open /moments?owner and enter it again.'); } else window.alert(`Delete failed after ${done.length} of ${ids.length}: ${er.message}`); }
    finally { setBusy(false); }
    if (done.length) { dropPhotos(done); setSel(new Set()); }
    return done;
  };
  const toggleSel = (id) => setSel((cur) => { const s = new Set(cur); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const startSelect = () => { setSelecting(true); setSel(new Set()); if (level === 'months') goLevel('days'); };
  const stopSelect = () => { setSelecting(false); setSel(new Set()); };

  // Deep link (#p=<folder>/<nnnn>) and the back gesture: the viewer is a history entry.
  useEffect(() => {
    if (!flat.length) return undefined;
    const fromHash = () => { const m = /p=([^&]+)/.exec(window.location.hash); const i = m ? flat.findIndex((p) => p.id === decodeURIComponent(m[1])) : -1; setAt(i); if (i < 0) setFly(null); };
    fromHash();
    window.addEventListener('popstate', fromHash);
    return () => window.removeEventListener('popstate', fromHash);
  }, [flat]);
  const open = (i, rect) => { setFly(rect || null); window.history.pushState({ momentsViewer: true }, '', `#p=${encodeURIComponent(flat[i].id)}`); setAt(i); };
  const close = useCallback(() => { if (window.history.state && window.history.state.momentsViewer) window.history.back(); else { window.history.replaceState(null, '', window.location.pathname); setAt(-1); setFly(null); } }, []);
  const onTap = useCallback((id, el) => {
    if (selectingRef.current) { toggleSel(id); return; }
    const i = indexRef.current.get(id); if (i === undefined) return;
    const r = el.getBoundingClientRect();
    setFly({ left: r.left, top: r.top, width: r.width, height: r.height });
    window.history.pushState({ momentsViewer: true }, '', `#p=${encodeURIComponent(id)}`); setAt(i);
  }, []);
  // Delete from inside the viewer: stay on the same position (the next photo slides in), or close when the last one goes.
  const deleteInViewer = useCallback(async (id) => {
    const done = await removePhotos([id]);
    if (!done.length) return;
    const left = flat.length - 1;
    if (left <= 0) { close(); return; }
    const ni = Math.min(at, left - 1);
    const nextPhoto = flat.filter((p) => p.id !== id)[ni];
    window.history.replaceState(window.history.state, '', `#p=${encodeURIComponent(nextPhoto.id)}`);
    setAt(ni);
  }, [flat, at, close, key, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Zoom levels. The grid animates from the old scale to the new layout (origin under the fingers) and the photo
  // under the fingers stays put, like iOS.
  const goLevel = (lv, origin) => {
    const cur = levelRef.current; if (lv === cur) return false;
    const b = bp(window.innerWidth); const from = COLS[lv][b] / COLS[cur][b];
    const o = origin || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    let anchor = null;
    if (cur !== 'months') { const el = document.elementFromPoint(o.x, o.y); const t = el && el.closest('.mo-ph[data-id]'); if (t) anchor = { id: t.dataset.id, y: t.getBoundingClientRect().top }; }
    trans.current = { from, ox: o.x, oy: o.y, anchor, lv };
    setLevel(lv); return true;
  };
  const step = (dir, origin) => { const i = LEVELS.indexOf(levelRef.current); const ni = clamp(i + dir, 0, LEVELS.length - 1); return goLevel(LEVELS[ni], origin); };
  useLayoutEffect(() => {
    const t = trans.current; const el = zoomEl.current; if (!t || !el) return; trans.current = null;
    if (t.anchor && t.lv !== 'months') { const a = document.querySelector(`.mo-ph[data-id="${esc(t.anchor.id)}"]`); if (a) window.scrollBy(0, a.getBoundingClientRect().top - t.anchor.y); }
    if (reduced()) { el.style.transform = ''; return; }
    const r = el.getBoundingClientRect();
    el.style.transformOrigin = `${t.ox - r.left}px ${t.oy - r.top}px`;
    el.style.transition = 'none'; el.style.transform = `scale(${t.from})`;
    el.getBoundingClientRect();
    el.style.transition = `transform .4s ${EASE}`; el.style.transform = 'scale(1)';
  }, [level]);

  // Pinch on the grid (iOS: pinch out = bigger photos = fewer columns). Trackpad pinch arrives as ctrl+wheel.
  const onTouchStart = (e) => {
    if (e.touches.length !== 2) return;
    const [a, b] = e.touches; const el = zoomEl.current; const r = el.getBoundingClientRect();
    const x = (a.clientX + b.clientX) / 2; const y = (a.clientY + b.clientY) / 2;
    pinch.current = { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), done: false, x, y };
    el.style.transformOrigin = `${x - r.left}px ${y - r.top}px`; el.style.transition = 'none';
  };
  const onTouchMove = (e) => {
    const p = pinch.current; if (!p || e.touches.length !== 2) return;
    e.preventDefault();
    if (p.done) return;
    const [a, b] = e.touches; const r = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / p.d0;
    zoomEl.current.style.transform = `scale(${clamp(r, .8, 1.25)})`;
    if (r > 1.22) { p.done = true; if (!step(-1, p)) springBack(); }
    else if (r < 0.82) { p.done = true; if (!step(1, p)) springBack(); }
  };
  const springBack = () => { const el = zoomEl.current; if (!el) return; el.style.transition = `transform .25s ${EASE}`; el.style.transform = 'scale(1)'; };
  const onTouchEnd = () => { if (pinch.current) { if (!pinch.current.done) springBack(); pinch.current = null; } };
  const onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    wheelAcc.current += e.deltaY;
    if (wheelAcc.current < -80) { step(-1, { x: e.clientX, y: e.clientY }); wheelAcc.current = 0; }
    if (wheelAcc.current > 80) { step(1, { x: e.clientX, y: e.clientY }); wheelAcc.current = 0; }
  };
  useEffect(() => { const el = zoomEl.current; if (!el) return undefined; el.addEventListener('touchmove', onTouchMove, { passive: false }); el.addEventListener('wheel', onWheel, { passive: false }); return () => { el.removeEventListener('touchmove', onTouchMove); el.removeEventListener('wheel', onWheel); }; }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!total) return undefined; const t1 = setTimeout(() => setHint(true), 1200); const t2 = setTimeout(() => setHint(false), 5200); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [total]);

  const cols = COLS[level][bp(w)];
  const jumpTo = (folder) => { goLevel('days'); setTimeout(() => { const el = document.getElementById(`night-${folder}`); if (el) el.scrollIntoView({ block: 'start' }); }, 60); };
  let offset = 0;

  return (
    <div className={`mo lv-${level}`}>
      <header className="mo-top">
        <img src={LOGO} alt="Baila Dembow" />
        <div><h1>Moments</h1><div className="mo-sub">Hemos tirado muchas fotos</div></div>
        <div className="mo-count">{total ? <>{total} photos<br />{events.length} {events.length === 1 ? 'night' : 'nights'}</> : ''}</div>
        {owner && total > 0 && at < 0 && (selecting
          ? <button type="button" className="mo-own" onClick={stopSelect}>Cancel</button>
          : <button type="button" className="mo-own" onClick={startSelect}>Select</button>)}
        {owner && !selecting && <button type="button" className="mo-own icon" onClick={lock} aria-label="Leave owner mode" title="Leave owner mode"><Icon d={I.lock} /></button>}
      </header>

      <div className="mo-body">
        {err ? (
          <div className="mo-empty"><h2>Offline</h2><p>The photos could not be loaded. Pull to refresh or try again in a minute.</p></div>
        ) : !data ? (
          <div className="mo-skel" style={{ '--cols': cols }}>{Array.from({ length: cols * 6 }).map((_, i) => <div key={i} />)}</div>
        ) : !total ? (
          <div className="mo-empty"><h2>Nothing here yet</h2><p>The first night's photos land here soon. Keep the link.</p></div>
        ) : (
          <div id="mo-zoom" className="mo-zoom" ref={zoomEl} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
            {level === 'months' ? (
              <div className="mo-months" style={{ '--mcols': cols }}>
                {events.map((ev, i) => { const d = prettyDate(ev.date); return (
                  <button type="button" key={ev.folder} className="mo-mcard" onClick={() => jumpTo(ev.folder)}>
                    <img src={ev.cover} alt="" loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
                    {i === 0 && <span className="tag">Latest</span>}
                    <div className="t"><b>{ev.city}</b><span>{ev.venue} <em>· {d.day} {d.date} {d.year} · {ev.count} photos</em></span></div>
                  </button>
                ); })}
              </div>
            ) : events.map((ev) => {
              const d = prettyDate(ev.date); offset += ev.photos.length;
              return (
                <section className="mo-sec" key={ev.folder} id={`night-${ev.folder}`}>
                  <div className="mo-head"><div><b>{d.day} {d.date}</b><span>{ev.city} · {ev.venue} · {d.year}</span></div><span className="mo-n">{ev.count} photos</span></div>
                  <div className="mo-grid" style={{ '--cols': cols }}>
                    {ev.photos.map((p, j) => <Thumb key={p.id} id={p.id} src={p.thumb} alt={`${ev.city} ${d.date}, photo ${j + 1}`} selecting={selecting} selected={sel.has(p.id)} onTap={onTap} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {selecting && at < 0 && (
        <div className="mo-selbar">
          <span>{sel.size ? `${sel.size} selected` : 'Tap photos to select'}</span>
          <button type="button" className="del" disabled={!sel.size || busy} onClick={() => removePhotos([...sel])}>{busy ? 'Deleting…' : `Delete${sel.size ? ` (${sel.size})` : ''}`}</button>
        </div>
      )}
      {ask && (
        <div className="mo-sheet" role="dialog" aria-modal="true" aria-label="Owner key">
          <form onSubmit={unlock}>
            <h2>Owner only</h2>
            <p>Enter the owner key to delete photos. It stays in this tab only.</p>
            <input name="key" type="password" autoComplete="off" placeholder="Owner key" autoFocus />
            {askMsg && <div className="m">{askMsg}</div>}
            <div className="r"><button type="button" className="ghost" onClick={() => { setAsk(false); window.history.replaceState(null, '', window.location.pathname); }}>Not now</button><button type="submit">Unlock</button></div>
          </form>
        </div>
      )}
      {total > 0 && at < 0 && !selecting && (
        <>
          <div className={`mo-hint${hint ? ' show' : ''}`}>Pinch to zoom the grid</div>
          <nav className="mo-seg" aria-label="Zoom level">
            {[['months', 'Nights'], ['days', 'Days'], ['all', 'All photos']].map(([k, label]) => (
              <button type="button" key={k} className={level === k ? 'on' : ''} onClick={() => goLevel(k)} aria-pressed={level === k}>{label}</button>
            ))}
          </nav>
        </>
      )}

      {at >= 0 && flat[at] && <Viewer key="viewer" flat={flat} at={at} setAt={setAt} onClose={close} onDelete={owner ? deleteInViewer : undefined} fromRect={fly} />}
    </div>
  );
};
