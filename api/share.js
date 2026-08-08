// HH Goa ID Generator — serverless share page
//
//   GET /share/<payload>               → the unique card page (HTML + og tags)
//   GET /api/png/<payload>             → the card image (og:image target)
//
// Payload = base64url(JSON { n:name, s:stack, c:class, f:format, img })
// img is either a catbox URL (short) or an embedded data: JPEG (fallback).

const B64RE = /^[A-Za-z0-9_-]+$/;

function decodePayload(raw) {
  if (!raw || !B64RE.test(raw)) return null;
  const json = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(json);
}

function absUrl(req, path) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}${path}`;
}

// POST body = raw JPEG bytes (or base64) → upload to catbox → {url}
// ponytail: catbox anon upload, no key, images persist. Fallback lives client-side.
async function uploadImage(req, res) {
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    let buf = Buffer.concat(chunks);
    if (buf.length > 0 && buf[0] !== 0xff) {
      // not a JPEG magic → treat body as base64 of the image
      const b = buf.toString('utf8').trim();
      buf = Buffer.from(b.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    }
    if (!buf.length || buf[0] !== 0xff || buf[1] !== 0xd8) {
      const m = /base64,([A-Za-z0-9+/=]+)/.exec(req.headers['content-type'] || '') || /base64,([A-Za-z0-9+/=]+)/.exec((req.body && req.body.b64) || '');
      if (m) buf = Buffer.from(m[1], 'base64');
    }
    if (buf.length < 100 || buf[0] !== 0xff || buf[1] !== 0xd8) {
      res.statusCode = 400; res.end('bad image'); return;
    }
    const fd = new FormData();
    fd.append('reqtype', 'fileupload');
    fd.append('fileToUpload', new Blob([buf], { type: 'image/jpeg' }), 'card.jpg');
    // catbox rejects undici's default UA with "Invalid uploader"
    const r = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST', body: fd,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36' },
    });
    const txt = (await r.text()).trim();
    if (/^https:\/\/(files\.)?catbox\.moe\/.+\.(jpg|jpeg|png|webp)$/.test(txt)) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ url: txt }));
      return;
    }
    res.statusCode = 502; res.end('upload failed: ' + txt.slice(0, 80));
  } catch (e) {
    res.statusCode = 502; res.end('upload error: ' + e.message);
  }
}

function CARD_HTML(p, ogImage) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${p.n || 'Builder'} — HH Goa 2026 Pass</title>
<meta name="description" content="My HH Goa 2026 Builder ID. Frame yours with #FrameInGoa."/>
<meta property="og:type" content="website"/>
<meta property="og:title" content="${p.n || 'Builder'} BUILDER • ${p.c || 'HH Goa 2026'}"/>
<meta property="og:description" content="Just locked in my spot for Hacker House Goa 2026 🌴 #FrameInGoa #HHGoa2026 #HackerHouseGoa"/>
<meta property="og:image" content="${ogImage}"/>
<meta property="og:image:alt" content="HH Goa 2026 Builder ID — ${p.n || ''}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${p.n || 'Builder'} BUILDER · ${p.c || 'HH Goa 2026'}"/>
<meta name="twitter:description" content="Just locked in my spot for Hacker House Goa 2026 🌴 #FrameInGoa #HHGoa2026"/>
<meta name="twitter:image" content="${ogImage}"/>
<meta name="robots" content="noindex"/>
<style>
  html,body{margin:0;background:#06301b;color:#fff;font-family:system-ui,sans-serif;min-height:100%}
  .wrap{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:24px}
  h2{margin:18px 0 4px;letter-spacing:.14em;font-size:14px;opacity:.85}
  h1{margin:0 0 24px;font-size:clamp(22px,4vw,36px);text-align:center}
  .card{max-width:min(86vw,420px);border-radius:18px;overflow:hidden;box-shadow:0 12px 44px rgba(0,0,0,.45)}
  .card img{display:block;width:100%;height:auto}
  a.cta{display:inline-block;margin-top:26px;padding:13px 26px;border-radius:999px;background:#ffe14d;color:#0b2e1a;font-weight:700;text-decoration:none;font-size:15px}
  .sub{margin-top:12px;font-size:13px;opacity:.65}
</style>
</head>
<body>
<div class="wrap">
  <img class="card" src="${p.img && p.img.startsWith('http') ? p.img : (p.img || '')}" alt="HH Goa 2026 Builder ID for ${p.n || ''}"/>
  <h2>OFFICIAL SHORTLISTING TOOL · TASK #1</h2>
  <h1>${p.n || 'Builder'} BUILDER · ${p.c || ''}</h1>
  <a class="cta" href="/">BUILD YOURS →</a>
  <div class="sub">#FrameInGoa · #HHGoa2026 · Hacker House Goa</div>
</div>
</body>
</html>`;
}

module.exports = async (req, res) => {
  // POST /api/upimg → relay the card JPEG to catbox; returns {url}
  if (req.method === 'POST' && ((req.query && req.query.up) || /upimg/.test(req.url))) {
    return uploadImage(req, res);
  }
  // Rewritten routes: /share/<payload> → /api/share?p=<payload>, /api/png/<payload> → ?png=1&p=<payload>
  const payload = (req.query && req.query.p) || req.url.split('/').filter(Boolean).pop();
  const isPng = !!((req.query && req.query.png) || (req.url.split('/')[1] === 'api' && req.url.split('/')[2] === 'png'));
  let p = null;
  try { p = decodePayload(payload); } catch (e) { p = null; }
  if (!p) { res.statusCode = 404; res.end('Not found'); return; }

  if (isPng) {
    if (p.img && p.img.startsWith('http')) {
      // catbox URL — 302 to it; crawlers and browsers follow fine
      res.statusCode = 302; res.setHeader('Location', p.img); res.end();
      return;
    }
    if (p.img && p.img.startsWith('data:image/')) {
      const m = p.img.match(/^data:image\/(jpeg|png);base64,(.+)$/);
      if (!m) { res.statusCode = 404; res.end('bad'); return; }
      const buf = Buffer.from(m[2], 'base64');
      res.setHeader('Content-Type', m[1] === 'png' ? 'image/png' : 'image/jpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.end(buf);
      return;
    }
    res.statusCode = 404; res.end('no image');
    return;
  }

  // og:image prefers the short catbox URL; embedded data: falls back to the
  // /api/png/<payload> endpoint so X still renders a card preview.
  const ogImage = p.img && p.img.startsWith('http')
    ? p.img
    : absUrl(req, '/api/png/' + payload);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.end(CARD_HTML(p, ogImage));
};