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

function drawCoverImage(ctx, img, dx, dy, dw, dh, radius) {
  ctx.save();
  roundRect(ctx, dx, dy, dw, dh, radius || 0);
  ctx.clip();
  const c = coverCrop(img, dw, dh);
  ctx.drawImage(img, c.sx, c.sy, c.sw, c.sh, dx, dy, dw, dh);
  ctx.restore();
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

  /* ── background ── */
  ctx.fillStyle = BRAND.green;
  ctx.fillRect(0, 0, W, H);

  // ghosted sun emblem behind the photo zone (tropical texture, very subtle)
  try {
    const sun = await loadAsset('assets/Sun_rise.png');
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.drawImage(sun, 150, 142, 900, 900);
    ctx.restore();
  } catch (e) { /* optional decoration */ }

  /* ── outer frame: chunky yellow slab + cream mat line + pink pins ── */
  ctx.fillStyle = BRAND.yellow;
  roundRect(ctx, 18, 18, W - 36, H - 36, 18);
  ctx.fill();
  ctx.fillStyle = BRAND.green;
  roundRect(ctx, 38, 38, W - 76, H - 76, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,251,232,0.85)';
  ctx.lineWidth = 3;
  roundRect(ctx, 46, 46, W - 92, H - 92, 10);
  ctx.stroke();
  ctx.fillStyle = BRAND.pink;
  for (const px of [62, W - 62]) {
    for (const py of [62, H - 62]) {
      ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
    }
  }

  /* ── header meta: studio line + ID number ── */
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '600 20px ' + BRAND.mono;
  setLetterSpacing(ctx, 4);
  ctx.fillStyle = BRAND.cream;
  ctx.fillText('2:47 PM STUDIO', 66, 86);
  ctx.textAlign = 'right';
  ctx.fillText('NO. ' + idNo, W - 66, 86);
  setLetterSpacing(ctx, 0);

  /* ── official logo lockup: Hacker house wordmark + गोवा (from hhgoa.com) ── */
  const logoW = 620, logoH = Math.round(logoW * 237 / 1148); // keep source aspect
  try {
    const logo = await loadAsset('assets/Hacker_house.png');
    const goa = await loadAsset('assets/goa_hindi.svg');
    const goaW = Math.round(logoH * goa.naturalWidth / goa.naturalHeight);
    const lockupW = logoW + 18 + goaW;
    const lx = (W - lockupW) / 2;
    ctx.drawImage(logo, lx, 78, logoW, logoH);
    ctx.drawImage(goa, lx + logoW + 18, 78, goaW, logoH);
  } catch (e) {
    // fallback: text wordmark
    ctx.textAlign = 'center';
    setLetterSpacing(ctx, 3);
    const hSize = fitText(ctx, 'HACKER HOUSE', BRAND.display, '800', 900, 100, 60);
    ctx.font = `800 ${hSize}px ${BRAND.display}`;
    ctx.fillStyle = BRAND.yellow;
    ctx.fillText('HACKER HOUSE', W / 2, 178);
  }
  // yellow rule under the lockup
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(W / 2 - 120, 232, 240, 5);

  /* ── photo block ── */
  const boxX = 270, boxY = 262, box = 660;
  ctx.fillStyle = BRAND.yellow;
  roundRect(ctx, boxX + 16, boxY + 16, box, box, 14);
  ctx.fill();
  ctx.fillStyle = BRAND.white;
  roundRect(ctx, boxX - 10, boxY - 10, box + 20, box + 20, 16);
  ctx.fill();
  if (state.photo) {
    drawCoverImage(ctx, state.photo, boxX, boxY, box, box, 12);
  } else {
    ctx.fillStyle = BRAND.greenDeep;
    roundRect(ctx, boxX, boxY, box, box, 12);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,251,232,0.35)';
    ctx.font = '700 44px ' + BRAND.display;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR PHOTO HERE', W / 2, boxY + box / 2 + 14);
  }

  // yellow corner brackets around the white mat
  ctx.strokeStyle = BRAND.yellow;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  const bx = boxX - 10, by = boxY - 10, bw = box + 20, bh = box + 20, L = 54;
  const brackets = [
    [bx, by, bx + L, by, bx, by + L],
    [bx + bw - L, by, bx + bw, by, bx + bw, by + L],
    [bx, by + bh - L, bx, by + bh, bx + L, by + bh],
    [bx + bw - L, by + bh, bx + bw, by + bh, bx + bw, by + bh - L],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of brackets) {
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.moveTo(x1, y1); ctx.lineTo(x3, y3);
    ctx.stroke();
  }

  // pink ID tag over the photo corner
  ctx.save();
  ctx.translate(boxX + 24, boxY + 24);
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

  /* ── vertical edge text (left margin) ── */
  ctx.save();
  ctx.translate(66, H / 2);
  ctx.rotate(Math.PI / 2);
  ctx.font = '600 20px ' + BRAND.mono;
  setLetterSpacing(ctx, 5);
  ctx.fillStyle = 'rgba(255,251,232,0.75)';
  ctx.textAlign = 'left';
  ctx.fillText('OFFICIAL BUILDER · HH GOA 2026', 0, 0);
  ctx.restore();
  setLetterSpacing(ctx, 0);

  /* ── identity zone ── */
  // eyebrow
  ctx.textAlign = 'center';
  ctx.font = '600 22px ' + BRAND.mono;
  setLetterSpacing(ctx, 7);
  ctx.fillStyle = BRAND.cream;
  ctx.fillText('ADMIT ONE · HH GOA 2026', W / 2, 1000);
  setLetterSpacing(ctx, 0);

  // name (big, white, hard drop shadow)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.30)';
  ctx.shadowOffsetY = 4;
  ctx.shadowBlur = 0;
  const nSize = fitText(ctx, name, BRAND.display, '800', 980, 118, 54);
  ctx.font = `800 ${nSize}px ${BRAND.display}`;
  ctx.fillStyle = BRAND.white;
  ctx.fillText(name, W / 2, 1106);
  ctx.restore();

  // yellow underline
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(W / 2 - 130, 1134, 260, 7);

  // stack chip (cream, pink hard shadow, slight tilt)
  ctx.save();
  ctx.translate(W / 2, 1200);
  ctx.rotate(-1.5 * Math.PI / 180);
  const sSize = fitText(ctx, stack, BRAND.mono, '700', 900, 30, 16);
  ctx.font = `700 ${sSize}px ${BRAND.mono}`;
  setLetterSpacing(ctx, 4);
  const sW = textWidth(ctx, stack);
  const chipW = sW + 92, chipH = 64;
  ctx.fillStyle = BRAND.pink;
  roundRect(ctx, -chipW / 2 + 7, -chipH / 2 + 7, chipW, chipH, 10);
  ctx.fill();
  ctx.fillStyle = BRAND.cream;
  roundRect(ctx, -chipW / 2, -chipH / 2, chipW, chipH, 10);
  ctx.fill();
  ctx.fillStyle = BRAND.black;
  ctx.textAlign = 'center';
  ctx.fillText(stack, 0, 9);
  ctx.restore();
  setLetterSpacing(ctx, 0);

  // builder class chip (yellow, black shadow, opposite tilt, overlaps stack)
  ctx.save();
  ctx.translate(W / 2, 1268);
  ctx.rotate(2 * Math.PI / 180);
  const clsText = 'CLASS · ' + cls;
  const cSize = fitText(ctx, clsText, BRAND.display, '700', 960, 40, 26);
  ctx.font = `700 ${cSize}px ${BRAND.display}`;
  setLetterSpacing(ctx, 2);
  const cW = textWidth(ctx, clsText);
  const cH = 74;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, -cW / 2 - 38 + 8, -cH / 2 - 16 + 8, cW + 76, cH + 32, 10);
  ctx.fill();
  ctx.fillStyle = BRAND.yellow;
  roundRect(ctx, -cW / 2 - 38, -cH / 2 - 16, cW + 76, cH + 32, 10);
  ctx.fill();
  ctx.fillStyle = BRAND.black;
  ctx.textAlign = 'center';
  ctx.fillText(clsText, 0, 12);
  ctx.restore();
  setLetterSpacing(ctx, 0);

  /* ── bottom cream band (ticket stub) ── */
  const bandY = 1336, bandH = 126;
  ctx.fillStyle = BRAND.yellow;
  ctx.fillRect(38, bandY - 6, W - 76, 6);
  ctx.fillStyle = BRAND.cream;
  ctx.fillRect(38, bandY, W - 76, bandH);
  // perforation notches (ticket punch) at both edges of the band line
  ctx.fillStyle = BRAND.cream;
  ctx.beginPath(); ctx.arc(0, bandY, 20, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W, bandY, 20, 0, Math.PI * 2); ctx.fill();

  // left: slogan
  ctx.textAlign = 'left';
  ctx.fillStyle = BRAND.green;
  ctx.font = '800 36px ' + BRAND.display;
  setLetterSpacing(ctx, 1);
  ctx.fillText('LESS NOISE.', 66, 1400);
  ctx.font = '800 52px ' + BRAND.display;
  ctx.fillText('MORE SIGNAL.', 66, 1450);

  // center: barcode (seeded by name+stack)
  ctx.fillStyle = BRAND.black;
  const bcX = W / 2 - 110, bcY = 1356;
  let seed = hashStr(name + stack);
  for (let i = 0; i < 44; i++) {
    // BigInt keeps the LCG exact — float64 multiplication overflows 2^53 and
    // collapses every seed to a multiple of 512 (all bars would be skipped)
    seed = Number((BigInt(seed) * 1103515245n + 12345n) % 4294967296n);
    const bw = 2 + (seed % 3) * 2;
    if (seed % 4 !== 0) ctx.fillRect(bcX + i * 5, bcY, bw, 46);
  }
  ctx.font = '600 15px ' + BRAND.mono;
  setLetterSpacing(ctx, 4);
  ctx.fillText('247 BUILDERS', bcX, bcY + 62);

  // right: date + hashtag
  ctx.textAlign = 'right';
  ctx.font = '600 19px ' + BRAND.mono;
  setLetterSpacing(ctx, 3);
  ctx.fillStyle = BRAND.black;
  ctx.fillText('GOA, INDIA · 28–31 OCT 2026', W - 66, 1400);
  ctx.font = '700 25px ' + BRAND.mono;
  setLetterSpacing(ctx, 2);
  ctx.fillStyle = BRAND.green;
  ctx.fillText('#FRAMEINGOA', W - 66, 1446);
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
      els.shareBtn.disabled = false;
      window.__app && (window.__app.lastCanvas = cv);
    } catch (e) {
      console.error('render failed', e);
    }
  }, 120);
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
  state.fileName = fileName || '';
  els.uploadInner.hidden = true;
  els.uploadPreview.hidden = false;
  els.previewImg.src = img.currentSrc || img.src;
  render();
}

function clearPhoto() {
  state.photo = null;
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

function captionFor() {
  const url = location.href.split('#')[0];
  const name = (els.nameInput.value || 'me').trim().toUpperCase();
  if (state.format === 'id') {
    return `My HH Goa 2026 Builder ID just dropped 🏝️ ${name}. Make yours in one pass → ${url} #FrameInGoa`;
  }
  return `New PFP, who dis? 🏝️ HH Goa 2026. Frame yours → ${url} #FrameInGoa`;
}

async function shareToX() {
  if (!state.rendered) return;
  const text = captionFor();
  try {
    const cv = els.canvas;
    const blob = await canvasToBlob(cv);
    const file = new File([blob], 'hhgoa-2026.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], text, title: 'HH Goa 2026' });
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return; // user cancelled
  }
  // fallback: X intent with link (OG preview shows the graphic)
  // NOTE: the intent's url= param already appends the link — don't duplicate it inline
  const url = encodeURIComponent(location.href.split('#')[0]);
  const t = encodeURIComponent(text.replace(/\s*→\s*\S+\s+(?=#FrameInGoa)/, ' '));
  window.open(`https://twitter.com/intent/tweet?text=${t}&url=${url}`, '_blank', 'noopener');
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
  state, els, BRAND,
};
