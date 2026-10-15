// เก็บไฟล์แอปไว้ในเครื่องเพื่อใช้ออฟไลน์
// เปลี่ยน VERSION ทุกครั้งที่อัปเดตแอป
const VERSION = 'v1-e2';
const CACHE = 'gut-log-' + VERSION;
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/app.css',
  'css/fonts.css',
  'fonts/plex-thai-looped-400-thai.woff2',
  'fonts/plex-thai-looped-400-latin.woff2',
  'fonts/plex-thai-looped-500-thai.woff2',
  'fonts/plex-thai-looped-500-latin.woff2',
  'fonts/plex-thai-looped-600-thai.woff2',
  'fonts/plex-thai-looped-600-latin.woff2',
  'icons/icon-180.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'js/vendor/preact-htm.js',
  'js/main.js',
  'js/db.js',
  'js/store.js',
  'js/rules.js',
  'js/icons.js',
  'js/ui.js',
  'js/screens/today.js',
  'js/screens/log.js',
  'js/screens/history.js',
  'js/screens/day.js',
  'js/screens/trends.js',
  'js/stats.js',
  'js/export.js',
  'js/screens/settings.js',
  'js/screens/manage.js',
  'js/screens/report.js'
];

self.addEventListener('install', (e) => {
  // cache: 'reload' = ดึงจากเซิร์ฟเวอร์จริง ไม่ใช้สำเนาเก่าที่เบราว์เซอร์จำไว้ (GitHub ให้จำได้ 10 นาที)
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('gut-log-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ใช้ไฟล์ในเครื่องก่อนเสมอ (เร็วและใช้ออฟไลน์ได้) แล้วอัปเดตจากเน็ตเบื้องหลัง
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const fresh = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' })
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
