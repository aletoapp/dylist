/**
 * DyList Tutorial Sidebar v2.0
 * Menu lateral profissional com tutoriais em vídeo
 * Design inspirado em Claude.ai, ChatGPT e Gemini
 * CORRIGIDO: Agora à DIREITA da tela
 */

class TutorialSidebar {
  constructor() {
    this.isOpen = false;
    this.tutorials = [
      {
        id: 1,
        title: 'Bem-vindo ao DyList',
        description: 'Aprenda os conceitos básicos e comece a usar a plataforma',
        videoId: 'dQw4w9WgXcQ', // Substitua pelo ID do seu vídeo
        duration: '3:45',
        category: 'Introdução',
        icon: '👋'
      },
      {
        id: 2,
        title: 'Criando sua Primeira Playlist',
        description: 'Como adicionar vídeos e organizar suas músicas favoritas',
        videoId: 'dQw4w9WgXcQ',
        duration: '5:20',
        category: 'Básico',
        icon: '🎵'
      },
      {
        id: 3,
        title: 'Categorias e Organização',
        description: 'Organize seus vídeos com categorias personalizadas e cores',
        videoId: 'dQw4w9WgXcQ',
        duration: '4:15',
        category: 'Básico',
        icon: '📁'
      },
      {
        id: 4,
        title: 'Busca Inteligente',
        description: 'Use a busca avançada para encontrar músicas e canais',
        videoId: 'dQw4w9WgXcQ',
        duration: '6:30',
        category: 'Avançado',
        icon: '🔍'
      },
      {
        id: 5,
        title: 'Ad Blocker Premium',
        description: 'Bloqueie anúncios e marque segmentos patrocinados',
        videoId: 'dQw4w9WgXcQ',
        duration: '7:10',
        category: 'Avançado',
        icon: '🛡️'
      },
      {
        id: 6,
        title: 'Backup e Sincronização',
        description: 'Proteja seus dados e sincronize entre dispositivos',
        videoId: 'dQw4w9WgXcQ',
        duration: '4:50',
        category: 'Avançado',
        icon: '💾'
      }
    ];
    
    this.init();
  }

