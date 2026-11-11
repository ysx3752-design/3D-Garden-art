let code = fs.readFileSync('.tmp/test-turn8.js', 'utf8');

// Hide 600m plane in buildGround so floating pedestal cleanly suspends in sky
code = code.replace(
  'groundMat = ground.material;',
  'groundMat = ground.material;\n    ground.visible = false; // 隐藏超大600m地面，使沙盘方格纯净悬浮于天幕之中'
);

// Bamboo groves position adjustment to sit cleanly on northern slope
const oldGroves = `    var groves = [
      { x: -32, z: 0, r: 3.2, n: isMobile ? 35 : 70, seed: 43 },
      { x: 33, z: -16, r: 3.0, n: isMobile ? 30 : 60, seed: 49 },
      { x: 0, z: -55, r: 12.0, n: isMobile ? 35 : 70, seed: 55 },
      { x: -75, z: -55, r: 24, n: isMobile ? 30 : 65, seed: 61 },
      { x: 80, z: -60, r: 24, n: isMobile ? 30 : 65, seed: 67 }
    ];`;

const newGroves = `    var groves = [
      { x: -32, z: 0, r: 3.2, n: isMobile ? 35 : 70, seed: 43 },
      { x: 33, z: -16, r: 3.0, n: isMobile ? 30 : 60, seed: 49 },
      { x: 0, z: -40, r: 9.0, n: isMobile ? 35 : 70, seed: 55 },
      { x: -26, z: -40, r: 7.5, n: isMobile ? 30 : 65, seed: 61 },
      { x: 26, z: -40, r: 7.5, n: isMobile ? 30 : 65, seed: 67 }
    ];`;

code = code.replace(oldGroves, newGroves);

