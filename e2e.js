function b64ToJpeg(b64) {
  return Buffer.from(b64, 'base64');
}

(async () => {
  const fs = require('fs');
  const jpeg = fs.readFileSync('assets/og-preview-2026.jpg');

  // direct with browser UA
  const fd = new FormData();
  fd.append('reqtype', 'fileupload');
  fd.append('fileToUpload', new Blob([jpeg], { type: 'image/jpeg' }), 'card.jpg');
  const r = await fetch('https://catbox.moe/user/api.php', {
    method: 'POST', body: fd,
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36' },
  });
  console.log('direct w/ UA:', r.status, (await r.text()).trim().slice(0, 80));

  // via prod relay (relay has no UA set — test adding one there is a code change; first confirm direct works from this IP)
})();