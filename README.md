<div align="center">

```
██████╗ ██╗   ██╗██╗     ██╗███████╗████████╗
██╔══██╗╚██╗ ██╔╝██║     ██║██╔════╝╚══██╔══╝
██║  ██║ ╚████╔╝ ██║     ██║███████╗   ██║   
██║  ██║  ╚██╔╝  ██║     ██║╚════██║   ██║   
██████╔╝   ██║   ███████╗██║███████║   ██║   
╚═════╝    ╚═╝   ╚══════╝╚═╝╚══════╝   ╚═╝   
```

**você lista, o show é por nossa conta.**

[![PWA](https://img.shields.io/badge/PWA-Ready-10b981?style=flat-square&logo=pwa)](https://ilist.online)
[![License](https://img.shields.io/badge/License-MIT-3b82f6?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-2.4-f59e0b?style=flat-square)](#)
[![YouTube API](https://img.shields.io/badge/YouTube%20API-v3-ef4444?style=flat-square&logo=youtube)](https://developers.google.com/youtube/v3)

[**🚀 Demo ao vivo**](https://ilist.online) · [**📖 Documentação**](#uso) · [**🐛 Reportar Bug**](../../issues) · [**💡 Sugerir Feature**](../../issues)

</div>

---

## O que é o DyList?

DyList é um **player de YouTube open source** com tudo que o YouTube Premium oferece — e mais. Roda direto no browser, sem instalação, sem conta, sem custo. Seus dados ficam no seu dispositivo.

> Construído com HTML, CSS e JavaScript puro. Zero dependências externas. Zero frameworks. Zero rastreamento.

---

## ✨ Funcionalidades

### 🎵 Player
- Reprodução de vídeos e playlists do YouTube
- **4 modos de loop** — Normal, Repetir 1, Repetir Todos, Aleatório
- **Velocidade variável** — 0.25x até 2x
- Controles por teclado (Espaço, ←→ para seek, ↑↓ para volume)
- Barra de progresso com tempo atual e duração
- Media Session API — controles na tela de bloqueio e fones Bluetooth

### 📋 Playlist
- Adicione vídeos por URL, link de canal ou busca
- **Drag & drop** para reordenar
- Seleção múltipla com checkboxes
- Filtro por categoria

### 📁 Categorias
- Crie categorias com nome, cor e emoji
- Reordene por drag & drop
- Ao deletar uma categoria, os vídeos são removidos junto
- Filtro rápido via select dropdown

### 🔍 Busca Inteligente
- Pesquisa de vídeos via **YouTube Data API v3**
- Suporte a link de canal (`@usuario`, `/channel/UC...`)
- Suporte a link de playlist
- Paginação de resultados
- Seleção em lote com limite configurável

### ♪ Equalizador
- 8 bandas de frequência (60Hz a 14kHz)
- **5 presets profissionais** — Normal, Músicas, PodCasts, Filmes, Graves
- Espectro animado em tempo real
- Web Audio API com filtros biquad

### 🛡️ Ad Blocker
- Bloqueio por CSS e DOM Observer (não interfere no player)
- SponsorBlock-like — marque e pule segmentos patrocinados manualmente
- Atalhos: `Ctrl+Shift+M` (início) · `Ctrl+Shift+E` (fim)

### 💾 Backup
- **Auto-backup** a cada alteração (debounce 1.5s)
- 3 slots rotativos no localStorage
- Exportar/Importar como arquivo `.json`
- Backup automático antes de fechar a aba (`beforeunload`)

### 📱 PWA
- Instalável em Android, iOS e desktop
- Funciona offline com cache de assets
- Service Worker com estratégia Network First
- Suporte a Web Share Target (compartilhe links direto do YouTube)

### 🌙 Extras
- **Modo OLED** — tela 100% preta para economia máxima de bateria
- **Timer de desligamento** — pausa e fecha após 15min até 2h
- Wake Lock API — mantém a tela acesa enquanto toca
- Estatísticas de uso (vídeos, reproduções, ad blocker, armazenamento)
- Sidebar de tutoriais

---

## 🗂️ Estrutura do projeto

```
dylist/
├── index.html                  # Aplicação principal
├── manifest.json               # Manifesto PWA
├── sw.js                       # Service Worker
│
└── assets/
    ├── css/
    │   └── styles.css          # Estilos globais
    │
    └── js/dist/
        ├── app.js              # Lógica principal + logger
        ├── player.js           # YouTube IFrame API
        ├── categories.js       # Sistema de categorias
        ├── search-advanced.js  # Busca inteligente
        ├── equalizer.js        # Equalizador 8 bandas
        ├── ad-blocker.js       # Bloqueador de anúncios
        ├── backup.js           # Sistema de backup
        ├── pwa.js              # Módulo PWA
        ├── sidebar.js          # Sidebar de tutoriais
        └── statistics.js       # Modal de estatísticas
```

---

## 🚀 Como usar

### Opção 1 — Usar online
Acesse **[ilist.online](https://ilist.online)** direto no browser. Nenhuma instalação necessária.

### Opção 2 — Hospedar você mesmo

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/dylist.git
cd dylist

# Sirva com qualquer servidor estático
npx serve .
# ou
python3 -m http.server 8080
```

> ⚠️ O YouTube IFrame API exige que a página seja servida via HTTP/HTTPS (não `file://`).

### Opção 3 — Instalar como PWA
1. Acesse o site no Chrome, Edge ou Brave (Android ou Desktop)
2. Clique em **"📲 Instalar DyList"** na barra lateral
3. O app aparece na tela inicial como qualquer app nativo

---

## 🔑 Configurar API Key do YouTube

A **Busca Inteligente** e a importação de canais exigem uma chave da YouTube Data API v3.

1. Acesse [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Crie um projeto → **Criar credenciais** → **Chave de API**
3. Ative a **YouTube Data API v3** no painel de APIs
4. No DyList, clique no ícone 🔑 na barra de controles e cole sua chave

> A API do Google oferece **10.000 requisições/dia gratuitas** — mais do que suficiente para uso pessoal.

---

## ⌨️ Atalhos de teclado

| Tecla | Ação |
|---|---|
| `Espaço` | Play / Pause |
| `←` / `→` | Voltar / Avançar 10s |
| `↑` / `↓` | Volume +10 / -10 |
| `Ctrl+N` | Próximo vídeo |
| `Ctrl+P` | Vídeo anterior |
| `Ctrl+L` | Alternar modo loop |
| `Ctrl+H` | Abrir / fechar tutoriais |
| `Ctrl+Shift+M` | Marcar início de segmento patrocinado |
| `Ctrl+Shift+E` | Marcar fim de segmento patrocinado |

---

## 🛠️ Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML5 / CSS3 / JS ES2020+ | Base da aplicação |
| YouTube IFrame API | Player de vídeo |
| YouTube Data API v3 | Busca e metadados |
| Web Audio API | Equalizador 8 bandas |
| Service Worker + Cache API | PWA / offline |
| Web Share Target API | Receber links compartilhados |
| Media Session API | Controles na tela de bloqueio |
| Wake Lock API | Manter tela acesa |
| localStorage | Persistência de dados |

---

## 🙏 Créditos

Desenvolvido por **Alexandre Nunes Torres** · [@alementoria](https://instagram.com/alementoria)

---

## 📄 Licença

[MIT](LICENSE) — use, modifique e distribua à vontade.

---

<div align="center">
  <sub>Feito com ☕ e muito <code>localStorage</code></sub>
</div>
