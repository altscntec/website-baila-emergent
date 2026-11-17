import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './moments.css';
import { deletePhoto, listMoments, prettyDate, readKey, verifyOwner, writeKey } from './api';

// Moments: the unlisted photo library at /moments (link only, noindex). Built to feel like the iPhone Photos app:
//   - one section per night, newest first, with a sticky date + venue header
//   - square grid; pinch in/out (two fingers, or trackpad pinch / ctrl+wheel) steps through the zoom levels
//   - Months (one cover card per night) · Days (3 across) · All (dense), also on the bottom pill like iOS
//   - tap a photo for the full-screen viewer: swipe between photos, pinch and double-tap to zoom, filmstrip,
//     share the link (view-only: no save/download), back gesture / Escape closes it
//   - owner mode (Hari only): /moments?owner asks for the owner key once per tab; then Select → tap photos → Delete,
//     or Delete inside the viewer. Public visitors never see any of it.
// Photos come from /api/moments/list (Vercel Blob behind it); the page itself holds no photos.

const LOGO = '/images/branding/baila-logo-white.png';
const LEVELS = ['months', 'days', 'all'];
const COLS = { days: [3, 5, 6], all: [5, 8, 10], months: [1, 2, 3] };
const bp = (w) => (w >= 1200 ? 2 : w >= 768 ? 1 : 0);

const Icon = ({ d }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>);
const I = {
  back: 'M15 18l-6-6 6-6',
  share: 'M12 3v13M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 6l6 6-6 6',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  check: 'M5 12l5 5L20 7',
  lock: 'M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z',
};

const Thumb = ({ src, alt, onClick, selecting, selected }) => {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={`mo-ph${selecting ? ' pick' : ''}${selected ? ' sel' : ''}`} onClick={onClick} aria-label={alt} aria-pressed={selecting ? selected : undefined}>
      <img src={src} alt="" loading="lazy" decoding="async" className={ok ? 'in' : ''} onLoad={() => setOk(true)} />
      {selecting && <span className="ck"><Icon d={I.check} /></span>}
    </button>
  );
};

