/**
 * YouList Ad Blocker System v3.2
 * Estratégia real de bloqueio de anúncios no YouTube IFrame Player
 *
 * MODO SEGURO (padrão, 2026):
 *   - CSS Blocking: oculta anúncios externos, NUNCA toca no #player
 *   - SponsorSkip: pula segmentos via seekTo() (API nativa, indetectável)
 *     → Segmentos manuais (marcados pelo usuário)
 *     → Segmentos da comunidade via API pública do SponsorBlock (sponsor.ajay.app)
 *   - DOM Observer: DESATIVADO por padrão — ativar via console se necessário:
 *       window.youlistAdBlocker.enableDOMObserver()
 *
 * SponsorBlock API:
 *   Busca automática ao iniciar cada vídeo. Segmentos ficam em cache local
 *   (youlist_sponsorblock_cache) para evitar chamadas repetidas.
 *   Tipos buscados: sponsor, intro, outro, selfpromo, interaction, preview, filler
 *   Créditos: https://sponsor.ajay.app — licença CC BY-NC-SA 4.0
 *
 * Por que DOM Observer desativado?
 *   Desde fev/2026 o YouTube detecta MutationObservers no body e aplica
 *   "buffering artificial" e force-skip como punição. O CSS Blocking é
 *   aplicado via <style> antes do player carregar e é praticamente indetectável.
 */

class YouListAdBlocker {
  constructor() {
    this.enabled = true;
    this.blockedCount = 0;
    this.sponsorDatabase = {};
    this.isMarking = false;
    this.markStartTime = null;

    // DOM Observer DESATIVADO por padrão (2026 — evita detecção pelo YouTube)
    // Para reativar: window.youlistAdBlocker.enableDOMObserver()
    this._domObserverEnabled = false;
    this._domObserver = null;

    // Controle anti-loop do skip de anúncio
    this._lastAdSkipTime = 0;
    this._adSkipCooldown = 3000;

    // SponsorBlock API — cache local e controle de requisição
    this._sbCache = {};          // { videoId: { segments: [], fetchedAt: timestamp } }
    this._sbFetching = new Set(); // IDs em requisição no momento (evita chamadas duplas)
    this._sbCacheMaxAge = 24 * 60 * 60 * 1000; // 24h em ms
    this._sbCategories = ['sponsor', 'intro', 'outro', 'selfpromo', 'interaction', 'preview', 'filler'];
    this._sbSkippedCount = 0;
    this._loadSBCache();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (typeof logger !== 'undefined') logger.info('Ad Blocker v3.1 inicializando (modo seguro 2026)...');
    this.loadSponsorDatabase();
    this.applyCSSBlocking();
    // DOM Observer desativado por padrão — reativar com enableDOMObserver() se necessário
    if (this._domObserverEnabled) this.startDOMObserver();
    this.startAdDetectionLoop();
    this.initSponsorSkip();
    this.initUI();
    if (typeof logger !== 'undefined') logger.success('Ad Blocker v3.1 ativo — modo seguro');
  }

  // API pública: reativa DOM Observer (use apenas se CSS blocking não for suficiente)
  enableDOMObserver() {
    if (this._domObserver) return;
    this._domObserverEnabled = true;
    this.startDOMObserver();
    if (typeof logger !== 'undefined') logger.warn('DOM Observer ativado manualmente — pode ser detectado pelo YouTube');
    console.warn('%c⚠️ DOM Observer ativado. Se o vídeo começar a pular para o fim, desative com: window.youlistAdBlocker.disableDOMObserver()', 'color:#f59e0b;font-weight:bold;');
  }

  disableDOMObserver() {
    if (this._domObserver) {
      this._domObserver.disconnect();
      this._domObserver = null;
    }
    this._domObserverEnabled = false;
    if (typeof logger !== 'undefined') logger.info('DOM Observer desativado');
  }

  // ══════════════════════════════════════════════════════════════════
  // DETECÇÃO E BLOQUEIO DE ANÚNCIOS NO PLAYER (núcleo da solução)
  // ══════════════════════════════════════════════════════════════════

  startAdDetectionLoop() {
    // Loop a cada 500ms para resposta rápida
    setInterval(() => this.detectAndBlockAd(), 500);
  }

