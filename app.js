/* ════════════════════════════════════════════════════════
   HH GOA 2026 · ID GENERATOR — app logic
   Pure client-side canvas rendering. No backend. No login.
   ════════════════════════════════════════════════════════ */

'use strict';

/* ── Brand tokens (from BRAND-ANALYSIS.md) ── */
const BRAND = {
  green: '#0b6839',
  greenDeep: '#08512d',
  greenGlow: '#0d7a42',
  yellow: '#fee101',
  pink: '#ff0080',
  cream: '#fffbe8',
  white: '#ffffff',
  black: '#000000',
  display: "'Imbue', serif",
  mono: "'Victor Mono', monospace",
};

/* ── Builder classes ── */
const CLASSES = [
  'SHIP MERCHANT', 'PROTOCOL SORCERER', 'ZERO-DAY GARDENER', 'VIBE COMPILER',
  'BUILD ORACLE', 'MARKET WIZARD', 'PALM-TOP HACKER', 'SIGNAL MAKER',
  'NOISE FILTER', 'TRIANGLE WRANGLER', 'SHIP-OR-SHIP CAPTAIN', 'GENESIS BUILDER',
  'LAUNCH-DAY LEGEND', 'HYPEMASTER GENERAL', 'STACK SHAPER', 'MONSOON MACHINE',
  'PUNCH-CARD POET', 'REGISTRATION RIDER',
];
const STACK_TAGS = [
  { re: /ai|ml|llm|gen|neural|data|gpt/, cls: 'PROTOCOL SORCERER' },
  { re: /web|react|front|next|js|ts|css/, cls: 'VIBE COMPILER' },
  { re: /block|web3|solidity|defi|token/, cls: 'MARKET WIZARD' },
  { re: /app|mobile|flutter|android|ios|swift|kotlin/, cls: 'PALM-TOP HACKER' },
  { re: /design|ui|ux|brand|figma|product/, cls: 'NOISE FILTER' },
  { re: /hardware|iot|embedded|arduino|rasp|robotics|drone/, cls: 'MONSOON MACHINE' },
  { re: /backend|api|server|devops|cloud|docker|k8s|infra|db|sql/, cls: 'SIGNAL MAKER' },
  { re: /game|unity|unreal|3d|vr|ar/, cls: 'LAUNCH-DAY LEGEND' },
];

/* ── DOM ── */
const $ = (id) => document.getElementById(id);
const els = {
  tabs: document.querySelectorAll('.tab'),
  uploadZone: $('uploadZone'),
  fileInput: $('fileInput'),
  uploadInner: $('uploadInner'),
  uploadPreview: $('uploadPreview'),
  previewImg: $('previewImg'),
  removePhoto: $('removePhoto'),
  idFields: $('idFields'),
  nameInput: $('nameInput'),
  stackInput: $('stackInput'),
  classInput: $('classInput'),
  shuffleBtn: $('shuffleBtn'),
  generateBtn: $('generateBtn'),
  downloadBtn: $('downloadBtn'),
  shareBtn: $('shareBtn'),
  shareNote: $('shareNote'),
  canvas: $('resultCanvas'),
  canvasEmpty: $('canvasEmpty'),
};

/* ── State ── */
const state = {
  format: 'id',        // 'id' | 'pfp'
  photo: null,         // HTMLImageElement
  fileName: '',
  classSeed: 0,
  rendered: false,
};

