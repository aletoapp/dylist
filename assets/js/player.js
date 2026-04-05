/**
 * DyList Player Module - VERSÃO PROFISSIONAL
 * Gerencia o YouTube IFrame Player com recursos avançados
 */

let player;
let apiReady = false;
let loopMode = 'none'; // none, one, all, shuffle
let playbackSpeed = 1;
let autoShutdownTimer = null;
// audioOnlyMode REMOVIDO
// visualizerCanvas REMOVIDO
// visualizerCtx REMOVIDO
// visualizerAnimationId REMOVIDO

// CORREÇÃO CRÍTICA: Função precisa estar no escopo global ANTES de carregar a API
window.onYouTubeIframeAPIReady = function() {
  logger.info('YouTube API callback recebido');
  
  // Aguardar o DOM estar pronto
  if (document.getElementById('player')) {
    initializePlayer();
  } else {
    // Se o DOM ainda não está pronto, aguardar
    document.addEventListener('DOMContentLoaded', initializePlayer);
  }
};

function initializePlayer() {
  try {
    player = new YT.Player('player', {
      height: '400',
      width: '100%',
      videoId: '', // Começa vazio
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        enablejsapi: 1
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: onPlayerError
      }
    });
    logger.success('Player inicializado');
  } catch (error) {
    logger.error('Erro ao inicializar player', { error: error.message });
  }
}

// Carregar YouTube IFrame API
(function loadYouTubeAPI() {
  // Verificar se já foi carregado
  if (window.YT && window.YT.Player) {
    logger.warn('YouTube API já carregada, inicializando player...');
    window.onYouTubeIframeAPIReady();
    return;
  }
  
  const tag = document.createElement('script');
  tag.src = "https://www.youtube.com/iframe_api";
  tag.async = true;
  
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  
  logger.info('YouTube API carregando...');
})();

function onPlayerReady(event) {
  apiReady = true;
  logger.success('YouTube Player pronto');
  
  // Aplicar velocidade salva
  const savedSpeed = localStorage.getItem('playback_speed');
  if (savedSpeed) {
    playbackSpeed = parseFloat(savedSpeed);
    updatePlaybackSpeedUI();
  }
  
  // Verificar timer salvo
  checkAutoShutdownTimer();
}

function onPlayerStateChange(event) {
  const states = {
    '-1': 'UNSTARTED',
    '0': 'ENDED',
    '1': 'PLAYING',
    '2': 'PAUSED',
    '3': 'BUFFERING',
    '5': 'CUED'
  };
  
  const stateName = states[event.data] || 'UNKNOWN';
  logger.debug('Player state changed', { state: stateName });

  // Quando começar a tocar
  if (event.data === YT.PlayerState.PLAYING) {
    let currentTitle = "Reproduzindo...";
    
    if (playlist[currentIndex]) {
      currentTitle = playlist[currentIndex].title;
      logger.trackVideoPlayed(
        playlist[currentIndex].id,
        playlist[currentIndex].title,
        currentIndex
      );
    } else if (player.getVideoData && player.getVideoData().title) {
      currentTitle = player.getVideoData().title;
    }
    
    updateMediaSession(currentTitle);
    
    // Aplicar velocidade
    if (playbackSpeed !== 1) {
      player.setPlaybackRate(playbackSpeed);
    }
    
    // Modo áudio only REMOVIDO
    
    // Atualizar barra de progresso
    startProgressUpdater();
  }

  // Quando pausar
  if (event.data === YT.PlayerState.PAUSED) {
    stopProgressUpdater();
    // Modo áudio REMOVIDO
  }

  // Quando vídeo terminar
  if (event.data === YT.PlayerState.ENDED) {
    logger.info('Vídeo finalizado', { index: currentIndex });
    handleVideoEnded();
  }
}

function onPlayerError(event) {
  const errors = {
    2: 'Request inválido',
    5: 'Erro HTML5 Player',
    100: 'Vídeo não encontrado',
    101: 'Vídeo não permitido para embed',
    150: 'Vídeo não permitido para embed'
  };
  
  const errorMsg = errors[event.data] || 'Erro desconhecido';
  logger.trackError('YouTube Player', errorMsg, `Error code: ${event.data}`);
  
  alert(`Erro no player: ${errorMsg}\n\nPulando para próximo vídeo...`);
  nextVideo();
}