  detectAndBlockAd() {
    if (!this.enabled) return;
    if (typeof player === 'undefined' || !player) return;
    if (typeof player.getPlayerState !== 'function') return;

    try {
      const now = Date.now();
      if (now - this._lastAdSkipTime < this._adSkipCooldown) return;

      const state = player.getPlayerState();
      // Só age enquanto está tocando (1) ou buffering (3)
      if (state !== 1 && state !== 3) return;

      // ── Método 1: getVideoUrl vs URL atual ──────────────────────
      // Durante anúncio, getVideoUrl() retorna uma URL diferente
      // da URL do vídeo da playlist atual
      if (typeof player.getVideoUrl === 'function' && this._currentVideoId) {
        const url = player.getVideoUrl();
        if (url && !url.includes(this._currentVideoId)) {
          this._skipAd('url-mismatch');
          return;
        }
      }

      // ── Método 2: getDuration retorna duração curta (<= 30s) ────
      // Anúncios geralmente têm duração muito curta
      if (typeof player.getDuration === 'function') {
        const duration = player.getDuration();
        if (duration > 0 && duration <= 30 && this._currentVideoDuration > 60) {
          this._skipAd('short-duration');
          return;
        }
      }

      // ── Método 3: getVideoData sem video_id ─────────────────────
      // Durante alguns anúncios, video_id fica vazio
      if (typeof player.getVideoData === 'function') {
        const data = player.getVideoData();
        if (data && this._currentVideoId && data.video_id && data.video_id !== this._currentVideoId) {
          this._skipAd('video-id-changed');
          return;
        }
      }

    } catch (e) { /* silencioso */ }
  }

  _skipAd(reason) {
    this._lastAdSkipTime = Date.now();

    try {
      if (typeof logger !== 'undefined') logger.info(`Ad Blocker: pulando anúncio (${reason})`);

      // Muta temporariamente para evitar o áudio do anúncio
      if (typeof player.mute === 'function') player.mute();

      // Avança o tempo para forçar o skip
      if (typeof player.seekTo === 'function') {
        const duration = player.getDuration?.() || 0;
        if (duration > 0) player.seekTo(duration, true);
      }

      // Tenta nextVideo depois de 800ms como fallback (300ms era curto demais — race condition)
      setTimeout(() => {
        try {
          // Reativa o som
          if (typeof player.unMute === 'function') player.unMute();

          // Se ainda estiver fora do vídeo esperado, força o reload
          // Dupla verificação: só recarrega se o ID ainda diverge APÓS 800ms
          if (typeof player.loadVideoById === 'function' && this._currentVideoId) {
            const data = player.getVideoData?.();
            const stillWrong = data && data.video_id && data.video_id !== this._currentVideoId;
            if (stillWrong) {
              player.loadVideoById(this._currentVideoId, this._currentVideoTime || 0);
            }
          }
        } catch (e) { /* silencioso */ }
      }, 800);

      this.blockedCount++;
      this.updateStats();
      this.showToast('🛡️ Anúncio bloqueado!', 'success');

    } catch (e) {
      if (typeof logger !== 'undefined') logger.error('Erro ao pular anúncio', { error: e.message });
    }
  }

  // Chamado pelo player.js quando um vídeo começa a tocar
  trackCurrentVideo(videoId, duration) {
    this._currentVideoId = videoId;
    this._currentVideoDuration = duration || 0;
    this._currentVideoTime = 0;

    // Disparar busca automática na API do SponsorBlock
    this.fetchSponsorBlockSegments(videoId);
  }

  // ══════════════════════════════════════════════════════════════════
  // CSS BLOCKING — elementos externos (fora do iframe)
  // ══════════════════════════════════════════════════════════════════

