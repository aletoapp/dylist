/**
 * DyList App - Main Application Logic
 * VERSÃO CORRIGIDA v2.2
 */

const logger = {
  debug: (msg, data) => console.log(`[DEBUG] ${msg}`, data || ''),
  info:  (msg, data) => console.log(`[INFO] ${msg}`,  data || ''),
  success:(msg,data) => console.log(`[SUCCESS] ${msg}`,data || ''),
  warn:  (msg, data) => console.warn(`[WARN] ${msg}`,  data || ''),
  error: (msg, data) => console.error(`[ERROR] ${msg}`,data || ''),
  trackVideoAdded:    (id, title)   => console.log(`[TRACK] Video added: ${title} (${id})`),
  trackPlaylistAction:(action,count)=> console.log(`[TRACK] Playlist action: ${action} (${count})`),
  trackEvent:         (event, data) => console.log(`[TRACK] Event: ${event}`, data || ''),
  trackDarkMode:      (enabled)     => console.log(`[TRACK] Dark mode: ${enabled}`)
};

let playlist     = [];
let currentIndex = -1;
let playQueue    = [];
let wakeLock     = null;
let draggedElement = null;
const MAX_LINKS  = Infinity;

const INSTAGRAM_USERNAME = 'alementoria';

// ==========================================
// UTILITÁRIOS
// ==========================================

function extractVideoId(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v');
    if (parsed.hostname === 'youtu.be') return parsed.pathname.substring(1);
  } catch (e) {
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  }
  return null;
}