// === CONTROLES BÁSICOS ===
function playVideo(index) {
  console.log('🎵 playVideo chamado com index:', index);
  console.log('📊 Status:', { apiReady, playerExists: !!player, playlistLength: playlist.length });
  
  if (!apiReady || !player || typeof player.loadVideoById !== 'function') {
    logger.warn('Player não está pronto');
    console.error('❌ Player não está pronto:', { apiReady, playerExists: !!player });
    return alert("Player ainda carregando... Aguarde alguns segundos e tente novamente.");
  }
  
  if (!playlist[index]) {
    logger.error('Índice de vídeo inválido', { index });
    console.error('❌ Vídeo não encontrado no índice:', index);
    return;
  }
  
  currentIndex = index;
  playQueue = [index];
  
  logger.info('Reproduzindo vídeo', {
    index,
    id: playlist[index].id,
    title: playlist[index].title
  });
  
  try {
    console.log('✅ Carregando vídeo:', playlist[index].id, playlist[index].title);
    player.loadVideoById(playlist[index].id);
    updateNowPlayingUI(index);
  } catch (error) {
    logger.error('Erro ao carregar vídeo', { error: error.message });
    console.error('❌ Erro ao carregar:', error);
    alert('Erro ao carregar vídeo. Tente novamente.');
  }
}

function playAll() {
  if (!apiReady || !player || typeof player.loadVideoById !== 'function') {
    logger.warn('Player não está pronto');
    return alert("Player ainda carregando... Aguarde alguns segundos e tente novamente.");
  }
  
  if (playlist.length === 0) {
    logger.warn('Playlist vazia');
    return alert("Nenhum vídeo na playlist.");
  }
  
  // Aplicar filtro de categoria se necessário
  const filteredPlaylist = currentFilter === 'all' 
    ? playlist 
    : playlist.filter(item => item.categoryId === currentFilter);
  
  playQueue = filteredPlaylist.map((item) => playlist.indexOf(item));
  currentIndex = 0;
  
  logger.trackPlaylistAction('play_all', playQueue.length);
  
  try {
    player.loadVideoById(playlist[playQueue[currentIndex]].id);
    updateNowPlayingUI(playQueue[currentIndex]);
  } catch (error) {
    logger.error('Erro ao reproduzir playlist', { error: error.message });
    alert('Erro ao reproduzir playlist. Tente novamente.');
  }
}

function playSelected() {
  if (!apiReady || !player || typeof player.loadVideoById !== 'function') {
    logger.warn('Player não está pronto');
    return alert("Player ainda carregando... Aguarde alguns segundos e tente novamente.");
  }
  
  const checkboxes = document.querySelectorAll("#playlistContainer input[type='checkbox']");
  playQueue = [];
  
  checkboxes.forEach((cb) => {
    if (cb.checked) {
      const realIndex = parseInt(cb.dataset.index);
      if (!isNaN(realIndex) && playlist[realIndex]) {
        playQueue.push(realIndex);
      }
    }
  });
  
  if (playQueue.length === 0) {
    logger.warn('Nenhum vídeo selecionado para reprodução');
    return alert("Nenhum vídeo selecionado.");
  }
  
  currentIndex = 0;
  logger.trackPlaylistAction('play_selected', playQueue.length);
  
  try {
    player.loadVideoById(playlist[playQueue[currentIndex]].id);
    updateNowPlayingUI(playQueue[currentIndex]);
  } catch (error) {
    logger.error('Erro ao reproduzir selecionados', { error: error.message });
    alert('Erro ao reproduzir vídeos. Tente novamente.');
  }
}

// === MODO LOOP ===
function handleVideoEnded() {
  if (loopMode === 'one') {
    // Repetir vídeo atual
    logger.info('Loop: Repetindo vídeo atual');
    player.loadVideoById(playlist[playQueue[currentIndex]].id);
  } else if (loopMode === 'all') {
    // Ir para próximo, voltar ao início se acabar
    nextVideo(true);
  } else if (loopMode === 'shuffle') {
    // Tocar aleatório
    playRandomVideo();
  } else {
    // Modo normal - próximo vídeo
    nextVideo();
  }
}

function nextVideo(isLoopAll = false) {
  currentIndex++;
  
  if (currentIndex < playQueue.length) {
    const nextId = playlist[playQueue[currentIndex]].id;
    logger.info('Próximo vídeo', { index: currentIndex, id: nextId });
    
    try {
      player.loadVideoById(nextId);
      updateNowPlayingUI(playQueue[currentIndex]);
    } catch (error) {
      logger.error('Erro ao carregar próximo vídeo', { error: error.message });
    }
  } else if (isLoopAll && playQueue.length > 0) {
    // Loop all - voltar ao início
    logger.info('Loop All: Voltando ao início');
    currentIndex = 0;
    player.loadVideoById(playlist[playQueue[currentIndex]].id);
    updateNowPlayingUI(playQueue[currentIndex]);
  } else {
    logger.info('Fila de reprodução finalizada');
  }
}

