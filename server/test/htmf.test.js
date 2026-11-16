'use strict';
// hTmF photo library: folder naming, listing shape, uploads and deletes against an in-memory Blob store.
const test = require('node:test');
const assert = require('node:assert/strict');
const htmf = require('../services/htmf');

const fakeBlob = () => {
  const store = new Map();
  return {
    store,
    list: async ({ prefix, limit = 1000, cursor }) => {
      const all = [...store.keys()].filter((k) => k.startsWith(prefix)).sort();
      const start = cursor ? Number(cursor) : 0;
      const page = all.slice(start, start + limit);
      return { blobs: page.map((k) => ({ pathname: k, url: `https://blob.test/${k}` })), hasMore: start + limit < all.length, cursor: String(start + limit) };
    },
    put: async (pathname, bytes) => { store.set(pathname, bytes); return { url: `https://blob.test/${pathname}` }; },
    del: async (urls) => { for (const u of urls) store.delete(u.replace('https://blob.test/', '')); },
  };
};
const jpeg = (n = 200) => Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(n, 1)]);

test('folder names: date + slugged city/venue, accents stripped, bad input refused', () => {
  assert.equal(htmf.folderFor({ date: '2026-10-25', city: 'Rotterdam', venue: 'Club Reverse' }), '2026-10-25_rotterdam_club-reverse');
  assert.equal(htmf.folderFor({ date: '2026-12-12', city: 'Groningen ', venue: 'Huize Maas!' }), '2026-12-12_groningen_huize-maas');
  assert.equal(htmf.folderFor({ date: '2026-11-07', city: 'Día de Muertos', venue: 'Reverse' }), '2026-11-07_dia-de-muertos_reverse');
  assert.throws(() => htmf.folderFor({ date: '2026-13-01', city: 'a', venue: 'b' }), /validation/);
  assert.throws(() => htmf.folderFor({ date: '2026-10-25', city: '', venue: 'b' }), /validation/);
  assert.deepEqual(htmf.parseFolder('2026-10-25_rotterdam_club-reverse'), { folder: '2026-10-25_rotterdam_club-reverse', date: '2026-10-25', city: 'Rotterdam', venue: 'Club Reverse' });
  assert.equal(htmf.parseFolder('random'), null);
});

test('upload both sizes, list newest night first with photos in order, append on a second session', async () => {
  const blob = fakeBlob();
  const f1 = '2026-10-25_rotterdam_club-reverse';
  const f2 = '2026-11-21_den-haag_westwood';
  for (const i of [1, 2, 3]) { await htmf.putPhoto(blob, { folder: f1, index: i, size: 'thumb', bytes: jpeg() }); await htmf.putPhoto(blob, { folder: f1, index: i, size: 'web', bytes: jpeg() }); }
  await htmf.putPhoto(blob, { folder: f2, index: 1, size: 'thumb', bytes: jpeg() });
  await htmf.putPhoto(blob, { folder: f2, index: 1, size: 'web', bytes: jpeg() });
  await htmf.putPhoto(blob, { folder: f2, index: 2, size: 'thumb', bytes: jpeg() });   // web half missing: hidden
  blob.store.set('htmf/junk.txt', Buffer.alloc(3));
  blob.store.set('htmf/not-a-folder/web/0001.jpg', Buffer.alloc(3));

  const events = await htmf.listEvents(blob);
  assert.deepEqual(events.map((e) => [e.folder, e.count]), [[f2, 1], [f1, 3]]);
  assert.equal(events[1].city, 'Rotterdam'); assert.equal(events[1].venue, 'Club Reverse'); assert.equal(events[1].date, '2026-10-25');
  assert.deepEqual(events[1].photos.map((p) => p.id), [`${f1}/0001`, `${f1}/0002`, `${f1}/0003`]);
  assert.equal(events[1].photos[0].thumb, `https://blob.test/htmf/${f1}/thumb/0001.jpg`);
  assert.equal(events[1].cover, `https://blob.test/htmf/${f1}/web/0001.jpg`);
  assert.equal(await htmf.nextIndex(blob, f1), 4);
  assert.equal(await htmf.nextIndex(blob, '2027-01-01_x_y'), 1);
});

test('uploads refuse non-JPEG, oversize and bad coordinates', async () => {
  const blob = fakeBlob();
  const f = '2026-10-25_rotterdam_club-reverse';
  await assert.rejects(htmf.putPhoto(blob, { folder: f, index: 1, size: 'web', bytes: Buffer.alloc(300, 7) }), /validation/);
  await assert.rejects(htmf.putPhoto(blob, { folder: f, index: 1, size: 'web', bytes: jpeg(htmf.MAX_BYTES + 1) }), /too_large/);
  await assert.rejects(htmf.putPhoto(blob, { folder: f, index: 0, size: 'web', bytes: jpeg() }), /validation/);
  await assert.rejects(htmf.putPhoto(blob, { folder: f, index: 1, size: 'huge', bytes: jpeg() }), /validation/);
  await assert.rejects(htmf.putPhoto(blob, { folder: '../x', index: 1, size: 'web', bytes: jpeg() }), /validation/);
  assert.equal(blob.store.size, 0);
});

test('delete one photo or a whole night', async () => {
  const blob = fakeBlob();
  const f = '2026-10-25_rotterdam_club-reverse';
  for (const i of [1, 2]) { await htmf.putPhoto(blob, { folder: f, index: i, size: 'thumb', bytes: jpeg() }); await htmf.putPhoto(blob, { folder: f, index: i, size: 'web', bytes: jpeg() }); }
  assert.deepEqual(await htmf.remove(blob, { folder: f, index: 1 }), { deleted: 2 });
  assert.deepEqual((await htmf.listEvents(blob))[0].photos.map((p) => p.id), [`${f}/0002`]);
  assert.deepEqual(await htmf.remove(blob, { folder: f, index: null }), { deleted: 2 });
  assert.deepEqual(await htmf.listEvents(blob), []);
});

test('listing pages through more than 1000 blobs', async () => {
  const blob = fakeBlob();
  const f = '2026-10-25_rotterdam_club-reverse';
  for (let i = 1; i <= 600; i++) { blob.store.set(`htmf/${f}/thumb/${String(i).padStart(4, '0')}.jpg`, jpeg()); blob.store.set(`htmf/${f}/web/${String(i).padStart(4, '0')}.jpg`, jpeg()); }
  const events = await htmf.listEvents(blob);
  assert.equal(events[0].count, 600);
  assert.equal(await htmf.nextIndex(blob, f), 601);
});
