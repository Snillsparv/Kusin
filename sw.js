/* ═══════════════ Kusinsemestern: service worker 📲 ═══════════════
   Gör sajten installerbar på hemskärmen och läsbar utan täckning – nyttigt
   i Thy, där mobilnätet inte alltid når ända ut till klitterna.

   Strategi:
   · sidor (navigeringar): nätet först, cachen som reserv → alltid färskt
     när täckning finns, men sidan funkar ändå på färjan
   · skalet (css, js, ikoner, ansikten): cache först med tyst uppdatering
     i bakgrunden → snabb start, nya versioner slår igenom nästa gång
   · publicerade data (anpassningar.json, hattar.json m.fl. med ?v=):
     alltid nätet först, så att texter och partyhattar aldrig fastnar
   · film och kartrutor cachas inte – de skulle äta upp telefonen */

const VERSION = 'v22';
const CACHE = `kusin-${VERSION}`;

// Sidskalet som ska finnas offline. Stora medier (mp4) står med flit inte här.
const SKAL = [
  './',
  'index.html',
  'stallet.html',
  'aktiviteter.html',
  'action.html',
  'matlagen.html',
  'danskskolan.html',
  'korsika.html',
  'lottningen.html',
  'cupen.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'larv/01.mp3',
  'larv/02.mp3',
  'img/app/ikon-192.png',
  'img/app/ikon-512.png',
  'img/app/apple-touch-icon.png',
];

const ejCachebart = (url) =>
  /\.mp4$/i.test(url.pathname) ||
  /tile\.openstreetmap\.org|tile\.opentopomap\.org/.test(url.hostname);

const arFontFil = (url) =>
  url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // En fil som strular får inte sänka hela installationen.
    await Promise.allSettled(SKAL.map((u) => cache.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const namn = await caches.keys();
    await Promise.all(namn.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;                      // publiceringar går rakt ut
  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (ejCachebart(url)) return;
  if (req.headers.has('range')) return;                  // delhämtningar (video/ljud)

  const egen = url.origin === self.location.origin;
  if (!egen && !arFontFil(url)) return;                  // t.ex. GitHub-API:t

  // Sidor: nätet först, cachen som reserv.
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const svar = await fetch(req);
        const cache = await caches.open(CACHE);
        cache.put(req, svar.clone());
        return svar;
      } catch (e) {
        const cache = await caches.open(CACHE);
        return (await cache.match(req, { ignoreSearch: true })) ||
          (await cache.match('index.html')) ||
          new Response('Offline – och sidan finns inte sparad än.', {
            status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
      }
    })());
    return;
  }

  // Publicerade data (?v=...): nätet först så att inget fastnar i cachen.
  if (egen && url.search) {
    event.respondWith((async () => {
      try {
        const svar = await fetch(req);
        if (svar.ok) {
          const cache = await caches.open(CACHE);
          cache.put(req, svar.clone());
        }
        return svar;
      } catch (e) {
        const cache = await caches.open(CACHE);
        const traff = await cache.match(req, { ignoreSearch: true });
        if (traff) return traff;
        throw e;
      }
    })());
    return;
  }

  // Resten (skalet): cachen först, uppdatera tyst i bakgrunden.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const traff = await cache.match(req);
    const nat = fetch(req).then((svar) => {
      if (svar && (svar.ok || svar.type === 'opaque')) cache.put(req, svar.clone());
      return svar;
    }).catch(() => null);
    return traff || (await nat) || new Response('', { status: 504 });
  })());
});