/* ── Asset images (SVG marks) ── */
const assetImages = {};
function loadAsset(url) {
  return new Promise((resolve, reject) => {
    if (assetImages[url]) return resolve(assetImages[url]);
    const img = new Image();
    img.onload = () => { assetImages[url] = img; resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

/* ══════════ SMALL HELPERS ══════════ */

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pickClass(name, stack, seed) {
  const s = (stack || '').toLowerCase();
  for (const t of STACK_TAGS) if (t.re.test(s)) return t.cls;
  const h = (hashStr((name || 'builder').toLowerCase()) + seed * 7919) % CLASSES.length;
  return CLASSES[h];
}

function shuffleClass() {
  state.classSeed = (state.classSeed + 1) % 100000;
  const cls = pickClass(els.nameInput.value, els.stackInput.value, state.classSeed);
  els.classInput.value = cls;
  render();
}

function fitText(ctx, text, fontFamily, weight, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }
  return size;
}

function setLetterSpacing(ctx, px) {
  try {
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = px ? `${px}px` : '0px';
      return true;
    }
  } catch (e) { /* older browsers */ }
  return false;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* cover-crop source rect — portrait photos bias upward (faces) */
function coverCrop(img, boxW, boxH) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const scale = Math.max(boxW / iw, boxH / ih);
  let sw = boxW / scale, sh = boxH / scale;
  let sx = (iw - sw) / 2;
  let sy = (ih - sh) / 2;
  if (ih > iw) sy = Math.max(0, (ih - sh) * 0.35); // faces live up top
  return { sx, sy, sw, sh };
}

function textWidth(ctx, text) { return ctx.measureText(text).width; }

/* ══════════ RENDER: BUILDER ID CARD (1200×1500) ══════════ */

async function renderID() {
  const cv = els.canvas;
  cv.width = 1200; cv.height = 1500;
  const ctx = cv.getContext('2d');
  const W = 1200, H = 1500;

  const name = (els.nameInput.value || 'YOUR NAME').toUpperCase();
  const stack = (els.stackInput.value || 'STACK UNKNOWN').toUpperCase();
  const cls = els.classInput.value || pickClass(name, stack, state.classSeed);
  const idNo = 'HHG-26-' + (1000 + (hashStr(name + stack) % 9000));

  // background
  ctx.fillStyle = BRAND.green;
  ctx.fillRect(0, 0, W, H);

  // subtle sun glow, top-right
  try {
    const sun = await loadAsset('assets/Sun_rise.png');
    ctx.save();
    ctx.globalAlpha = 0.55;
    ctx.drawImage(sun, 700, -170, 640, 640);
    ctx.restore();
  } catch (e) { /* optional decoration */ }

  // dashed outer frame + corner pins
  ctx.save();
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([18, 14]);
  roundRect(ctx, 26, 26, W - 52, H - 52, 14);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = BRAND.pink;
  ctx.beginPath(); ctx.arc(48, 48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W - 48, 48, 7, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // header
  try {
    const mark = await loadAsset('assets/2-47.svg');
    ctx.drawImage(mark, 54, 58, 120, 120 * mark.naturalHeight / mark.naturalWidth);
  } catch (e) { /* optional */ }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  setLetterSpacing(ctx, 3);
  const hSize = fitText(ctx, 'HACKER HOUSE', BRAND.display, '800', 900, 100, 60);
  ctx.font = `800 ${hSize}px ${BRAND.display}`;
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText('HACKER HOUSE', W / 2, 168);

  // date + गोवा line
  ctx.font = '600 26px ' + BRAND.mono;
  setLetterSpacing(ctx, 6);
  ctx.fillStyle = BRAND.cream;
  const dateStr = 'GOA, INDIA · 28–31 OCT 2026';
  const dateW = textWidth(ctx, dateStr);
  try {
    const goa = await loadAsset('assets/goa_hindi.svg');
    const gh = 58, gw = gh * goa.naturalWidth / goa.naturalHeight;
    ctx.drawImage(goa, W / 2 + dateW / 2 + 16, 168 + hSize * 0.15, gw, gh);
  } catch (e) { /* optional */ }
  ctx.fillText(dateStr, W / 2 - 20, 218);

  // vertical ID number on right edge
  ctx.save();
  ctx.translate(W - 40, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = '600 22px ' + BRAND.mono;
  setLetterSpacing(ctx, 5);
  ctx.fillStyle = BRAND.cream;
  ctx.textAlign = 'left';
  ctx.fillText('NO. ' + idNo, 0, 0);
  ctx.restore();

  // photo block
  const boxX = 280, boxY = 330, box = 640;
  // yellow hard shadow
  ctx.fillStyle = BRAND.yellow;
  roundRect(ctx, boxX + 14, boxY + 14, box, box, 12);
  ctx.fill();
  // white mat
  ctx.fillStyle = BRAND.white;
  roundRect(ctx, boxX - 10, boxY - 10, box + 20, box + 20, 14);
  ctx.fill();
  // photo
  if (state.photo) {
    drawCoverImage(ctx, state.photo, boxX, boxY, box, box, 10);
  } else {
    ctx.fillStyle = BRAND.greenDeep;
    roundRect(ctx, boxX, boxY, box, box, 10);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,251,232,0.35)';
    ctx.font = '700 44px ' + BRAND.display;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO HERE', W / 2, boxY + box / 2 + 14);
  }

  // corner brackets
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const bx = boxX - 10, by = boxY - 10, bw = box + 20, bh = box + 20, L = 52;
  const brackets = [
    [bx, by, bx + L, by, bx, by + L],        // TL
    [bx + bw - L, by, bx + bw, by, bx + bw, by + L],  // TR
    [bx, by + bh - L, bx, by + bh, bx + L, by + bh],  // BL
    [bx + bw - L, by + bh, bx + bw, by + bh, bx + bw, by + bh - L], // BR
  ];
  for (const [x1, y1, x2, y2, x3, y3] of brackets) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x1, y1); ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  // pink ID tag over photo corner
  ctx.save();
  ctx.translate(boxX + 26, boxY + 26);
  ctx.rotate(-3 * Math.PI / 180);
  ctx.font = '700 24px ' + BRAND.mono;
  setLetterSpacing(ctx, 3);
  const tagW = textWidth(ctx, idNo) + 56;
  ctx.fillStyle = BRAND.pink;
  roundRect(ctx, 0, 0, tagW, 64, 8);
  ctx.fill();
  ctx.fillStyle = BRAND.white;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(idNo, 28, 32);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
  setLetterSpacing(ctx, 0);

  // name
  ctx.textAlign = 'center';
  const nSize = fitText(ctx, name, BRAND.display, '800', 1020, 104, 48);
  ctx.font = `800 ${nSize}px ${BRAND.display}`;
  ctx.fillStyle = BRAND.white;
  ctx.fillText(name, W / 2, 1145);

  // stack chip (cream, pink hard shadow)
  const sSize = fitText(ctx, stack, BRAND.mono, '700', 880, 30, 16);
  ctx.font = `700 ${sSize}px ${BRAND.mono}`;
  setLetterSpacing(ctx, 4);
  const sW = textWidth(ctx, stack);
  const chipW = sW + 100, chipH = 66, chipY = 1195;
  ctx.fillStyle = BRAND.pink;
  roundRect(ctx, W / 2 - chipW / 2 + 6, chipY + 6, chipW, chipH, 8);
  ctx.fill();
  ctx.fillStyle = BRAND.cream;
  roundRect(ctx, W / 2 - chipW / 2, chipY, chipW, chipH, 8);
  ctx.fill();
  ctx.fillStyle = BRAND.black;
  ctx.textAlign = 'center';
  ctx.fillText(stack, W / 2, chipY + 44);

  // builder class chip (yellow, rotated)
  ctx.save();
  ctx.translate(W / 2, 1345);
  ctx.rotate(-2 * Math.PI / 180);
  const clsText = 'CLASS · ' + cls;
  const cSize = fitText(ctx, clsText, BRAND.display, '700', 940, 46, 28);
  ctx.font = `700 ${cSize}px ${BRAND.display}`;
  setLetterSpacing(ctx, 2);
  const cW = textWidth(ctx, clsText);
  const cH = 78;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  roundRect(ctx, -cW / 2 - 44 + 8, -cH / 2 - 20 + 8, cW + 88, cH + 40, 8);
  ctx.fill();
  ctx.fillStyle = BRAND.yellow;
  roundRect(ctx, -cW / 2 - 44, -cH / 2 - 20, cW + 88, cH + 40, 8);
  ctx.fill();
  ctx.fillStyle = BRAND.black;
  ctx.textAlign = 'center';
  ctx.fillText(clsText, 0, 14);
  ctx.restore();
  setLetterSpacing(ctx, 0);

  // bottom cream strip
  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(0, 1400, W, 100);
  ctx.fillStyle = BRAND.black;
  ctx.textAlign = 'left';
  ctx.font = '700 34px ' + BRAND.display;
  setLetterSpacing(ctx, 1);
  ctx.fillText('LESS NOISE.', 60, 1444);
  ctx.font = '700 34px ' + BRAND.display;
  ctx.fillText('MORE SIGNAL.', 60, 1480);
  // barcode (seeded by name)
  ctx.fillStyle = BRAND.black;
  const bcX = W / 2 - 110, bcY = 1432;
  let seed = hashStr(name + stack);
  for (let i = 0; i < 44; i++) {
    // BigInt keeps the LCG exact — float64 multiplication overflows 2^53 and
    // collapses every seed to a multiple of 512 (all bars would be skipped)
    seed = Number((BigInt(seed) * 1103515245n + 12345n) % 4294967296n);
    const bw = 2 + (seed % 3) * 2;
    if (seed % 4 !== 0) ctx.fillRect(bcX + i * 5, bcY, bw, 46);
  }
  ctx.font = '600 16px ' + BRAND.mono;
  setLetterSpacing(ctx, 4);
  ctx.fillText('247 BUILDERS', bcX, bcY + 62);
  // hashtag
  ctx.font = '700 24px ' + BRAND.mono;
  setLetterSpacing(ctx, 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = BRAND.black;
  ctx.fillText('#FRAMEINGOA', W - 60, 1470);
  ctx.textAlign = 'left';
  setLetterSpacing(ctx, 0);

  state.rendered = true;
  return cv;
}

/* ══════════ RENDER: PFP FRAME (1080×1080) ══════════ */

async function renderPFP() {
  const cv = els.canvas;
  cv.width = 1080; cv.height = 1080;
  const ctx = cv.getContext('2d');
  const S = 1080;

  // photo full-bleed (or placeholder)
  if (state.photo) {
    drawCoverImage(ctx, state.photo, 0, 0, S, S, 0);
  } else {
    ctx.fillStyle = BRAND.greenDeep;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,251,232,0.35)';
    ctx.font = '700 52px ' + BRAND.display;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO HERE', S / 2, S / 2 + 18);
  }

  // top bar
  const topH = 150;
  ctx.fillStyle = 'rgba(11,104,57,0.97)';
  ctx.fillRect(0, 0, S, topH);
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(0, topH - 4, S, 4);

  try {
    const mark = await loadAsset('assets/2-47.svg');
    ctx.drawImage(mark, 44, 34, 82, 82 * mark.naturalHeight / mark.naturalWidth);
  } catch (e) { /* optional */ }

  ctx.textAlign = 'center';
  setLetterSpacing(ctx, 2);
  const tSize = fitText(ctx, 'HACKER HOUSE GOA', BRAND.display, '800', 620, 62, 40);
  ctx.font = `800 ${tSize}px ${BRAND.display}`;
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText('HACKER HOUSE GOA', S / 2, 98);
  ctx.font = '800 74px ' + BRAND.display;
  setLetterSpacing(ctx, 1);
  ctx.fillStyle = BRAND.white;
  ctx.textAlign = 'right';
  ctx.fillText('2026', S - 46, 102);

  // bottom bar
  const botH = 150, botY = S - botH;
  ctx.fillStyle = 'rgba(11,104,57,0.97)';
  ctx.fillRect(0, botY, S, botH);
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(0, botY, S, 4);

  ctx.textAlign = 'left';
  ctx.font = '600 25px ' + BRAND.mono;
  setLetterSpacing(ctx, 4);
  ctx.fillStyle = BRAND.cream;
  ctx.fillText('GOA, INDIA · 28–31 OCT 2026', 46, botY + 52);
  const sSize = fitText(ctx, 'LESS NOISE. MORE SIGNAL.', BRAND.display, '700', 640, 42, 28);
  ctx.font = `700 ${sSize}px ${BRAND.display}`;
  setLetterSpacing(ctx, 2);
  ctx.fillStyle = BRAND.yellow;
  ctx.fillText('LESS NOISE. MORE SIGNAL.', 46, botY + 110);

  ctx.font = '700 24px ' + BRAND.mono;
  setLetterSpacing(ctx, 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = BRAND.white;
  ctx.fillText('#FRAMEINGOA', S - 46, botY + 62);
  try {
    const goa = await loadAsset('assets/goa_hindi.svg');
    const gh = 44, gw = gh * goa.naturalWidth / goa.naturalHeight;
    ctx.drawImage(goa, S - 46 - gw, botY + 78, gw, gh);
  } catch (e) { /* optional */ }

  // picture frame: inner white + dashed yellow
  ctx.strokeStyle = 'rgba(255,251,232,0.95)';
  ctx.lineWidth = 5;
  ctx.strokeRect(22, 22, S - 44, S - 44);
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 10]);
  ctx.strokeRect(40, 40, S - 80, S - 80);
  ctx.setLineDash([]);
  setLetterSpacing(ctx, 0);

  state.rendered = true;
  return cv;
}

/* ══════════ RENDER DISPATCH ══════════ */

let renderTimer = null;
function render() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(async () => {
    try {
      await ensureFonts();
      const cv = state.format === 'id' ? await renderID() : await renderPFP();
      els.canvasEmpty.hidden = true;
      els.downloadBtn.disabled = false;
      // prebuild the share payload off the render pass — share button stays instant
            state.payload = await buildPayload();
            els.shareBtn.disabled = !state.payload;
      window.__app && (window.__app.lastCanvas = cv);
    } catch (e) {
      console.error('render failed', e);
    }
  }, 80);
}