  init() {
    this.injectStyles();
    this.createHamburgerButton();
    this.createSidebar();
    this.setupScrollEffect();
    this.setupKeyboardShortcuts();
    
    if (typeof logger !== 'undefined') {
      logger.info('Tutorial Sidebar inicializado');
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.id = 'tutorial-sidebar-styles';
    style.textContent = `
      /* Botão Hamburger - Conforme imagem 002 */
      .tutorial-hamburger {
        position: fixed;
        top: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        border-radius: 8px;
        cursor: pointer;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 0;
        box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tutorial-hamburger:hover {
        transform: scale(1.05) rotate(0deg);
        box-shadow: 0 6px 30px rgba(102, 126, 234, 0.6);
      }

      .tutorial-hamburger.open {
        background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
      }

      .hamburger-line {
        width: 20px;
        height: 2px;
        background: white;
        border-radius: 2px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tutorial-hamburger.open .hamburger-line:nth-child(1) {
        transform: translateY(6px) rotate(45deg);
      }

      .tutorial-hamburger.open .hamburger-line:nth-child(2) {
        opacity: 0;
        transform: translateX(-10px);
      }

      .tutorial-hamburger.open .hamburger-line:nth-child(3) {
        transform: translateY(-6px) rotate(-45deg);
      }

      /* Label "TUTORIAL" - Embaixo do ícone */
      .tutorial-label {
        position: fixed;
        top: 70px;
        right: 20px;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 1px;
        color: #667eea;
        z-index: 10001;
        text-align: center;
        width: 48px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: none;
        text-transform: uppercase;
      }

      /* Sidebar Container - AGORA À DIREITA */
      .tutorial-sidebar {
        position: fixed;
        top: 0;
        right: -400px;
        width: 380px;
        height: 100vh;
        background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
        z-index: 10000;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .tutorial-sidebar.open {
        right: 0;
        box-shadow: -8px 0 40px rgba(0, 0, 0, 0.5);
      }

      /* Overlay */
      .tutorial-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0);
        z-index: 9999;
        pointer-events: none;
        transition: background 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tutorial-overlay.visible {
        background: rgba(0, 0, 0, 0.6);
        pointer-events: auto;
        backdrop-filter: blur(2px);
      }

      /* Header */
      .sidebar-header {
        padding: 30px 25px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%);
        position: relative;
        overflow: hidden;
      }

      .sidebar-header::before {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(102,126,234,0.1) 0%, transparent 70%);
        animation: pulse 4s ease-in-out infinite;
      }

      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.1); opacity: 0.8; }
      }

      .sidebar-header h2 {
        margin: 0 0 8px 0;
        color: #fff;
        font-size: 24px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
        position: relative;
        z-index: 1;
      }

      .sidebar-header p {
        margin: 0;
        color: #94a3b8;
        font-size: 13px;
        line-height: 1.5;
        position: relative;
        z-index: 1;
      }

      /* Content */
      .sidebar-content {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .sidebar-content::-webkit-scrollbar {
        width: 6px;
      }

      .sidebar-content::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }

      .sidebar-content::-webkit-scrollbar-thumb {
        background: rgba(102, 126, 234, 0.4);
        border-radius: 3px;
      }

      .sidebar-content::-webkit-scrollbar-thumb:hover {
        background: rgba(102, 126, 234, 0.6);
      }

      /* Tutorial Card */
      .tutorial-card {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
      }

      .tutorial-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
        transform: scaleY(0);
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tutorial-card:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(102, 126, 234, 0.3);
        transform: translateX(-4px);
      }

      .tutorial-card:hover::before {
        transform: scaleY(1);
      }

      .tutorial-card-header {
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
      }

      .tutorial-thumbnail {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.2) 100%);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .tutorial-info {
        flex: 1;
      }

      .tutorial-category {
        display: inline-block;
        font-size: 10px;
        font-weight: 600;
        color: #667eea;
        background: rgba(102, 126, 234, 0.15);
        padding: 3px 8px;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 4px;
      }

      .tutorial-title {
        margin: 0;
        font-size: 15px;
        font-weight: 600;
        color: #fff;
        line-height: 1.3;
      }

      .tutorial-description {
        margin: 0;
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.5;
      }

      .tutorial-duration {
        position: absolute;
        top: 16px;
        right: 16px;
        font-size: 11px;
        color: #64748b;
        background: rgba(0, 0, 0, 0.3);
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 500;
      }

      /* Video Modal */
      .video-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.95);
        z-index: 10002;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
      }

      .video-modal.show {
        display: flex;
      }

      .video-container {
        background: #0f172a;
        border-radius: 16px;
        overflow: hidden;
        max-width: 900px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      }

      .video-header {
        padding: 20px 25px;
        background: linear-gradient(135deg, rgba(102,126,234,0.15) 0%, rgba(118,75,162,0.15) 100%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .video-header h3 {
        margin: 0;
        color: #fff;
        font-size: 18px;
        font-weight: 600;
      }

      .video-close {
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 24px;
        line-height: 1;
        transition: all 0.2s;
      }

      .video-close:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
      }

      .video-wrapper {
        position: relative;
        padding-bottom: 56.25%; /* 16:9 */
        height: 0;
        overflow: hidden;
      }

      .video-wrapper iframe {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border: none;
      }

      /* Footer */
      .sidebar-footer {
        padding: 20px 25px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
      }

      .sidebar-footer p {
        margin: 0;
        font-size: 12px;
        color: #64748b;
        text-align: center;
        line-height: 1.6;
      }

      .sidebar-footer strong {
        color: #667eea;
        font-weight: 600;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .tutorial-sidebar {
          width: 100%;
          right: -100%;
        }

        .tutorial-sidebar.open {
          right: 0;
        }

        .video-container {
          max-width: 100%;
        }
        
        .tutorial-hamburger {
          top: 20px;
          right: 20px;
        }
        
        .tutorial-label {
          top: 76px;
          right: 20px;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  createHamburgerButton() {
    // Container do botão
    const container = document.createElement('div');
    
    // Botão hamburger
    const button = document.createElement('button');
    button.className = 'tutorial-hamburger';
    button.setAttribute('aria-label', 'Abrir tutoriais');
    button.title = 'Tutoriais (Ctrl+H)';
    button.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;
    
    button.addEventListener('click', () => this.toggleSidebar());
    
    // Label "TUTORIAL"
    const label = document.createElement('div');
    label.className = 'tutorial-label';
    label.textContent = 'TUTORIAL';
    
    container.appendChild(button);
    container.appendChild(label);
    // Ocultar botão flutuante — controle feito pelo botão fixo no HTML
    container.style.display = 'none';
    document.body.appendChild(container);
    
    this.hamburgerButton = button;
    this.tutorialLabel = label;
  }

  createSidebar() {
    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'tutorial-overlay';
    overlay.addEventListener('click', () => this.closeSidebar());
    document.body.appendChild(overlay);
    this.overlay = overlay;

    // Sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'tutorial-sidebar';
    
    // Header
    const header = document.createElement('div');
    header.className = 'sidebar-header';
    header.innerHTML = `
      <h2>
        <span style="font-size: 28px;">🎓</span>
        Tutoriais
      </h2>
      <p>Aprenda a usar todos os recursos do DyList</p>
    `;
    
    // Content
    const content = document.createElement('div');
    content.className = 'sidebar-content';
    
    // Renderizar tutoriais
    this.tutorials.forEach(tutorial => {
      const card = this.createTutorialCard(tutorial);
      content.appendChild(card);
    });
    
    // Footer
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';
    footer.innerHTML = `
      <div id="apiKeySection">
        <button id="toggleApiKeyBtn" style="
          width: 100%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">🔑 Trocar Credencial API</button>

        <div id="apiKeyForm" style="display:none; margin-top: 12px;">
          <input
            id="apiKeyInput"
            type="password"
            placeholder="Cole a nova chave aqui"
            style="
              width: 100%;
              background: rgba(255,255,255,0.08);
              border: 1px solid rgba(255,255,255,0.2);
              border-radius: 6px;
              color: #f1f5f9;
              font-size: 13px;
              padding: 10px 12px;
              box-sizing: border-box;
              margin-bottom: 8px;
              outline: none;
            "
          >
          <div style="display:flex; gap:8px;">
            <button id="saveApiKeyBtn" style="
              flex: 1;
              background: #10b981;
              color: #fff;
              border: none;
              border-radius: 6px;
              padding: 10px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
            ">✅ Substituir</button>
            <button id="cancelApiKeyBtn" style="
              flex: 1;
              background: rgba(255,255,255,0.1);
              color: #94a3b8;
              border: none;
              border-radius: 6px;
              padding: 10px;
              font-size: 13px;
              cursor: pointer;
            ">Cancelar</button>
          </div>
          <div id="apiKeyMsg" style="display:none; margin-top:8px; font-size:12px; color:#10b981; text-align:center;">✅ Chave salva com sucesso!</div>
        </div>
      </div>
    `;

    // Eventos do formulário de API key
    setTimeout(() => {
      const toggleBtn  = document.getElementById('toggleApiKeyBtn');
      const form       = document.getElementById('apiKeyForm');
      const saveBtn    = document.getElementById('saveApiKeyBtn');
      const cancelBtn  = document.getElementById('cancelApiKeyBtn');
      const input      = document.getElementById('apiKeyInput');
      const msg        = document.getElementById('apiKeyMsg');

      if (toggleBtn) toggleBtn.addEventListener('click', () => {
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
        input.value = '';
        msg.style.display = 'none';
      });

      if (saveBtn) saveBtn.addEventListener('click', () => {
        const key = input.value.trim();
        if (!key) { input.style.borderColor = '#ef4444'; return; }
        localStorage.setItem('youtube_api_key', key);
        input.style.borderColor = '#10b981';
        msg.style.display = 'block';
        input.value = '';
        setTimeout(() => {
          form.style.display = 'none';
          msg.style.display  = 'none';
          input.style.borderColor = 'rgba(255,255,255,0.2)';
        }, 1800);
      });

      if (cancelBtn) cancelBtn.addEventListener('click', () => {
        form.style.display = 'none';
        input.value = '';
        msg.style.display = 'none';
      });
    }, 100);
    
    sidebar.appendChild(header);
    sidebar.appendChild(content);
    sidebar.appendChild(footer);
    document.body.appendChild(sidebar);
    
    this.sidebar = sidebar;
    
    // Modal de vídeo
    this.createVideoModal();
  }

  createTutorialCard(tutorial) {
    const card = document.createElement('div');
    card.className = 'tutorial-card';
    
    card.innerHTML = `
      <div class="tutorial-card-header">
        <div class="tutorial-thumbnail">${tutorial.icon}</div>
        <div class="tutorial-info">
          <span class="tutorial-category">${tutorial.category}</span>
          <h3 class="tutorial-title">${tutorial.title}</h3>
        </div>
      </div>
      <p class="tutorial-description">${tutorial.description}</p>
      <div class="tutorial-duration">${tutorial.duration}</div>
    `;
    
    card.addEventListener('click', () => this.openVideo(tutorial));
    
    return card;
  }

  createVideoModal() {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.id = 'tutorialVideoModal';
    
    modal.innerHTML = `
      <div class="video-container">
        <div class="video-header">
          <h3 id="videoModalTitle">Tutorial</h3>
          <button class="video-close" aria-label="Fechar" title="Fechar (ESC)">×</button>
        </div>
        <div class="video-wrapper">
          <iframe id="tutorialVideo" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen>
          </iframe>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners
    modal.querySelector('.video-close').addEventListener('click', () => this.closeVideo());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.closeVideo();
    });
    