// Add buildDioramaPedestal and Scale Control System
const dioramaPedestalAndScaleSystem = `
  /* ---------------- 13.8 悬浮方格沙盘基座系统（精致微缩立体展台与地层剖面） ---------------- */

  var dioramaGroup = null;

  function buildDioramaPedestal() {
    dioramaGroup = new THREE.Group();

    var CX = 0;
    var CZ = -6;
    var SIZE = 84; // 84m x 84m 完美正方形基座，严格包围四面院墙与前后庭院
    var HALF = SIZE / 2; // 42m
    var PLINTH_H = 6.0;  // 垂直地层剖面厚度 6m (Y: 0 -> -6.0)
    var BEVEL_H = 1.2;   // 底部倒角高度 (Y: -6.0 -> -7.2)
    var BEVEL_INSET = 1.2; // 底部向内收缩 1.2m

    // 1. 基座周边铺装材质与切面材质
    var stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTexture(),
      color: 0x9e9b92,
      roughness: 0.88,
      metalness: 0.02
    });
    applySnowAccumulation(stoneMat, 1.0);

    // 深色立体地层剖面材质（类似建筑模型高级黑檀木/深灰玄武岩切片，带横向地质层理微纹）
    var plinthSideMat = new THREE.MeshStandardMaterial({
      color: 0x22262b,
      roughness: 0.82,
      metalness: 0.16
    });

    // 乌金石外沿包边条材质（高光微倒角金属边框）
    var rimMat = new THREE.MeshStandardMaterial({
      color: 0x363b42,
      roughness: 0.42,
      metalness: 0.40
    });

    // 微光氛围导光槽材质（发光微晶线条，增加现代科技建筑展台质感）
    var glowLineMat = new THREE.MeshStandardMaterial({
      color: 0xfff0d8,
      emissive: 0xffddb0,
      emissiveIntensity: 0.60,
      roughness: 0.3
    });

    // 2. 方格顶面边缘包边护框（Curb Rim）
    // 四条顶边金属/石质包边（截面 0.45m 宽, 0.16m 高）
    var rimThick = 0.45;
    var rimH = 0.16;
    addMesh(new THREE.BoxGeometry(SIZE + rimThick * 2, rimH, rimThick), rimMat, CX, rimH / 2, CZ - HALF, { parent: dioramaGroup, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(SIZE + rimThick * 2, rimH, rimThick), rimMat, CX, rimH / 2, CZ + HALF, { parent: dioramaGroup, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(rimThick, rimH, SIZE), rimMat, CX - HALF, rimH / 2, CZ, { parent: dioramaGroup, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(rimThick, rimH, SIZE), rimMat, CX + HALF, rimH / 2, CZ, { parent: dioramaGroup, cast: true, receive: true });

    // 3. 悬浮沙盘主厚度切面（4 面深色厚实剖立面，从 Y: 0 垂降至 Y: -6.0）
    var sideThick = 0.6;
    addMesh(new THREE.BoxGeometry(SIZE, PLINTH_H, sideThick), plinthSideMat, CX, -PLINTH_H / 2, CZ - HALF + sideThick / 2, { parent: dioramaGroup, receive: true });
    addMesh(new THREE.BoxGeometry(SIZE, PLINTH_H, sideThick), plinthSideMat, CX, -PLINTH_H / 2, CZ + HALF - sideThick / 2, { parent: dioramaGroup, receive: true });
    addMesh(new THREE.BoxGeometry(sideThick, PLINTH_H, SIZE - sideThick * 2), plinthSideMat, CX - HALF + sideThick / 2, -PLINTH_H / 2, CZ, { parent: dioramaGroup, receive: true });
    addMesh(new THREE.BoxGeometry(sideThick, PLINTH_H, SIZE - sideThick * 2), plinthSideMat, CX + HALF - sideThick / 2, -PLINTH_H / 2, CZ, { parent: dioramaGroup, receive: true });

    // 4. 环绕微光导光线槽（嵌入在 Y = -0.35 处）
    var glowH = 0.08;
    var glowY = -0.35;
    addMesh(new THREE.BoxGeometry(SIZE + 0.05, glowH, 0.05), glowLineMat, CX, glowY, CZ - HALF, { parent: dioramaGroup });
    addMesh(new THREE.BoxGeometry(SIZE + 0.05, glowH, 0.05), glowLineMat, CX, glowY, CZ + HALF, { parent: dioramaGroup });
    addMesh(new THREE.BoxGeometry(0.05, glowH, SIZE + 0.05), glowLineMat, CX - HALF, glowY, CZ, { parent: dioramaGroup });
    addMesh(new THREE.BoxGeometry(0.05, glowH, SIZE + 0.05), glowLineMat, CX + HALF, glowY, CZ, { parent: dioramaGroup });

    // 5. 底部斜切收分与底盖（Chamfer Bevel Base: Y 从 -6.0 收至 -7.2）
    var btmSize = SIZE - BEVEL_INSET * 2;
    var btmBaseMat = new THREE.MeshStandardMaterial({ color: 0x181a1d, roughness: 0.88 });
    addMesh(new THREE.BoxGeometry(btmSize, 0.4, btmSize), btmBaseMat, CX, -PLINTH_H - BEVEL_H + 0.2, CZ, { parent: dioramaGroup, receive: true });

    // 6. 围墙外围四大区域的高品位地坪与庭院景观衔接
    // 南侧正门前入口广场 (Z: 20 到 36, X: -42 到 42)
    var southPlazaGeo = new THREE.PlaneGeometry(SIZE, 16);
    var southPlaza = new THREE.Mesh(southPlazaGeo, stoneMat);
    southPlaza.rotation.x = -Math.PI / 2;
    southPlaza.position.set(CX, 0.02, 28);
    southPlaza.receiveShadow = true;
    dioramaGroup.add(southPlaza);

    // 南侧边缘青石护栏（低矮雅致栏板，高 0.65m）
    for (var bx = -HALF + 2; bx <= HALF - 2; bx += 3.5) {
      addMesh(new THREE.CylinderGeometry(0.08, 0.09, 0.72, 6), stoneMat, bx, 0.36, CZ + HALF - 0.5, { parent: dioramaGroup, cast: true });
      if (bx < HALF - 2) {
        addMesh(new THREE.BoxGeometry(3.3, 0.12, 0.10), stoneMat, bx + 1.75, 0.58, CZ + HALF - 0.5, { parent: dioramaGroup, cast: true });
        addMesh(new THREE.BoxGeometry(3.3, 0.10, 0.08), stoneMat, bx + 1.75, 0.22, CZ + HALF - 0.5, { parent: dioramaGroup, cast: true });
      }
    }

    // 东西两侧外围石板步道
    var westPath = new THREE.Mesh(new THREE.PlaneGeometry(4, 52), stoneMat);
    westPath.rotation.x = -Math.PI / 2;
    westPath.position.set(-40, 0.02, -6);
    westPath.receiveShadow = true;
    dioramaGroup.add(westPath);

    var eastPath = new THREE.Mesh(new THREE.PlaneGeometry(4, 52), stoneMat);
    eastPath.rotation.x = -Math.PI / 2;
    eastPath.position.set(40, 0.02, -6);
    eastPath.receiveShadow = true;
    dioramaGroup.add(eastPath);

    // 北侧后园青翠山林斜坡与青石边 (Z: -48 到 -32)
    var northSlope = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, 16), new THREE.MeshStandardMaterial({
      color: COL.grass,
      roughness: 0.90
    }));
    northSlope.rotation.x = -Math.PI / 2;
    northSlope.position.set(CX, 0.02, -40);
    northSlope.receiveShadow = true;
    dioramaGroup.add(northSlope);

    scene.add(dioramaGroup);
  }

  /* ---------------- 15.6 沙盘微缩与原寸缩放无级控制系统 ---------------- */
  var dioramaScale = 1.0; // 0.28 (微缩沙盘) ~ 1.0 (当前原寸)
  var isAnimatingScale = false;
  var scaleAnimStart = 0;
  var scaleAnimDuration = 900; // 0.9秒平滑阻尼插值过渡
  var camFromPos = new THREE.Vector3();
  var camToPos = new THREE.Vector3();
  var targetFrom = new THREE.Vector3();
  var targetTo = new THREE.Vector3();

  // 关键预设机位定义
  var DIORAMA_CAM_POS = new THREE.Vector3(68, 52, 60); // 经典东南45度鸟瞰方格沙盘机位
  var DIORAMA_TARGET = new THREE.Vector3(0, 1.5, -6.0); // 沙盘中心

  var FULL_CAM_POS = new THREE.Vector3(0, 5.2, 16.2);   // 当前大小1:1庭院全貌机位
  var FULL_TARGET = new THREE.Vector3(0, 3.6, -6.0);    // 庭院中心

  function getCamTrack(t) {
    var u = (t - 0.28) / (1.0 - 0.28);
    u = clamp(u, 0, 1);
    var pos = new THREE.Vector3().lerpVectors(DIORAMA_CAM_POS, FULL_CAM_POS, u);
    var tgt = new THREE.Vector3().lerpVectors(DIORAMA_TARGET, FULL_TARGET, u);
    return { pos: pos, target: tgt };
  }

  function setDioramaScale(val, animate) {
    val = clamp(val, 0.28, 1.0);
    dioramaScale = val;

    var slider = document.getElementById('diorama-scale-slider');
    if (slider) slider.value = val.toFixed(2);
    var badge = document.getElementById('scale-badge');
    if (badge) {
      if (val <= 0.32) badge.textContent = '微缩方格 (0.28x)';
      else if (val >= 0.98) badge.textContent = '当前大小 (1.00x)';
      else badge.textContent = val.toFixed(2) + 'x';
    }

    var btnMini = document.getElementById('btn-scale-mini');
    var btnFull = document.getElementById('btn-scale-full');
    if (btnMini) btnMini.classList.toggle('active', val <= 0.35);
    if (btnFull) btnFull.classList.toggle('active', val >= 0.95);

    var btnDiorama = document.getElementById('btn-mode-diorama');
    var btnGod = document.getElementById('btn-mode-god');
    if (btnDiorama) btnDiorama.classList.toggle('active', val <= 0.35 && viewMode === 'diorama');
    if (btnGod) btnGod.classList.toggle('active', val >= 0.95 && viewMode === 'god');

    var track = getCamTrack(val);
    if (animate) {
      isAnimatingScale = true;
      scaleAnimStart = performance.now();
      camFromPos.copy(camera.position);
      camToPos.copy(track.pos);
      targetFrom.copy(controls.target);
      targetTo.copy(track.target);
    } else {
      if (viewMode !== 'walk') {
        camera.position.copy(track.pos);
        controls.target.copy(track.target);
        controls.update();
      }
    }
  }

  function updateScaleAnimation(now) {
    if (!isAnimatingScale) return;
    var progress = (now - scaleAnimStart) / scaleAnimDuration;
    if (progress >= 1.0) {
      progress = 1.0;
      isAnimatingScale = false;
    }
    var ease = easeOutCubic(progress);
    camera.position.lerpVectors(camFromPos, camToPos, ease);
    controls.target.lerpVectors(targetFrom, targetTo, ease);
    controls.update();
  }

  function syncDioramaScaleFromCamera() {
    if (!camera || !controls || viewMode === 'walk') return;
    var curDist = camera.position.distanceTo(controls.target);
    var u = clamp((curDist - 22.25) / (105.0 - 22.25), 0, 1);
    var currentS = 1.0 - u * (1.0 - 0.28);
    dioramaScale = currentS;

    var slider = document.getElementById('diorama-scale-slider');
    if (slider && document.activeElement !== slider) {
      slider.value = currentS.toFixed(2);
    }
    var badge = document.getElementById('scale-badge');
    if (badge) {
      if (currentS <= 0.32) badge.textContent = '微缩方格 (0.28x)';
      else if (currentS >= 0.98) badge.textContent = '当前大小 (1.00x)';
      else badge.textContent = currentS.toFixed(2) + 'x';
    }
    var btnMini = document.getElementById('btn-scale-mini');
    var btnFull = document.getElementById('btn-scale-full');
    if (btnMini) btnMini.classList.toggle('active', currentS <= 0.35);
    if (btnFull) btnFull.classList.toggle('active', currentS >= 0.95);

    var btnDiorama = document.getElementById('btn-mode-diorama');
    var btnGod = document.getElementById('btn-mode-god');
    if (btnDiorama) btnDiorama.classList.toggle('active', currentS <= 0.35);
    if (btnGod) btnGod.classList.toggle('active', currentS >= 0.95);
  }
`;