function previousVideo() {
  if (currentIndex > 0) {
    currentIndex--;
    const prevId = playlist[playQueue[currentIndex]].id;
    logger.info('Vídeo anterior', { index: currentIndex, id: prevId });
    
    try {
      player.loadVideoById(prevId);
      updateNowPlayingUI(playQueue[currentIndex]);
    } catch (error) {
      logger.error('Erro ao carregar vídeo anterior', { error: error.message });
    }
  } else {
    logger.info('Já está no primeiro vídeo');
  }
}

function playRandomVideo() {
  if (playQueue.length === 0) return;
  
  const randomIndex = Math.floor(Math.random() * playQueue.length);
  currentIndex = randomIndex;
  
  logger.info('Shuffle: Tocando aleatório', { index: currentIndex });
  player.loadVideoById(playlist[playQueue[currentIndex]].id);
  updateNowPlayingUI(playQueue[currentIndex]);
}

function toggleLoopMode() {
  const modes = ['none', 'one', 'all', 'shuffle'];
  const currentModeIndex = modes.indexOf(loopMode);
  loopMode = modes[(currentModeIndex + 1) % modes.length];
  
  localStorage.setItem('loop_mode', loopMode);
  updateLoopModeUI();
  
  logger.info('Loop mode alterado', { mode: loopMode });
}

// === VELOCIDADE DE REPRODUÇÃO ===
function changePlaybackSpeed(speed) {
  if (!player || !apiReady) return;
  
  playbackSpeed = speed;
  localStorage.setItem('playback_speed', speed);
  
  try {
    player.setPlaybackRate(speed);
    updatePlaybackSpeedUI();
    logger.info('Velocidade alterada', { speed });
  } catch (error) {
    logger.error('Erro ao alterar velocidade', { error: error.message });
  }
}

// === CONTROLES DE TEMPO ===
function skipForward(seconds = 10) {
  if (!player || !apiReady) return;
  
  try {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
    logger.debug('Avançou', { seconds });
  } catch (error) {
    logger.error('Erro ao avançar', { error: error.message });
  }
}

function skipBackward(seconds = 10) {
  if (!player || !apiReady) return;
  
  try {
    const currentTime = player.getCurrentTime();
    player.seekTo(Math.max(0, currentTime - seconds), true);
    logger.debug('Voltou', { seconds });
  } catch (error) {
    logger.error('Erro ao voltar', { error: error.message });
  }
}

// === BARRA DE PROGRESSO ===
let progressInterval = null;

function startProgressUpdater() {
  stopProgressUpdater();
  
  progressInterval = setInterval(() => {
    if (player && apiReady && typeof player.getCurrentTime === 'function') {
      try {
        const currentTime = player.getCurrentTime();
        const duration = player.getDuration();
        const progress = (currentTime / duration) * 100;
        
        updateProgressBar(progress, currentTime, duration);
      } catch (error) {
        // Silencioso - evitar spam de erros
      }
    }
  }, 1000);
}