    this.videoModal = modal;
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+H para abrir/fechar sidebar
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        this.toggleSidebar();
      }
      
      // ESC para fechar vídeo
      if (e.key === 'Escape') {
        if (this.videoModal.classList.contains('show')) {
          this.closeVideo();
        } else if (this.isOpen) {
          this.closeSidebar();
        }
      }
    });
  }

  toggleSidebar() {
    if (this.isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    this.isOpen = true;
    this.sidebar.classList.add('open');
    this.overlay.classList.add('visible');
    this.hamburgerButton.classList.add('open');
    
    if (typeof logger !== 'undefined') {
      logger.info('Tutorial sidebar aberto');
    }
  }

  closeSidebar() {
    this.isOpen = false;
    this.sidebar.classList.remove('open');
    this.overlay.classList.remove('visible');
    this.hamburgerButton.classList.remove('open');
    
    if (typeof logger !== 'undefined') {
      logger.info('Tutorial sidebar fechado');
    }
  }

  openVideo(tutorial) {
    const modal = this.videoModal;
    const iframe = document.getElementById('tutorialVideo');
    const title = document.getElementById('videoModalTitle');
    
    // Definir vídeo
    iframe.src = `https://www.youtube.com/embed/${tutorial.videoId}?autoplay=1&rel=0&modestbranding=1`;
    title.textContent = tutorial.title;
    
    // Mostrar modal
    modal.classList.add('show');
    
    // Fechar sidebar
    this.closeSidebar();
    
    if (typeof logger !== 'undefined') {
      logger.trackEvent('tutorial_video_opened', { 
        id: tutorial.id, 
        title: tutorial.title 
      });
    }
  }

  closeVideo() {
    const modal = this.videoModal;
    const iframe = document.getElementById('tutorialVideo');
    
    // Parar vídeo
    iframe.src = '';
    
    // Ocultar modal
    modal.classList.remove('show');
    
    if (typeof logger !== 'undefined') {
      logger.info('Video modal fechado');
    }
  }

  setupScrollEffect() {
    // Desabilitado - não é necessário para este design
  }
}

// Inicialização
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTutorialSidebar);
} else {
  initTutorialSidebar();
}

function initTutorialSidebar() {
  window.tutorialSidebar = new TutorialSidebar();
  
  // API pública
  window.openTutorials = () => {
    if (window.tutorialSidebar) {
      window.tutorialSidebar.openSidebar();
    }
  };
  
  window.closeTutorials = () => {
    if (window.tutorialSidebar) {
      window.tutorialSidebar.closeSidebar();
    }
  };
  
  console.log('%c🎓 Tutorial Sidebar v2.0 carregado! [ALINHAMENTO FIXO + COLUNAS IGUAIS]', 'color: #667eea; font-size: 14px; font-weight: bold;');
  console.log('%cAtalhos: Ctrl+H (abrir/fechar) | ESC (fechar)', 'color: #764ba2; font-size: 12px;');
  console.log('%cComandos: openTutorials() | closeTutorials()', 'color: #64748b; font-size: 11px;');
}