/* ══════════ FONTS ══════════ */

let fontsReady = null;
function ensureFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      document.fonts.load('800 100px Imbue'),
      document.fonts.load('700 50px Imbue'),
      document.fonts.load('700 32px "Victor Mono"'),
      document.fonts.load('600 26px "Victor Mono"'),
    ]).catch(() => {});
  }
  return fontsReady;
}

/* ══════════ UPLOAD ══════════ */

function isHEIC(file) {
  return /\.heic|\.heif$/i.test(file.name) || /heic|heif/i.test(file.type);
}

let heicLibPromise = null;
function loadHEICLib() {
  if (window.heic2any) return Promise.resolve();
  if (heicLibPromise) return heicLibPromise;
  heicLibPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('HEIC decoder could not load — try JPG/PNG'));
    document.head.appendChild(s);
  });
  return heicLibPromise;
}

async function fileToImage(file) {
  let blob = file;
  if (isHEIC(file)) {
    await loadHEICLib();
    const out = await window.heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 });
    blob = Array.isArray(out) ? out[0] : out;
  }
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not decode image')); };
    img.src = url;
  });
}

function setPhoto(img, fileName) {
  state.photo = img;
  state.photoCrop = null; // rebuild crop cache for the new photo
  state.fileName = fileName || '';
  els.uploadInner.hidden = true;
  els.uploadPreview.hidden = false;
  els.previewImg.src = img.currentSrc || img.src;
  render();
}

