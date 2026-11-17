// Moments photo library: tiny fetch helpers shared by the public page and the owner upload page.
// Public: one night via its album token. Owner (key): every night, each with its link token.
export const listMoments = async ({ key, album } = {}) => {
  const q = album ? `?album=${encodeURIComponent(album)}` : '';
  const r = await fetch(`/api/moments/list${q}`, { credentials: 'same-origin', headers: key ? { Authorization: `Bearer ${key}` } : {} });
  if (!r.ok) throw new Error(`list ${r.status}`);
  return r.json();
};

export const ownerJson = async (key, method, path, body) => {
  const r = await fetch(path, { method, credentials: 'same-origin', headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  let data = {}; try { data = await r.json(); } catch (_) { /* empty */ }
  if (!r.ok) throw Object.assign(new Error(data.error || `http_${r.status}`), { status: r.status, data });
  return data;
};

export const ownerUpload = async (key, { folder, index, size, blob }) => {
  const q = new URLSearchParams({ folder, index: String(index), size });
  const r = await fetch(`/api/moments/upload?${q}`, { method: 'POST', credentials: 'same-origin', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/octet-stream' }, body: blob });
  let data = {}; try { data = await r.json(); } catch (_) { /* empty */ }
  if (!r.ok) throw Object.assign(new Error(data.error || `http_${r.status}`), { status: r.status, data });
  return data;
};

// Owner mode on the public page: the key lives in sessionStorage (same slot the upload page uses), never in a URL.
export const KEY_STORE = 'bd_moments_key';
export const readKey = () => { try { return sessionStorage.getItem(KEY_STORE) || ''; } catch (_) { return ''; } };
export const writeKey = (k) => { try { if (k) sessionStorage.setItem(KEY_STORE, k); else sessionStorage.removeItem(KEY_STORE); } catch (_) { /* private mode */ } };
// Cheap authenticated read: proves the key without changing anything.
export const verifyOwner = (key) => ownerJson(key, 'GET', '/api/moments/next?date=2000-01-01&city=check&venue=check');
// One photo = <folder>/<nnnn>; the server removes both sizes.
export const deletePhoto = (key, id) => { const i = id.lastIndexOf('/'); return ownerJson(key, 'POST', '/api/moments/delete', { folder: id.slice(0, i), index: Number(id.slice(i + 1)) }); };

// /moments/<token> → token, else null
export const albumFromPath = (pathname) => { const m = /^\/moments\/([A-Za-z0-9_-]{16})\/?$/.exec(pathname || window.location.pathname); return m ? m[1] : null; };
export const albumUrl = (token) => `${window.location.origin}/moments/${token}`;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// "2026-10-25" -> { day: 'Saturday', date: '25 October', year: '2026', month: 'October 2026' }
export const prettyDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return { day: DAYS[dt.getUTCDay()], date: `${d} ${MONTHS[m - 1]}`, year: String(y), month: `${MONTHS[m - 1]} ${y}` };
};
