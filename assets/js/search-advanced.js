/**
 * iList - Busca Inteligente TURBO 🚀
 * Ajuste Final: Botão Principal em #990066
 * CORREÇÃO: Sistema de Solicitação de API Key
 */

class SmartSearch {
  constructor() {
    this.API_KEY = localStorage.getItem('youtube_api_key');
    this.allResults = { videos: [] };
    this.source = 'youtube';
    this.currentTab = 'videos';
    this.selectedCategory = null;
    this.pageTokens = { videos: null };
    this.pageNumbers = { videos: 1 };
    this.currentQuery = '';
    this.cleanQueryVideos = '';
    this.channelUploadsPlaylistId = null; // para paginação de canais
    this.init();
  }

  init() {
    this.createSmartSearchButton();
    this.createSmartSearchModal();
    this.makeCategoriesClickable();
  }

  checkAndRequestApiKey() {
    if (!this.API_KEY) {
      this.showApiKeyModal();
      return false;
    }
    return true;
  }

  showApiKeyModal() {
    let modal = document.getElementById('apiKeyModal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'apiKeyModal';
      modal.className = 'modal';
      modal.style.cssText = "display:flex; position:fixed; inset:0; background:rgba(0,0,0,0.9); z-index:10000; align-items:center; justify-content:center;";
      
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px; width:95%; text-align: left; background:#1e293b; padding:25px; border-radius:12px;" onclick="event.stopPropagation()">
          <h3 style="margin-top: 0; color: #fff;">🔑 Configurar API Key do YouTube</h3>
          
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 15px;">
            Para usar a <strong>Busca Inteligente</strong> e adicionar vídeos de canais, você precisa de uma chave da API do YouTube V3.
          </p>
          
          <div style="background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; padding: 12px; border-radius: 6px; margin-bottom: 15px;">
            <p style="font-size: 13px; color: #10b981; margin: 0; line-height: 1.5;">
              <strong>✓ É grátis!</strong> Google oferece 10.000 requisições/dia sem custo.
            </p>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h4 style="font-size: 14px; color: #fff; margin-bottom: 10px;">📋 Como obter sua chave:</h4>
            <ol style="font-size: 13px; color: #cbd5e1; line-height: 1.8; padding-left: 20px;">
              <li>Acesse: <a href="https://console.cloud.google.com/apis/credentials" target="_blank" style="color: #06b6d4; text-decoration: none;">console.cloud.google.com/apis/credentials</a></li>
              <li>Crie um projeto (se não tiver)</li>
              <li>Clique em "Criar credenciais" → "Chave de API"</li>
              <li>Ative a "YouTube Data API v3"</li>
              <li>Copie sua chave e cole abaixo</li>
            </ol>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 13px; color: #94a3b8; margin-bottom: 8px;">Cole sua API Key:</label>
            <input type="text" id="apiKeyInput" placeholder="AIzaSy..." style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9; font-size: 14px;"/>
          </div>
          
          <button id="saveApiKeyBtn" style="width: 100%; background: #10b981; padding: 12px; border-radius: 6px; color: #fff; font-weight: 600; border: none; cursor: pointer; margin-bottom: 10px;">
            💾 Salvar e Continuar
          </button>
          
          <button id="cancelApiKeyBtn" style="width: 100%; background: #334155; color: #fff; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
            Cancelar
          </button>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelector('#saveApiKeyBtn').onclick = () => this.saveApiKey();
      modal.querySelector('#cancelApiKeyBtn').onclick = () => {
        modal.style.display = 'none';
      };
      
      modal.querySelector('#apiKeyInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.saveApiKey();
      });
    } else {
      modal.style.display = 'flex';
    }
    
