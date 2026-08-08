const fs = require('fs');

(async () => {
  const jpeg = fs.readFileSync('assets/og-preview-2026.jpg');
  const fd = new FormData();
  fd.append('files[]', new Blob([jpeg], { type: 'image/jpeg' }), 'card.jpg');
  const r = await fetch('https://uguu.se/upload', { method: 'POST', body: fd, headers: { 'User-Agent': 'curl/8.4.0' } });
  const j = await r.json();
  const url = j && j.files && j.files[0] && j.files[0].url;
  console.log('uguu:', r.status, 'url:', url);
  if (url) {
    const img = await fetch(url);
    const buf = Buffer.from(await img.arrayBuffer());
    console.log('  fetch back:', img.status, img.headers.get('content-type'), buf.length, 'magic:', buf[0] === 0xff && buf[1] === 0xd8);
  }
})();