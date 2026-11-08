const fs = require('fs');

let s = fs.readFileSync('src/index.html', 'utf8');

const target = '    <div class="tip-inner">\r\n      <span class="tip-seal">漫步</span>\r\n      <span class="tip-text"><b>W A S D</b> 移动漫游 · <b>鼠标移动/拖拽</b>视角 · 全园全境畅行无阻，自由探索</span>\r\n    </div>\r\n  </div>';

const addition = `\r
\r
  <!-- 荷风四面水亭 · 石桌对弈入座交互 -->\r
  <div class="pavilion-seat-prompt" id="pavilion-seat-prompt" style="display: none;" role="button" aria-label="入座对弈">\r
    <div class="prompt-inner">\r
      <span class="prompt-key">E</span>\r
      <span class="prompt-text">入座石桌对弈</span>\r
    </div>\r
  </div>\r
  <div class="pavilion-sitting-hud" id="pavilion-sitting-hud" style="display: none;">\r
    <div class="sitting-inner">\r
      <span class="sitting-seal">弈</span>\r
      <span class="sitting-desc">已入座 · 荷风四面水亭对弈</span>\r
      <button type="button" class="btn-stand-up" id="btn-stand-up">起立 (WASD / 空格)</button>\r
    </div>\r
  </div>`;

if (s.includes(target)) {
  s = s.replace(target, target + addition);
  fs.writeFileSync('src/index.html', s, 'utf8');
  console.log('index.html updated successfully');
} else {
  // Try LF version if CRLF did not match
  const targetLF = '    <div class="tip-inner">\n      <span class="tip-seal">漫步</span>\n      <span class="tip-text"><b>W A S D</b> 移动漫游 · <b>鼠标移动/拖拽</b>视角 · 全园全境畅行无阻，自由探索</span>\n    </div>\n  </div>';
  const additionLF = addition.replace(/\r\n/g, '\n');
  if (s.includes(targetLF)) {
    s = s.replace(targetLF, targetLF + additionLF);
    fs.writeFileSync('src/index.html', s, 'utf8');
    console.log('index.html updated with LF');
  } else {
    console.error('Neither target found in index.html');
  }
}
