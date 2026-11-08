const fs = require('fs');

let css = fs.readFileSync('src/style.css', 'utf8');

const promptCSS = `

/* =========================================================
   荷风四面水亭 · 对弈入座与轻提示 HUD
   ========================================================= */
.pavilion-seat-prompt {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, 60px);
  background: rgba(24, 22, 20, 0.88);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(212, 175, 55, 0.45);
  border-radius: 24px;
  padding: 6px 16px 6px 10px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28);
  z-index: 25;
  cursor: pointer;
  pointer-events: auto;
  user-select: none;
  animation: promptPulse 2s infinite ease-in-out;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.pavilion-seat-prompt:hover {
  background: rgba(36, 32, 28, 0.95);
  border-color: rgba(255, 215, 0, 0.7);
  transform: translate(-50%, 58px) scale(1.03);
}

.pavilion-seat-prompt .prompt-inner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.prompt-key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  background: #c84b31;
  color: #fff;
  font-family: var(--font-editorial, sans-serif);
  font-size: 13px;
  font-weight: 700;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.prompt-text {
  font-size: 13px;
  color: #f7f2e8;
  letter-spacing: 0.05em;
  font-weight: 500;
}

@keyframes promptPulse {
  0%, 100% { box-shadow: 0 4px 18px rgba(0, 0, 0, 0.28), 0 0 0 0 rgba(212, 175, 55, 0.4); }
  50% { box-shadow: 0 4px 22px rgba(0, 0, 0, 0.35), 0 0 0 6px rgba(212, 175, 55, 0); }
}

/* 入座对弈状态 HUD */
.pavilion-sitting-hud {
  position: absolute;
  bottom: clamp(24px, 5vh, 48px);
  left: 50%;
  transform: translateX(-50%);
  background: rgba(22, 20, 18, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.4);
  border-radius: 30px;
  padding: 8px 18px 8px 14px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.35);
  z-index: 26;
  user-select: none;
  animation: sittingFadeIn 0.4s ease-out;
}

@keyframes sittingFadeIn {
  from { opacity: 0; transform: translate(-50%, 14px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.sitting-inner {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sitting-seal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #c84b31;
  color: #fff;
  font-family: var(--font-editorial, serif);
  font-size: 13px;
  font-weight: 600;
  border-radius: 5px;
}

.sitting-desc {
  font-size: 13px;
  color: #f2ede4;
  letter-spacing: 0.04em;
}

.btn-stand-up {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-stand-up:hover {
  background: #c84b31;
  border-color: #c84b31;
  transform: scale(1.05);
}
`;

css += promptCSS;
fs.writeFileSync('src/style.css', css, 'utf8');
console.log('style.css updated successfully');