    setTimeout(() => {
      const input = document.getElementById('apiKeyInput');
      if (input) input.focus();
    }, 100);
  }

  saveApiKey() {
    const input = document.querySelector('#apiKeyModal #apiKeyInput');
    const key = input.value.trim();
    
    if (!key) {
      alert('❌ Por favor, insira uma chave válida.');
      return;
    }
    
    if (!key.startsWith('AIza')) {
      alert('⚠️ A chave da API do YouTube geralmente começa com "AIza". Verifique se está correta.');
      return;
    }
    
    localStorage.setItem('youtube_api_key', key);
    this.API_KEY = key;
    
    document.getElementById('apiKeyModal').style.display = 'none';
    
    showQuickToast('✅ API Key configurada com sucesso!');
    
    console.log('[API Key] Configurada e salva no localStorage');
  }

  createSmartSearchButton() {
    // Se o botão já existe no HTML, apenas conecta o evento
    const existing = document.getElementById('smartSearchBtn');
    if (existing) {
      existing.onclick = () => this.openSmartSearchModal();
      return;
    }

    // Fallback: criar o botão dinamicamente (comportamento original)
    const title = document.querySelector('.box h3');
    if (!title) return;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin: 15px 0; text-align: left;';
    
    const button = document.createElement('button');
    button.id = 'smartSearchBtn';
    button.innerHTML = '🔍 Busca Inteligente';
    button.style.cssText = `background: #990066; color: #fff; padding: 12px 24px; border-radius: 8px; border: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: opacity 0.3s;`;
    
    button.onmouseover = () => button.style.opacity = '0.9';
    button.onmouseout = () => button.style.opacity = '1';
    
    button.onclick = () => this.openSmartSearchModal();
    buttonContainer.appendChild(button);
    title.parentNode.insertBefore(buttonContainer, title.nextSibling);
  }

  createSmartSearchModal() {
    if (document.getElementById('smartSearchModal')) return;
    const modal = document.createElement('div');
    modal.id = 'smartSearchModal';
    modal.className = 'modal';
    modal.style.cssText = "display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center;";
    
    // FECHAR AO CLICAR FORA (NA MÁSCARA ESCURA)
    modal.onclick = (e) => { if(e.target === modal) this.closeSmartSearchModal(); };

    modal.innerHTML = `
      <div class="modal-content" style="max-width: 700px; width:95%; max-height: 90vh; overflow-y: auto; text-align: left; background:#1e293b; padding:20px; border-radius:12px;" onclick="event.stopPropagation()">
        <h3 style="margin-top: 0; text-align: left; color: #fff;">🔍 Busca Inteligente</h3>
        
        <div style="margin-bottom: 15px;">
          <input id="smartSearchInput" type="text" placeholder='O que vamos ouvir hoje?' style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f1f5f9;"/>
        </div>

        <button id="smartSearchExecuteBtn" style="width: 100%; background: #06b6d4; padding: 12px; border-radius: 6px; color: #fff; font-weight: 600; border: none; cursor: pointer; margin-bottom: 15px;">🔍 Buscar Agora</button>

        <div id="smartSearchResults" style="display: none;">
          <div id="smartSearchLoading" style="display: none; text-align: left; padding: 10px; color: #94a3b8;">⏳ Buscando...</div>

          <div id="smartSearchTabs" style="display: none; margin-bottom: 15px;">
            <div style="display: flex; gap: 8px; justify-content: flex-start; align-items: center; flex-wrap: wrap;">
              <button class="smart-tab" data-tab="videos" style="background:#990066; color:white; border:none; padding:8px 15px; border-radius:6px; cursor:pointer; font-size:12px; font-weight: 600;">📺 VÍDEOS <span class="tab-count"></span></button>
              <span id="smartSearchSourceBadge" style="font-size:11px; color:#64748b; margin-left:4px;"></span>
            </div>
          </div>

          <div id="smartSearchTabContent" style="display: flex; flex-direction: column; gap: 2px;"></div>

          <div id="smartSearchQuantityWrapper" style="display: none; margin: 15px 0;">
            <div style="font-size: 13px; color: #94a3b8;" id="smartSearchSelectedCount">0 selecionado(s)</div>
          </div>

          <button id="smartSearchAddBtn" style="display: none; width: 100%; background: #10b981; padding: 12px; border-radius: 6px; color: #fff; font-weight: 600; border: none; cursor: pointer;">✅ Adicionar à Minha Lista</button>
        </div>

        <button class="close-btn" style="margin-top:20px; width:100%; background: #334155; color: #fff; border: none; padding: 10px; border-radius: 6px; cursor: pointer;" id="smartSearchCloseBtn">Fechar</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    document.getElementById('smartSearchCloseBtn').onclick = () => this.closeSmartSearchModal();
    document.getElementById('smartSearchExecuteBtn').onclick = () => this.executeSmartSearch();
    document.getElementById('smartSearchAddBtn').onclick = () => this.addVideosToCategory();
    
    modal.querySelectorAll('.smart-tab').forEach(tab => {
      tab.onclick = () => this.switchTab(tab.dataset.tab);
    });
  }

  openSmartSearchModal() {
    // VERIFICAR API KEY ANTES DE ABRIR
    if (!this.checkAndRequestApiKey()) {
      return;
    }
    
    this.selectedCategory = (typeof currentFilter !== 'undefined' && currentFilter !== 'all') ? currentFilter : 'uncategorized';
    document.getElementById('smartSearchModal').style.display = 'flex';
    document.getElementById('smartSearchInput').focus();
  }

  closeSmartSearchModal() {
    document.getElementById('smartSearchModal').style.display = 'none';
  }

  // ──────────────────────────────────────────────
  // DETECÇÃO DE TIPO DE INPUT
  // ──────────────────────────────────────────────

  detectInputType(input) {
    try {
      const url = new URL(input);
      const hostname = url.hostname.replace('www.', '');
      const pathname = url.pathname;
      const params = url.searchParams;
      const isMusicDomain = hostname === 'music.youtube.com';

      // 1. Vídeo único: youtu.be/ID
      if (hostname === 'youtu.be') {
        const videoId = pathname.slice(1).split('?')[0];
        return { type: 'video', videoId, source: 'youtube' };
      }

      // 2. Vídeo único: youtube.com/watch?v=ID
      if (params.get('v') && !params.get('list')) {
        return { type: 'video', videoId: params.get('v'), source: isMusicDomain ? 'music' : 'youtube' };
      }

      // 3. Playlist: qualquer URL com list=
      if (params.get('list')) {
        return { type: 'playlist', playlistId: params.get('list'), source: isMusicDomain ? 'music' : 'youtube' };
      }

      // 4. Canal (com ou sem /videos no final)
      if (hostname === 'youtube.com' && (
        /@[\w-]+/.test(pathname) ||
        /\/channel\/UC[\w-]+/.test(pathname) ||
        /\/c\/[\w-]+/.test(pathname) ||
        /\/user\/[\w-]+/.test(pathname)
      )) {
        return { type: 'channel', url: input, source: 'youtube' };
      }

      return { type: 'text', query: input };
    } catch (e) {
      // Não é URL → busca textual
      return { type: 'text', query: input };
    }
  }

  // ──────────────────────────────────────────────
  // DEDUPLICAÇÃO CENTRALIZADA
  // ──────────────────────────────────────────────

  _dedup(items) {
    const seen = new Set();
    return items.filter(item => {
      if (!item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }

  // ──────────────────────────────────────────────
  // FILTRO DE RELEVÂNCIA (SOFT)
  // ──────────────────────────────────────────────

  // Filtragem suave: remove resultados sem nenhuma palavra-chave,
  // mas garante mínimo de MIN_KEEP resultados. Confia no ranking da API.
  _filterByRelevanceSoft(items, query, minKeep = 10) {
    const stopWords = new Set(['ao','de','da','do','das','dos','em','no','na','e','a','o','um','uma','the','in','of','and','com','por','para','que','se','os','as']);
    const words = query.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1 && !stopWords.has(w));

    if (words.length === 0) return items;

    const filtered = items.filter(item => {
      const title = item.title.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return words.some(w => title.includes(w));
    });

    // Se filtrou demais, devolve original (ranking da API é confiável)
    return filtered.length >= minKeep ? filtered : items;
  }

  detectMusicIntent(query) {
    const musicKeywords = [
      'música', 'musica', 'músicas', 'musicas',
      'song', 'songs', 'music', 'canção', 'cancao',
      'álbum', 'album', 'sertanejo', 'forró', 'forro',
      'pagode', 'funk', 'gospel', 'mpb', 'axé', 'axe',
      'banda', 'artista', 'discografia', 'clipe'
    ];
    const q = query.toLowerCase();
    return musicKeywords.some(kw => q.includes(kw));
  }

  detectVideoChannelIntent(query) {
    // "pedro calabrez videos" → busca só vídeos, sem playlists
    return /\b(videos?|vídeos?|channel|canal)\b/i.test(query);
  }

  async executeSmartSearch() {
    const query = document.getElementById('smartSearchInput').value.trim();
    if (!query) return;
    if (!this.checkAndRequestApiKey()) return;

    // Reset completo
    this.pageTokens = { videos: null };
    this.pageNumbers = { videos: 1 };
    this.currentQuery = query;
    this.cleanQueryVideos = '';
    this.channelUploadsPlaylistId = null;
    this.inputTypeCache = null;

    this.showLoading(true);
    try {
      const inputType = this.detectInputType(query);
      this.inputTypeCache = inputType; // guarda para paginação

      if (inputType.type === 'video') {
        // ── Vídeo único: 1 resultado exato ──
        const video = await this.fetchSingleVideo(inputType.videoId);
        this.allResults = { videos: [video] };
        this.source = inputType.source;

      } else if (inputType.type === 'playlist') {
        // ── Link de playlist: expande os itens ──
        const items = this._dedup(await this.fetchPlaylistItems(inputType.playlistId));
        this.pageTokens.videos = this._lastNextPageToken || null;
        this.channelUploadsPlaylistId = inputType.playlistId; // reusar na paginação
        this.allResults = { videos: items };
        this.source = inputType.source;

      } else if (inputType.type === 'channel') {
        // ── Link de canal: resolve uploads playlist ──
        const { videos, uploadsPlaylistId } = await this.fetchChannelVideosByUrl(inputType.url);
        this.channelUploadsPlaylistId = uploadsPlaylistId;
        this.pageTokens.videos = this._lastNextPageToken || null;
        this.allResults = { videos: this._dedup(videos) };
        this.source = 'youtube';

      } else {
        // ── Busca textual: confia no ranking do YouTube, filtragem leve ──
        const cleanQuery = query.replace(/\b(videos?|vídeos?)\b/gi, '').trim();
        this.cleanQueryVideos = cleanQuery || query;

        const vRes = await this.searchVideosPage(this.cleanQueryVideos);
        this.pageTokens.videos = vRes.nextPageToken || null;
        // Filtragem leve: remove só resultados que não têm NENHUMA palavra-chave
        // mas mantém pelo menos 10 resultados mesmo que todos passem pelo filtro
        const filtered = this._filterByRelevanceSoft(vRes.items, this.cleanQueryVideos);
        this.allResults = { videos: this._dedup(filtered) };
        this.source = 'youtube';
      }

      this.displayTabsWithResults();
    } catch (e) {
      console.error(e);
      alert('❌ Erro ao buscar: ' + e.message);
    } finally {
      this.showLoading(false);
    }
  }

  async loadNextPage() {
    if (!this.pageTokens.videos || !this.currentQuery) return;

    this.showLoading(true);
    try {
      let newItems = [];
      let nextToken = null;

      // Canal ou playlist → pagina via playlistItems
      if (this.channelUploadsPlaylistId) {
        const result = await this.fetchPlaylistItems(this.channelUploadsPlaylistId, this.pageTokens.videos);
        newItems = result;
        nextToken = this._lastNextPageToken || null;

      } else {
        // Busca textual → pagina via search API
        const result = await this.searchVideosPage(this.cleanQueryVideos || this.currentQuery, this.pageTokens.videos);
        newItems = this._filterByRelevanceSoft(result.items, this.cleanQueryVideos || this.currentQuery);
        nextToken = result.nextPageToken || null;
      }

      this.pageTokens.videos = nextToken;
      this.pageNumbers.videos++;

      const existingIds = new Set(this.allResults.videos.map(v => v.id));
      const unique = this._dedup(newItems).filter(v => !existingIds.has(v.id));
      this.allResults.videos = [...this.allResults.videos, ...unique];

      this.displayTabsWithResults(false);
    } catch (e) {
      console.error(e);
      alert('❌ Erro ao carregar próxima página: ' + e.message);
    } finally {
      this.showLoading(false);
    }
  }

  // ──────────────────────────────────────────────
  // MÉTODOS DE BUSCA
  // ──────────────────────────────────────────────

  async fetchChannelVideosByUrl(channelUrl) {
    const urlObj = new URL(channelUrl);
    const pathname = urlObj.pathname;

    const handleMatch = pathname.match(/@([\w-]+)/);
    if (handleMatch) {
      const handle = '@' + handleMatch[1];
      const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forHandle=${encodeURIComponent(handle)}&key=${this.API_KEY}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      if (d.items?.[0]) {
        const uploadsPlaylistId = d.items[0].contentDetails.relatedPlaylists.uploads;
        const videos = await this.fetchPlaylistItems(uploadsPlaylistId);
        return { videos, uploadsPlaylistId };
      }
    }

    const channelMatch = pathname.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) {
      const r = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelMatch[1]}&key=${this.API_KEY}`);
      const d = await r.json();
      if (d.error) throw new Error(d.error.message);
      if (!d.items?.[0]) throw new Error('Canal não encontrado.');
      const uploadsPlaylistId = d.items[0].contentDetails.relatedPlaylists.uploads;
      const videos = await this.fetchPlaylistItems(uploadsPlaylistId);
      return { videos, uploadsPlaylistId };
    }

    throw new Error('Não foi possível identificar o canal. Tente colar o link completo.');
  }

  async fetchSingleVideo(videoId) {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${this.API_KEY}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    const item = d.items?.[0];
    if (!item) throw new Error('Vídeo não encontrado.');
    return {
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    };
  }

  async fetchPlaylistItems(playlistId, pageToken = null) {
    const params = new URLSearchParams({ part: 'snippet', playlistId, maxResults: '50', key: this.API_KEY });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    this._lastNextPageToken = d.nextPageToken || null;
    return (d.items || [])
      .filter(i => i.snippet.resourceId?.videoId && i.snippet.title !== 'Deleted video' && i.snippet.title !== 'Private video')
      .map(i => ({
        id: i.snippet.resourceId.videoId,
        title: i.snippet.title,
        thumbnail: i.snippet.thumbnails?.medium?.url || i.snippet.thumbnails?.default?.url || ''
      }));
  }

  async searchVideosPage(q, pageToken = null, extraParams = {}) {
    const params = new URLSearchParams({ part: 'snippet', q, type: 'video', maxResults: '50', key: this.API_KEY, ...extraParams });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return {
      items: (d.items || []).map(i => ({
        id: i.id.videoId,
        title: i.snippet.title,
        thumbnail: i.snippet.thumbnails.medium?.url || i.snippet.thumbnails.default?.url || ''
      })),
      nextPageToken: d.nextPageToken || null
    };
  }

  async searchPlaylistsMusicPage(q, pageToken = null) {
    // Adiciona "music" para biasear para playlists do YouTube Music
    const musicQuery = /music|música|musica/i.test(q) ? q : q + ' music playlist';
    const params = new URLSearchParams({ part: 'snippet', q: musicQuery, type: 'playlist', maxResults: '50', key: this.API_KEY });
    if (pageToken) params.set('pageToken', pageToken);
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`);
    const d = await r.json();
    if (d.error) throw new Error(d.error.message);
    return {
      items: (d.items || []).map(i => ({
        id: i.id.playlistId,
        title: i.snippet.title,
        thumbnail: i.snippet.thumbnails.medium?.url || i.snippet.thumbnails.default?.url || '',
        isPlaylist: true
      })),
      nextPageToken: d.nextPageToken || null
    };
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    this.displayResults(tabName);
  }

  displayResults(tabName) {
    const results = this.allResults[tabName] || [];
    const contentDiv = document.getElementById('smartSearchTabContent');

    if (results.length === 0) {
      contentDiv.innerHTML = `<p style="color:#64748b; font-size:13px; padding:10px;">Nenhum resultado para esta aba.</p>`;
      document.getElementById('smartSearchQuantityWrapper').style.display = 'none';
      document.getElementById('smartSearchAddBtn').style.display = 'none';
      document.getElementById('smartSearchNextBtn')?.remove();
      return;
    }

    contentDiv.innerHTML = results.map((item, index) => `
      <div style="display: flex; gap: 12px; background: ${index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}; padding: 8px; border-radius: 4px; align-items: center; text-align: left;">
        <input type="checkbox" class="video-checkbox" data-video-id="${item.id}" checked style="width: 18px; height: 18px; cursor:pointer;">
        <img src="${item.thumbnail || ''}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; background:#1e293b;" onerror="this.style.display='none'">
        <div style="flex: 1; font-size: 13px; color: #eee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left;">${item.title}</div>
      </div>
    `).join('');

    // Contador dinâmico
    const updateCounter = () => {
      const checked = contentDiv.querySelectorAll('.video-checkbox:checked').length;
      const totalLabel = document.getElementById('smartSearchSelectedCount');
      if (totalLabel) totalLabel.textContent = `${checked} selecionado(s) de ${results.length}`;
    };
    contentDiv.querySelectorAll('.video-checkbox').forEach(cb => cb.addEventListener('change', updateCounter));
    document.getElementById('smartSearchQuantityWrapper').style.display = 'block';
    document.getElementById('smartSearchAddBtn').style.display = 'block';
    updateCounter();

    // Botão "Próxima Página" com número — só aparece se houver mais vídeos
    let nextBtn = document.getElementById('smartSearchNextBtn');
    const hasMore = !!this.pageTokens?.videos;
    if (hasMore) {
      if (!nextBtn) {
        nextBtn = document.createElement('button');
        nextBtn.id = 'smartSearchNextBtn';
        nextBtn.style.cssText = 'width:100%; background:#1e3a5f; color:#06b6d4; border:1px solid #06b6d4; padding:10px; border-radius:6px; cursor:pointer; font-size:13px; font-weight:600; margin-top:8px;';
        contentDiv.after(nextBtn);
      }
      const pageNum = (this.pageNumbers?.videos || 1) + 1;
      nextBtn.textContent = `➕ Página ${pageNum} — mais vídeos`;
      nextBtn.onclick = () => this.loadNextPage();
    } else {
      nextBtn?.remove();
    }
  }

  displayTabsWithResults(resetTab = true) {
    document.getElementById('smartSearchResults').style.display = 'block';
    document.getElementById('smartSearchTabs').style.display = 'block';

    const tab = document.querySelector('.smart-tab[data-tab="videos"]');
    if (tab) tab.querySelector('.tab-count').textContent = `(${this.allResults.videos.length})`;

    const badge = document.getElementById('smartSearchSourceBadge');
    if (badge) {
      badge.textContent = '▶ YouTube';
      badge.style.color = '#ef4444';
    }

    if (resetTab) {
      document.getElementById('smartSearchNextBtn')?.remove();
    }
    this.displayResults('videos');
  }

  addVideosToCategory() {
    const checkboxes = document.querySelectorAll('.video-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.videoId);
    const selected = this.allResults.videos.filter(v => selectedIds.includes(v.id));

    if (selected.length === 0) {
      alert('Nenhum vídeo selecionado!');
      return;
    }

    const WARN_THRESHOLD = 20;
    if (selected.length > WARN_THRESHOLD) {
      this._showBatchConfirmModal(selected, 500);
      return;
    }

    this._commitVideos(selected);
  }

  _showBatchConfirmModal(selected, hardLimit) {
    document.getElementById('batchConfirmModal')?.remove();

    const total = Math.min(selected.length, hardLimit);

    const modal = document.createElement('div');
    modal.id = 'batchConfirmModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.88);z-index:10001;display:flex;align-items:center;justify-content:center;';

    modal.innerHTML = `
      <div style="background:#1e293b;border-radius:12px;padding:24px;max-width:420px;width:95%;color:#f1f5f9;" onclick="event.stopPropagation()">
        <div style="font-size:28px;text-align:center;margin-bottom:8px;">⚠️</div>
        <h3 style="margin:0 0 12px;text-align:center;color:#f97316;">Lote grande detectado</h3>
        <p style="font-size:13px;color:#94a3b8;margin-bottom:18px;line-height:1.6;">
          Você está prestes a adicionar <strong style="color:#fff">${selected.length} vídeos</strong> à sua lista.
        </p>
        <div style="background:#0f172a;border-radius:8px;padding:14px;margin-bottom:18px;">
          <label style="font-size:12px;color:#64748b;display:block;margin-bottom:8px;">Limitar quantidade a adicionar:</label>
          <div style="display:flex;align-items:center;gap:12px;">
            <input type="range" id="batchLimitSlider" min="1" max="${total}" value="${Math.min(50, total)}"
              style="flex:1;accent-color:#06b6d4;" oninput="document.getElementById('batchLimitVal').textContent=this.value"/>
            <span id="batchLimitVal" style="font-size:18px;font-weight:700;color:#06b6d4;min-width:40px;text-align:right;">${Math.min(50, total)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:11px;color:#475569;margin-top:4px;">
            <span>1</span><span>${total}</span>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;">
          <button id="batchConfirmBtn" style="background:#10b981;color:#fff;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
            ✅ Adicionar quantidade selecionada
          </button>
          <button id="batchAllBtn" style="background:#334155;color:#94a3b8;border:none;padding:10px;border-radius:8px;font-size:12px;cursor:pointer;">
            Adicionar todos os ${selected.length} mesmo assim
          </button>
          <button id="batchCancelBtn" style="background:transparent;color:#64748b;border:none;padding:8px;border-radius:8px;font-size:12px;cursor:pointer;">
            Cancelar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#batchConfirmBtn').onclick = () => {
      const limit = parseInt(document.getElementById('batchLimitSlider').value);
      modal.remove();
      this._commitVideos(selected.slice(0, limit));
    };
    modal.querySelector('#batchAllBtn').onclick = () => {
      modal.remove();
      this._commitVideos(selected);
    };
    modal.querySelector('#batchCancelBtn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  }

  async _expandAndAddPlaylists(playlists) {
    const btn = document.getElementById('smartSearchAddBtn');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Carregando vídeos das playlists...'; }

    try {
      const allVideos = [];
      for (const pl of playlists) {
        try {
          showQuickToast(`📋 Carregando: ${pl.title.substring(0, 40)}...`);
          const videos = await this.fetchPlaylistItems(pl.id);
          allVideos.push(...videos);
        } catch (e) {
          console.warn(`Falha ao expandir playlist ${pl.id}:`, e.message);
        }
      }

      if (allVideos.length === 0) {
        alert('❌ Nenhum vídeo encontrado nas playlists selecionadas.');
        return;
      }

      // Dedup centralizado: elimina repetições dentro e entre playlists
      const unique = this._dedup(allVideos);

      this._commitVideos(unique);
    } catch (e) {
      alert('❌ Erro ao expandir playlists: ' + e.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = '✅ Adicionar à Minha Lista'; }
    }
  }

  _commitVideos(videos) {
    if (typeof playlist === 'undefined') return;

    // Dedup dentro do próprio lote antes de comparar com o salvo
    const batch = this._dedup(videos);
    let added = 0;
    batch.forEach(v => {
      if (!playlist.find(p => p.id === v.id)) {
        playlist.push({ id: v.id, title: v.title, thumbnail: v.thumbnail || '', categoryId: this.selectedCategory });
        added++;
      }
    });

    if (window.savePlaylist) savePlaylist();
    if (window.renderPlaylist) renderPlaylist();
    if (window.renderCategoryFilters) renderCategoryFilters();
    this.closeSmartSearchModal();
    showQuickToast(`✅ ${added} vídeo(s) adicionado(s)!`);
  }

  makeCategoriesClickable() {
    setTimeout(() => {
      document.querySelectorAll('.category-list-item').forEach(item => {
        item.style.cursor = 'pointer';
      });
    }, 2000);
  }

  showLoading(s) { document.getElementById('smartSearchLoading').style.display = s ? 'block' : 'none'; }
}

// Inicialização segura com atraso para garantir o carregamento da API e UI
setTimeout(() => { 
  window.smartSearchInstance = new SmartSearch(); 
}, 2000);

// ========================================
// FUNÇÕES PARA BUSCAR VÍDEOS DE CANAIS
// ========================================

/**
 * Verifica se a URL é de um canal do YouTube
 */
function isChannelUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  // Padrões aceitos:
  // https://www.youtube.com/@usuario
  // https://www.youtube.com/@usuario/videos
  // https://www.youtube.com/channel/UCxxxxxxx
  // https://www.youtube.com/c/NomeCanal
  // https://youtube.com/@usuario
  
  const patterns = [
    /youtube\.com\/@[\w-]+/i,           // @usuario
    /youtube\.com\/channel\/UC[\w-]+/i, // /channel/UCxxx
    /youtube\.com\/c\/[\w-]+/i,         // /c/nome
    /youtube\.com\/user\/[\w-]+/i       // /user/nome (antigo)
  ];
  
  return patterns.some(pattern => pattern.test(url));
}

