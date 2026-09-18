// Service worker for offline play / installability.
//
// Strategy: network-first, falling back to cache when offline, and writing
// every successful response back into the cache. This is deliberately NOT
// cache-first: the project is still under active development (game code and
// src/data/room-overrides.json change often), and a cache-first strategy
// would keep serving stale files after an update until the cache was
// manually cleared. Network-first costs one extra round-trip per request
// while online (negligible on localhost / a personal connection) but always
// shows the current files, while still giving full offline support once
// something has been fetched at least once.
const CACHE_NAME = 'shamus-like-v1';

const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.json',
  'serve.js',
  'src/main.js',
  'src/engine/loop.js',
  'src/engine/input.js',
  'src/engine/collision.js',
  'src/engine/audio.js',
  'src/engine/save.js',
  'src/engine/prng.js',
  'src/engine/touchControls.js',
  'src/game/constants.js',
  'src/game/sprites.js',
  'src/game/levelgen.js',
  'src/game/room.js',
  'src/game/world.js',
  'src/game/hud.js',
  'src/game/render.js',
  'src/game/entities/projectile.js',
  'src/game/entities/player.js',
  'src/game/entities/enemy.js',
  'src/game/entities/shadow.js',
  'src/game/entities/pickups.js',
  'src/data/room-overrides.json',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => { /* best effort */ })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
