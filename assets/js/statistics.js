/**
 * YouList Statistics Module
 * Modal de estatísticas detalhadas
 */

class StatisticsManager {
  constructor() {
    this.init();
  }

  init() {
    this.createStatsButton();
    this.createStatsModal();
    logger.info('Statistics Manager inicializado');
  }

  createStatsButton() {
    // statsBtn já existe no HTML como elemento oculto — não criar outro
    if (document.getElementById('statsBtn')) return;
    // fallback silencioso: não injetar botão visível
    logger.info('statsBtn não encontrado no HTML — statistics operando só via openStatsModal()');
  }

  createStatsModal() {
    if (document.getElementById('statsModal')) return;

    const modal = document.createElement('div');
    modal.id = 'statsModal';
    modal.className = 'modal';
    modal.style.cssText = `
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.85);
      z-index: 9999;
      align-items: center;
      justify-content: center;
    `;

    // Fechar ao clicar fora
    modal.onclick = (e) => {
      if (e.target === modal) this.closeStatsModal();
    };

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px; width: 95%; max-height: 90vh; overflow-y: auto; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 25px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; color: #fff; font-size: 24px;">📊 Estatísticas</h3>
          <button id="closeStatsBtn" style="background: transparent; border: none; color: #94a3b8; cursor: pointer; font-size: 28px; line-height: 1; padding: 0;">&times;</button>
        </div>

        <div id="statsContent" style="color: #e2e8f0;">
          <!-- Conteúdo será preenchido dinamicamente -->
        </div>

        <button id="refreshStatsBtn" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 12px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; margin-top: 15px;">
          🔄 Atualizar
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // Event listeners
    document.getElementById('closeStatsBtn').onclick = () => this.closeStatsModal();
    document.getElementById('refreshStatsBtn').onclick = () => this.updateStatsContent();

    logger.success('Modal de estatísticas criado');
  }

  openStatsModal() {
    document.getElementById('statsModal').style.display = 'flex';
    this.updateStatsContent();
    logger.info('Modal de estatísticas aberto');
  }

  closeStatsModal() {
    document.getElementById('statsModal').style.display = 'none';
  }

