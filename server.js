const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  const clean = decodeURIComponent((req.url || '/').split('?')[0]);
  const rel = clean === '/' ? '/index.html' : clean;
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end('Forbidden'); }

  fs.stat(file, (err, stat) => {
    if (!err && stat.isDirectory()) return serve(path.join(file, 'index.html'));
    serve(file, err);
  });

  function serve(target, statErr) {
    if (statErr) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache'
    });
    fs.createReadStream(target).pipe(res);
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log('RZ localhost server: http://localhost:' + port);
  if (process.platform === 'win32') {
    execFile('cmd', ['/c', 'start', 'http://localhost:' + port], { windowsHide: true });
  }
});
