const fs = require('fs');

let lines = fs.readFileSync('.tmp/test-turn8.js', 'utf8').split(/\r?\n/);

// 1. Update FULL_CAM_POS and FULL_TARGET
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('var FULL_CAM_POS = new THREE.Vector3(0, 5.2, 16.2);')) {
    lines[i] = '  var FULL_CAM_POS = new THREE.Vector3(-16.0, 11.5, 26.0);   // 当前大小1:1庭院全貌精选机位';
  }
  if (lines[i].includes('var FULL_TARGET = new THREE.Vector3(0, 3.6, -6.0);')) {
    lines[i] = '  var FULL_TARGET = new THREE.Vector3(0, 2.0, 5.0);          // 庭院核心全景聚焦点';
  }
}

// 2. Replace switchViewMode
const switchIdx = lines.findIndex(l => l.includes('function switchViewMode(newMode) {'));
if (switchIdx === -1) throw new Error('switchViewMode not found');
const switchEnd = lines.findIndex((l, i) => i > switchIdx && l.trim() === '}');

const newSwitchLines = `  function switchViewMode(newMode) {
    if (isSitting) {
      standUp();
    }
    if (newMode === viewMode) return;
    resumeAudioOnGesture();

    var prevMode = viewMode;
    viewMode = newMode;
    document.body.setAttribute('data-view', newMode);

    ['diorama', 'god', 'walk'].forEach(function (m) {
      var btn = document.getElementById('btn-mode-' + m);
      if (btn) {
        if (m === newMode) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (newMode === 'diorama') {
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }
      controls.enabled = true;
      setDioramaScale(0.28, true);
    } else if (newMode === 'god') {
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }
      controls.enabled = true;
      setDioramaScale(1.0, true);
    } else if (newMode === 'walk') {
      controls.enabled = false;
      if (prevMode !== 'walk') {
        playerPos.set(0, getGroundHeight(0, 13.5) + 1.65, 13.5);
        playerYaw = 0;
        playerPitch = -0.05;
      }
      camera.position.copy(playerPos);
    }
  }`.split('\n');

lines.splice(switchIdx, switchEnd - switchIdx + 1, ...newSwitchLines);

// 3. Replace bindRoamingControls
const bindIdx = lines.findIndex(l => l.includes('function bindRoamingControls() {'));
if (bindIdx === -1) throw new Error('bindRoamingControls not found');

// Find the lines with btnGod and btnWalk
let btnWalkLine = -1;
for (let i = bindIdx; i < bindIdx + 20; i++) {
  if (lines[i].includes('if (btnWalk) btnWalk.addEventListener')) {
    btnWalkLine = i;
    break;
  }
}
if (btnWalkLine === -1) throw new Error('btnWalk listener not found');

const newBindings = `    var btnDiorama = document.getElementById('btn-mode-diorama');
    var btnGod = document.getElementById('btn-mode-god');
    var btnWalk = document.getElementById('btn-mode-walk');

    if (btnDiorama) btnDiorama.addEventListener('click', function () { switchViewMode('diorama'); });
    if (btnGod) btnGod.addEventListener('click', function () { switchViewMode('god'); });
    if (btnWalk) btnWalk.addEventListener('click', function () { switchViewMode('walk'); });

    var btnScaleMini = document.getElementById('btn-scale-mini');
    if (btnScaleMini) btnScaleMini.addEventListener('click', function () {
      if (viewMode === 'walk') switchViewMode('diorama');
      else setDioramaScale(0.28, true);
    });

    var btnScaleFull = document.getElementById('btn-scale-full');
    if (btnScaleFull) btnScaleFull.addEventListener('click', function () {
      if (viewMode === 'walk') switchViewMode('god');
      else setDioramaScale(1.0, true);
    });

    var scaleSlider = document.getElementById('diorama-scale-slider');
    if (scaleSlider) {
      scaleSlider.addEventListener('input', function (e) {
        var v = parseFloat(e.target.value);
        if (viewMode === 'walk') switchViewMode('god');
        setDioramaScale(v, false);
      });
    }`.split('\n');

// Replace the old btnGod/btnWalk binding lines
const oldBtnStart = lines.findIndex((l, i) => i >= bindIdx && l.includes('var btnGod ='));
lines.splice(oldBtnStart, btnWalkLine - oldBtnStart + 1, ...newBindings);

// 4. Expose to window for seamless API and debugging
const bootIdx = lines.findIndex(l => l.includes('window.appCamera = camera;'));
if (bootIdx !== -1) {
  lines.splice(bootIdx + 1, 0,
    '    window.switchViewMode = switchViewMode;',
    '    window.setDioramaScale = setDioramaScale;'
  );
}

fs.writeFileSync('.tmp/test-turn8.js', lines.join('\n'), 'utf8');
console.log('.tmp/test-turn8.js successfully wired for diorama controls and scale system!');