/**
 * Extrai o identificador do canal da URL
 */
function extractChannelIdentifier(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Padrão @usuario
    const atMatch = pathname.match(/@([\w-]+)/);
    if (atMatch) {
      return {
        type: 'handle',
        value: '@' + atMatch[1]
      };
    }
    
    // Padrão /channel/UCxxx
    const channelMatch = pathname.match(/\/channel\/(UC[\w-]+)/);
    if (channelMatch) {
      return {
        type: 'id',
        value: channelMatch[1]
      };
    }
    
    // Padrão /c/nome
    const customMatch = pathname.match(/\/c\/([\w-]+)/);
    if (customMatch) {
      return {
        type: 'custom',
        value: customMatch[1]
      };
    }
    
    // Padrão /user/nome
    const userMatch = pathname.match(/\/user\/([\w-]+)/);
    if (userMatch) {
      return {
        type: 'user',
        value: userMatch[1]
      };
    }
    
    return null;
  } catch (e) {
    console.error('Erro ao extrair identificador do canal:', e);
    return null;
  }
}

/**
 * Busca vídeos de um canal usando a API do YouTube
 */
async function fetchChannelVideos(channelInfo) {
  const API_KEY = localStorage.getItem('youtube_api_key');
  
  if (!API_KEY) {
    // ABRIR MODAL DE API KEY
    if (window.smartSearchInstance) {
      window.smartSearchInstance.showApiKeyModal();
    } else {
      // Fallback: criar modal diretamente
      const tempInstance = new SmartSearch();
      tempInstance.showApiKeyModal();
    }
    throw new Error('API Key necessária');
  }
  
  try {
    let channelId = null;
    
    // Se já temos o ID do canal, usar diretamente
    if (channelInfo.type === 'id') {
      channelId = channelInfo.value;
    } else {
      // Caso contrário, buscar o ID do canal pelo handle/custom/user
      channelId = await getChannelIdFromIdentifier(channelInfo, API_KEY);
    }
    
    if (!channelId) {
      throw new Error('Não foi possível encontrar o canal.');
    }
    
    // Buscar vídeos do canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=50&key=${API_KEY}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Erro ao buscar vídeos do canal');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Nenhum vídeo encontrado neste canal.');
    }
    
    // Mapear os vídeos para o formato esperado
    return data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
    }));
    
  } catch (error) {
    console.error('Erro ao buscar vídeos do canal:', error);
    throw error;
  }
}

