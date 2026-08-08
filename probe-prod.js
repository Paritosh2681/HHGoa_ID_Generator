const fakeJpeg = Buffer.alloc(64, 1).toString('base64');
const obj = { n: 'ABHISHEK JHA', s: 'ELECTRONICS', c: 'TRIANGLE WRANGLER', f: 'id', img: 'data:image/jpeg;base64,' + fakeJpeg };
const payload = Buffer.from(JSON.stringify(obj)).toString('base64url');
console.log('payload chars:', payload.length);
(async () => {
  const base = 'https://hhgoa-id-generator-inky.vercel.app';
  const h = await fetch(base + '/share/' + payload);
  const txt = await h.text();
  console.log('status', h.status, '| body head:', txt.slice(0, 300));
  const p = await fetch(base + '/api/png/' + payload);
  console.log('png status', p.status, (await p.text()).slice(0, 120));
})();