// cover-crop the photo ONCE into an offscreen canvas (1080×1080 — both card
// formats draw from a square box), so every re-render is a single blit
// instead of re-decoding + re-scaling the full-resolution source.
function cropCache() {
  if (!state.photo) return null;
  if (state.photoCache) return state.photoCache;
  const img = state.photo, S = 1080;
  const c = document.createElement('canvas');
  c.width = S; c.height = S;
  const ctx = c.getContext('2d');
  const src = coverCrop(img, S, S);
  ctx.drawImage(img, src.sx, src.sy, src.sw, src.sh, 0, 0, S, S);
  state.photoCache = c;
  return c;
}

function drawCoverImage(ctx, img, dx, dy, dw, dh, radius) {
  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, radius || 0);
  ctx.clip();
  const cached = cropCache();
  const src = cached || img, S = cached ? 1080 : 0;
  ctx.drawImage(src, cached ? 0 : 0, cached ? 0 : 0, cached ? S : img.naturalWidth, cached ? S : img.naturalHeight, dx, dy, dw, dh);
  ctx.restore();
}

function clearPhoto() {
  state.photo = null;
  state.photoCache = null;
  els.uploadInner.hidden = false;
  els.uploadPreview.hidden = true;
  els.previewImg.removeAttribute('src');
  render();
}

