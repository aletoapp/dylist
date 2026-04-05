/**
 * DyList - Sistema de Backup e Restore - v2.1
 * ✅ Backup automático disparado em cada savePlaylist() / saveCategories()
 * ✅ Botão "Importar Último Backup" injetado na UI
 * ✅ Exportar / Importar (arquivo JSON) — revisados e funcionando
 */

class BackupManager {
  constructor() {
    this._debounceTimer = null;
    this.init();
  }

  init() {
    console.log('📦 Backup Manager v2.1 inicializado');
    this._hookDataFunctions();
    this._setupEventListeners();
    this._injectLastBackupButton();
  }

  // ── Intercepta savePlaylist e saveCategories para backup automático ──────────

  _hookDataFunctions() {
    const self = this;

    // Aguarda as funções globais estarem disponíveis (scripts carregam em ordem)
    const hookWhenReady = () => {
      let hooked = 0;

      if (typeof window.savePlaylist === 'function' && !window.savePlaylist._bkHooked) {
        const orig = window.savePlaylist;
        window.savePlaylist = function() {
          orig.apply(this, arguments);
          self._debouncedAutoBackup('playlist');
        };
        window.savePlaylist._bkHooked = true;
        hooked++;
      }

      if (typeof window.saveCategories === 'function' && !window.saveCategories._bkHooked) {
        const orig = window.saveCategories;
        window.saveCategories = function() {
          orig.apply(this, arguments);
          self._debouncedAutoBackup('categorias');
        };
        window.saveCategories._bkHooked = true;
        hooked++;
      }

      if (hooked < 2) {
        // Retry se ainda não carregou
        setTimeout(hookWhenReady, 600);
      } else {
        console.log('[BACKUP] ✅ Hooks ativos em savePlaylist e saveCategories');
      }
    };

    // Primeira tentativa após o DOM estar pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', hookWhenReady);
    } else {
      setTimeout(hookWhenReady, 500);
    }
  }

  // ── Debounce: evita múltiplos backups em sequência rápida ────────────────────

  _debouncedAutoBackup(source = '') {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(() => {
      this.createAutoBackup(source);
    }, 1500); // 1.5s após a última alteração
  }

  // ── Setup dos botões Exportar / Importar ─────────────────────────────────────

  _setupEventListeners() {
    const setup = () => {
      const exportBtn = document.getElementById('exportBackupBtn');
      const importBtn = document.getElementById('importBackupBtn');

      if (exportBtn) {
        // Remove listener anterior para evitar duplicatas
        exportBtn.replaceWith(exportBtn.cloneNode(true));
        document.getElementById('exportBackupBtn').addEventListener('click', () => this.exportBackup());
      }

      if (importBtn) {
        importBtn.replaceWith(importBtn.cloneNode(true));
        document.getElementById('importBackupBtn').addEventListener('click', () => this.importBackup());
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  // ── Injeta botão "Importar Último Backup" abaixo do par Exportar/Importar ───

  _injectLastBackupButton() {
    const inject = () => {
      if (document.getElementById('importLastBackupBtn')) return;

      const importBtn = document.getElementById('importBackupBtn');
      if (!importBtn) return;

      // Encontrar o container pai (a div com display:flex dos dois botões)
      const flexDiv = importBtn.closest('div');
      if (!flexDiv) return;

      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'margin-top:8px;';

      const btn = document.createElement('button');
      btn.id = 'importLastBackupBtn';
      btn.style.cssText = `
        width:100%; background:#7c3aed; color:#fff; padding:10px;
        border-radius:6px; border:none; cursor:pointer; font-size:13px;
        font-weight:600; display:flex; align-items:center;
        justify-content:center; gap:6px; transition:background 0.2s, transform 0.15s;
        font-family:inherit; margin-left:0;
      `;
      btn.onmouseenter = () => { btn.style.background = '#6d28d9'; btn.style.transform = 'translateY(-1px)'; };
      btn.onmouseleave = () => { btn.style.background = '#7c3aed'; btn.style.transform = 'none'; };

      // Mostrar data do último backup se existir
      const lastDate = localStorage.getItem('dylist_auto_backup_date');
      const dateStr  = lastDate
        ? new Date(lastDate).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
        : 'Nenhum ainda';

      btn.innerHTML = `<span>🔄</span><span>Importar Último Backup</span><span style="font-size:11px;opacity:0.75;margin-left:4px;">(${dateStr})</span>`;
      btn.addEventListener('click', () => this.restoreAutoBackup());

      wrapper.appendChild(btn);
      flexDiv.parentNode.insertBefore(wrapper, flexDiv.nextSibling);

      console.log('[BACKUP] ✅ Botão "Importar Último Backup" injetado');
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', inject);
    } else {
      setTimeout(inject, 300); // garante que o DOM do HTML já foi pintado
    }
  }

  // ── Coleta todos os dados do localStorage ────────────────────────────────────

  collectAllData() {
    const playlist    = JSON.parse(localStorage.getItem('playlist')                      || '[]');
    const categories  = JSON.parse(localStorage.getItem('youlist_categories')            || '[]');
    const playHistory = JSON.parse(localStorage.getItem('play_history')                  || '[]');
    const sponsorSegs = JSON.parse(localStorage.getItem('youlist_sponsor_segments')      || '{}');

    const backup = {
      version:   '2.1',
      timestamp: new Date().toISOString(),
      data: {
        playlist,
        categories,
        playback_speed:     localStorage.getItem('playback_speed'),
        loop_mode:          localStorage.getItem('loop_mode'),
        auto_shutdown_time: localStorage.getItem('auto_shutdown_time'),
        play_history:       playHistory,
        sponsor_segments:   sponsorSegs,
        youtube_api_key:    localStorage.getItem('youtube_api_key'),
        followed_insta:     localStorage.getItem('youlist_followed_insta'),
        dylist_eq:          localStorage.getItem('dylist_eq'),
      },
      stats: {
        totalVideos:         playlist.length,
        totalCategories:     categories.length,
        totalPlayHistory:    playHistory.length,
        totalSponsorSegments:Object.keys(sponsorSegs).length,
      }
    };

    return backup;
  }

  // ── EXPORTAR → baixa arquivo JSON ────────────────────────────────────────────

  exportBackup() {
    try {
      const backup   = this.collectAllData();
      const blob     = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url      = URL.createObjectURL(blob);
      const filename = `dylist-backup-${new Date().toISOString().split('T')[0]}.json`;
      const a        = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.showToast(`✅ Backup exportado!\n\n• ${backup.stats.totalVideos} vídeos\n• ${backup.stats.totalCategories} categorias\n• ${backup.stats.totalPlayHistory} reproduções`, 'success');
      console.log('[BACKUP] Exportado:', backup.stats);
    } catch (error) {
      console.error('[BACKUP] Erro ao exportar:', error);
      this.showToast('❌ Erro ao exportar: ' + error.message, 'error');
    }
  }

  // ── IMPORTAR → lê arquivo JSON ────────────────────────────────────────────────

  importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const backup = JSON.parse(ev.target.result);

          // Validação básica
          if (!backup.version || !backup.data) {
            throw new Error('Arquivo de backup inválido ou corrompido.');
          }

          const stats = backup.stats || {};
          const dt    = backup.timestamp ? new Date(backup.timestamp).toLocaleString('pt-BR') : '—';

          const msg = `Importar backup?\n\nData: ${dt}\nConteúdo:\n• ${stats.totalVideos ?? '?'} vídeos\n• ${stats.totalCategories ?? '?'} categorias\n• ${stats.totalPlayHistory ?? '?'} reproduções\n\n⚠️ Os dados atuais serão substituídos!\n\nContinuar?`;
          if (!confirm(msg)) return;

          this.restoreData(backup.data);
          this.showToast(`✅ Backup restaurado!\n\n• ${stats.totalVideos ?? '?'} vídeos importados\n• ${stats.totalCategories ?? '?'} categorias importadas\n\n🔄 Recarregando em 2s...`, 'success');
          setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
          console.error('[BACKUP] Erro ao importar:', err);
          this.showToast('❌ Erro: ' + err.message, 'error');
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  // ── RESTORE DE DADOS ──────────────────────────────────────────────────────────

  restoreData(data) {
    if (data.playlist)         localStorage.setItem('playlist',                   JSON.stringify(data.playlist));
    if (data.categories)       localStorage.setItem('youlist_categories',         JSON.stringify(data.categories));
    if (data.playback_speed)   localStorage.setItem('playback_speed',             data.playback_speed);
    if (data.loop_mode)        localStorage.setItem('loop_mode',                  data.loop_mode);
    if (data.auto_shutdown_time) localStorage.setItem('auto_shutdown_time',       data.auto_shutdown_time);
    if (data.play_history)     localStorage.setItem('play_history',               JSON.stringify(data.play_history));
    if (data.sponsor_segments) localStorage.setItem('youlist_sponsor_segments',   JSON.stringify(data.sponsor_segments));
    if (data.youtube_api_key)  localStorage.setItem('youtube_api_key',            data.youtube_api_key);
    if (data.followed_insta)   localStorage.setItem('youlist_followed_insta',     data.followed_insta);
    if (data.dylist_eq)        localStorage.setItem('dylist_eq',                  data.dylist_eq);

    console.log('[BACKUP] ✅ Dados restaurados');
  }

  // ── BACKUP AUTOMÁTICO → salva no localStorage ─────────────────────────────────

  createAutoBackup(source = '') {
    try {
      const backup = this.collectAllData();
      const key = 'dylist_auto_backup';

      // Manter últimos 3 snapshots rotativos
      const slot = 'dylist_auto_backup_' + (Date.now() % 3);
      localStorage.setItem(slot,                  JSON.stringify(backup));
      localStorage.setItem(key,                   JSON.stringify(backup)); // principal (mais recente)
      localStorage.setItem(key + '_date',         backup.timestamp);
      localStorage.setItem(key + '_source',       source);

      // Atualizar label do botão
      const btn = document.getElementById('importLastBackupBtn');
      if (btn) {
        const dateStr = new Date(backup.timestamp).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' });
        const spans   = btn.querySelectorAll('span');
        if (spans[2]) spans[2].textContent = `(${dateStr})`;
      }

      console.log(`[BACKUP] Auto-backup criado (${source}):`, backup.stats);
      return true;
    } catch (error) {
      console.error('[BACKUP] Erro no auto-backup:', error);
      return false;
    }
  }

  // ── RESTAURAR ÚLTIMO AUTO-BACKUP ──────────────────────────────────────────────

  restoreAutoBackup() {
    try {
      const raw = localStorage.getItem('dylist_auto_backup');
      if (!raw) {
        this.showToast('❌ Nenhum backup automático encontrado.\nAdicione vídeos ou crie categorias para gerar um.', 'error');
        return false;
      }

      const backup   = JSON.parse(raw);
      const dateStr  = backup.timestamp
        ? new Date(backup.timestamp).toLocaleString('pt-BR')
        : '—';
      const stats    = backup.stats || {};
      const source   = localStorage.getItem('dylist_auto_backup_source') || '';

      const msg = `Restaurar último backup automático?\n\nData: ${dateStr}${source ? '\nOrigem: ' + source : ''}\n\nConteúdo:\n• ${stats.totalVideos ?? '?'} vídeos\n• ${stats.totalCategories ?? '?'} categorias\n\n⚠️ Os dados atuais serão substituídos!`;
      if (!confirm(msg)) return false;

      this.restoreData(backup.data);
      this.showToast(`✅ Backup restaurado!\n\n• ${stats.totalVideos ?? '?'} vídeos\n• ${stats.totalCategories ?? '?'} categorias\n\n🔄 Recarregando em 2s...`, 'success');
      setTimeout(() => window.location.reload(), 2000);
      return true;
    } catch (error) {
      console.error('[BACKUP] Erro ao restaurar auto-backup:', error);
      this.showToast('❌ Erro: ' + error.message, 'error');
      return false;
    }
  }

  // ── Toast de notificação ──────────────────────────────────────────────────────

  showToast(message, type = 'info') {
    const colors = {
      info:    'rgba(59,130,246,0.95)',
      success: 'rgba(16,185,129,0.95)',
      error:   'rgba(239,68,68,0.95)',
      warning: 'rgba(245,158,11,0.95)'
    };
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed; top:20px; right:20px;
      background:${colors[type] || colors.info};
      color:white; padding:14px 20px; border-radius:10px;
      font-size:13px; font-weight:500; z-index:10001;
      max-width:360px; box-shadow:0 8px 32px rgba(0,0,0,0.4);
      white-space:pre-line; line-height:1.55;
      animation:fadeIn 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s';
      toast.style.opacity    = '0';
      setTimeout(() => toast.remove(), 400);
    }, 4500);
  }
}

// ── Inicialização ─────────────────────────────────────────────────────────────

window.backupManager = new BackupManager();

// Backup a cada 15 min (reforço)
setInterval(() => window.backupManager?.createAutoBackup('timer-15min'), 15 * 60 * 1000);

// Backup antes de fechar a aba/janela
window.addEventListener('beforeunload', () => window.backupManager?.createAutoBackup('beforeunload'));

// API pública (console)
window.exportBackup       = () => window.backupManager.exportBackup();
window.importBackup       = () => window.backupManager.importBackup();
window.restoreAutoBackup  = () => window.backupManager.restoreAutoBackup();
window.triggerAutoBackup  = (src) => window.backupManager.createAutoBackup(src);

console.log('%c📦 Backup Manager v2.1 carregado!', 'color:#10b981;font-size:14px;font-weight:bold;');
console.log('%cComandos: exportBackup() | importBackup() | restoreAutoBackup() | triggerAutoBackup()', 'color:#64748b;font-size:11px;');