  applyCSSBlocking() {
    const style = document.createElement('style');
    style.id = 'youlist-adblocker-css';
    style.textContent = `
      [class*="ad-container"]:not(#player):not(#player *),
      [class*="advertisement"]:not(#player):not(#player *),
      [id*="google_ads"]:not(#player):not(#player *),
      [data-ad-slot]:not(#player):not(#player *),
      iframe[src*="doubleclick"]:not(#player):not(#player *),
      iframe[src*="googlesyndication"]:not(#player):not(#player *) {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        width: 0 !important;
      }
      /* NUNCA bloquear o player */
      #player, #player iframe,
      iframe[src*="youtube.com/embed"],
      iframe[src*="youtube-nocookie.com/embed"] {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
  }

  // ══════════════════════════════════════════════════════════════════
  // DOM OBSERVER — remove elementos de anúncio injetados na página
  // ══════════════════════════════════════════════════════════════════

  startDOMObserver() {
    const adSelectors = [
      '[class*="ad-banner"]',
      '[class*="advertising"]',
      '[id*="ad-container"]',
      'iframe[src*="doubleclick"]',
      'iframe[src*="googlesyndication"]'
    ];

    this._domObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          const isPlayer = node.id === 'player' ||
            node.closest?.('#player') ||
            (node.tagName === 'IFRAME' && node.src?.includes('youtube.com/embed'));
          if (!isPlayer) this.checkAndRemoveAd(node, adSelectors);
        });
      });
    });

    this._domObserver.observe(document.body, { childList: true, subtree: true });
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

  // ══════════════════════════════════════════════════════════════════
  // SPONSOR SKIP — pula segmentos marcados manualmente
  // ══════════════════════════════════════════════════════════════════

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

      // 1️⃣ Segmentos manuais do usuário
      if (this.isInSponsorSegment(videoId, currentTime)) {
        const nextTime = this.getNextNonSponsorTime(videoId, currentTime);
        player.seekTo(nextTime, true);
        if (typeof logger !== 'undefined') logger.info('Segmento manual pulado', { videoId, from: currentTime.toFixed(1), to: nextTime.toFixed(1) });
        this.showToast(`⏭️ Pulado (manual): ${currentTime.toFixed(0)}s → ${nextTime.toFixed(0)}s`);
        return;
      }

      // 2️⃣ Segmentos da comunidade via SponsorBlock
      if (this._isSBSegment(videoId, currentTime)) {
        const nextTime = this._getNextSBTime(videoId, currentTime);
        player.seekTo(nextTime, true);
        this._sbSkippedCount++;
        if (typeof logger !== 'undefined') logger.info('SponsorBlock: segmento pulado', { videoId, from: currentTime.toFixed(1), to: nextTime.toFixed(1) });
        this.showToast(`📡 SponsorBlock: ${currentTime.toFixed(0)}s → ${nextTime.toFixed(0)}s`, 'success');
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

  // ══════════════════════════════════════════════════════════════════
  // DATABASE DE SEGMENTOS
  // ══════════════════════════════════════════════════════════════════

  loadSponsorDatabase() {
    try {
      const saved = localStorage.getItem('youlist_sponsor_segments');
      this.sponsorDatabase = saved ? JSON.parse(saved) : {};
    } catch (e) { this.sponsorDatabase = {}; }
  }

  saveSponsorDatabase() {
    try {
      localStorage.setItem('youlist_sponsor_segments', JSON.stringify(this.sponsorDatabase));
    } catch (e) {}
  }

  markSponsorSegment(videoId, startTime, endTime) {
    if (startTime >= endTime) return alert('Tempo inválido! O início deve ser antes do fim.');
    if (!this.sponsorDatabase[videoId]) this.sponsorDatabase[videoId] = [];
    this.sponsorDatabase[videoId].push({ start: startTime, end: endTime, category: 'sponsor' });
    this.saveSponsorDatabase();
  }

  clearAllSegments() {
    if (!confirm('Deseja limpar TODOS os segmentos salvos?')) return;
    this.sponsorDatabase = {};
    this.saveSponsorDatabase();
    this.updateStats();
    alert('Todos os segmentos foram limpos!');
  }

  getStats() {
    const manualSegs = Object.values(this.sponsorDatabase).reduce((sum, segs) => sum + segs.length, 0);
    const sbSegs = Object.values(this._sbCache).reduce((sum, entry) => sum + (entry.segments?.length || 0), 0);
    return {
      enabled: this.enabled,
      blockedAds: this.blockedCount,
      totalSegments: manualSegs,
      sbSegments: sbSegs,
      sbSkipped: this._sbSkippedCount,
      videosWithSegments: Object.keys(this.sponsorDatabase).length
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // SPONSORBLOCK API — busca automática de segmentos da comunidade
  // ══════════════════════════════════════════════════════════════════

  // Chamado pelo player.js (trackCurrentVideo) ao iniciar cada vídeo
  fetchSponsorBlockSegments(videoId) {
    if (!videoId) return;

    // Já está em cache válido?
    const cached = this._sbCache[videoId];
    if (cached && (Date.now() - cached.fetchedAt) < this._sbCacheMaxAge) {
      if (typeof logger !== 'undefined') logger.debug('SponsorBlock: cache hit', { videoId, segments: cached.segments.length });
      return;
    }

    // Já buscando?
    if (this._sbFetching.has(videoId)) return;
    this._sbFetching.add(videoId);

    const cats = this._sbCategories.map(c => `categories=${encodeURIComponent(c)}`).join('&');
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&${cats}&actionType=skip`;

    fetch(url)
      .then(res => {
        if (res.status === 404) return []; // Vídeo sem segmentos cadastrados
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        const segments = Array.isArray(data)
          ? data.map(s => ({ start: s.segment[0], end: s.segment[1], category: s.category, source: 'sponsorblock' }))
          : [];

        this._sbCache[videoId] = { segments, fetchedAt: Date.now() };
        this._saveSBCache();

        if (typeof logger !== 'undefined') logger.info('SponsorBlock: segmentos carregados', { videoId, count: segments.length });
        if (segments.length > 0) this.showToast(`📡 SponsorBlock: ${segments.length} segmento(s) carregado(s)`, 'info');
      })
      .catch(err => {
        // Falha silenciosa — não quebra nada
        if (typeof logger !== 'undefined') logger.warn('SponsorBlock: falha na API', { videoId, error: err.message });
      })
      .finally(() => {
        this._sbFetching.delete(videoId);
      });
  }