  updateStatsContent() {
    const content = document.getElementById('statsContent');
    if (!content) return;

    try {
      // Coletar estatísticas
      const stats = this.collectStats();

      // Renderizar estatísticas
      content.innerHTML = `
        <div style="display: grid; gap: 20px;">
          
          <!-- Biblioteca -->
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
            <h4 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">📚 Biblioteca</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Total de vídeos:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.totalVideos}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Categorias criadas:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.totalCategories}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Categoria favorita:</span>
                <strong style="color: #fff;">${stats.favoriteCategory}</strong>
              </div>
            </div>
          </div>

          <!-- Reprodução -->
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #10b981;">
            <h4 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px;">▶️ Reprodução</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Tocados hoje:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.playedToday}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Total histórico:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.totalPlayHistory}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Modo atual:</span>
                <strong style="color: #fff;">${stats.currentLoopMode}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Velocidade:</span>
                <strong style="color: #fff;">${stats.playbackSpeed}x</strong>
              </div>
            </div>
          </div>

          <!-- Ad Blocker -->
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #f59e0b;">
            <h4 style="margin: 0 0 15px 0; color: #f59e0b; font-size: 18px;">🛡️ Ad Blocker</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Anúncios bloqueados:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.blockedAds}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Segmentos salvos:</span>
                <strong style="color: #fff; font-size: 20px;">${stats.sponsorSegments}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Status:</span>
                <strong style="color: ${stats.adBlockerEnabled ? '#10b981' : '#64748b'};">${stats.adBlockerEnabled ? 'Ativo' : 'Inativo'}</strong>
              </div>
            </div>
          </div>

          <!-- Armazenamento -->
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #8b5cf6;">
            <h4 style="margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px;">💾 Armazenamento</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Dados em cache:</span>
                <strong style="color: #fff;">${stats.storageUsed}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">API Key configurada:</span>
                <strong style="color: ${stats.hasApiKey ? '#10b981' : '#ef4444'};">${stats.hasApiKey ? 'Sim ✔' : 'Não ✗'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Backup automático:</span>
                <strong style="color: #fff;">${stats.lastBackup}</strong>
              </div>
            </div>
          </div>

          <!-- Uso do App -->
          <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 4px solid #ec4899;">
            <h4 style="margin: 0 0 15px 0; color: #ec4899; font-size: 18px;">📱 Uso do App</h4>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">PWA instalado:</span>
                <strong style="color: ${stats.isPWA ? '#10b981' : '#64748b'};">${stats.isPWA ? 'Sim ✔' : 'Não ✗'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span style="color: #94a3b8;">Service Worker:</span>
                <strong style="color: ${stats.hasSW ? '#10b981' : '#64748b'};">${stats.hasSW ? 'Ativo' : 'Inativo'}</strong>
              </div>
            </div>
          </div>

        </div>
      `;

      logger.info('Estatísticas atualizadas', stats);
    } catch (error) {
      logger.error('Erro ao atualizar estatísticas', { error: error.message });
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ef4444;">
          <p style="font-size: 48px; margin-bottom: 10px;">⚠️</p>
          <p style="font-size: 16px;">Erro ao carregar estatísticas</p>
          <p style="font-size: 14px; color: #94a3b8; margin-top: 10px;">${error.message}</p>
        </div>
      `;
    }
  }

  collectStats() {
    const stats = {};

    // Lê direto do localStorage — fonte mais confiável independente de timing
    const rawPlaylist   = JSON.parse(localStorage.getItem('playlist') || '[]');
    const rawCategories = JSON.parse(localStorage.getItem('youlist_categories') || '[]');

    stats.totalVideos      = rawPlaylist.length;
    stats.totalCategories  = rawCategories.length;

    // Categoria favorita
    if (rawPlaylist.length > 0) {
      const categoryCount = {};
      rawPlaylist.forEach(video => {
        const catId = video.categoryId || 'uncategorized';
        categoryCount[catId] = (categoryCount[catId] || 0) + 1;
      });
      const maxCatId = Object.keys(categoryCount).reduce((a, b) =>
        categoryCount[a] > categoryCount[b] ? a : b, 'uncategorized'
      );
      // Tenta resolver nome da categoria
      const cat = rawCategories.find(c => c.id === maxCatId);
      stats.favoriteCategory = cat?.name || (maxCatId === 'uncategorized' ? 'Sem Categoria' : maxCatId);
    } else {
      stats.favoriteCategory = 'N/A';
    }

    // Reprodução
    const playHistory = JSON.parse(localStorage.getItem('play_history') || '[]');
    const today = new Date().toDateString();
    stats.playedToday       = playHistory.filter(h => new Date(h.timestamp).toDateString() === today).length;
    stats.totalPlayHistory  = playHistory.length;

    // Loop mode
    const loopModeLabels = { none: 'Normal', one: 'Repetir 1', all: 'Repetir Todos', shuffle: 'Aleatório' };
    const savedLoop = localStorage.getItem('loop_mode') || 'none';
    stats.currentLoopMode  = loopModeLabels[savedLoop] || 'Normal';
    stats.playbackSpeed    = localStorage.getItem('playback_speed') || 1;

    // Ad Blocker / Premium Engine
    if (window.youlistAdBlocker) {
      const adStats = window.youlistAdBlocker.getStats();
      stats.blockedAds       = adStats.blockedAds || 0;
      stats.sponsorSegments  = adStats.totalSegments || 0;
      stats.adBlockerEnabled = adStats.enabled;
    } else {
      stats.blockedAds = 0; stats.sponsorSegments = 0; stats.adBlockerEnabled = false;
    }

    // Armazenamento
    try {
      const used = new Blob([localStorage.getItem('playlist') || '']).size;
      stats.storageUsed = this.formatBytes(used);
    } catch (e) { stats.storageUsed = 'N/A'; }

    stats.hasApiKey = !!localStorage.getItem('youtube_api_key');

    const lastBackupDate = localStorage.getItem('dylist_auto_backup_date');
    if (lastBackupDate) {
      stats.lastBackup = new Date(lastBackupDate).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    } else {
      stats.lastBackup = 'Nunca';
    }

    stats.isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    stats.hasSW = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;

    return stats;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Inicialização com delay para garantir que outros módulos estejam prontos
setTimeout(() => {
  window.statisticsManager = new StatisticsManager();
  
  // API pública para console e HTML
  window.showStats = () => {
    if (window.statisticsManager) {
      window.statisticsManager.openStatsModal();
    }
  };
  
  // CORREÇÃO: Adicionar função openStatsModal() global para compatibilidade com HTML
  window.openStatsModal = () => {
    if (window.statisticsManager) {
      window.statisticsManager.openStatsModal();
    }
  };
  
  console.log('%c📊 Statistics Manager carregado!', 'color: #667eea; font-size: 14px; font-weight: bold;');
  console.log('%cUse showStats() ou openStatsModal() para abrir o modal', 'color: #764ba2; font-size: 12px;');
}, 2000);
