'use strict';
// Memories: the unlisted photo library at /htmf (one section per event night, iOS-Photos style).
//
// Photos live in Vercel Blob (public store, BLOB_READ_WRITE_TOKEN from the connected store). Nothing is in the
// repo or the database. One folder per event, two sizes per photo, written by the owner's upload page
// (/memories-upload) which resizes in the browser before sending:
//   memories/<YYYY-MM-DD>_<city>_<venue>/web/<NNNN>.jpg     long edge <= 2000px, what the viewer opens
//   memories/<YYYY-MM-DD>_<city>_<venue>/thumb/<NNNN>.jpg   600px square crop, what the grid shows
// The folder name is the only metadata: date, city and venue are parsed back out of it for the headers.
const { HttpError } = require('../lib/http');

const PREFIX = 'memories/';
const FOLDER_RE = /^(\d{4}-\d{2}-\d{2})_([a-z0-9-]+)_([a-z0-9-]+)$/;
const FILE_RE = /^(\d{4})\.jpg$/;
const MAX_BYTES = 4 * 1024 * 1024;   // Vercel function body limit is 4.5 MB; browser-resized files are far below

const slug = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const words = (s) => String(s).split('-').filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

const parseFolder = (folder) => {
  const m = FOLDER_RE.exec(folder);
  if (!m) return null;
  const date = new Date(`${m[1]}T12:00:00Z`);
  if (Number.isNaN(+date)) return null;
  return { folder, date: m[1], city: words(m[2]), venue: words(m[3]) };
};

const folderFor = ({ date, city, venue }) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) || Number.isNaN(+new Date(`${date}T12:00:00Z`))) throw new HttpError(400, 'validation', { fields: { date: 'invalid' } });
  const c = slug(city); const v = slug(venue);
  if (!c) throw new HttpError(400, 'validation', { fields: { city: 'invalid' } });
  if (!v) throw new HttpError(400, 'validation', { fields: { venue: 'invalid' } });
  return `${date}_${c}_${v}`;
};

// Every blob under memories/ (the store lists 1000 per page).
const listAll = async (blob, prefix = PREFIX) => {
  const out = []; let cursor;
  do {
    const page = await blob.list({ prefix, limit: 1000, cursor });
    out.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
};

// Public shape for the page: newest night first, photos in upload order. Only pairs with both sizes are shown.
const listEvents = async (blob) => {
  const blobs = await listAll(blob);
  const byFolder = new Map();
  for (const b of blobs) {
    const rel = b.pathname.startsWith(PREFIX) ? b.pathname.slice(PREFIX.length) : null;
    if (!rel) continue;
    const [folder, size, file] = rel.split('/');
    if (!folder || !file || !FILE_RE.test(file) || (size !== 'web' && size !== 'thumb')) continue;
    if (!byFolder.has(folder)) byFolder.set(folder, new Map());
    const photos = byFolder.get(folder);
    if (!photos.has(file)) photos.set(file, { id: `${folder}/${file.replace('.jpg', '')}`, n: Number(file.slice(0, 4)) });
    photos.get(file)[size] = b.url;
  }
  const events = [];
  for (const [folder, photos] of byFolder) {
    const meta = parseFolder(folder);
    if (!meta) continue;
    const list = [...photos.values()].filter((p) => p.web && p.thumb).sort((a, b) => a.n - b.n).map(({ id, web, thumb }) => ({ id, web, thumb }));
    if (!list.length) continue;
    events.push({ ...meta, count: list.length, cover: list[0].web, photos: list });
  }
  events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.folder.localeCompare(b.folder)));
  return events;
};

// Next free index in a folder, so a second upload session to the same night keeps appending.
const nextIndex = async (blob, folder) => {
  const existing = await listAll(blob, `${PREFIX}${folder}/web/`);
  let max = 0;
  for (const b of existing) { const m = FILE_RE.exec(b.pathname.split('/').pop()); if (m) max = Math.max(max, Number(m[1])); }
  return max + 1;
};

// One photo, one size. The upload page sends `thumb` then `web` for the same index.
const putPhoto = async (blob, { folder, index, size, bytes }) => {
  if (!parseFolder(folder)) throw new HttpError(400, 'validation', { fields: { folder: 'invalid' } });
  if (!Number.isInteger(index) || index < 1 || index > 9999) throw new HttpError(400, 'validation', { fields: { index: 'invalid' } });
  if (size !== 'web' && size !== 'thumb') throw new HttpError(400, 'validation', { fields: { size: 'invalid' } });
  if (!Buffer.isBuffer(bytes) || bytes.length < 100) throw new HttpError(400, 'validation', { fields: { body: 'empty' } });
  if (bytes.length > MAX_BYTES) throw new HttpError(413, 'too_large');
  if (!(bytes[0] === 0xff && bytes[1] === 0xd8)) throw new HttpError(400, 'validation', { fields: { body: 'not_jpeg' } });
  const pathname = `${PREFIX}${folder}/${size}/${String(index).padStart(4, '0')}.jpg`;
  const r = await blob.put(pathname, bytes, { access: 'public', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 31536000 });
  return { pathname, url: r.url };
};

// Remove one photo (both sizes) or a whole night.
const remove = async (blob, { folder, index }) => {
  if (!parseFolder(folder)) throw new HttpError(400, 'validation', { fields: { folder: 'invalid' } });
  let targets;
  if (index === undefined || index === null) targets = await listAll(blob, `${PREFIX}${folder}/`);
  else {
    if (!Number.isInteger(index) || index < 1) throw new HttpError(400, 'validation', { fields: { index: 'invalid' } });
    const name = `${String(index).padStart(4, '0')}.jpg`;
    const all = await listAll(blob, `${PREFIX}${folder}/`);
    targets = all.filter((b) => b.pathname.endsWith(`/web/${name}`) || b.pathname.endsWith(`/thumb/${name}`));
  }
  if (targets.length) await blob.del(targets.map((b) => b.url));
  return { deleted: targets.length };
};

module.exports = { PREFIX, slug, parseFolder, folderFor, listEvents, nextIndex, putPhoto, remove, MAX_BYTES };
