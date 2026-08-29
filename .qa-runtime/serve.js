'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.argv[2] || 8790);
const ROOT = path.resolve(__dirname, '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.zip': 'application/zip',
  '.md': 'text/plain; charset=utf-8'
};

const server = http.createServer(function (req, res) {
  const urlPath = (req.url || '/').split('?')[0].split('#')[0];
  /* FR-006: swallow the browser-default /favicon.ico request with 204 so it
     never 404s (a 404 would fall through to a browser `console.error`, which
     violates the `consoleErrors === []` gate). */
  if (urlPath === '/favicon.ico' || /^\/favicon\.ico\?v=/.test(req.url || '')) {
    res.writeHead(204, { 'Content-Type': 'image/x-icon', 'Cache-Control': 'public, max-age=86400' });
    res.end();
    return;
  }
  let p = decodeURIComponent(urlPath);
  if (p === '/' || p === '') p = '/index.html';
  const fp = path.normalize(path.join(ROOT, p));
  if (!fp.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }
  fs.readFile(fp, function (err, buf) {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 not found: ' + p); return; }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*' });
    res.end(buf);
  });
});

server.listen(PORT, '127.0.0.1', function () {
  console.log('SERVE_READY http://127.0.0.1:' + PORT + ' root=' + ROOT);
});