async function handleFile(file) {
  if (!file) return;
  if (!file.type.startsWith('image/') && !isHEIC(file)) {
    alert('Please upload an image file (JPG, PNG, HEIC, WEBP).');
    return;
  }
  try {
    const img = await fileToImage(file);
    setPhoto(img, file.name);
  } catch (e) {
    alert(e.message || 'Could not read that image.');
  }
}

/* ══════════ DOWNLOAD ══════════ */

function canvasToBlob(cv) {
  return new Promise((resolve) => cv.toBlob(resolve, 'image/png'));
}

async function downloadPNG() {
  if (!state.rendered) return;
  const cv = els.canvas;
  const blob = await canvasToBlob(cv);
  const base = (state.fileName || 'me').replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '-').slice(0, 30);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = state.format === 'id'
    ? `HHG-ID-${base}.png`
    : `HHG-PFP-${base}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ══════════ SHARE TO X ══════════ */

// Compact base64url JSON that carries everything needed to re-render the
// card from a URL — no DB. Include a small JPEG of the card itself so the
// og:image preview shows the real card (photo included) on X.
function base64url(s) {
  // unescape/encodeURIComponent keeps Unicode names (Devanagari etc.) alive
  return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Downscale the card to ≤240px JPEG so the share URL stays compact (X
// previews render ~320px anyway; 240 is visually identical).
function cardJPEG() {
  const cv = els.canvas;
  const scale = Math.min(1, 240 / Math.max(cv.width, cv.height));
  if (scale >= 1) return cv.toDataURL('image/jpeg', 0.55);
  const c = document.createElement('canvas');
  c.width = Math.round(cv.width * scale);
  c.height = Math.round(cv.height * scale);
  c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.55);
}

// Card image: try to host it via our serverless relay (catbox → short URL so
// X's og:image crawler accepts it); fall back to embedded JPEG if offline.
async function buildPayload() {
  const name = (els.nameInput.value || '').trim().toUpperCase();
  const stack = (els.stackInput.value || '').trim().toUpperCase();
  const cls = (els.classInput.value || '').trim().toUpperCase();
  let img;
  try {
    const b64 = cardJPEG().split(',')[1];
    const r = await fetch('/api/upimg', { method: 'POST', body: b64 });
    const j = await r.json();
    if (j && j.url) img = j.url;
  } catch (e) { /* offline / relay down */ }
  if (!img) img = cardJPEG(); // embedded fallback — long URL — share still works
  const obj = { n: name, s: stack, c: cls, f: state.format, img };
  return base64url(JSON.stringify(obj));
}

async function shareLink() {
  return location.origin + '/share/' + (state.payload || await buildPayload());
}

async function captionFor() {
  const name = (els.nameInput.value || 'me').trim().toUpperCase();
  const cls = (els.classInput.value || pickClass(name, '', state.classSeed)).toUpperCase();
  const fmt = state.format;
  const link = await shareLink();
  if (fmt === 'id') {
    return `Just locked in my spot for Hacker House Goa 2026 🌴\n\n${name} BUILDER • ${cls}\n\nCheck out my pass: ${link}\n\n#FrameInGoa #HHGoa2026 #HackerHouseGoa`;
  }
  return `New PFP, who dis? 🏝️ HH Goa 2026. Frame yours #FrameInGoa`;
}