  _isSBSegment(videoId, time) {
    const entry = this._sbCache[videoId];
    if (!entry?.segments?.length) return false;
    return entry.segments.some(seg => time >= seg.start && time <= seg.end);
  }

  _getNextSBTime(videoId, currentTime) {
    const entry = this._sbCache[videoId];
    if (!entry?.segments) return currentTime;
    const seg = entry.segments.find(s => currentTime >= s.start && currentTime <= s.end);
    return seg ? seg.end + 0.5 : currentTime;
  }

  _loadSBCache() {
    try {
      const saved = localStorage.getItem('youlist_sponsorblock_cache');
      if (saved) {
        const raw = JSON.parse(saved);
        // Descartar entradas expiradas ao carregar
        const now = Date.now();
        Object.keys(raw).forEach(id => {
          if ((now - raw[id].fetchedAt) < this._sbCacheMaxAge) this._sbCache[id] = raw[id];
        });
      }
    } catch (e) { this._sbCache = {}; }
  }

  _saveSBCache() {
    try {
      localStorage.setItem('youlist_sponsorblock_cache', JSON.stringify(this._sbCache));
    } catch (e) { /* silencioso — localStorage pode estar cheio */ }
  }

  // ══════════════════════════════════════════════════════════════════
  // UI
  // ══════════════════════════════════════════════════════════════════

  initUI() {
    const checkReady = setInterval(() => {
      if (document.querySelector('.playlist')) {
        clearInterval(checkReady);
        this.createFixedPanel();
      }
    }, 100);
  }

  createFixedPanel() {
    if (document.getElementById('adBlockerContainer')) return;

    const container = document.createElement('div');
    container.id = 'adBlockerContainer';
    container.style.cssText = 'text-align:center; margin:15px 0; padding:0;';

    container.innerHTML = `
      <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;padding:15px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">🛡️</span>
            <span style="color:white;font-weight:600;font-size:14px;">Ad Blocker</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;">
            <span id="adBlockerStatusDot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;"></span>
            <span style="font-size:11px;color:rgba(255,255,255,0.8);font-weight:600;">ATIVO</span>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;color:white;font-size:12px;">
          <div style="text-align:left;">
            <div style="opacity:0.85;margin-bottom:4px;">Bloqueados:</div>
            <strong id="blockedAdsCount" style="font-size:18px;">0</strong>
          </div>
          <div style="text-align:left;">
            <div style="opacity:0.85;margin-bottom:4px;">Manuais:</div>
            <strong id="sponsorSegmentsCount" style="font-size:18px;">0</strong>
          </div>
          <div style="text-align:left;">
            <div style="opacity:0.85;margin-bottom:4px;">📡 SB:</div>
            <strong id="sbSkippedCount" style="font-size:18px;">0</strong>
          </div>
        </div>

        <div style="display:flex;gap:8px;">
          <button id="markSponsorBtn" style="flex:1;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;padding:10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            🎯 Marcar
          </button>
          <button id="clearSegmentsBtn" style="flex:1;background:rgba(255,255,255,0.2);border:1px solid rgba(255,255,255,0.3);color:white;padding:10px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            🗑️ Limpar
          </button>
        </div>

        <div style="font-size:10px;opacity:0.7;text-align:center;margin-top:10px;color:white;">
          Ctrl+Shift+M: início · Ctrl+Shift+E: fim · 📡 SponsorBlock ativo
        </div>
      </div>
    `;

    const playlistDiv = document.querySelector('.playlist');
    const backupTitle = Array.from(playlistDiv.querySelectorAll('p')).find(p =>
      p.textContent.includes('💾 Backup') || p.textContent.includes('Backup')
    );

    if (backupTitle?.parentElement) {
      const backupDiv = backupTitle.parentElement;
      backupDiv.parentNode.insertBefore(container, backupDiv.nextSibling);
    } else {
      playlistDiv.appendChild(container);
    }

    document.getElementById('markSponsorBtn').addEventListener('click', () => this.toggleMarking());
    document.getElementById('clearSegmentsBtn').addEventListener('click', () => this.clearAllSegments());
    setInterval(() => this.updateStats(), 2000);
    this.updateStats();
  }

