/**
 * DyList Premium Engine v4.0
 * Delega para o YouListAdBlocker principal (ad-blocker.js)
 * Mantido para compatibilidade — não duplica lógica
 */

// O ad-blocker.js já inicializa window.youlistAdBlocker com a v3.0
// Este arquivo apenas garante compatibilidade com código que referencie
// window.youlistAdBlocker esperando a interface do Premium Engine.

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.youlistAdBlocker) {
      if (typeof logger !== 'undefined') {
        logger.info('DyList Premium Engine: delegando para Ad Blocker v3.0');
      }
    }
  });
}

console.log('%c🛡️ DyList Premium Engine v4.0 — integrado ao Ad Blocker v3.0', 'color:#10b981;font-size:13px;font-weight:bold;');