function stopProgressUpdater() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function updateProgressBar(progress, currentTime, duration) {
  const progressBar = document.getElementById('progressBar');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');
  
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
  
  if (currentTimeEl && durationEl) {
    currentTimeEl.textContent = formatTime(currentTime);
    durationEl.textContent = formatTime(duration);
  }
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// === TIMER DE DESLIGAMENTO ===
function handleTimerSelect(select) {
  const val = parseInt(select.value);
  if (val === -1) {
    clearAutoShutdownTimer();
    const opt = select.querySelector('option[value="-1"]');
    if (opt) opt.remove();
    select.value = '0';
  } else {
    setAutoShutdown(val);
  }
}

function setAutoShutdown(minutes) {
  clearAutoShutdownTimer();
  
  const sel = document.getElementById('timerSelect');

  if (minutes === 0) {
    logger.info('Timer de desligamento cancelado');
    if (sel) {
      const opt = sel.querySelector('option[value="-1"]');
      if (opt) opt.remove();
    }
    return;
  }
  
  const milliseconds = minutes * 60 * 1000;
  const shutdownTime = Date.now() + milliseconds;
  
  localStorage.setItem('auto_shutdown_time', shutdownTime);

  // Adicionar opção "Suspender" no select se ainda não existir
  if (sel && !sel.querySelector('option[value="-1"]')) {
    const opt = document.createElement('option');
    opt.value = '-1';
    opt.textContent = '⏸ Suspender';
    sel.appendChild(opt);
  }
  
  autoShutdownTimer = setTimeout(() => {
    logger.info('Timer de desligamento ativado');
    
    if (player && apiReady) {
      player.pauseVideo();
    }

    // Limpar opção Suspender e resetar select
    const sel2 = document.getElementById('timerSelect');
    if (sel2) {
      const opt = sel2.querySelector('option[value="-1"]');
      if (opt) opt.remove();
      sel2.value = '0';
    }
    
    updateTimerCountdown(null);

    // Liberar wake lock para tela apagar normalmente no celular
    if (typeof wakeLock !== 'undefined' && wakeLock) {
      wakeLock.release().catch(() => {});
      wakeLock = null;
    }

    // Tentar fechar a janela (funciona em PWA e mobile)
    showQuickToast('⏰ Timer finalizado! Encerrando DyList...');
    setTimeout(() => { window.close(); }, 1500);

    clearAutoShutdownTimer();
  }, milliseconds);
  
  updateTimerCountdown(shutdownTime);
  logger.info('Timer de desligamento configurado', { minutes });
}

function clearAutoShutdownTimer() {
  if (autoShutdownTimer) {
    clearTimeout(autoShutdownTimer);
    autoShutdownTimer = null;
  }
  localStorage.removeItem('auto_shutdown_time');
  updateTimerCountdown(null);
}

function checkAutoShutdownTimer() {
  const savedTime = localStorage.getItem('auto_shutdown_time');
  
  if (savedTime) {
    const shutdownTime = parseInt(savedTime);
    const now = Date.now();
    
    if (shutdownTime > now) {
      const remaining = shutdownTime - now;

      // Restaurar opção Suspender
      const sel = document.getElementById('timerSelect');
      if (sel && !sel.querySelector('option[value="-1"]')) {
        const opt = document.createElement('option');
        opt.value = '-1';
        opt.textContent = '⏸ Suspender';
        sel.appendChild(opt);
      }
      
      autoShutdownTimer = setTimeout(() => {
        if (player && apiReady) {
          player.pauseVideo();
        }
        const sel2 = document.getElementById('timerSelect');
        if (sel2) {
          const opt = sel2.querySelector('option[value="-1"]');
          if (opt) opt.remove();
          sel2.value = '0';
        }
        updateTimerCountdown(null);
        if (typeof wakeLock !== 'undefined' && wakeLock) {
          wakeLock.release().catch(() => {});
          wakeLock = null;
        }
        showQuickToast('⏰ Timer finalizado! Encerrando DyList...');
        setTimeout(() => { window.close(); }, 1500);
        clearAutoShutdownTimer();
      }, remaining);
      
      updateTimerCountdown(shutdownTime);
      logger.info('Timer restaurado', { remaining: Math.floor(remaining / 1000) });
    } else {
      clearAutoShutdownTimer();
    }
  }
}

// === MEDIA SESSION API (Controles na notificação) ===
function updateMediaSession(title) {
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: title,
        artist: 'DyList',
        album: 'Minha Playlist',
        artwork: [
          { 
            src: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', 
            sizes: '512x512', 
            type: 'image/png' 
          }
        ]
      });

      navigator.mediaSession.setActionHandler('play', () => {
        if (player && player.playVideo) {
          player.playVideo();
          logger.debug('Media Session: Play');
        }
      });
      
      navigator.mediaSession.setActionHandler('pause', () => {
        if (player && player.pauseVideo) {
          player.pauseVideo();
          logger.debug('Media Session: Pause');
        }
      });
      
      navigator.mediaSession.setActionHandler('previoustrack', () => {
        previousVideo();
        logger.debug('Media Session: Previous');
      });
      
      navigator.mediaSession.setActionHandler('nexttrack', () => {
        nextVideo();
        logger.debug('Media Session: Next');
      });
      
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        skipBackward(10);
        logger.debug('Media Session: Seek backward');
      });
      
      navigator.mediaSession.setActionHandler('seekforward', () => {
        skipForward(10);
        logger.debug('Media Session: Seek forward');
      });
      
      logger.debug('Media Session atualizada', { title });
    } catch (error) {
      logger.error('Erro ao atualizar Media Session', { error: error.message });
    }
  }
}

