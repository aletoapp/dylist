/**
 * DyList Equalizer Module - v1.1
 * Equalizador 8 bandas com espectro animado em tempo real
 * Presets baseados em pesquisa de engenharia de áudio (Harman Curve + AudioEQ)
 */

// ─── BANDAS ──────────────────────────────────────────────────────────────────

const EQ_BANDS = [
  { freq: 60,    label: '60Hz'  },
  { freq: 170,   label: '170Hz' },
  { freq: 310,   label: '310Hz' },
  { freq: 600,   label: '600Hz' },
  { freq: 1000,  label: '1kHz'  },
  { freq: 3000,  label: '3kHz'  },
  { freq: 6000,  label: '6kHz'  },
  { freq: 14000, label: '14kHz' },
];

// ─── PRESETS PROFISSIONAIS ────────────────────────────────────────────────────
// Valores dB por banda: [60Hz, 170Hz, 310Hz, 600Hz, 1kHz, 3kHz, 6kHz, 14kHz]
//
// Músicas   → Inspirado na Harman Target Curve: sub-bass com punch, corte de
//             embolamento nos low-mids (300-600Hz), realce de presença (3-6kHz)
//             e brilho/ar nos highs para experiência musical envolvente e clara.
//
// PodCasts  → Corte agressivo de sub-bass e rumble, neutro nos low-mids,
//             boost forte de inteligibilidade de voz (600Hz-3kHz), leveza nos
//             altos para voz clara, sem sibilância excessiva.
//
// Filmes    → Sub-bass profundo para efeitos de impacto e ação, mids neutros
//             para diálogos nítidos na faixa de presença (1-3kHz), highs
//             abertos e arejados para trilha e ambientação sonora.
//
// Graves    → Sub-bass e bass reforçados para quem quer sentir o baixo,
//             compensação leve nos highs para manter equilíbrio geral.
//
// Normal    → Curva plana, sem alterações.
//
const EQ_PRESETS = {
  'Normal':   [  0,   0,   0,   0,   0,   0,   0,   0 ],
  'Músicas':  [ +3,  +2,  -1,  -2,  +1,  +3,  +5,  +4 ],
  'PodCasts': [ -6,  -4,  -2,  +4,  +6,  +5,  +2,  -1 ],
  'Filmes':   [ +6,  +5,  +2,   0,  +2,  +4,  +3,  +5 ],
  'Graves':   [ +8,  +6,  +4,  +1,  -1,  -2,  -1,  +1 ],
};

const PRESET_ICONS = {
  'Normal':   '🎵',
  'Músicas':  '🎸',
  'PodCasts': '🎙️',
  'Filmes':   '🎬',
  'Graves':   '🥁',
};

const PRESET_DESC = {
  'Normal':   'Curva plana — sem alterações',
  'Músicas':  'Harman curve: punch, presença e brilho',
  'PodCasts': 'Voz clara e inteligível, sem rumble',
  'Filmes':   'Impacto + diálogo nítido + trilha aberta',
  'Graves':   'Sub-bass e baixo reforçados',
};

// ─── ESTADO ──────────────────────────────────────────────────────────────────

let eqValues       = [0, 0, 0, 0, 0, 0, 0, 0];
let eqActivePreset = 'Normal';
let eqAnimFrame    = null;
let eqAnimPhase    = 0;
let eqIsOpen       = false;

let audioCtx  = null;
let filters   = [];
let gainNode  = null;
let eqChained = false;

// ─── WEB AUDIO API ───────────────────────────────────────────────────────────

function initAudioContext() {
  if (audioCtx) return;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    filters = EQ_BANDS.map((band, i) => {
      const f = audioCtx.createBiquadFilter();
      f.type            = i === 0 ? 'lowshelf' : i === EQ_BANDS.length - 1 ? 'highshelf' : 'peaking';
      f.frequency.value = band.freq;
      f.gain.value      = eqValues[i];
      f.Q.value         = 1.0;
      return f;
    });

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 1.0;

    for (let i = 0; i < filters.length - 1; i++) filters[i].connect(filters[i + 1]);
    filters[filters.length - 1].connect(gainNode);
    gainNode.connect(audioCtx.destination);

    tryHookPageAudio();
    console.log('[EQ] AudioContext criado');
  } catch (e) {
    console.warn('[EQ] Web Audio API indisponível:', e.message);
  }
}

