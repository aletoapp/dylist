/**
 * YouList Service Worker
 * Cache Strategy: Network First, Cache Fallback
 */

const CACHE_NAME = "youlist-cache-v2";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json",
  "./assets/css/styles.css",
  "./assets/js/logger.js",
  "./assets/js/player.js",
  "./assets/js/app.js",
  "./assets/js/pwa.js"
];

// Instalação
self.addEventListener("install", (event) => {
  console.log('[SW] Instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[SW] Erro ao cachear:', err);
      })
  );
});

// Ativação
self.addEventListener("activate", (event) => {
  console.log('[SW] Ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch - Network First
self.addEventListener("fetch", (event) => {
  // Ignorar requisições do YouTube (CORS)
  if (event.request.url.includes('youtube.com') || 
      event.request.url.includes('ytimg.com') ||
      event.request.url.includes('googlevideo.com')) {
    return;
  }
  
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone antes de cachear
        const responseClone = response.clone();
        
        // Cachear apenas respostas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Fallback para cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Fallback para index.html em navegação
            if (event.request.destination === 'document') {
              return caches.match('./index.html');
            }
          });
      })
  );
});