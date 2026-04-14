/*
 * Service Worker — turko.by
 * Стратегии:
 *   - App Shell (fonts, icons, logos): Cache First, precache при установке
 *   - CSS / JS: Cache First, lazy caching при первом запросе
 *   - /data/*.json: Network First (всегда свежие данные, кеш — запасной вариант)
 *   - /images/*, /media/*: Cache First, lazy caching
 *   - /api/*, *.php, /adminka_objects/*: Network Only (не кешируем)
 */

const CACHE_STATIC  = 'sw-static-v1';
const CACHE_DATA    = 'sw-data-v2';
const CACHE_IMAGES  = 'sw-images-v1';

const ALL_CACHES = [CACHE_STATIC, CACHE_DATA, CACHE_IMAGES];

/* ─── App Shell: то, что кешируем сразу при установке ─── */
const APP_SHELL = [
  /* Шрифты */
  '/fonts/inter/Inter-Regular.woff2',
  '/fonts/inter/Inter-Medium.woff2',
  '/fonts/inter/Inter-SemiBold.woff2',
  '/fonts/inter/Inter-Bold.woff2',
  '/fonts/montserrat/Montserrat-Regular.woff2',
  '/fonts/montserrat/Montserrat-Medium.woff2',
  '/fonts/montserrat/Montserrat-SemiBold.woff2',
  '/fonts/montserrat/Montserrat-Bold.woff2',
  '/fonts/montserrat/Montserrat-ExtraBold.woff2',
  /* FontAwesome иконки */
  '/css/fontawesome/webfonts/fa-solid-900.woff2',
  '/css/fontawesome/webfonts/fa-regular-400.woff2',
  '/css/fontawesome/webfonts/fa-brands-400.woff2',
  /* Логотипы и фавиконки */
  '/images/logo-dark.svg',
  '/images/logo-light.svg',
  '/images/logo-dark.webp',
  '/images/logo-light.webp',
  '/favicon.ico',
  '/favicon.svg',
  '/apple-touch-icon.png',
];

/* ─── Install: кешируем App Shell ─── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => {
      return cache.addAll(APP_SHELL);
    }).then(() => self.skipWaiting())
  );
});

/* ─── Activate: удаляем устаревшие кеши ─── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => !ALL_CACHES.includes(key))
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ─── Fetch: маршрутизация по типу ресурса ─── */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Только GET-запросы, только HTTP/HTTPS */
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  /* Network Only: API, PHP, панель администратора */
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/adminka_objects/') ||
    url.pathname.endsWith('.php')
  ) {
    return;
  }

  /* Network First: JSON данные — всегда свежие, кеш только как запасной вариант */
  if (url.pathname.startsWith('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(networkFirst(request, CACHE_DATA));
    return;
  }

  /* Cache First: статика (CSS, JS, шрифты, библиотеки) */
  if (
    url.pathname.startsWith('/css/') ||
    url.pathname.startsWith('/js/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/libs/')
  ) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  /* Cache First: изображения и медиа */
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/media/')
  ) {
    event.respondWith(cacheFirst(request, CACHE_IMAGES));
    return;
  }

  /* Cache First: внешние ресурсы (CDN — Bootstrap, FontAwesome и т.д.) */
  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
    return;
  }

  /* Всё остальное — не трогаем (HTML страницы, PHP) */
});

/* ─── Стратегия: Cache First ─── */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

/* ─── Стратегия: Network First (с кешем как запасным вариантом) ─── */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response('', { status: 503 });
  }
}