function tryHookPageAudio() {
  try {
    for (const iframe of document.querySelectorAll('iframe')) {
      try {
        const video = (iframe.contentDocument || iframe.contentWindow?.document)?.querySelector('video');
        if (video && !video._eqHooked) {
          audioCtx.createMediaElementSource(video).connect(filters[0]);
          video._eqHooked = true;
          eqChained = true;
          updateEqStatusUI(true);
          return;
        }
      } catch (_) {}
    }
  } catch (_) {}

  try {
    for (const el of document.querySelectorAll('audio, video')) {
      if (!el._eqHooked) {
        audioCtx.createMediaElementSource(el).connect(filters[0]);
        el._eqHooked = true;
        eqChained = true;
        updateEqStatusUI(true);
        return;
      }
    }
  } catch (_) {}

  updateEqStatusUI(false);
}

function retryAudioHook() {
  if (!eqChained && audioCtx) tryHookPageAudio();
}

function applyEqToFilters() {
  if (!filters.length || !audioCtx) return;
  filters.forEach((f, i) => {
    if (f && f.gain) f.gain.setTargetAtTime(eqValues[i], audioCtx.currentTime, 0.015);
  });
}

function applyVolumeHint() {
  if (eqChained) return;
  try {
    if (typeof player === 'undefined' || !player?.getVolume) return;
    const bassBoost = (eqValues[0] + eqValues[1]) / 2;
    const adjusted  = Math.min(100, Math.max(10, 80 + bassBoost * 1.5));
    if (Math.abs(adjusted - player.getVolume()) > 2) player.setVolume(adjusted);
  } catch (_) {}
}

// ─── SPECTRUM ────────────────────────────────────────────────────────────────

function drawSpectrum() {
  const canvas = document.getElementById('eqSpectrumCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const BARS = 40, barW = W / BARS - 1;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(15,23,42,0.6)';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(100,116,139,0.2)';
  ctx.lineWidth = 1;
  for (let y = H * 0.25; y < H; y += H * 0.25) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  eqAnimPhase += 0.025;

  for (let i = 0; i < BARS; i++) {
    const t    = i / (BARS - 1);
    const eqI  = Math.min(7, Math.floor(t * 8));
    const pulse= Math.sin(eqAnimPhase + i * 0.4) * 0.15 + 0.85;
    const eqG  = (eqValues[eqI] + 12) / 24;
    const barH = Math.max(4, H * (0.25 + eqG * 0.55) * pulse);
    const x    = i * (barW + 1), y = H - barH;

    const grad = ctx.createLinearGradient(x, y, x, H);
    const h1 = 180 + t * 40, h2 = 30 + t * 20;
    grad.addColorStop(0,   `hsla(${h1},90%,65%,0.95)`);
    grad.addColorStop(0.5, `hsla(${(h1+h2)/2},85%,55%,0.85)`);
    grad.addColorStop(1,   `hsla(${h2},95%,55%,0.7)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, [2, 2, 0, 0]);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(x, y, barW, 2);
  }

  if (eqIsOpen) eqAnimFrame = requestAnimationFrame(drawSpectrum);
}

function startSpectrum() {
  if (eqAnimFrame) cancelAnimationFrame(eqAnimFrame);
  eqIsOpen = true;
  drawSpectrum();
}

function stopSpectrum() {
  eqIsOpen = false;
  if (eqAnimFrame) { cancelAnimationFrame(eqAnimFrame); eqAnimFrame = null; }
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function updateEqStatusUI(hooked) {
  const dot = document.getElementById('eqStatusDot');
  const txt = document.getElementById('eqStatusText');
  if (!dot || !txt) return;
  dot.style.background = hooked ? '#22c55e' : '#f59e0b';
  txt.textContent      = hooked ? 'ao vivo' : 'visual';
}

function renderEqBands() {
  const container = document.getElementById('eqBandsContainer');
  if (!container) return;
  container.innerHTML = '';

  EQ_BANDS.forEach((band, i) => {
    const col = document.createElement('div');
    col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;';

    const valLabel = document.createElement('span');
    valLabel.id = `eqVal_${i}`;
    valLabel.style.cssText = 'font-size:11px;color:#06b6d4;font-weight:700;min-height:16px;';
    valLabel.textContent   = formatGain(eqValues[i]);

    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = '-12'; slider.max = '12';
    slider.step = '1'; slider.value = eqValues[i]; slider.id = `eqSlider_${i}`;
    slider.style.cssText = `-webkit-appearance:slider-vertical;writing-mode:vertical-lr;direction:rtl;width:28px;height:110px;cursor:pointer;accent-color:#06b6d4;`;
    slider.oninput = () => {
      eqValues[i] = parseFloat(slider.value);
      valLabel.textContent = formatGain(eqValues[i]);
      eqActivePreset = '';
      deselectAllPresets();
      applyEqToFilters();
      applyVolumeHint();
      saveEqSettings();
    };

    const freqLabel = document.createElement('span');
    freqLabel.style.cssText = 'font-size:10px;color:#64748b;text-align:center;font-weight:600;';
    freqLabel.textContent   = band.label;

    col.appendChild(valLabel);
    col.appendChild(slider);
    col.appendChild(freqLabel);
    container.appendChild(col);
  });
}

function renderPresets() {
  const container = document.getElementById('eqPresetsContainer');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(EQ_PRESETS).forEach(name => {
    const btn = document.createElement('button');
    btn.id    = `eqPreset_${name}`;
    btn.type  = 'button';
    btn.title = PRESET_DESC[name] || name;
    btn.innerHTML = `<span style="font-size:18px;">${PRESET_ICONS[name] || ''}</span><span style="display:block;font-size:11px;margin-top:3px;font-weight:700;">${name}</span>`;
    btn.style.cssText = `flex:1;min-width:72px;padding:9px 4px 7px;border:2px solid #334155;border-radius:9px;background:#1e293b;color:#94a3b8;cursor:pointer;transition:all 0.2s;font-family:inherit;line-height:1;text-align:center;`;
    btn.onmouseenter = () => { if (eqActivePreset !== name) btn.style.background = '#334155'; };
    btn.onmouseleave = () => { if (eqActivePreset !== name) btn.style.background = '#1e293b'; };
    btn.onclick = () => applyPreset(name);
    container.appendChild(btn);
  });
}

function applyPreset(name) {
  const values = EQ_PRESETS[name];
  if (!values) return;

  eqValues = [...values];
  eqActivePreset = name;

  EQ_BANDS.forEach((_, i) => {
    const sl  = document.getElementById(`eqSlider_${i}`);
    const lbl = document.getElementById(`eqVal_${i}`);
    if (sl)  sl.value        = eqValues[i];
    if (lbl) lbl.textContent = formatGain(eqValues[i]);
  });

  deselectAllPresets();
  const btn = document.getElementById(`eqPreset_${name}`);
  if (btn) {
    btn.style.background  = 'linear-gradient(135deg,#06b6d4,#3b82f6)';
    btn.style.color       = '#fff';
    btn.style.borderColor = '#06b6d4';
    btn.style.boxShadow   = '0 0 12px rgba(6,182,212,0.4)';
  }

  applyEqToFilters();
  applyVolumeHint();
  saveEqSettings();
}

function deselectAllPresets() {
  Object.keys(EQ_PRESETS).forEach(name => {
    const btn = document.getElementById(`eqPreset_${name}`);
    if (btn) { btn.style.background = '#1e293b'; btn.style.color = '#94a3b8'; btn.style.borderColor = '#334155'; btn.style.boxShadow = 'none'; }
  });
}

function formatGain(v) {
  return v === 0 ? '0' : (v > 0 ? '+' : '') + v;
}

// ─── PERSISTÊNCIA ────────────────────────────────────────────────────────────

function saveEqSettings() {
  try { localStorage.setItem('dylist_eq', JSON.stringify({ values: eqValues, preset: eqActivePreset })); } catch (_) {}
}

function loadEqSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem('dylist_eq'));
    if (saved?.values?.length === 8) { eqValues = saved.values; eqActivePreset = saved.preset || 'Normal'; }
  } catch (_) {}
}