// === ATALHOS DE TECLADO ===
document.addEventListener('keydown', (e) => {
  // Ignorar se estiver digitando
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  if (player && apiReady && typeof player.getPlayerState === 'function') {
    try {
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          const state = player.getPlayerState();
          if (state === YT.PlayerState.PLAYING) {
            player.pauseVideo();
            logger.debug('Pausado via teclado');
          } else {
            player.playVideo();
            logger.debug('Reproduzido via teclado');
          }
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          skipForward(10);
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward(10);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          // Aumentar volume (se possível)
          try {
            const vol = player.getVolume();
            player.setVolume(Math.min(100, vol + 10));
          } catch (err) {}
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          // Diminuir volume (se possível)
          try {
            const vol = player.getVolume();
            player.setVolume(Math.max(0, vol - 10));
          } catch (err) {}
          break;
          
        case 'KeyN':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            nextVideo();
          }
          break;
          
        case 'KeyP':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            previousVideo();
          }
          break;
          
        case 'KeyL':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleLoopMode();
          }
          break;
      }
    } catch (error) {
      logger.error('Erro ao processar atalho de teclado', { error: error.message });
    }
  }
});

// === FUNÇÕES DE UI (implementar no HTML/CSS) ===
function updateLoopModeUI() {
  const btn = document.getElementById('loopModeBtn');
  if (!btn) return;
  
  const icons = {
    'none': '➡️',
    'one': '🔂',
    'all': '🔁',
    'shuffle': '🔀'
  };
  
  const labels = {
    'none': 'Normal',
    'one': 'Repetir 1',
    'all': 'Repetir Todos',
    'shuffle': 'Aleatório'
  };
  
  btn.innerHTML = `${icons[loopMode]} ${labels[loopMode]}`;
  btn.title = labels[loopMode];
}

function updatePlaybackSpeedUI() {
  const btn = document.getElementById('speedBtn');
  if (!btn) return;
  
  btn.textContent = `${playbackSpeed}x`;
  btn.title = `Velocidade: ${playbackSpeed}x`;
}

function updateTimerCountdown(shutdownTime) {
  const display = document.getElementById('timerCountdown');
  if (!display) return;

  // Manter legado oculto
  const legacy = document.getElementById('timerDisplay');
  if (legacy) legacy.style.display = 'none';

  if (!shutdownTime) {
    display.style.display = 'none';
    display.textContent = '';
    return;
  }

  display.style.display = 'block';

  function tick() {
    const remaining = Math.max(0, shutdownTime - Date.now());
    if (remaining === 0) {
      display.style.display = 'none';
      return;
    }
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    display.textContent = `⏱ Desligando em ${m}:${s.toString().padStart(2, '0')}`;
    setTimeout(tick, 1000);
  }
  tick();
}

// Mantido para compatibilidade com chamadas legadas
function updateTimerUI(shutdownTime) {
  updateTimerCountdown(shutdownTime);
}

// updateAudioModeUI REMOVIDA

function updateNowPlayingUI(index) {
  const items = document.querySelectorAll('.playlist-item');
  
  items.forEach((item, i) => {
    if (parseInt(item.dataset.index) === index) {
      item.classList.add('now-playing');
    } else {
      item.classList.remove('now-playing');
    }
  });
}

// === ESTATÍSTICAS ===
function getPlaybackStats() {
  const stats = {
    totalVideos: playlist.length,
    playedToday: 0,
    favoriteCategory: null,
    totalPlayTime: 0
  };
  
  // Buscar do localStorage
  const playHistory = JSON.parse(localStorage.getItem('play_history') || '[]');
  const today = new Date().toDateString();
  
  stats.playedToday = playHistory.filter(h => 
    new Date(h.timestamp).toDateString() === today
  ).length;
  
  // Categoria favorita
  const categoryCount = {};
  playlist.forEach(video => {
    const catId = video.categoryId || 'uncategorized';
    categoryCount[catId] = (categoryCount[catId] || 0) + 1;
  });
  
  const maxCategory = Object.keys(categoryCount).reduce((a, b) => 
    categoryCount[a] > categoryCount[b] ? a : b, 'uncategorized'
  );
  
  stats.favoriteCategory = getCategoryById(maxCategory)?.name || 'Sem Categoria';
  
  return stats;
}

// Debug: Status do player
window.getPlayerStatus = function() {
  return {
    apiReady,
    playerExists: !!player,
    YT: !!window.YT,
    YTPlayer: !!(window.YT && window.YT.Player),
    loopMode,
    playbackSpeed,
    currentIndex,
    queueLength: playQueue.length
  };
};

// Carregar configurações salvas
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar modo loop
  const savedLoopMode = localStorage.getItem('loop_mode');
  if (savedLoopMode) {
    loopMode = savedLoopMode;
    updateLoopModeUI();
  }
  
  // Modo áudio REMOVIDO
  
  logger.info('Player module carregado');
});