  toggleMarking() {
    if (typeof player === 'undefined' || !player || typeof player.getCurrentTime !== 'function') {
      return alert('Reproduza um vídeo primeiro!');
    }
    try {
      const videoId = player.getVideoData().video_id;
      if (!this.isMarking) {
        this.isMarking = true;
        this.markStartTime = player.getCurrentTime();
        document.getElementById('markSponsorBtn').innerHTML = '⏹️ Finalizar';
        document.getElementById('markSponsorBtn').style.background = 'rgba(239,68,68,0.5)';
        this.showToast(`▶️ Gravando desde ${this.markStartTime.toFixed(1)}s...`);
      } else {
        const endTime = player.getCurrentTime();
        this.markSponsorSegment(videoId, this.markStartTime, endTime);
        this.isMarking = false;
        this.markStartTime = null;
        document.getElementById('markSponsorBtn').innerHTML = '🎯 Marcar';
        document.getElementById('markSponsorBtn').style.background = 'rgba(255,255,255,0.2)';
        this.showToast(`✅ Segmento salvo`, 'success');
        this.updateStats();
      }
    } catch (e) { alert('Erro ao marcar segmento.'); }
  }

  updateStats() {
    const stats = this.getStats();
    const el1 = document.getElementById('blockedAdsCount');
    const el2 = document.getElementById('sponsorSegmentsCount');
    const el3 = document.getElementById('sbSkippedCount');
    if (el1) el1.textContent = stats.blockedAds;
    if (el2) el2.textContent = stats.totalSegments;
    if (el3) el3.textContent = stats.sbSkipped;
  }

  showToast(message, type = 'info') {
    const colors = { info: 'rgba(59,130,246,0.95)', success: 'rgba(16,185,129,0.95)', warning: 'rgba(245,158,11,0.95)' };
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;top:20px;right:20px;background:${colors[type]};color:white;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:500;z-index:10000;max-width:300px;animation:slideIn 0.3s ease-out;`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
  }
}

// ══════════════════════════════════════════════════════════════════
// ATALHOS DE TECLADO
// ══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  if (!window.youlistAdBlocker) return;
  if (e.ctrlKey && e.shiftKey && e.key === 'M') { e.preventDefault(); window.youlistAdBlocker.toggleMarking(); }
  if (e.ctrlKey && e.shiftKey && e.key === 'E') { e.preventDefault(); if (window.youlistAdBlocker.isMarking) window.youlistAdBlocker.toggleMarking(); }
});

// ══════════════════════════════════════════════════════════════════
// ANIMAÇÕES
// ══════════════════════════════════════════════════════════════════

const _abStyle = document.createElement('style');
_abStyle.textContent = `
  @keyframes slideIn { from { transform:translateX(400px);opacity:0; } to { transform:translateX(0);opacity:1; } }
  @keyframes slideOut { from { transform:translateX(0);opacity:1; } to { transform:translateX(400px);opacity:0; } }
`;
document.head.appendChild(_abStyle);

// ══════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ══════════════════════════════════════════════════════════════════

window.youlistAdBlocker = new YouListAdBlocker();
window.adBlockerStats = () => { const s = window.youlistAdBlocker.getStats(); console.log('📊 Ad Blocker Stats:', s); return s; };

console.log('%c🛡️ YouList Ad Blocker v3.2 — Modo Seguro 2026 + SponsorBlock', 'color:#667eea;font-size:14px;font-weight:bold;');
console.log('%cDOM Observer desativado por padrão. Para ativar: window.youlistAdBlocker.enableDOMObserver()', 'color:#94a3b8;font-size:11px;');
console.log('%c📡 SponsorBlock API integrada — segmentos carregados automaticamente ao iniciar cada vídeo', 'color:#22c55e;font-size:11px;');
