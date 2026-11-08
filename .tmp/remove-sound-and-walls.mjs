import fs from 'fs';

// 1. Update src/index.html
let html = fs.readFileSync('src/index.html', 'utf8');
const oldTip = `<b>W A S D</b> 移动 · <b>鼠标点击</b>锁定视角 · 踏青石板闻清脆步履 · 临水畔听潺潺水声`;
const newTip = `<b>W A S D</b> 移动漫游 · <b>鼠标移动/拖拽</b>视角 · 全园全境畅行无阻，自由探索`;
if (html.includes(oldTip)) {
  html = html.replace(oldTip, newTip);
  fs.writeFileSync('src/index.html', html, 'utf8');
  console.log('src/index.html tip updated.');
} else {
  console.warn('oldTip not found in src/index.html, check content');
}

// 2. Update src/app.js
let app = fs.readFileSync('src/app.js', 'utf8');

// Replace canWalk and audio block
const idxCanWalk = app.indexOf('  // 判定是否允许通行');
const idxUpdateWalk = app.indexOf('  function updateWalkMode(dt) {');

if (idxCanWalk === -1 || idxUpdateWalk === -1) {
  console.error("Indices not found in src/app.js!", idxCanWalk, idxUpdateWalk);
  process.exit(1);
}

const replacement = `  // 取消所有空气墙：这片地方的任何地方用户都可以自由走到！
  function canWalk(x, z) {
    // 仅限制在园林外围超宽外框内，防止走出场景虚空
    if (Math.abs(x) > 38.5 || Math.abs(z) > 31.0) {
      return false;
    }
    return true;
  }

  // 取消所有声音：全局静音，零外部音频与声音合成
  var audioCtx = null;
  var waterGainNode = null;
  var waterSourceNode = null;
  var audioInitialized = false;

  function initAudio() {}
  function resumeAudioOnGesture() {}
  function playFootstep() {}
  function updateWaterAudio(posX, posZ) {}

`;

app = app.slice(0, idxCanWalk) + replacement + app.slice(idxUpdateWalk);
console.log('canWalk and audio functions updated in src/app.js.');

// In getGroundHeight, add lake water support so stepping into water is at water surface (0.34m)
const oldGroundDefault = `    // 默认平地地坪\r\n    return 0.08;\r\n  }`;
const newGroundDefault = `    // 12. 整个水池湖面（可在水上自由漫步闲庭踏水，水面标高 0.34m）\r\n    if (x > -18.0 && x < 18.0 && z > -0.5 && z < 18.0) {\r\n      return 0.34;\r\n    }\r\n\r\n    // 默认平地地坪\r\n    return 0.08;\r\n  }`;

if (app.includes(oldGroundDefault)) {
  app = app.replace(oldGroundDefault, newGroundDefault);
  console.log('getGroundHeight water surface walk added.');
} else {
  // Try unix line ending
  const oldGroundDefaultUnix = `    // 默认平地地坪\n    return 0.08;\n  }`;
  const newGroundDefaultUnix = `    // 12. 整个水池湖面（可在水上自由漫步闲庭踏水，水面标高 0.34m）\n    if (x > -18.0 && x < 18.0 && z > -0.5 && z < 18.0) {\n      return 0.34;\n    }\n\n    // 默认平地地坪\n    return 0.08;\n  }`;
  if (app.includes(oldGroundDefaultUnix)) {
    app = app.replace(oldGroundDefaultUnix, newGroundDefaultUnix);
    console.log('getGroundHeight water surface walk added (unix).');
  } else {
    console.warn('oldGroundDefault not matched, check getGroundHeight end');
  }
}

fs.writeFileSync('src/app.js', app, 'utf8');
console.log('src/app.js saved successfully.');
