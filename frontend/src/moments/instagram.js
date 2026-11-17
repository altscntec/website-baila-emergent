// Instagram-ready versions of a Moments photo, drawn on a canvas in the browser:
//   story 1080x1920 (9:16) and post 1080x1350 (4:5), Baila Dembow logo on top, the photo on a blurred
//   backdrop in brand colours, and the @handle baked in at the bottom. The file is handed to the OS share
//   sheet, where Instagram picks it up as a story or a post.
export const IG_HANDLE = 'baila.dembow';

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
  const cover = Math.max(W / im.width, H / im.height) * 1.15; const bw = im.width * cover; const bh = im.height * cover;
  if ('filter' in ctx) { ctx.filter = 'blur(50px) brightness(.5) saturate(1.3)'; ctx.drawImage(im, (W - bw) / 2, (H - bh) / 2, bw, bh); ctx.filter = 'none'; }
  else { ctx.globalAlpha = .3; ctx.drawImage(im, (W - bw) / 2, (H - bh) / 2, bw, bh); ctx.globalAlpha = 1; }
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

  // @handle pill + the night, below
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `700 46px ${FONT}`;
  const txt = `@${IG_HANDLE}`; const tw = ctx.measureText(txt).width; const pillW = tw + 76; const pillH = 96;
  const bx = (W - pillW) / 2; const by = py + ph + (story ? 64 : 40);
  ctx.save(); ctx.shadowColor = 'rgba(227,18,26,.45)'; ctx.shadowBlur = 40; rr(ctx, bx, by, pillW, pillH, 48); ctx.fillStyle = '#E3121A'; ctx.fill(); ctx.restore();
  ctx.fillStyle = '#fff'; ctx.fillText(txt, W / 2, by + pillH / 2 + 2);
  if (line) { ctx.font = `600 26px ${FONT}`; ctx.fillStyle = '#E9D5FF'; ctx.fillText(line.toUpperCase().split('').join(' '), W / 2, by + pillH + 42); }

  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('blob'))), 'image/jpeg', .9));
}
