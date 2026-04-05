/**
 * YouList Ad Blocker System v2.0
 * Sistema próprio e seguro de bloqueio de anúncios
 * NÃO INTERFERE COM O PLAYER DO YOUTUBE - 100% SEGURO
 * CORRIGIDO: Interface fixa abaixo do Backup
 */

class YouListAdBlocker {
  constructor() {
    this.enabled = true;
    this.blockedCount = 0;
    this.sponsorDatabase = {};
    this.isMarking = false;
    this.markStartTime = null;
    
    // Aguardar DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    if (typeof logger !== 'undefined') {
      logger.info('Ad Blocker System inicializando...');
    }
    
    // Carregar database de segmentos salvos
    this.loadSponsorDatabase();
    
    // Estratégia 1: CSS-based blocking (mais seguro)
    this.applyCSSBlocking();
    
    // Estratégia 2: DOM Observer (detecta e remove anúncios)
    this.startDOMObserver();
    
    // Estratégia 3: SponsorBlock-like (pula segmentos patrocinados)
    this.initSponsorSkip();
    
    // Inicializar UI - AGORA FIXO
    this.initUI();
    
    if (typeof logger !== 'undefined') {
      logger.success('Ad Blocker ativo', { enabled: this.enabled });
    }
  }

  // ========================================
  // ESTRATÉGIA 1: CSS Blocking (NÃO TOCA NO PLAYER)
  // ========================================
  applyCSSBlocking() {
    const style = document.createElement('style');
    style.id = 'youlist-adblocker-css';
    style.textContent = `
      /* Ocultar elementos de anúncios FORA do player */
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
      
      /* NUNCA BLOQUEAR O PLAYER DO YOUTUBE */
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
    
    if (typeof logger !== 'undefined') {
      logger.debug('CSS blocking aplicado (player protegido)');
    }
  }

  // ========================================
  // ESTRATÉGIA 2: DOM Observer (CUIDADOSO)
  // ========================================
  startDOMObserver() {
    // Seletores MUITO ESPECÍFICOS - nunca tocar no player
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
          if (node.nodeType === 1) { // Element node
            // PROTEÇÃO: Nunca remover o player ou seus filhos
            const isPlayer = node.id === 'player' || 
                           node.closest('#player') ||
                           node.tagName === 'IFRAME' && node.src?.includes('youtube.com/embed');
            
            if (!isPlayer) {
              this.checkAndRemoveAd(node, adSelectors);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    if (typeof logger !== 'undefined') {
      logger.debug('DOM Observer ativo (player protegido)');
    }
  }

  checkAndRemoveAd(element, selectors) {
    // DUPLA PROTEÇÃO: Nunca tocar no player
    if (element.id === 'player' || element.closest('#player')) {
      return;
    }

    selectors.forEach(selector => {
      if (element.matches && element.matches(selector)) {
        element.remove();
        this.blockedCount++;
        if (typeof logger !== 'undefined') {
          logger.debug('Anúncio removido', { selector, count: this.blockedCount });
        }
      }
    });
  }

  // ========================================
  // ESTRATÉGIA 3: SponsorBlock-like
  // ========================================
  initSponsorSkip() {
    // Monitorar progresso do vídeo a cada segundo
    setInterval(() => {
      this.checkSponsorSegments();
    }, 1000);
  }

  checkSponsorSegments() {
    // Verificar se player existe e está pronto
    if (typeof player === 'undefined' || !player || typeof player.getCurrentTime !== 'function') {
      return;
    }

    try {
      const videoData = player.getVideoData();
      if (!videoData || !videoData.video_id) return;
      
      const videoId = videoData.video_id;
      const currentTime = player.getCurrentTime();
      
      // Verificar se está em segmento patrocinado
      if (this.isInSponsorSegment(videoId, currentTime)) {
        const nextTime = this.getNextNonSponsorTime(videoId, currentTime);
        player.seekTo(nextTime, true);
        
        if (typeof logger !== 'undefined') {
          logger.info('Segmento patrocinado pulado', { 
            videoId, 
            from: currentTime.toFixed(1), 
            to: nextTime.toFixed(1) 
          });
        }
        
        this.showToast(`⏭️ Pulado: ${currentTime.toFixed(0)}s → ${nextTime.toFixed(0)}s`);
      }
    } catch (e) {
      // Silenciar erros se player não estiver pronto
    }
  }

  isInSponsorSegment(videoId, time) {
    const segments = this.sponsorDatabase[videoId];
    if (!segments || segments.length === 0) return false;

    return segments.some(seg => time >= seg.start && time <= seg.end);
  }

  getNextNonSponsorTime(videoId, currentTime) {
    const segments = this.sponsorDatabase[videoId];
    if (!segments) return currentTime;

    const currentSegment = segments.find(seg => 
      currentTime >= seg.start && currentTime <= seg.end
    );

    return currentSegment ? currentSegment.end + 0.5 : currentTime;
  }

  // ========================================
  // DATABASE DE SEGMENTOS
  // ========================================
  loadSponsorDatabase() {
    try {
      const saved = localStorage.getItem('youlist_sponsor_segments');
      this.sponsorDatabase = saved ? JSON.parse(saved) : {};
    } catch (e) {
      this.sponsorDatabase = {};
    }
  }

  saveSponsorDatabase() {
    try {
      localStorage.setItem('youlist_sponsor_segments', 
        JSON.stringify(this.sponsorDatabase));
    } catch (e) {
      if (typeof logger !== 'undefined') {
        logger.error('Falha ao salvar sponsor database', { error: e.message });
      }
    }
  }

  markSponsorSegment(videoId, startTime, endTime) {
    if (startTime >= endTime) {
      return alert('Tempo inválido! O início deve ser antes do fim.');
    }

    if (!this.sponsorDatabase[videoId]) {
      this.sponsorDatabase[videoId] = [];
    }

    this.sponsorDatabase[videoId].push({
      start: startTime,
      end: endTime,
      category: 'sponsor'
    });

    this.saveSponsorDatabase();
    
    if (typeof logger !== 'undefined') {
      logger.success('Segmento sponsor marcado', { 
        videoId, 
        start: startTime.toFixed(1), 
        end: endTime.toFixed(1) 
      });
    }
  }

  clearAllSegments() {
    if (!confirm('Deseja limpar TODOS os segmentos salvos?')) return;
    
    this.sponsorDatabase = {};
    this.saveSponsorDatabase();
    this.updateStats();
    
    if (typeof logger !== 'undefined') {
      logger.info('Todos os segmentos foram limpos');
    }
    
    alert('Todos os segmentos foram limpos!');
  }

  // Limpar segmentos de vídeos removidos
  cleanupRemovedVideos(currentPlaylistIds) {
    const databaseIds = Object.keys(this.sponsorDatabase);
    let cleaned = 0;
    
    databaseIds.forEach(videoId => {
      if (!currentPlaylistIds.includes(videoId)) {
        delete this.sponsorDatabase[videoId];
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      this.saveSponsorDatabase();
      this.updateStats();
      if (typeof logger !== 'undefined') {
        logger.info(`${cleaned} segmento(s) órfão(s) removido(s)`);
      }
    }
  }

  getStats() {
    const totalSegments = Object.values(this.sponsorDatabase)
      .reduce((sum, segs) => sum + segs.length, 0);

    return {
      enabled: this.enabled,
      blockedAds: this.blockedCount,
      totalSegments: totalSegments,
      videosWithSegments: Object.keys(this.sponsorDatabase).length
    };
  }

  // ========================================
  // UI - AGORA FIXO AO INVÉS DE FLUTUANTE
  // ========================================
  initUI() {
    // Aguardar até que o elemento de backup exista
    const checkBackupExists = setInterval(() => {
      const backupSection = document.querySelector('.playlist');
      if (backupSection) {
        clearInterval(checkBackupExists);
        this.createFixedPanel();
      }
    }, 100);
  }

  createFixedPanel() {
    // Criar container fixo abaixo do backup
    const container = document.createElement('div');
    container.id = 'adBlockerContainer';
    container.style.cssText = `
      text-align: center;
      margin: 15px 0;
      padding: 0;
      display: none;
    `;
    
    container.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; padding: 15px; margin: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 18px;">🛡️</span>
            <span style="color: white; font-weight: 600; font-size: 14px;">Ad Blocker</span>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px; color: white; font-size: 12px;">
          <div style="text-align: left;">
            <div style="opacity: 0.9; margin-bottom: 4px;">Anúncios bloqueados:</div>
            <strong id="blockedAdsCount" style="font-size: 20px;">0</strong>
          </div>
          <div style="text-align: left;">
            <div style="opacity: 0.9; margin-bottom: 4px;">Segmentos salvos:</div>
            <strong id="sponsorSegmentsCount" style="font-size: 20px;">0</strong>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button id="markSponsorBtn" style="flex: 1; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
            🎯 Marcar
          </button>
          <button id="clearSegmentsBtn" style="flex: 1; background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;">
            🗑️ Limpar
          </button>
        </div>
        
        <div style="font-size: 10px; opacity: 0.7; text-align: center; margin-top: 10px; color: white;">
          Ctrl+Shift+M: início | Ctrl+Shift+E: fim
        </div>
      </div>
    `;
    
    // Inserir LOGO APÓS a div do backup (e antes do próximo HR)
    const playlistDiv = document.querySelector('.playlist');
    
    // Encontrar a div que contém o título "💾 Backup"
    const backupTitle = Array.from(playlistDiv.querySelectorAll('p')).find(p => 
      p.textContent.includes('💾 Backup') || p.textContent.includes('Backup')
    );
    
    if (backupTitle && backupTitle.parentElement) {
      // Inserir após o parent da div de backup
      const backupDiv = backupTitle.parentElement;
      backupDiv.parentNode.insertBefore(container, backupDiv.nextSibling);
    } else {
      // Fallback: adicionar antes do primeiro HR após a palavra "Backup"
      const hrs = playlistDiv.querySelectorAll('hr');
      const targetHr = Array.from(hrs).find((hr, index) => {
        const prevText = hr.previousElementSibling?.textContent || '';
        return prevText.includes('Backup') || prevText.includes('Importar');
      });
      
      if (targetHr) {
        playlistDiv.insertBefore(container, targetHr);
      } else {
        // Último fallback: adicionar no final
        playlistDiv.appendChild(container);
      }
    }
    
    // Event listeners
    document.getElementById('markSponsorBtn').addEventListener('click', () => this.toggleMarking());
    document.getElementById('clearSegmentsBtn').addEventListener('click', () => this.clearAllSegments());
    
    // Atualizar stats a cada 2 segundos
    setInterval(() => this.updateStats(), 2000);
    
    // Atualizar stats inicial
    this.updateStats();
    
    if (typeof logger !== 'undefined') {
      logger.success('Ad Blocker UI criado (fixo abaixo do backup)');
    }
  }

  toggleMarking() {
    if (typeof player === 'undefined' || !player || typeof player.getCurrentTime !== 'function') {
      return alert('Reproduza um vídeo primeiro!');
    }

    try {
      const videoId = player.getVideoData().video_id;
      
      if (!this.isMarking) {
        // Iniciar marcação
        this.isMarking = true;
        this.markStartTime = player.getCurrentTime();
        document.getElementById('markSponsorBtn').innerHTML = '⏹️ Finalizar';
        document.getElementById('markSponsorBtn').style.background = 'rgba(239, 68, 68, 0.5)';
        this.showToast(`▶️ Gravando desde ${this.markStartTime.toFixed(1)}s...`);
      } else {
        // Finalizar marcação
        const endTime = player.getCurrentTime();
        const startTime = this.markStartTime;
        this.markSponsorSegment(videoId, startTime, endTime);
        
        this.isMarking = false;
        this.markStartTime = null;
        document.getElementById('markSponsorBtn').innerHTML = '🎯 Marcar';
        document.getElementById('markSponsorBtn').style.background = 'rgba(255,255,255,0.2)';
        
        this.showToast(`✅ Segmento salvo: ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`, 'success');
        this.updateStats();
      }
    } catch (e) {
      alert('Erro ao marcar segmento. Certifique-se que um vídeo está tocando.');
    }
  }

  updateStats() {
    const stats = this.getStats();
    const blockedEl = document.getElementById('blockedAdsCount');
    const segmentsEl = document.getElementById('sponsorSegmentsCount');
    
    if (blockedEl) blockedEl.textContent = stats.blockedAds;
    if (segmentsEl) segmentsEl.textContent = stats.totalSegments;
  }

  showToast(message, type = 'info') {
    const colors = {
      info: 'rgba(59, 130, 246, 0.95)',
      success: 'rgba(16, 185, 129, 0.95)',
      warning: 'rgba(245, 158, 11, 0.95)'
    };
    
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// ========================================
// ATALHOS DE TECLADO
// ========================================
document.addEventListener('keydown', (e) => {
  if (!window.youlistAdBlocker) return;
  
  // Ctrl + Shift + M = Marcar início
  if (e.ctrlKey && e.shiftKey && e.key === 'M') {
    e.preventDefault();
    window.youlistAdBlocker.toggleMarking();
  }
  
  // Ctrl + Shift + E = Marcar fim
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    e.preventDefault();
    if (window.youlistAdBlocker.isMarking) {
      window.youlistAdBlocker.toggleMarking();
    }
  }
});

// ========================================
// ANIMAÇÕES CSS
// ========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// ========================================
// INICIALIZAÇÃO AUTOMÁTICA
// ========================================
window.youlistAdBlocker = new YouListAdBlocker();

// API pública para console
window.adBlockerStats = () => {
  const stats = window.youlistAdBlocker.getStats();
  console.log('📊 YouList Ad Blocker Stats:', stats);
  return stats;
};

console.log('%c🛡️ YouList Ad Blocker carregado! [FIXO ABAIXO DO BACKUP]', 'color: #667eea; font-size: 14px; font-weight: bold;');
console.log('%cUse adBlockerStats() para ver estatísticas', 'color: #764ba2; font-size: 12px;');