/**
 * DyList Categories System - v2.4
 * Melhorias: sem alert ao criar, delete apaga links, emoji picker, drag & drop
 */

let categories = [];
let currentFilter = 'all';
let editingCategoryId = null;

const COLORS = [
  { name: 'Vermelho',  value: '#ef4444' },
  { name: 'Laranja',   value: '#f97316' },
  { name: 'Amarelo',   value: '#eab308' },
  { name: 'Verde',     value: '#22c55e' },
  { name: 'Azul',      value: '#3b82f6' },
  { name: 'Roxo',      value: '#a855f7' },
  { name: 'Rosa',      value: '#ec4899' },
  { name: 'Ciano',     value: '#06b6d4' },
  { name: 'Esmeralda', value: '#10b981' },
  { name: 'Índigo',    value: '#6366f1' },
  { name: 'Fúcsia',    value: '#d946ef' },
  { name: 'Lima',      value: '#84cc16' }
];

// ==========================================
// EMOJI PICKER DATA
// ==========================================
const EMOJI_CATEGORIES = [
  { label: '😊', name: 'Rostos', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','👽','👾','🤖','🎃'] },
  { label: '👋', name: 'Pessoas', emojis: ['👋','🤚','✋','🖖','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','💪','👂','👃','👀','👅','👄','💋','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💔','💘','💓','💞','💕','💟','❣️'] },
  { label: '🐶', name: 'Animais', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🙈','🙉','🙊','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🦋','🐛','🐞','🐜','🐢','🐍','🦎','🐲','🦕','🦖','🦈','🐬','🐳','🐋','🐊','🐅','🐆','🦌','🐈','🐩','🦡','🦦','🦥','🦙','🦘','🦚','🦜','🦢','🦩','🕊','🐇','🦔','🐓','🦃','🐠','🐡','🦑','🦐','🦞','🦀','🐙','🐚'] },
  { label: '🍎', name: 'Comida', emojis: ['🍎','🍊','🍋','🍇','🍓','🫐','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥕','🧅','🧄','🥔','🥐','🥯','🍞','🥖','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🍗','🍖','🌭','🍔','🍟','🍕','🌮','🌯','🥗','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🍯','☕','🍵','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🍾'] },
  { label: '⚽', name: 'Esportes', emojis: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🏒','🥊','🥋','🎽','🛹','⛸','🥌','🎿','🏋️','🤸','🏊','🚵','🚴','🧘','🏇','🤽','🚣','🤿','🏄','🏌️','🎯','🏹','🎣','🏆','🥇','🥈','🥉','🏅','🎖','🏵','🎗','🎫','🎟','🎪','🤹','🎨','🎭','🎬','🎤','🎧','🎵','🎶','🎷','🎸','🎹','🥁','🎺','🎻','🎲','🎰','🎳'] },
  { label: '🚀', name: 'Viagem', emojis: ['🚀','🛸','🚗','🚕','🚙','🚌','🏎','🚓','🚑','🚒','🚐','🛻','🚚','🚛','🚜','🛴','🚲','🛵','🏍','🚨','🚡','🚠','🚟','🚃','🚋','🚄','🚅','🚈','🚂','🚆','🚇','✈️','🛩','🪂','💺','🛰','🚁','🚢','⛵','🚤','🛥','⛴','🚣','🛶','⛽','🚧','🗺','🧭','⛰','🌋','🏔','🗻','🏕','🏖','🏜','🏝','🏞','🏟','🏛','🏗','🏘','🏠','🏡','🏢','🏥','🏦','🏨','🏩','🏪','🏫','🏬','🏭','🏯','🏰','💒','🗼','🗽'] },
  { label: '💡', name: 'Objetos', emojis: ['💡','🔦','🕯','🧯','💸','💵','💰','💳','💎','⚖️','🔧','🔨','⚒','🛠','⛏','🔩','🧲','🔪','⚔️','🛡','🔭','🔬','💊','🩹','💻','🖥','🖱','📱','☎️','📞','📺','📻','🧭','⌚','📡','🔋','🔌','🔑','🗝','🔐','🔏','🔒','🔓','🚪','📦','📫','📬','📢','📣','🔔','📷','📸','📹','🎥','📞','⏰','⌛','⏳','📅','📆','📓','📔','📒','📕','📗','📘','📙','📚','📖','🔖','📎','📐','📏','✂️','🔍','🔎','🖊','✏️','🖋','📝'] },
  { label: '⭐', name: 'Símbolos', emojis: ['⭐','🌟','💫','✨','🎇','🎆','🌈','☀️','⛅','☁️','❄️','🌪','🌊','💧','💦','🔥','🌱','🌲','🌳','🌴','🌵','🌾','☘️','🍀','🍁','🍂','🍃','🍄','💐','🌷','🌹','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌙','🌍','🌎','🌏','🪐','💥','♥️','♠️','♣️','♦️','🃏','🔮','🧿','🧸','🎀','🎁','🎊','🎉','🎈','🎏','🎐','🧧','✉️','💌','📥','📤'] }
];

// ==========================================
// CORE
// ==========================================

function loadCategories() {
  try {
    const saved = localStorage.getItem('youlist_categories');
    categories = saved ? JSON.parse(saved) : [];

    if (!categories.find(c => c.id === 'uncategorized')) {
      const uncategorized = { id: 'uncategorized', name: 'Sem Categoria', color: '#64748b' };
      categories.length === 0 ? categories = [uncategorized] : categories.unshift(uncategorized);
      saveCategories();
    }
    console.log('[CATEGORIES] Carregadas:', categories);
  } catch (e) {
    console.error('[CATEGORIES] Erro ao carregar:', e);
    categories = [{ id: 'uncategorized', name: 'Sem Categoria', color: '#64748b' }];
    saveCategories();
  }
}

function saveCategories() {
  try {
    localStorage.setItem('youlist_categories', JSON.stringify(categories));
  } catch (e) {
    alert('ERRO: Não foi possível salvar as categorias.');
  }
}

function getCategoryById(id) {
  return categories.find(c => c.id === id)
    || categories.find(c => c.id === 'uncategorized')
    || categories[0];
}

function getAutoColor() {
  const userCats = categories.filter(c => c.id !== 'uncategorized');
  return COLORS[userCats.length % COLORS.length].value;
}

// ==========================================
// RENDERIZAÇÃO - SELECT DA PLAYLIST (coluna direita)
// ==========================================

function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  container.innerHTML = '';
  const select = document.createElement('select');
  select.className = 'category-select';
  select.style.width = '100%';

  const totalVideos = (typeof playlist !== 'undefined') ? playlist.length : 0;
  const optAll = document.createElement('option');
  optAll.value = 'all';
  optAll.textContent = `📋 TODAS CATEGORIAS (${totalVideos})`;
  optAll.selected = (currentFilter === 'all');
  select.appendChild(optAll);

  const userCats  = categories.filter(c => c.id !== 'uncategorized');
  const uncatCat  = categories.find(c => c.id === 'uncategorized');
  const ordered   = uncatCat ? [...userCats, uncatCat] : userCats;

  ordered.forEach(cat => {
    const count = (typeof playlist !== 'undefined')
      ? playlist.filter(v => v.categoryId === cat.id).length
      : 0;
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = `${cat.name} (${count})`;
    opt.selected = (currentFilter === cat.id);
    select.appendChild(opt);
  });

  select.onchange = (e) => {
    currentFilter = e.target.value;
    if (window.renderPlaylist) renderPlaylist();
    renderCategoryFilters();
  };

  container.appendChild(select);
  console.log('[CATEGORIES] Select renderizado. Selecionado:', currentFilter);
}

// ==========================================
// RENDERIZAÇÃO - LISTA NO MODAL (com Drag & Drop)
// ==========================================

let dragSrcId = null;

function renderCategoriesList() {
  const container = document.getElementById('categoriesList');
  if (!container) return;

  container.innerHTML = '';
  const userCats = categories.filter(c => c.id !== 'uncategorized');

  if (userCats.length === 0) {
    container.innerHTML = '<p style="color:#64748b;font-size:13px;text-align:center;">Nenhuma categoria criada.</p>';
    return;
  }

  userCats.forEach(cat => {
    const div = document.createElement('div');
    div.className = 'category-list-item';
    div.dataset.id = cat.id;
    div.draggable = true;
    div.style.cssText = `
      display:flex; align-items:center; justify-content:space-between;
      margin-bottom:8px; background:rgba(255,255,255,0.05);
      padding:8px 10px; border-radius:8px; cursor:grab;
      border:2px solid transparent; transition:border-color 0.15s, background 0.15s;
      user-select:none;
    `;

    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="color:#475569;font-size:18px;cursor:grab;line-height:1;" title="Arraste para reordenar">⠿</span>
        <div style="background:${cat.color};width:12px;height:12px;border-radius:50%;flex-shrink:0;"></div>
        <span style="font-size:14px;">${cat.name}</span>
      </div>
      <div style="display:flex;gap:4px;">
        <button onclick="editCategoryModal('${cat.id}')" style="background:none;border:none;cursor:pointer;font-size:17px;padding:2px 4px;" title="Editar">✏️</button>
        <button onclick="deleteCategory('${cat.id}')" style="background:none;border:none;cursor:pointer;font-size:17px;padding:2px 4px;" title="Deletar">🗑️</button>
      </div>
    `;

    // --- Drag & Drop ---
    div.addEventListener('dragstart', (e) => {
      dragSrcId = cat.id;
      setTimeout(() => div.style.opacity = '0.4', 0);
      e.dataTransfer.effectAllowed = 'move';
    });

    div.addEventListener('dragend', () => {
      div.style.opacity = '1';
      document.querySelectorAll('.category-list-item').forEach(el => {
        el.style.borderColor = 'transparent';
        el.style.background  = 'rgba(255,255,255,0.05)';
      });
    });

    div.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      div.style.borderColor = '#3b82f6';
      div.style.background  = 'rgba(59,130,246,0.12)';
    });

    div.addEventListener('dragleave', () => {
      div.style.borderColor = 'transparent';
      div.style.background  = 'rgba(255,255,255,0.05)';
    });

    div.addEventListener('drop', (e) => {
      e.preventDefault();
      if (dragSrcId === cat.id) return;

      const srcIndex  = categories.findIndex(c => c.id === dragSrcId);
      const destIndex = categories.findIndex(c => c.id === cat.id);
      if (srcIndex === -1 || destIndex === -1) return;

      const [moved] = categories.splice(srcIndex, 1);
      categories.splice(destIndex, 0, moved);

      saveCategories();
      renderCategoriesList();
      renderCategoryFilters();
    });

    container.appendChild(div);
  });
}

// ==========================================
// CRIAR CATEGORIA  (sem alert — modal fecha ao criar)
// ==========================================

function createCategory() {
  const input = document.getElementById('newCategoryInput');
  const name  = input.value.trim();

  if (!name)              { alert('Dê um nome à categoria!'); return; }
  if (name.length > 25)   { alert('Nome muito longo! Máximo 25 caracteres.'); return; }
  if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    alert('Já existe uma categoria com este nome!');
    return;
  }

  const newCategory = {
    id:    'cat_' + Date.now(),
    name:  name,
    color: getAutoColor()
  };

  categories.push(newCategory);
  currentFilter = newCategory.id;

  saveCategories();
  renderCategoriesList();
  renderCategoryFilters();
  if (window.renderPlaylist) renderPlaylist();

  input.value = '';
  closeEmojiPicker();

  // Fechar modal sem exibir notificação
  const modal = document.getElementById('categoriesModal');
  if (modal) modal.style.display = 'none';

  console.log('[CATEGORIES] Criada e selecionada:', newCategory);
}

// ==========================================
// EDITAR CATEGORIA
// ==========================================

function editCategoryModal(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;
  editingCategoryId = catId;
  document.getElementById('editCategoryInput').value = cat.name;
  document.getElementById('editCategoryModal').style.display = 'flex';
}

function saveEditCategory() {
  const name = document.getElementById('editCategoryInput').value.trim();
  if (!name)            { alert('Digite um nome!'); return; }
  if (name.length > 25) { alert('Nome muito longo! Máximo 25 caracteres.'); return; }

  const cat = categories.find(c => c.id === editingCategoryId);
  if (!cat) { alert('Erro ao salvar categoria.'); return; }

  if (categories.some(c => c.id !== editingCategoryId && c.name.toLowerCase() === name.toLowerCase())) {
    alert('Já existe uma categoria com este nome!');
    return;
  }

  cat.name = name;
  saveCategories();
  renderCategoriesList();
  renderCategoryFilters();
  if (window.renderPlaylist) renderPlaylist();
  document.getElementById('editCategoryModal').style.display = 'none';
}

// ==========================================
// DELETAR CATEGORIA  (apaga os vídeos da playlist)
// ==========================================

function deleteCategory(catId) {
  const cat = categories.find(c => c.id === catId);
  if (!cat) return;

  const videosCount = (typeof playlist !== 'undefined')
    ? playlist.filter(v => v.categoryId === catId).length : 0;

  let msg = `Excluir a categoria "${cat.name}"?`;
  if (videosCount > 0) msg += `\n\n⚠️ ${videosCount} vídeo(s) desta categoria também serão removidos da playlist.`;
  if (!confirm(msg)) return;

  // Remover os vídeos da playlist (apagar, não mover)
  if (videosCount > 0 && typeof playlist !== 'undefined') {
    playlist = playlist.filter(v => v.categoryId !== catId);
    if (typeof savePlaylist === 'function') savePlaylist();
  }

  categories = categories.filter(c => c.id !== catId);
  if (currentFilter === catId) currentFilter = 'all';

  saveCategories();
  renderCategoriesList();
  renderCategoryFilters();
  if (window.renderPlaylist) renderPlaylist();
  console.log('[CATEGORIES] Deletada:', cat.name, '| Vídeos removidos:', videosCount);
}

// ==========================================
// EMOJI PICKER (puro CSS/JS, sem dependências)
// ==========================================

let emojiPickerOpen = false;

function buildEmojiPicker() {
  if (document.getElementById('emojiPickerPanel')) return;

  const panel = document.createElement('div');
  panel.id = 'emojiPickerPanel';
  panel.style.cssText = `
    display:none; position:absolute; z-index:99999;
    background:#1e293b; border:1.5px solid #334155;
    border-radius:12px; width:290px;
    box-shadow:0 8px 32px rgba(0,0,0,0.65);
    overflow:hidden; top:calc(100% + 6px); left:0;
  `;

  // Tabs
  const tabsBar = document.createElement('div');
  tabsBar.id = 'emojiTabsBar';
  tabsBar.style.cssText = `
    display:flex; overflow-x:auto; background:#0f172a;
    padding:6px 4px 0; gap:1px;
  `;

  EMOJI_CATEGORIES.forEach((cat, idx) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.textContent = cat.label;
    tab.title = cat.name;
    tab.style.cssText = `
      background:none; border:none; cursor:pointer; font-size:17px;
      padding:5px 8px; border-radius:6px 6px 0 0; flex-shrink:0;
      opacity:${idx===0?'1':'0.5'};
      border-bottom:2px solid ${idx===0?'#3b82f6':'transparent'};
      transition:opacity 0.15s;
    `;
    tab.onclick = () => switchEmojiTab(idx);
    tabsBar.appendChild(tab);
  });

  // Grid
  const grid = document.createElement('div');
  grid.id = 'emojiGrid';
  grid.style.cssText = `
    display:flex; flex-wrap:wrap; gap:1px;
    padding:8px; max-height:190px; overflow-y:auto;
    scrollbar-width:thin; scrollbar-color:#334155 transparent;
  `;

  panel.appendChild(tabsBar);
  panel.appendChild(grid);

  const wrapper = document.getElementById('emojiInputWrapper');
  if (wrapper) wrapper.appendChild(panel);

  switchEmojiTab(0);
}

function switchEmojiTab(idx) {
  const grid = document.getElementById('emojiGrid');
  if (!grid) return;
  grid.innerHTML = '';

  EMOJI_CATEGORIES[idx].emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = emoji;
    btn.style.cssText = `
      background:none; border:none; cursor:pointer; font-size:20px;
      padding:3px; border-radius:5px; width:33px; height:33px;
      transition:background 0.1s; line-height:1;
    `;
    btn.onmouseenter = () => btn.style.background = 'rgba(255,255,255,0.12)';
    btn.onmouseleave = () => btn.style.background = 'none';
    btn.onclick = (e) => { e.stopPropagation(); insertEmoji(emoji); };
    grid.appendChild(btn);
  });

  document.querySelectorAll('#emojiTabsBar button').forEach((tab, i) => {
    tab.style.opacity      = i === idx ? '1' : '0.5';
    tab.style.borderBottom = `2px solid ${i === idx ? '#3b82f6' : 'transparent'}`;
    tab.style.background   = i === idx ? 'rgba(59,130,246,0.12)' : 'none';
  });
}

function insertEmoji(emoji) {
  const input = document.getElementById('newCategoryInput');
  if (!input) return;
  const start = input.selectionStart ?? input.value.length;
  const end   = input.selectionEnd   ?? input.value.length;
  input.value = input.value.slice(0, start) + emoji + input.value.slice(end);
  const pos = start + emoji.length;
  input.setSelectionRange(pos, pos);
  input.focus();
}

function toggleEmojiPicker(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('emojiPickerPanel');
  if (!panel) return;
  emojiPickerOpen = !emojiPickerOpen;
  panel.style.display = emojiPickerOpen ? 'block' : 'none';
}

function closeEmojiPicker() {
  const panel = document.getElementById('emojiPickerPanel');
  if (panel) panel.style.display = 'none';
  emojiPickerOpen = false;
}

function injectEmojiUI() {
  const input = document.getElementById('newCategoryInput');
  if (!input || document.getElementById('emojiInputWrapper')) return;

  const wrapper = document.createElement('div');
  wrapper.id = 'emojiInputWrapper';
  wrapper.style.cssText = 'position:relative; display:flex; gap:6px; align-items:center; width:100%;';

  const emojiBtn = document.createElement('button');
  emojiBtn.type = 'button';
  emojiBtn.id   = 'emojiPickerBtn';
  emojiBtn.textContent = '😊';
  emojiBtn.title = 'Inserir emoji';
  emojiBtn.style.cssText = `
    background:rgba(255,255,255,0.07); border:1.5px solid #334155;
    border-radius:8px; cursor:pointer; font-size:18px;
    padding:0 10px; height:40px; flex-shrink:0;
    transition:background 0.15s;
  `;
  emojiBtn.onmouseenter = () => emojiBtn.style.background = 'rgba(255,255,255,0.14)';
  emojiBtn.onmouseleave = () => emojiBtn.style.background = 'rgba(255,255,255,0.07)';
  emojiBtn.onclick = toggleEmojiPicker;

  input.style.flex = '1';

  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);
  wrapper.appendChild(emojiBtn);

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    const panel  = document.getElementById('emojiPickerPanel');
    const btn    = document.getElementById('emojiPickerBtn');
    if (!panel) return;
    if (!panel.contains(e.target) && e.target !== btn) {
      closeEmojiPicker();
    }
  });

  buildEmojiPicker();
}

// ==========================================
// INICIALIZAÇÃO
// ==========================================

function initCategories() {
  loadCategories();
  renderCategoriesList();
  renderCategoryFilters();

  ['.color-selector', '#colorGrid', '#editColorGrid'].forEach(s => {
    const el = document.querySelector(s);
    if (el) el.style.display = 'none';
  });

  const bind = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
  };

  bind('openCategoriesBtn',   () => document.getElementById('categoriesModal').style.display = 'flex');
  bind('closeCategoriesBtn',  () => { closeEmojiPicker(); document.getElementById('categoriesModal').style.display = 'none'; });
  bind('createCategoryBtn',   createCategory);
  bind('saveEditCategoryBtn', saveEditCategory);
  bind('closeEditCategoryBtn',() => document.getElementById('editCategoryModal').style.display = 'none');

  const newInput  = document.getElementById('newCategoryInput');
  const editInput = document.getElementById('editCategoryInput');
  if (newInput)  newInput.addEventListener('keypress',  e => { if (e.key === 'Enter') createCategory(); });
  if (editInput) editInput.addEventListener('keypress', e => { if (e.key === 'Enter') saveEditCategory(); });

  injectEmojiUI();

  console.log('[CATEGORIES] ✅ v2.4 inicializado com sucesso!');
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initCategories();
} else {
  window.addEventListener('load', initCategories);
}

window.getCategoryById       = getCategoryById;
window.renderCategoryFilters = renderCategoryFilters;