function shareToX() {
  if (!state.rendered && !state.payload) return;
  (async () => {
    const text = await captionFor();
    // Mobile: native share sheet — X appears as a target with the actual PNG
    // attached; post it publicly or send it as a DM from there.
    const isTouch = (navigator.maxTouchPoints > 0) || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent || '');
    if (isTouch && navigator.canShare) {
      try {
        const blob = await canvasToBlob(els.canvas);
        const file = new File([blob], 'hhgoa-2026.png', { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text, title: 'HH Goa 2026' });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return; // user cancelled the sheet
      }
      openXWithImage(text);
      return;
    }
    openXWithImage(text);
  })();
}

// X's web intent cannot attach images (text/hashtags only) — so the desktop
// flow opens X compose with the caption pre-filled (link now points at the
// card's unique /share/<payload> page, whose og:image shows the card on X)
// and puts the ID card PNG on the clipboard: paste it (Ctrl/⌘+V) into the
// compose box and it posts as an image.
function openXWithImage(text) {
  const t = encodeURIComponent(text);
  (async () => {
    try {
      // clipboard BEFORE opening the X tab — window.open steals focus, and
      // navigator.clipboard.write fails in an unfocused document.
      const blob = await canvasToBlob(els.canvas);
      if (typeof ClipboardItem === 'undefined') throw new Error('no ClipboardItem');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      window.open(`https://x.com/intent/post?text=${t}`, '_blank', 'noopener');
      flashToast('ID card copied — paste it (Ctrl/⌘+V) into the X post');
    } catch (e) {
      window.open(`https://x.com/intent/post?text=${t}`, '_blank', 'noopener');
      downloadPNG();
      flashToast('ID card downloaded — attach it to the X post');
    }
  })();
}