// Full-screen viewer. `flat` is every photo of every night in page order; `at` is the index into it.
const Viewer = ({ flat, at, setAt, onClose, onDelete }) => {
  const [chrome, setChrome] = useState(true);
  const [drag, setDrag] = useState(0);
  const [snap, setSnap] = useState(true);
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const t = useRef({});
  const filmRef = useRef(null);
  const cur = flat[at];
  const prev = useCallback(() => setAt((i) => Math.max(0, i - 1)), [setAt]);
  const next = useCallback(() => setAt((i) => Math.min(flat.length - 1, i + 1)), [setAt, flat.length]);

  useEffect(() => { setZoom({ s: 1, x: 0, y: 0 }); setDrag(0); setSnap(true); }, [at]);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); else if (e.key === 'ArrowLeft') prev(); else if (e.key === 'ArrowRight') next(); else if (onDelete && (e.key === 'Delete' || e.key === 'Backspace')) onDelete(cur.id); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next, onDelete, cur.id]);
  useEffect(() => {
    const el = filmRef.current && filmRef.current.children[at];
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    // warm the neighbours
    [at - 1, at + 1].forEach((i) => { if (flat[i]) { const im = new Image(); im.src = flat[i].web; } });
  }, [at, flat]);
  useEffect(() => { const prevOv = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prevOv; }; }, []);

  const dist = (a, b) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  const onStart = (e) => {
    const ts = e.touches;
    if (ts.length === 2) { t.current = { pinch: true, d0: dist(ts[0], ts[1]), s0: zoom.s, x0: zoom.x, y0: zoom.y, cx: (ts[0].clientX + ts[1].clientX) / 2, cy: (ts[0].clientY + ts[1].clientY) / 2 }; setSnap(false); return; }
    const p = ts[0];
    const now = Date.now();
    const dbl = t.current.lastTap && now - t.current.lastTap < 280 && Math.abs(p.clientX - t.current.lx) < 24 && Math.abs(p.clientY - t.current.ly) < 24;
    t.current = { ...t.current, pinch: false, sx: p.clientX, sy: p.clientY, px: zoom.x, py: zoom.y, moved: false, t0: now, dbl, lastTap: now, lx: p.clientX, ly: p.clientY };
    setSnap(false);
  };
  const onMove = (e) => {
    const ts = e.touches; const c = t.current;
    if (c.pinch && ts.length === 2) {
      const s = Math.min(5, Math.max(1, c.s0 * (dist(ts[0], ts[1]) / c.d0)));
      setZoom({ s, x: c.x0, y: c.y0 }); return;
    }
    if (ts.length !== 1 || c.pinch) return;
    const dx = ts[0].clientX - c.sx; const dy = ts[0].clientY - c.sy;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) c.moved = true;
    if (zoom.s > 1) { setZoom((z) => ({ ...z, x: c.px + dx, y: c.py + dy })); return; }
    // swipe between photos (resist at the ends)
    const edge = (dx > 0 && at === 0) || (dx < 0 && at === flat.length - 1);
    setDrag(edge ? dx * 0.3 : dx);
  };
  const onEnd = (e) => {
    const c = t.current;
    setSnap(true);
    if (c.pinch) { if (e.touches.length === 0) { c.pinch = false; if (zoom.s <= 1.05) setZoom({ s: 1, x: 0, y: 0 }); } return; }
    if (zoom.s > 1) return;
    if (!c.moved) {
      if (c.dbl) { setZoom((z) => (z.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 })); c.lastTap = 0; }
      else setChrome((v) => !v);
      setDrag(0); return;
    }
    const w = window.innerWidth; const fast = Date.now() - c.t0 < 250 && Math.abs(drag) > 30;
    if ((drag < -w * 0.2 || (fast && drag < 0)) && at < flat.length - 1) next();
    else if ((drag > w * 0.2 || (fast && drag > 0)) && at > 0) prev();
    setDrag(0);
  };
  const stageRef = useRef(null);
  useEffect(() => { const el = stageRef.current; if (!el) return; const onWheel = (e) => { if (e.ctrlKey) { e.preventDefault(); setZoom((z) => ({ ...z, s: Math.min(5, Math.max(1, z.s - e.deltaY * 0.01)) })); } }; el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel); }, []);

  // Share the link to this photo (never the file: the album is view-only).
  const share = async () => {
    const url = `${window.location.origin}/moments#p=${cur.id}`;
    try { if (navigator.share) await navigator.share({ title: 'Baila Dembow', url }); else if (navigator.clipboard) await navigator.clipboard.writeText(url); } catch (_) { /* cancelled */ }
  };

  const d = prettyDate(cur.ev.date);
  const slides = [at - 1, at, at + 1].filter((i) => flat[i]);
  const base = -(at - slides[0]) * 100;
  return (
    <div className={`mo-view${chrome ? '' : ' chrome-off'}`} role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div className="mo-vtop">
        <button type="button" className="mo-back" onClick={onClose} aria-label="Back"><Icon d={I.back} /></button>
        <div className="mo-ttl"><b>{d.day} {d.date} {d.year}</b><span>{cur.ev.city} · {cur.ev.venue}</span></div>
        <div className="mo-pos">{at + 1} / {flat.length}</div>
      </div>
      <div className="mo-stage" ref={stageRef} onContextMenu={(e) => e.preventDefault()} onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}>
        <div className={`mo-strip${snap ? ' snap' : ''}`} style={{ transform: `translate3d(calc(${base}% + ${drag}px), 0, 0)` }}>
          {slides.map((i) => (
            <div className="mo-slide" key={flat[i].id}>
              <img src={flat[i].web} alt="" draggable="false" className={i === at && zoom.s > 1 ? 'zoomed' : ''}
                style={i === at ? { transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})`, transition: snap ? 'transform .2s ease-out' : 'none' } : undefined} />
            </div>
          ))}
        </div>
      </div>
      {at > 0 && <button type="button" className="mo-nav l" onClick={prev} aria-label="Previous"><Icon d={I.left} /></button>}
      {at < flat.length - 1 && <button type="button" className="mo-nav r" onClick={next} aria-label="Next"><Icon d={I.right} /></button>}
      <div className="mo-vbot">
        <div className="mo-film" ref={filmRef}>
          {flat.map((p, i) => (<button type="button" key={p.id} className={i === at ? 'on' : ''} onClick={() => setAt(i)} aria-label={`Photo ${i + 1}`}><img src={p.thumb} alt="" loading="lazy" decoding="async" /></button>))}
        </div>
        <div className="mo-acts">
          <button type="button" onClick={share}><Icon d={I.share} />Share</button>
          {onDelete && <button type="button" className="danger" onClick={() => onDelete(cur.id)}><Icon d={I.trash} />Delete</button>}
          <button type="button" onClick={onClose}><Icon d={I.grid} />Grid</button>
        </div>
      </div>
    </div>
  );
};

export const MomentsPage = () => {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(false);
  const [level, setLevel] = useState(() => { try { return LEVELS.includes(localStorage.getItem('bd_moments_zoom')) ? localStorage.getItem('bd_moments_zoom') : 'days'; } catch (_) { return 'days'; } });
  const [w, setW] = useState(() => window.innerWidth);
  const [scale, setScale] = useState(1);
  const [snap, setSnap] = useState(false);
  const [hint, setHint] = useState(false);
  const [at, setAt] = useState(-1);
  const pinch = useRef(null);
  const wheelAcc = useRef(0);
  // Owner mode (delete). Key in sessionStorage; asked for via /moments?owner.
  const [key, setKey] = useState(readKey);
  const [ask, setAsk] = useState(() => !readKey() && /(^|[?&#])owner(=|&|$)/.test(window.location.search + window.location.hash));
  const [askMsg, setAskMsg] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [sel, setSel] = useState(() => new Set());
  const [busy, setBusy] = useState(false);
  const owner = !!key;

  useEffect(() => { listMoments().then(setData).catch(() => setErr(true)); }, []);
  useEffect(() => { const r = () => setW(window.innerWidth); window.addEventListener('resize', r); return () => window.removeEventListener('resize', r); }, []);
  useEffect(() => { try { localStorage.setItem('bd_moments_zoom', level); } catch (_) { /* private mode */ } }, [level]);

  const events = useMemo(() => (data && data.events) || [], [data]);

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
  const toggleSel = (id) => setSel((cur) => { const n = new Set(cur); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const startSelect = () => { setSelecting(true); setSel(new Set()); if (level === 'months') setLevel('days'); };
  const stopSelect = () => { setSelecting(false); setSel(new Set()); };
  const flat = useMemo(() => events.flatMap((ev) => ev.photos.map((p) => ({ ...p, ev }))), [events]);
  const total = flat.length;

  // Deep link (#p=<folder>/<nnnn>) and the back gesture: the viewer is a history entry.
  useEffect(() => {
    if (!flat.length) return;
    const fromHash = () => { const m = /p=([^&]+)/.exec(window.location.hash); const i = m ? flat.findIndex((p) => p.id === decodeURIComponent(m[1])) : -1; setAt(i); };
    fromHash();
    window.addEventListener('popstate', fromHash);
    return () => window.removeEventListener('popstate', fromHash);
  }, [flat]);
  const open = (i) => { window.history.pushState({ momentsViewer: true }, '', `#p=${encodeURIComponent(flat[i].id)}`); setAt(i); };
  const close = useCallback(() => { if (window.history.state && window.history.state.momentsViewer) window.history.back(); else { window.history.replaceState(null, '', window.location.pathname); setAt(-1); } }, []);
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

  // Pinch on the grid (iOS: pinch out = bigger photos = fewer columns). Trackpad pinch arrives as ctrl+wheel.
  const step = (dir) => setLevel((l) => { const i = LEVELS.indexOf(l); const n = Math.min(LEVELS.length - 1, Math.max(0, i + dir)); return LEVELS[n]; });
  const onTouchStart = (e) => { if (e.touches.length === 2) { const [a, b] = e.touches; pinch.current = { d0: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), done: false }; setSnap(false); } };
  const onTouchMove = (e) => {
    const p = pinch.current; if (!p || e.touches.length !== 2) return;
    e.preventDefault();
    const [a, b] = e.touches; const r = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) / p.d0;
    setScale(Math.min(1.35, Math.max(0.75, r)));
    if (!p.done && r > 1.25) { p.done = true; step(-1); setScale(1); }
    if (!p.done && r < 0.8) { p.done = true; step(1); setScale(1); }
  };
  const onTouchEnd = () => { if (pinch.current) { pinch.current = null; setSnap(true); setScale(1); } };
  const onWheel = (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    wheelAcc.current += e.deltaY;
    if (wheelAcc.current < -80) { step(-1); wheelAcc.current = 0; }
    if (wheelAcc.current > 80) { step(1); wheelAcc.current = 0; }
  };
  useEffect(() => { const el = document.getElementById('mo-zoom'); if (!el) return; el.addEventListener('touchmove', onTouchMove, { passive: false }); el.addEventListener('wheel', onWheel, { passive: false }); return () => { el.removeEventListener('touchmove', onTouchMove); el.removeEventListener('wheel', onWheel); }; }); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (!total) return; const t1 = setTimeout(() => setHint(true), 1200); const t2 = setTimeout(() => setHint(false), 5200); return () => { clearTimeout(t1); clearTimeout(t2); }; }, [total]);

  const cols = COLS[level][bp(w)];
  const jumpTo = (folder) => { setLevel('days'); setTimeout(() => { const el = document.getElementById(`night-${folder}`); if (el) el.scrollIntoView({ block: 'start' }); }, 50); };
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
          <div id="mo-zoom" className={`mo-zoom${snap ? ' snap' : ''}`} style={{ transform: `scale(${scale})` }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
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
              const d = prettyDate(ev.date); const start = offset; offset += ev.photos.length;
              return (
                <section className="mo-sec" key={ev.folder} id={`night-${ev.folder}`}>
                  <div className="mo-head"><div><b>{d.day} {d.date}</b><span>{ev.city} · {ev.venue} · {d.year}</span></div><span className="mo-n">{ev.count} photos</span></div>
                  <div className="mo-grid" style={{ '--cols': cols }}>
                    {ev.photos.map((p, j) => <Thumb key={p.id} src={p.thumb} alt={`${ev.city} ${d.date}, photo ${j + 1}`} selecting={selecting} selected={sel.has(p.id)} onClick={() => (selecting ? toggleSel(p.id) : open(start + j))} />)}
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
            <input name="key" type="password" autoComplete="current-password" placeholder="Owner key" autoFocus />
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
              <button type="button" key={k} className={level === k ? 'on' : ''} onClick={() => setLevel(k)} aria-pressed={level === k}>{label}</button>
            ))}
          </nav>
        </>
      )}

      {at >= 0 && flat[at] && <Viewer flat={flat} at={at} setAt={setAt} onClose={close} onDelete={owner ? deleteInViewer : undefined} />}
    </div>
  );
};