function titleCase(str) {
  if (!str) return '';
  const lower = ['de','da','do','das','dos','e','em','por','para','com','a','o','as','os','no','na','nos','nas','ao','à','às','pelo','pela'];
  return str.toLowerCase()
    .split(/(\s+|—|-)/g)
    .map((word, idx) => {
      if (word.trim() === '') return word;
      if (lower.includes(word.trim()) && idx !== 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('');
}

async function fetchVideoTitle(id) {
  try {
    const res  = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let title  = data.title || 'Vídeo sem título';
    title = titleCase(title);
    title = [...title].slice(0, 40).join('');
    return title;
  } catch (err) {
    return 'Vídeo sem título';
  }
}

// ==========================================
// PLAYLIST - RENDERIZAÇÃO
// ==========================================

function renderPlaylist() {
  const container = document.getElementById('playlistContainer');
  container.innerHTML = '';

  if (currentFilter === 'all') {
    const div = document.createElement('div');
    div.style.cssText = 'padding:40px 20px;text-align:center;color:#94a3b8;';
    div.innerHTML = `
      <p style="font-size:16px;margin-bottom:10px;">Selecione uma categoria para visualizar os vídeos</p>
      <p style="font-size:14px;opacity:0.7;">Total: ${playlist.length} vídeos na biblioteca</p>
    `;
    container.appendChild(div);
    updatePlaylistTitle();
    return;
  }

  const filtered = playlist.filter(item => item.categoryId === currentFilter);

  filtered.forEach((item, index) => {
    const realIndex = playlist.indexOf(item);
    const div = document.createElement('div');
    div.className  = 'playlist-item';
    div.draggable  = true;
    div.dataset.index = realIndex;
    div.innerHTML = `
      <span class="drag-handle">::::  </span>
      <span title="${item.title}" data-index="${realIndex}">${item.title}</span>
      <div class="checkbox-container">
        <input type="checkbox" data-index="${realIndex}">
        <span class="play-number">${index + 1}</span>
      </div>
    `;
    container.appendChild(div);
  });

  updatePlaylistTitle();
  initDragAndDrop();
  initCheckboxes();
}

function updatePlaylistTitle() {
  const title = document.getElementById('playlistTitle');
  if (title) title.textContent = `${playlist.length} créditos - uso pessoal! ☺`;
}

function updatePlayNumbers() {
  document.querySelectorAll('.playlist-item').forEach((item, index) => {
    const cb  = item.querySelector('input[type="checkbox"]');
    const num = item.querySelector('.play-number');
    num.textContent = index + 1;
    cb.checked ? item.classList.add('selected') : item.classList.remove('selected');
  });
}

// ==========================================
// DRAG AND DROP
// ==========================================

function initDragAndDrop() {
  const container = document.getElementById('playlistContainer');
  const items     = container.querySelectorAll('.playlist-item');

  items.forEach(item => {
    item.addEventListener('dragstart', e => { draggedElement = item; item.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
    item.addEventListener('dragend',   () => { item.classList.remove('dragging'); container.querySelectorAll('.playlist-item').forEach(i => i.classList.remove('drag-over')); reorderPlaylist(); updatePlayNumbers(); });
    item.addEventListener('dragover',  e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const after = getDragAfterElement(container, e.clientY); after == null ? container.appendChild(draggedElement) : container.insertBefore(draggedElement, after); });
    item.addEventListener('dragenter', () => { if (item !== draggedElement) item.classList.add('drag-over'); });
    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
    item.addEventListener('drop',      e => { e.preventDefault(); item.classList.remove('drag-over'); });
  });
}

function getDragAfterElement(container, y) {
  return [...container.querySelectorAll('.playlist-item:not(.dragging)')]
    .reduce((closest, child) => {
      const box    = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      return (offset < 0 && offset > closest.offset) ? { offset, element: child } : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function reorderPlaylist() {
  const newPlaylist = [];
  document.querySelectorAll('.playlist-item').forEach(item => {
    const title = item.querySelector('span[title]').textContent;
    const found = playlist.find(p => p.title === title);
    if (found) newPlaylist.push(found);
  });
  playlist = newPlaylist;
  savePlaylist();
}

function initCheckboxes() {
  document.querySelectorAll('.playlist-item input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updatePlayNumbers);
  });
}

// ==========================================
// SALVAR / CARREGAR PLAYLIST
// ==========================================

function savePlaylist() {
  try {
    playlist = playlist.map(item => ({
      ...item,
      categoryId: item.categoryId || 'uncategorized'
    }));
    localStorage.setItem('playlist', JSON.stringify(playlist));
    console.log('📊 Playlist salva:', playlist);
  } catch (e) {
    alert('ERRO: Não foi possível salvar a playlist.');
  }
}

function loadPlaylist() {
  try {
    const saved = localStorage.getItem('playlist');
    if (saved) {
      playlist = JSON.parse(saved).map(item => ({
        id:         item.id,
        title:      item.title || 'Vídeo sem título',
        categoryId: item.categoryId || 'uncategorized'
      }));
      console.log('📊 Playlist carregada:', playlist);
      renderPlaylist();
      if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
    }
  } catch (e) {
    alert('ERRO: Não foi possível carregar a playlist. Os dados podem estar corrompidos.');
  }
}

// ==========================================
// ADICIONAR VÍDEO
// Usa currentFilter diretamente — sem pedir categoria de novo
// ==========================================

function showCategorySelectModal(videos) {
  // Determina a categoria destino: a que está selecionada no filtro (se não for 'all')
  // ou 'uncategorized' como fallback
  const targetCategoryId = (typeof currentFilter !== 'undefined' && currentFilter !== 'all')
    ? currentFilter
    : 'uncategorized';

  // Verifica duplicatas e adiciona
  let adicionados = 0;
  videos.forEach(video => {
    if (playlist.find(p => p.id === video.id)) return; // já existe
    playlist.push({ id: video.id, title: video.title, categoryId: targetCategoryId });
    logger.trackVideoAdded(video.id, video.title);
    adicionados++;
  });

  savePlaylist();
  renderPlaylist();
  updatePlaylistTitle();
  if (typeof renderCategoryFilters === 'function') renderCategoryFilters();

  const catName = (typeof getCategoryById === 'function')
    ? getCategoryById(targetCategoryId)?.name || targetCategoryId
    : targetCategoryId;

  if (adicionados > 0) {
    alert(`✅ ${adicionados} vídeo(s) adicionado(s) à "${catName}"!`);
  } else {
    alert('⚠️ Nenhum vídeo novo foi adicionado (já existiam na playlist).');
  }
}

async function addToPlaylist() {
  const input = document.getElementById('urlInput');
  const url   = input.value.trim();
  if (!url) return;

  if (typeof isChannelUrl === 'function' && isChannelUrl(url)) {
    try {
      const channelInfo = extractChannelIdentifier(url);
      if (!channelInfo) return alert('Link de canal inválido.');
      const videos = await fetchChannelVideos(channelInfo);
      if (playlist.length + videos.length > MAX_LINKS) return alert('Limite excedido.');
      showChannelVideosModal(videos, channelInfo.value);
      input.value = '';
      return;
    } catch (err) {
      if (err.message !== 'API Key necessária') alert('Erro ao buscar vídeos do canal: ' + err.message);
      return;
    }
  }

  const id = extractVideoId(url);
  if (!id) return alert('Link inválido. Use um link de vídeo ou canal.');
  if (playlist.some(item => item.id === id)) return alert('Este vídeo já está na playlist.');

  const title = await fetchVideoTitle(id);
  showCategorySelectModal([{ id, title }]);
  input.value = '';
}

// ==========================================
// AÇÕES DA PLAYLIST
// ==========================================

function deleteSelected() {
  const checkboxes = document.querySelectorAll("#playlistContainer input[type='checkbox']");
  const toKeep = [];
  checkboxes.forEach(cb => {
    const realIndex = parseInt(cb.dataset.index);
    if (!cb.checked) toKeep.push(playlist[realIndex]);
  });
  playlist = toKeep;
  renderPlaylist();
  savePlaylist();
  updatePlaylistTitle();
  if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
}

function confirmClearAll() {
  document.getElementById('confirmModal').style.display = 'flex';
}

function closeConfirm() {
  document.getElementById('confirmModal').style.display = 'none';
}

function clearAll() {
  playlist = [];
  renderPlaylist();
  savePlaylist();
  closeConfirm();
  updatePlaylistTitle();
  if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
}

function selectAll() {
  const checkboxes = document.querySelectorAll('#playlistContainer input[type="checkbox"]');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach(cb => { cb.checked = !allChecked; });
  updatePlayNumbers();
}

function copyPix() {
  navigator.clipboard.writeText('faledemim@gmail.com').then(() => {
    const msg = document.getElementById('msgPix');
    if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 2500); }
  });
}

function followInstagram() {
  window.open(`https://www.instagram.com/${INSTAGRAM_USERNAME}/`, '_blank');
  localStorage.setItem('dylist_followed_insta', 'true');
  const btn = document.getElementById('instagramFollowBtn');
  if (btn) btn.style.display = 'none';
}

async function ativarModoEscuro() {
  document.getElementById('darkOverlay').style.display = 'flex';
  if ('wakeLock' in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      const txt = document.getElementById('turnOn');
      if (txt) {
        const orig = txt.textContent;
        txt.textContent = '🔋 Economia de bateria ativa | Toque para sair';
        setTimeout(() => { if (txt) txt.textContent = orig; }, 3000);
      }
    } catch (err) { logger.error('Wake Lock falhou'); }
  }
}

function desativarModoEscuro() {
  document.getElementById('darkOverlay').style.display = 'none';
  if (wakeLock !== null) wakeLock.release().then(() => { wakeLock = null; });
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // darkModeBtnWrapper mantido no HTML mas sem botão visível —
  // o botão OLED fica exclusivamente na barra de controles (secondary-controls)
  // As funções ativarModoEscuro / desativarModoEscuro continuam ativas

  document.getElementById('addBtn').addEventListener('click', addToPlaylist);
  document.getElementById('playAllBtn').addEventListener('click', playAll);
  document.getElementById('playSelectedBtn').addEventListener('click', playSelected);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('confirmClearBtn').addEventListener('click', confirmClearAll);
  document.getElementById('clearYesBtn').addEventListener('click', clearAll);
  document.getElementById('clearNoBtn').addEventListener('click', closeConfirm);

  const selectAllBtn = document.getElementById('selectAllBtn');
  if (selectAllBtn) selectAllBtn.addEventListener('click', selectAll);

  const instagramBtn = document.getElementById('instagramFollowBtn');
  if (instagramBtn) instagramBtn.addEventListener('click', followInstagram);

  const pixBtn = document.getElementById('copiarPixBtn');
  if (pixBtn) pixBtn.addEventListener('click', copyPix);

  document.getElementById('darkOverlay').addEventListener('click', desativarModoEscuro);

  document.getElementById('playlistContainer').addEventListener('click', e => {
    const span = e.target.closest('span[title]');
    if (span && span.dataset && span.dataset.index) {
      const idx = parseInt(span.dataset.index);
      if (!isNaN(idx)) playVideo(idx);
    }
  });

  document.getElementById('urlInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') addToPlaylist();
  });

  loadPlaylist();

  setTimeout(() => {
    if (typeof renderCategoryFilters === 'function') renderCategoryFilters();
  }, 100);

  logger.success('DyList iniciado com sucesso');
});