// ─── MODAL HTML ──────────────────────────────────────────────────────────────

function injectEqualizerModal() {
  if (document.getElementById('equalizerModal')) return;

  const modal = document.createElement('div');
  modal.id = 'equalizerModal';
  modal.className = 'modal';
  modal.style.cssText = 'background:rgba(0,0,0,0.88);z-index:2000;';
  modal.onclick = (e) => { if (e.target === modal) closeEqualizer(); };

  modal.innerHTML = `
    <div onclick="event.stopPropagation()" style="background:linear-gradient(160deg,#0f1f35 0%,#0d1b2e 100%);border:1.5px solid rgba(6,182,212,0.25);border-radius:16px;padding:22px 20px 18px;width:92%;max-width:500px;box-shadow:0 20px 60px rgba(0,0,0,0.7),0 0 40px rgba(6,182,212,0.08);animation:scaleIn 0.3s ease forwards;">

      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;filter:drop-shadow(0 0 6px #06b6d4);">♪</span>
          <div>
            <div style="font-size:15px;font-weight:700;color:#f1f5f9;">Equalizador</div>
            <div style="font-size:11px;color:#64748b;margin-top:1px;">8 bandas · tempo real</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:7px;">
          <span id="eqStatusDot" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#f59e0b;box-shadow:0 0 6px currentColor;"></span>
          <span id="eqStatusText" style="font-size:11px;color:#64748b;font-weight:600;">visual</span>
        </div>
      </div>

      <div style="border-radius:10px;overflow:hidden;margin-bottom:18px;border:1px solid rgba(255,255,255,0.06);">
        <canvas id="eqSpectrumCanvas" style="display:block;width:100%;height:80px;" height="80"></canvas>
      </div>

      <div id="eqBandsContainer" style="display:flex;gap:4px;justify-content:space-between;padding:14px 8px;background:rgba(0,0,0,0.3);border-radius:10px;margin-bottom:16px;border:1px solid rgba(255,255,255,0.05);"></div>

      <div style="margin-bottom:6px;">
        <div style="font-size:11px;color:#475569;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:8px;">Presets</div>
        <div id="eqPresetsContainer" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
      </div>

      <button onclick="closeEqualizer()" style="width:100%;margin-top:14px;padding:11px;background:rgba(239,68,68,0.15);border:1.5px solid rgba(239,68,68,0.4);color:#ef4444;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;"
        onmouseenter="this.style.background='rgba(239,68,68,0.28)'"
        onmouseleave="this.style.background='rgba(239,68,68,0.15)'">Fechar</button>
    </div>
  `;

  document.body.appendChild(modal);
  requestAnimationFrame(() => {
    const c = document.getElementById('eqSpectrumCanvas');
    if (c) c.width = c.offsetWidth || 460;
  });
}