/**
 * Obtém o ID do canal a partir de handle, custom URL ou username
 */
async function getChannelIdFromIdentifier(channelInfo, apiKey) {
  try {
    let searchQuery = '';
    
    // Construir a query de busca baseada no tipo
    if (channelInfo.type === 'handle') {
      // Para handles (@usuario), buscar diretamente
      searchQuery = channelInfo.value;
    } else if (channelInfo.type === 'custom' || channelInfo.type === 'user') {
      searchQuery = channelInfo.value;
    }
    
    // Buscar o canal
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=channel&maxResults=1&key=${apiKey}`;
    
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar canal');
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      throw new Error('Canal não encontrado');
    }
    
    return data.items[0].id.channelId;
    
  } catch (error) {
    console.error('Erro ao obter ID do canal:', error);
    throw error;
  }
}

/**
 * Mostra vídeos do canal em interface tipo "Busca Inteligente"
 * Permite selecionar quais vídeos adicionar com checkboxes
 */
function showChannelVideosModal(videos, channelName = 'Canal') {
  // Criar modal se não existir
  let modal = document.getElementById('channelVideosModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'channelVideosModal';
    modal.className = 'modal';
    modal.style.cssText = "display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; align-items:center; justify-content:center;";
    
    // Fechar ao clicar fora
    modal.onclick = (e) => { 
      if(e.target === modal) {
        modal.style.display = 'none';
      }
    };
    
    document.body.appendChild(modal);
  }
  
  // Obter categoria atual
  const currentCat = (typeof currentFilter !== 'undefined' && currentFilter !== 'all') ? currentFilter : 'uncategorized';
  const categoryName = getCategoryById(currentCat)?.name || 'Sem Categoria';
  
  // Criar conteúdo do modal
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 700px; width:95%; max-height: 90vh; overflow-y: auto; text-align: left; background:#1e293b; padding:20px; border-radius:12px;" onclick="event.stopPropagation()">
      <h3 style="margin-top: 0; text-align: left; color: #fff;">📺 Vídeos do Canal</h3>
      
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 15px;">
        Encontrados <strong>${videos.length} vídeos</strong>. Selecione quais adicionar à categoria <strong>${categoryName}</strong>.
      </p>
      
      <div style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button id="channelSelectAll" style="flex: 1; background: #8b5cf6; color: white; padding: 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600;">
          ✅ Selecionar Todos
        </button>
        <button id="channelDeselectAll" style="flex: 1; background: #64748b; color: white; padding: 10px; border-radius: 6px; border: none; cursor: pointer; font-size: 13px; font-weight: 600;">
          ❌ Desmarcar Todos
        </button>
      </div>
      
      <div id="channelVideosContent" style="display: flex; flex-direction: column; gap: 2px; max-height: 400px; overflow-y: auto; margin-bottom: 15px;"></div>
      
      <div style="margin-bottom: 15px;">
        <label style="display: block; font-size: 12px; color: #94a3b8; margin-bottom: 5px;">Quantidade máxima a adicionar:</label>
        <input type="number" id="channelQuantity" value="50" min="1" max="50" style="width: 80px; padding: 8px; border-radius: 4px; border: 1px solid #334155; background: #0f172a; color: #fff;"/>
      </div>
      
      <button id="channelAddBtn" style="width: 100%; background: #10b981; padding: 12px; border-radius: 6px; color: #fff; font-weight: 600; border: none; cursor: pointer; margin-bottom: 10px;">
        ✅ Adicionar Selecionados
      </button>
      
      <button id="channelCloseBtn" style="width: 100%; background: #334155; color: #fff; border: none; padding: 10px; border-radius: 6px; cursor: pointer;">
        Fechar
      </button>
    </div>
  `;
  
  // Renderizar lista de vídeos
  const contentDiv = modal.querySelector('#channelVideosContent');
  contentDiv.innerHTML = videos.map((video, index) => `
    <div style="display: flex; gap: 12px; background: ${index % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'}; padding: 8px; border-radius: 4px; align-items: center; text-align: left;">
      <input type="checkbox" class="channel-video-checkbox" data-video-id="${video.id}" checked style="width: 18px; height: 18px; cursor:pointer;">
      <img src="${video.thumbnail}" style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px;">
      <div style="flex: 1; font-size: 13px; color: #eee; overflow: hidden; text-overflow: ellipsis; text-align: left;" title="${video.title}">${video.title}</div>
    </div>
  `).join('');
  
  // Event listeners
  modal.querySelector('#channelSelectAll').onclick = () => {
    modal.querySelectorAll('.channel-video-checkbox').forEach(cb => cb.checked = true);
  };
  
  modal.querySelector('#channelDeselectAll').onclick = () => {
    modal.querySelectorAll('.channel-video-checkbox').forEach(cb => cb.checked = false);
  };
  
  modal.querySelector('#channelAddBtn').onclick = () => {
    const checkboxes = modal.querySelectorAll('.channel-video-checkbox:checked');
    const quantity = parseInt(modal.querySelector('#channelQuantity').value) || 50;
    const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.videoId).slice(0, quantity);
    const selectedVideos = videos.filter(v => selectedIds.includes(v.id));
    
    if (selectedVideos.length === 0) {
      alert('Nenhum vídeo selecionado!');
      return;
    }
    
    // Adicionar à playlist na categoria atual
    let addedCount = 0;
    selectedVideos.forEach(video => {
      if (!playlist.find(p => p.id === video.id)) {
        playlist.push({
          id: video.id,
          title: video.title,
          categoryId: currentCat
        });
        addedCount++;
      }
    });
    
    // Salvar e atualizar UI
    if (window.savePlaylist) savePlaylist();
    if (window.renderPlaylist) renderPlaylist();
    if (window.renderCategoryFilters) renderCategoryFilters();
    
    modal.style.display = 'none';
    alert(`✅ ${addedCount} vídeo(s) adicionado(s) à categoria "${categoryName}"!`);
    
    if (typeof logger !== 'undefined') {
      logger.success(`${addedCount} vídeos adicionados do canal`, { categoryId: currentCat });
    }
  };
  
  modal.querySelector('#channelCloseBtn').onclick = () => {
    modal.style.display = 'none';
  };
  
  // Mostrar modal
  modal.style.display = 'flex';
}