code = code.replace(
  'function buildVegetation() {',
  dioramaPedestalAndScaleSystem + '\n  function buildVegetation() {'
);

code = code.replace(
  'buildVegetation(); buildPath(); buildEnvironmentalDetails();',
  'buildVegetation(); buildPath(); buildEnvironmentalDetails(); buildDioramaPedestal();'
);

// Update switchViewMode to support 'diorama'
const oldSwitchView = `function switchViewMode(newMode) {
    if (isSitting) {
      standUp();
    }
    if (newMode === viewMode) return;
    resumeAudioOnGesture();

    var prevMode = viewMode;
    viewMode = newMode;
    document.body.setAttribute('data-view', newMode);

    ['god', 'walk'].forEach(function (m) {
      var btn = document.getElementById('btn-mode-' + m);
      if (btn) {
        if (m === newMode) btn.classList.add('active');
        else btn.classList.remove('active');
      }
    });

    if (newMode === 'god') {
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }
      controls.enabled = true;
      camera.position.set(0, 5.2, 16.2);
      controls.target.set(0, 3.6, -6.0);
      controls.update();
    } else if (newMode === 'walk') {
      controls.enabled = false;
      if (prevMode === 'god') {
        playerPos.set(0, getGroundHeight(0, 13.5) + 1.65, 13.5);
        playerYaw = 0;
        playerPitch = -0.05;
        camera.position.copy(playerPos);
      }
    }
  }`;

