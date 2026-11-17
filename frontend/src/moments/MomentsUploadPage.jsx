import { useEffect, useRef, useState } from 'react';
import './moments.css';
import { KEY_STORE, albumUrl, listMoments, ownerJson, ownerUpload, prettyDate } from './api';

// Owner-only upload page for the Moments photo library (/moments-upload, unlisted, noindex).
// Pick a night (date, city, venue) and the photos; the browser resizes each photo to a 2000px web copy and a
// 600px square thumbnail, then sends both to /api/moments/upload with the owner key. Nothing full-size leaves the
// phone, so an iPhone can upload a whole night on mobile data. HEIC photos work in Safari (iPhone/Mac); other
// browsers need JPEG. Works on existing nights too: new photos are appended after the ones already there.

// Desktop browsers only open the calendar from the small icon; open it from anywhere in the field.
const openPicker = (e) => { try { if (e.target.showPicker) e.target.showPicker(); } catch (_) { /* needs a user gesture; the icon still works */ } };
const WEB_EDGE = 2000; const THUMB = 600;

const decode = async (file) => {
  if (window.createImageBitmap) { try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fall through */ } }
  return new Promise((res, rej) => { const u = URL.createObjectURL(file); const im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im); }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('decode')); }; im.src = u; });
};
const toJpeg = (canvas, q) => new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('encode'))), 'image/jpeg', q));
const resize = async (file) => {
  const img = await decode(file);
  const iw = img.width; const ih = img.height;
  const k = Math.min(1, WEB_EDGE / Math.max(iw, ih));
  const c = document.createElement('canvas'); c.width = Math.round(iw * k); c.height = Math.round(ih * k);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  const web = await toJpeg(c, 0.82);
  const side = Math.min(iw, ih); const sx = (iw - side) / 2; const sy = (ih - side) / 2;
  const t = document.createElement('canvas'); t.width = THUMB; t.height = THUMB;
  t.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, THUMB, THUMB);
  const thumb = await toJpeg(t, 0.78);
  if (img.close) img.close();
  return { web, thumb };
};

