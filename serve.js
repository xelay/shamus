#!/usr/bin/env node
// Сервер для локальной разработки без внешних зависимостей — нужен только Node.js.
// Существует, чтобы не зависеть от того, установлен ли у вас Python и как именно
// (на Windows команда "python3" часто перехватывается заглушкой Microsoft Store).
// Запуск: node serve.js [порт]   (по умолчанию 8000)
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.argv[2]) || 8000;
const root = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(root, urlPath);

  if (!filePath.startsWith(root)) { res.writeHead(403); res.end('Forbidden'); return; }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found: ' + urlPath); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(port, () => {
  console.log(`Shamus-like dev server: http://localhost:${port}/`);
  console.log('Ctrl+C — остановить');
});