let toastTimer = null;
function flashToast(msg) {
  let t = document.getElementById('x-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'x-toast';
    t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:9999;background:#fee101;color:#0b0b0b;border:2px solid #0b0b0b;box-shadow:6px 6px 0 #0b0b0b;padding:12px 18px;font:700 14px/1.3 "Victor Mono",monospace;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.remove(); }, 6000);
}

/* ══════════ EVENTS ══════════ */

els.tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    els.tabs.forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
    tab.classList.add('is-active');
    tab.setAttribute('aria-selected', 'true');
    state.format = tab.dataset.format;
    els.idFields.style.display = state.format === 'id' ? 'grid' : 'none';
    render();
  });
});

els.uploadZone.addEventListener('click', () => els.fileInput.click());
els.uploadZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); els.fileInput.click(); }
});
els.fileInput.addEventListener('change', () => { handleFile(els.fileInput.files[0]); els.fileInput.value = ''; });

['dragenter', 'dragover'].forEach((ev) =>
  els.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); els.uploadZone.classList.add('is-drag'); }));
['dragleave', 'drop'].forEach((ev) =>
  els.uploadZone.addEventListener(ev, (e) => { e.preventDefault(); els.uploadZone.classList.remove('is-drag'); }));
els.uploadZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFile(f);
});

els.removePhoto.addEventListener('click', (e) => { e.stopPropagation(); clearPhoto(); });
els.generateBtn.addEventListener('click', () => render());
els.downloadBtn.addEventListener('click', downloadPNG);
els.shareBtn.addEventListener('click', shareToX);
els.shuffleBtn.addEventListener('click', shuffleClass);

let fieldTimer = null;
[els.nameInput, els.stackInput].forEach((inp) => {
  inp.addEventListener('input', () => {
    clearTimeout(fieldTimer);
    fieldTimer = setTimeout(() => {
      const cls = pickClass(els.nameInput.value, els.stackInput.value, state.classSeed);
      els.classInput.value = cls;
      render();
    }, 200);
  });
});

/* ══════════ BOOT ══════════ */

els.classInput.value = pickClass('', '', 0);

window.__app = {
  setPhoto, clearPhoto, render, renderID, renderPFP,
  pickClass, hashStr, captionFor, downloadPNG, shareToX,
  ensureFonts, loadAsset, shareLink, buildPayload, cardJPEG,
  state, els, BRAND,
};

// Warm the render pipeline at boot: fonts + always-used assets load in the
// background so the first GENERATE finishes in one frame instead of waiting
// on network fetches.
(function () {
  ensureFonts().catch(() => {});
  loadAsset('assets/Sun_rise.png');
  loadAsset('assets/2-47.svg');
  loadAsset('assets/goa_hindi.svg');
})();
