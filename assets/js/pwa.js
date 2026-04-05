/**
 * DyList PWA Module
 * Progressive Web App functionality
 */

let deferredPrompt;

// Service Worker Code (registrado via Blob)
const swCode = `
self.addEventListener("install", (e) => {
  self.skipWaiting();
  console.log('[SW] Instalado');
});

self.addEventListener("activate", (e) => {
  console.log('[SW] Ativado');
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.open("dylist-cache-v2").then(cache => {
      return fetch(e.request)
        .then(response => {
          try {
            cache.put(e.request, response.clone());
          } catch(err) {
            console.warn('[SW] Cache error:', err);
          }
          return response;
        })
        .catch(() => cache.match(e.request));
    })
  );
});
`;

// Registrar Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const blob = new Blob([swCode], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);
      
      navigator.serviceWorker.register(swUrl)
        .then(reg => {
          logger.success('Service Worker registrado', { scope: reg.scope });
        })
        .catch(err => {
          logger.error('Falha ao registrar SW', { error: err.message });
        });
    } catch (err) {
      logger.error('Erro ao criar Service Worker', { error: err.message });
    }
  } else {
    logger.warn('Service Workers não suportados');
  }
}

// Capturar evento de instalação
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    // CORREÇÃO: Usar flex para manter o layout correto
    installBtn.style.display = 'flex';
    logger.info('Prompt de instalação PWA capturado');
  }
});

// Instalar PWA
async function installPWA() {
  const installBtn = document.getElementById('installAppBtn');
  
  if (!deferredPrompt) {
    logger.warn('Prompt de instalação não disponível');
    alert("A instalação PWA só funciona em navegadores compatíveis (Chrome/Edge/Brave Android) ou o app já está instalado.");
    return;
  }
  
  logger.info('Solicitando instalação PWA');
  deferredPrompt.prompt();
  
  const result = await deferredPrompt.userChoice;
  
  if (result.outcome === 'accepted') {
    logger.trackPWAInstall();
    logger.success('PWA instalado');
    if (installBtn) installBtn.style.display = 'none';
  } else {
    logger.info('Instalação PWA recusada');
  }
  
  deferredPrompt = null;
}

// Evento de instalação concluída
window.addEventListener('appinstalled', () => {
  logger.trackPWAInstall();
  logger.success('App instalado no dispositivo');
  
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) installBtn.style.display = 'none';
});

// Detectar se está rodando como PWA
function isRunningAsPWA() {
  const isPWA = 
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  
  if (isPWA) {
    logger.info('Rodando como PWA');
  }
  
  return isPWA;
}

// Verificar atualizações do SW
function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update();
        logger.debug('Verificando atualizações do SW');
      }
    });
  }
}

// Inicialização PWA
document.addEventListener('DOMContentLoaded', () => {
  // Registrar Service Worker
  registerServiceWorker();
  
  // Verificar se está rodando como PWA
  isRunningAsPWA();
  
  // Botão de instalação
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) {
    installBtn.addEventListener('click', installPWA);
  }
  
  // Verificar atualizações a cada 30 minutos
  setInterval(checkForUpdates, 30 * 60 * 1000);
  
  logger.info('Módulo PWA inicializado');
});
