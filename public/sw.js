const CACHE_NAME = 'medpulse-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch((err) => {
        console.warn('Initial caching deferred:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network-first falling back to Cache)
self.addEventListener('fetch', (e) => {
  // Only handle GET requests and local scope
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Clone response and put in cache if valid
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache on network failure
        return caches.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If fallback fails, return simple offline message if document is requested
          if (e.request.headers.get('accept').includes('text/html')) {
            return new Response(`
              <div style="font-family: sans-serif; text-align: center; padding: 50px; direction: rtl;">
                <h2>أنت غير متصل بالإنترنت حالياً 🌐</h2>
                <p>يرجى التحقق من اتصال الشبكة وإعادة المحاولة للولوج إلى منصة MedPulse الطبية.</p>
                <button onclick="window.location.reload()" style="background: #008080; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">إعادة المحاولة</button>
              </div>
            `, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
        });
      })
  );
});