const newSwitchView = `function switchViewMode(newMode) {
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
        camera.position.copy(playerPos);
      }
    }
  }`;

code = code.replace(oldSwitchView, newSwitchView);

// Update bindRoamingControls to hook diorama buttons and slider
const oldBind = `    var btnGod = document.getElementById('btn-mode-god');
    var btnWalk = document.getElementById('btn-mode-walk');

    if (btnGod) btnGod.addEventListener('click', function () { switchViewMode('god'); });
    if (btnWalk) btnWalk.addEventListener('click', function () { switchViewMode('walk'); });`;

const newBind = `    var btnDiorama = document.getElementById('btn-mode-diorama');
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
    }`;

code = code.replace(oldBind, newBind);

// Camera controls zoom range
code = code.replace('controls.maxDistance = 34;', 'controls.minDistance = 2.0;\n    controls.maxDistance = 160.0;');

// Update clampView
code = code.replace(
  'if (controls.target.y > 9.5) controls.target.y = 9.5;',
  'if (controls.target.y > 15.0) controls.target.y = 15.0;'
);

// Update frame() render loop to update scale animation and sync
code = code.replace(
  'updateTween(now);\n    updateWaterReflection();',
  'updateTween(now);\n    updateWaterReflection();\n    updateScaleAnimation(now);\n    if (!isAnimatingScale && viewMode !== "walk") syncDioramaScaleFromCamera();'
);

fs.writeFileSync('.tmp/test-turn8.js', code, 'utf8');
console.log('.tmp/test-turn8.js successfully updated with diorama system!');
