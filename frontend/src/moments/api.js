// Moments photo library: tiny fetch helpers shared by the public page and the owner upload page.
export const listMoments = async () => {
  const r = await fetch('/api/moments/list', { credentials: 'same-origin' });
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

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// "2026-10-25" -> { day: 'Saturday', date: '25 October', year: '2026', month: 'October 2026' }
export const prettyDate = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return { day: DAYS[dt.getUTCDay()], date: `${d} ${MONTHS[m - 1]}`, year: String(y), month: `${MONTHS[m - 1]} ${y}` };
};
