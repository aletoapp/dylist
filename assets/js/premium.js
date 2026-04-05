/**
 * DyList Premium Engine v3.0
 * Bloqueio de anúncios silencioso — zero intervenção do usuário
 * Funciona nos bastidores: CSS + DOM Observer + SponsorSkip
 */

class DyListPremium {
  constructor() {
    this.enabled = true;
    this.blockedCount = 0;
    this.sponsorDatabase = {};

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.loadSponsorDatabase();
    this.applyCSSBlocking();
    this.startDOMObserver();
    this.initSponsorSkip();

    if (typeof logger !== 'undefined') {
      logger.success('DyList Premium ativo — bloqueio silencioso');
    }
  }

  // ======================================
  // CSS Blocking — nunca toca no player
  // ======================================
  applyCSSBlocking() {
    const style = document.createElement('style');
    style.id = 'dylist-premium-css';
    style.textContent = `
      [class*="ad-container"]:not(#player):not(#player *),
      [class*="advertisement"]:not(#player):not(#player *),
      [id*="google_ads"]:not(#player):not(#player *),
      [data-ad-slot]:not(#player):not(#player *),
      iframe[src*="doubleclick"]:not(#player):not(#player *),
      iframe[src*="googlesyndication"]:not(#player):not(#player *) {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        width: 0 !important;
      }

      /* NUNCA bloquear o player do YouTube */
      #player,
      #player iframe,
      iframe[src*="youtube.com/embed"],
      iframe[src*="youtube-nocookie.com/embed"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ======================================
  // DOM Observer — cuidadoso com o player
  // ======================================
  startDOMObserver() {
    const adSelectors = [
      '[class*="ad-banner"]',
      '[class*="advertising"]',
      '[id*="ad-container"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]'
    ];

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const isPlayer = node.id === 'player' ||
            node.closest?.('#player') ||
            (node.tagName === 'IFRAME' && node.src?.includes('youtube.com/embed'));
          if (!isPlayer) this.checkAndRemoveAd(node, adSelectors);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  checkAndRemoveAd(element, selectors) {
    if (element.id === 'player' || element.closest?.('#player')) return;
    selectors.forEach(selector => {
      if (element.matches?.(selector)) {
        element.remove();
        this.blockedCount++;
      }
    });
  }

  // ======================================
  // SponsorSkip — pula segmentos salvos
  // ======================================
  initSponsorSkip() {
    setInterval(() => this.checkSponsorSegments(), 1000);
  }

  checkSponsorSegments() {
    if (typeof player === 'undefined' || !player || typeof player.getCurrentTime !== 'function') return;
    try {
      const videoData = player.getVideoData();
      if (!videoData?.video_id) return;
      const videoId = videoData.video_id;
      const currentTime = player.getCurrentTime();
      if (this.isInSponsorSegment(videoId, currentTime)) {
        const nextTime = this.getNextNonSponsorTime(videoId, currentTime);
        player.seekTo(nextTime, true);
      }
    } catch (e) { /* silencioso */ }
  }

  isInSponsorSegment(videoId, time) {
    const segments = this.sponsorDatabase[videoId];
    if (!segments?.length) return false;
    return segments.some(seg => time >= seg.start && time <= seg.end);
  }

  getNextNonSponsorTime(videoId, currentTime) {
    const segments = this.sponsorDatabase[videoId];
    if (!segments) return currentTime;
    const seg = segments.find(s => currentTime >= s.start && currentTime <= s.end);
    return seg ? seg.end + 0.5 : currentTime;
  }

  loadSponsorDatabase() {
    try {
      const saved = localStorage.getItem('youlist_sponsor_segments');
      this.sponsorDatabase = saved ? JSON.parse(saved) : {};
    } catch (e) {
      this.sponsorDatabase = {};
    }
  }

  getStats() {
    const totalSegments = Object.values(this.sponsorDatabase)
      .reduce((sum, segs) => sum + segs.length, 0);
    return {
      enabled: this.enabled,
      blockedAds: this.blockedCount,
      totalSegments,
      videosWithSegments: Object.keys(this.sponsorDatabase).length
    };
  }
}

// Inicialização automática e silenciosa
window.youlistAdBlocker = new DyListPremium();

console.log('%c🛡️ DyList Premium Engine ativo — bloqueio silencioso', 'color: #10b981; font-size: 13px; font-weight: bold;');