/**
 * REMOVIDA - usar showChannelVideosModal para canais
 * Esta função é mantida apenas para compatibilidade com vídeos individuais
 */
function showCategorySelectModal(videos) {
  // Se for apenas 1 vídeo, adicionar direto na categoria atual
  if (videos.length === 1) {
    const video = videos[0];
    const currentCat = (typeof currentFilter !== 'undefined' && currentFilter !== 'all') ? currentFilter : 'uncategorized';
    
    // Verificar duplicata
    if (playlist.find(p => p.id === video.id)) {
      alert('Este vídeo já está na playlist!');
      return;
    }
    
    // Adicionar direto
    playlist.push({
      id: video.id,
      title: video.title,
      categoryId: currentCat
    });
    
    if (window.savePlaylist) savePlaylist();
    if (window.renderPlaylist) renderPlaylist();
    if (window.renderCategoryFilters) renderCategoryFilters();
    
    const categoryName = getCategoryById(currentCat)?.name || 'Sem Categoria';
    
    // Toast rápido ao invés de alert
    showQuickToast(`✅ Adicionado à "${categoryName}"`);
    
    if (typeof logger !== 'undefined') {
      logger.success('Vídeo adicionado', { videoId: video.id, categoryId: currentCat });
    }
    
    return;
  }
  
  // Se for múltiplos vídeos, usar o modal de canal
  showChannelVideosModal(videos);
}

/**
 * Toast rápido para feedback visual
 */
function showQuickToast(message) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(16, 185, 129, 0.95);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Converte cor hexadecimal para RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '255, 255, 255';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}