// Instagram-ready versions of a Moments photo, drawn on a canvas in the browser:
//   story 1080x1920 (9:16) and post 1080x1350 (4:5), Baila Dembow logo on top, the photo on a blurred
//   backdrop in brand colours, and the night written underneath. The file is handed to the OS share
//   sheet, where Instagram picks it up as a story or a post.
const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif';
const load = (src, cors) => new Promise((res, rej) => { const im = new Image(); if (cors) im.crossOrigin = 'anonymous'; im.onload = () => res(im); im.onerror = () => rej(new Error('image')); im.src = src; });
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

export async function renderInstagram({ src, kind, logo, line }) {
  const story = kind === 'story';
  const W = 1080; const H = story ? 1920 : 1350;
  const [im, lg] = await Promise.all([load(src, true), logo ? load(logo, false).catch(() => null) : null]);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // backdrop: the photo itself, blurred and darkened, with a red → purple wash
  ctx.fillStyle = '#0A0609'; ctx.fillRect(0, 0, W, H);
  // Only the middle of the photo feeds the backdrop (the watermark sits on the photo's bottom edge and would
  // otherwise show up, blurred and cut in half, under the story).
  const sx = im.width * .2; const sy = im.height * .2; const sw = im.width * .6; const sh = im.height * .6;
  const cover = Math.max(W / sw, H / sh); const bw = sw * cover; const bh = sh * cover;
  if ('filter' in ctx) { ctx.filter = 'blur(50px) brightness(.5) saturate(1.3)'; ctx.drawImage(im, sx, sy, sw, sh, (W - bw) / 2, (H - bh) / 2, bw, bh); ctx.filter = 'none'; }
  else { ctx.globalAlpha = .3; ctx.drawImage(im, sx, sy, sw, sh, (W - bw) / 2, (H - bh) / 2, bw, bh); ctx.globalAlpha = 1; }
  const wash = ctx.createLinearGradient(0, 0, 0, H); wash.addColorStop(0, 'rgba(227,18,26,.28)'); wash.addColorStop(1, 'rgba(58,13,82,.6)');
  ctx.fillStyle = wash; ctx.fillRect(0, 0, W, H);

  // the photo, fitted with rounded corners and a soft shadow
  const pad = 64; const top = story ? 290 : 160; const bottom = story ? 320 : 200;
  const aw = W - pad * 2; const ah = H - top - bottom; const k = Math.min(aw / im.width, ah / im.height);
  const pw = Math.round(im.width * k); const ph = Math.round(im.height * k); const px = Math.round((W - pw) / 2); const py = Math.round(top + (ah - ph) / 2);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 28; rr(ctx, px, py, pw, ph, 30); ctx.fillStyle = '#000'; ctx.fill(); ctx.restore();
  ctx.save(); rr(ctx, px, py, pw, ph, 30); ctx.clip(); ctx.drawImage(im, px, py, pw, ph); ctx.restore();

  // logo above
  if (lg) { const lw = story ? 330 : 250; const lh = lw * lg.height / lg.width; ctx.drawImage(lg, (W - lw) / 2, Math.round((top - lh) / 2) + (story ? 50 : 14), lw, lh); }

  // the night, below
  if (line) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `600 28px ${FONT}`; ctx.fillStyle = '#E9D5FF'; ctx.fillText(line.toUpperCase().split('').join('\u200A'), W / 2, py + ph + (story ? 70 : 48)); }

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', .9));
}