// ─── BOTÃO ♪ ─────────────────────────────────────────────────────────────────

function injectEqualizerButton() {
  // Se o botão já foi colocado no HTML, apenas conecta o evento
  const existing = document.getElementById('openEqualizerBtn');
  if (existing) {
    existing.onclick = openEqualizer;
    return;
  }
  // Fallback: criar dinamicamente após o smartSearchBtn
  const searchBtn = document.getElementById('smartSearchBtn');
  if (!searchBtn) return;

  const eqBtn = document.createElement('button');
  eqBtn.id = 'openEqualizerBtn';
  eqBtn.className = 'btn-equalizador';
  eqBtn.title = 'Equalizador';
  eqBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg> ♪`;
  eqBtn.onclick = openEqualizer;
  searchBtn.parentNode.insertBefore(eqBtn, searchBtn.nextSibling);
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────

function injectEqualizerStyles() {
  if (document.getElementById('eqStyles')) return;
  const style = document.createElement('style');
  style.id = 'eqStyles';
  style.textContent = `
    .btn-equalizador {
      display:inline-flex;align-items:center;gap:6px;padding:10px 18px;
      border:none;border-radius:8px;font-size:15px;font-weight:700;cursor:pointer;
      transition:opacity 0.2s,transform 0.15s,box-shadow 0.2s;
      font-family:'Source Sans Pro',sans-serif;
      background:linear-gradient(135deg,#0e7490,#0284c7);color:#fff;margin-left:0;
    }
    .btn-equalizador:hover {
      opacity:0.9;transform:translateY(-1px);
      box-shadow:0 4px 14px rgba(6,182,212,0.4);
      background:linear-gradient(135deg,#0e7490,#0284c7);
    }
    #eqBandsContainer input[type=range] {
      -webkit-appearance:slider-vertical;writing-mode:vertical-lr;direction:rtl;
      width:24px;height:110px;cursor:pointer;accent-color:#06b6d4;background:transparent;
    }
  `;
  document.head.appendChild(style);
}

// ─── INICIALIZAÇÃO ────────────────────────────────────────────────────────────

function initEqualizer() {
  loadEqSettings();
  injectEqualizerStyles();
  injectEqualizerModal();
  injectEqualizerButton();
  console.log('[EQ] ✅ Equalizador v1.1 — Músicas / PodCasts / Filmes / Graves / Normal');
}

function openEqualizer() {
  initAudioContext();
  retryAudioHook();
  const modal = document.getElementById('equalizerModal');
  if (modal) {
    modal.style.display = 'flex';
    renderEqBands();
    renderPresets();
    if (eqActivePreset) {
      const btn = document.getElementById(`eqPreset_${eqActivePreset}`);
      if (btn) {
        deselectAllPresets();
        btn.style.background  = 'linear-gradient(135deg,#06b6d4,#3b82f6)';
        btn.style.color       = '#fff';
        btn.style.borderColor = '#06b6d4';
        btn.style.boxShadow   = '0 0 12px rgba(6,182,212,0.4)';
      }
    }
    startSpectrum();
  }
}

function closeEqualizer() {
  const modal = document.getElementById('equalizerModal');
  if (modal) modal.style.display = 'none';
  stopSpectrum();
}

window.openEqualizer  = openEqualizer;
window.closeEqualizer = closeEqualizer;

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initEqualizer();
} else {
  window.addEventListener('load', initEqualizer);
}