export const MomentsUploadPage = () => {
  const [key, setKey] = useState(() => { try { return sessionStorage.getItem(KEY_STORE) || ''; } catch (_) { return ''; } });
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');
  const [venue, setVenue] = useState('');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [log, setLog] = useState([]);
  const [msg, setMsg] = useState(null);
  const [nights, setNights] = useState(null);
  const [configured, setConfigured] = useState(true);
  const inputRef = useRef(null);
  const stop = useRef(false);

  // The list needs the owner key (a pasted key is long; short typing never hits the API, so no lock-out).
  const keyOk = key.trim().length >= 40;
  const refresh = () => listMoments(keyOk ? { key: key.trim() } : {}).then((d) => { setNights(d.events); setConfigured(d.configured !== false); }).catch(() => setNights([]));
  useEffect(() => { refresh(); }, [keyOk]); // eslint-disable-line react-hooks/exhaustive-deps
  const [copied, setCopied] = useState('');
  const copyLink = async (ev) => { const url = albumUrl(ev.token); try { await navigator.clipboard.writeText(url); setCopied(ev.folder); setTimeout(() => setCopied(''), 2000); } catch (_) { window.prompt('Album link', url); } };
  useEffect(() => { try { sessionStorage.setItem(KEY_STORE, key); } catch (_) { /* private mode */ } }, [key]);

  const pick = (list) => { const arr = [...list].filter((f) => /^image\//.test(f.type) || /\.(heic|heif|jpe?g|png)$/i.test(f.name)); arr.sort((a, b) => a.lastModified - b.lastModified || a.name.localeCompare(b.name)); setFiles(arr); setLog([]); setDone(0); setMsg(null); };
  const ready = key.trim() && date && city.trim() && venue.trim() && files.length > 0 && !busy;
  const missing = [!key.trim() && 'owner key', !date && 'date', !city.trim() && 'city', !venue.trim() && 'venue', files.length === 0 && 'photos'].filter(Boolean);

  const run = async () => {
    setBusy(true); setMsg(null); setLog([]); setDone(0); stop.current = false;
    let folder; let index;
    try {
      const q = new URLSearchParams({ date, city: city.trim(), venue: venue.trim() });
      const r = await ownerJson(key.trim(), 'GET', `/api/moments/next?${q}`);
      folder = r.folder; index = r.next;
    } catch (e) {
      setBusy(false);
      setMsg(e.status === 401 ? 'Owner key refused.' : e.status === 503 ? 'Storage is not connected yet (Vercel Blob store missing).' : e.data && e.data.fields ? `Check the night details: ${Object.keys(e.data.fields).join(', ')}.` : `Could not start: ${e.message}`);
      return;
    }
    const failed = [];
    for (let i = 0; i < files.length; i++) {
      if (stop.current) break;
      const f = files[i];
      try {
        const { web, thumb } = await resize(f);
        await ownerUpload(key.trim(), { folder, index, size: 'thumb', blob: thumb });
        await ownerUpload(key.trim(), { folder, index, size: 'web', blob: web });
        setLog((l) => [...l, { ok: true, text: `${String(index).padStart(4, '0')} ← ${f.name} (${Math.round(web.size / 1024)} KB)` }]);
        index += 1;
      } catch (e) {
        failed.push(f);
        setLog((l) => [...l, { ok: false, text: `${f.name}: ${e.message === 'decode' ? 'cannot read this format in this browser (HEIC? use Safari or export JPEG)' : e.message}` }]);
      }
      setDone(i + 1);
    }
    setBusy(false);
    setMsg(failed.length ? `${files.length - failed.length} uploaded, ${failed.length} failed. Fix the failed ones and upload them again.` : `All ${files.length} photos are live in ${folder}.`);
    if (!failed.length) setFiles([]);
    refresh();
  };

  const delNight = async (ev) => {
    if (!key.trim()) { setMsg('Enter the owner key first.'); return; }
    if (!window.confirm(`Delete all ${ev.count} photos of ${ev.city} · ${ev.venue} (${ev.date})? This cannot be undone.`)) return;
    try { await ownerJson(key.trim(), 'POST', '/api/moments/delete', { folder: ev.folder }); setMsg(`Deleted ${ev.folder}.`); refresh(); }
    catch (e) { setMsg(e.status === 401 ? 'Owner key refused.' : `Delete failed: ${e.message}`); }
  };

  const pct = files.length ? Math.round((done / files.length) * 100) : 0;
  return (
    <div className="mo">
      <div className="mo-up">
        <h1>Moments upload</h1>
        <p className="lead">Owner only. Photos are resized on this device before upload, so a full night from your phone is fine. Every night gets its own private link (copy it from the list below); the bare /moments page shows nothing.</p>
        {!configured && <div className="msg">Storage is not connected yet. In Vercel: Storage → Create → Blob → connect it to the baila-dembow project. Uploads work the moment that is done.</div>}

        <label htmlFor="agk">Owner key</label>
        <input id="agk" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" placeholder="ADMIN_API_KEY" />
        <div className="row">
          <div><label htmlFor="agd">Night (date)</label><input id="agd" type="date" value={date} onChange={(e) => setDate(e.target.value)} onClick={openPicker} onFocus={openPicker} /></div>
          <div><label htmlFor="agc">City</label><input id="agc" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rotterdam" autoComplete="off" /></div>
        </div>
        <label htmlFor="agv">Venue</label>
        <input id="agv" type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Club Reverse" autoComplete="off" />

        <label className="drop" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files); }}>
          <input ref={inputRef} type="file" accept="image/*,.heic,.heif" multiple onChange={(e) => pick(e.target.files)} />
          <b>{files.length ? `${files.length} photos selected` : 'Choose photos'}</b>
          <span>{files.length ? 'Tap to change the selection' : 'Tap to pick from the camera roll, or drop files here. Order follows the time they were taken.'}</span>
        </label>
        {files.length > 0 && !busy && (
          <div className="previews">{files.slice(0, 12).map((f) => <Preview key={`${f.name}-${f.lastModified}`} file={f} />)}</div>
        )}

        <button type="button" className="btn" disabled={!ready} onClick={run}>{busy ? `Uploading ${done} / ${files.length}` : 'Upload to Moments'}</button>
        {!busy && missing.length > 0 && <div className="hint">Still needed: {missing.join(', ')}.</div>}
        {busy && <button type="button" className="btn ghost" onClick={() => { stop.current = true; }}>Stop after this photo</button>}
        {(busy || done > 0) && <div className="bar"><i style={{ width: `${pct}%` }} /></div>}
        {msg && <div className={`msg${/live|Deleted/.test(msg) ? ' ok' : ''}`}>{msg}</div>}
        {log.length > 0 && <div className="log">{log.map((l, i) => <div key={i} className={l.ok ? 'ok' : 'bad'}>{l.text}</div>)}</div>}

        <div className="nights">
          <h2>Baila Dembow - Moments</h2>
          <p className="hint">To remove single photos, open <a href="/moments?owner" style={{ color: '#C9A0F0' }}>Moments in owner mode</a>: Select, tap the photos, Delete. The key you typed here carries over in this tab.</p>
          {!keyOk ? <div className="log">Paste the owner key to see the nights and their links.</div> : nights === null ? <div className="log">Loading…</div> : nights.length === 0 ? <div className="log">Nothing uploaded yet (or the key was refused).</div> : nights.map((ev) => { const d = prettyDate(ev.date); return (
            <div className="night" key={ev.folder}>
              <img src={ev.photos[0].thumb} alt="" />
              <div><b>{ev.city} · {ev.venue}</b><span>{d.day} {d.date} {d.year} · {ev.count} photos · <a href={albumUrl(ev.token)} style={{ color: '#C9A0F0' }}>open</a></span></div>
              <button type="button" className="lnk" onClick={() => copyLink(ev)}>{copied === ev.folder ? 'Copied' : 'Copy link'}</button>
              <button type="button" onClick={() => delNight(ev)}>Delete night</button>
            </div>
          ); })}
        </div>
      </div>
    </div>
  );
};

const Preview = ({ file }) => {
  const [src, setSrc] = useState(null);
  useEffect(() => { let u; let alive = true; (async () => { try { const bmp = await decode(file); const c = document.createElement('canvas'); const k = 120 / Math.max(bmp.width, bmp.height); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k)); c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height); if (bmp.close) bmp.close(); if (alive) setSrc(c.toDataURL('image/jpeg', 0.6)); } catch (_) { /* unsupported format: no preview */ } })(); return () => { alive = false; if (u) URL.revokeObjectURL(u); }; }, [file]);
  return <div>{src && <img src={src} alt="" />}</div>;
};
