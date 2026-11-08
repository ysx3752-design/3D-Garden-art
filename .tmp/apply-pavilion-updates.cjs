const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// 1. Add weiqiBoardTexture before buildLakePavilion
const weiqiTextureCode = `
  /* ---------------- 围棋盘十九路纹理生成（天然榧木色调、精致网格与九星） ---------------- */
  function weiqiBoardTexture() {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    var ctx = c.getContext('2d');

    // 棋盘主体榧木温润色泽与木纹底色
    var grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#eac07e');
    grad.addColorStop(0.5, '#deb060');
    grad.addColorStop(1, '#cfa04c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // 细腻行云木纹
    ctx.strokeStyle = 'rgba(150, 95, 30, 0.14)';
    ctx.lineWidth = 1.2;
    for (var i = 0; i < 512; i += 3) {
      ctx.beginPath();
      ctx.moveTo(0, i + Math.sin(i * 0.08) * 3);
      ctx.bezierCurveTo(160, i + Math.sin(i * 0.05) * 5, 340, i - Math.cos(i * 0.04) * 4, 512, i);
      ctx.stroke();
    }

    // 19x19 围棋标准路网格与星位
    var pad = 38;
    var step = (512 - pad * 2) / 18; // 24.22px
    ctx.strokeStyle = '#26201b';
    ctx.lineWidth = 1.6;
    for (var l = 0; l < 19; l++) {
      var p = Math.round(pad + l * step);
      // 横线
      ctx.beginPath();
      ctx.moveTo(pad, p);
      ctx.lineTo(512 - pad, p);
      ctx.stroke();
      // 竖线
      ctx.beginPath();
      ctx.moveTo(p, pad);
      ctx.lineTo(p, 512 - pad);
      ctx.stroke();
    }
    // 粗外边框
    ctx.lineWidth = 2.6;
    ctx.strokeRect(pad, pad, 512 - pad * 2, 512 - pad * 2);

    // 九个星位（天元与八星：第4、10、16道交点，即 0-indexed 3, 9, 15）
    var stars = [3, 9, 15];
    ctx.fillStyle = '#1c1713';
    stars.forEach(function (sx) {
      stars.forEach(function (sy) {
        var x = pad + sx * step;
        var y = pad + sy * step;
        ctx.beginPath();
        ctx.arc(x, y, 4.2, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }
`;

// Insert weiqiTextureCode right before function buildLakePavilion
const targetPavilionDef = 'function buildLakePavilion() {';
if (!code.includes(targetPavilionDef)) {
  console.error('buildLakePavilion not found');
  process.exit(1);
}
code = code.replace(targetPavilionDef, weiqiTextureCode + '\n  ' + targetPavilionDef);

// 2. Add the Stone Table, Chessboard, Stones, Bowls, and Cushions inside buildLakePavilion
const targetPavilionEnd = `    g.position.set(8.5, WATER_Y, 8.5);
    scene.add(g);
  }`;

const tableAndCushionCode = `
    // ---------------- 石桌、棋盘与坐垫（荷风四面水亭核心对弈雅趣） ----------------
    // 1. 古典青石雕花圆石桌（束腰鼓腹石座与厚圆石台面）
    var tableStoneMat = new THREE.MeshStandardMaterial({
      map: stoneTexture(),
      color: 0xdfddd6,
      roughness: 0.62,
      metalness: 0.04
    });
    snowCoverMats.push(tableStoneMat);
    applySnowAccumulation(tableStoneMat, 0.85);

    // 石桌底座
    addMesh(new THREE.CylinderGeometry(0.36, 0.42, 0.10, 20), tableStoneMat, 0, 0.85, 0, { parent: g, cast: true, receive: true });
    // 束腰雕花鼓腹立柱
    addMesh(new THREE.CylinderGeometry(0.22, 0.32, 0.36, 20), tableStoneMat, 0, 1.08, 0, { parent: g, cast: true });
    // 承托台面托首
    addMesh(new THREE.CylinderGeometry(0.38, 0.25, 0.10, 20), tableStoneMat, 0, 1.31, 0, { parent: g, cast: true });
    // 圆石桌面（标高 1.40m，台面高 1.44m）
    var tableTopMesh = addMesh(new THREE.CylinderGeometry(0.56, 0.56, 0.08, 36), tableStoneMat, 0, 1.40, 0, { parent: g, cast: true, receive: true });
    tableTopMesh.name = 'pavilionTableTop';

    // 2. 传统实木围棋盘（十九路标准棋盘，置于石桌中心）
    var woodBoardSideMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0xcca366, roughness: 0.65 });
    var weiqiFaceMat = new THREE.MeshStandardMaterial({ map: weiqiBoardTexture(), roughness: 0.55 });
    var boardMaterials = [
      woodBoardSideMat, // +X
      woodBoardSideMat, // -X
      weiqiFaceMat,     // +Y (棋盘顶面)
      woodBoardSideMat, // -Y
      woodBoardSideMat, // +Z
      woodBoardSideMat  // -Z
    ];
    var boardMesh = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.045, 0.44), boardMaterials);
    boardMesh.position.set(0, 1.44 + 0.045 / 2, 0);
    boardMesh.castShadow = true;
    boardMesh.receiveShadow = true;
    boardMesh.name = 'pavilionChessboard';
    g.add(boardMesh);

    // 3. 两个棋笥（黑子罐与白子罐，置于棋盘东西两侧，盒盖半启）
    var blackBowlMat = new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.22, metalness: 0.15 });
    var whiteBowlMat = new THREE.MeshStandardMaterial({ color: 0xf5f3ee, roughness: 0.25, metalness: 0.08 });
    // 黑子罐（东侧，local x: 0.30, z: 0.16）
    addMesh(new THREE.CylinderGeometry(0.065, 0.05, 0.075, 18), blackBowlMat, 0.30, 1.44 + 0.038, 0.16, { parent: g, cast: true });
    addMesh(new THREE.CylinderGeometry(0.068, 0.07, 0.016, 18), blackBowlMat, 0.38, 1.44 + 0.012, 0.12, { parent: g, rotX: 0.25, cast: true });
    // 白子罐（西侧，local x: -0.30, z: -0.16）
    addMesh(new THREE.CylinderGeometry(0.065, 0.05, 0.075, 18), whiteBowlMat, -0.30, 1.44 + 0.038, -0.16, { parent: g, cast: true });
    addMesh(new THREE.CylinderGeometry(0.068, 0.07, 0.016, 18), whiteBowlMat, -0.38, 1.44 + 0.012, -0.12, { parent: g, rotX: -0.25, cast: true });

    // 4. 云子棋子（棋局正酣，星位与角部定式中盘厮杀）
    var blackStoneMat = new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.14, metalness: 0.1 });
    var whiteStoneMat = new THREE.MeshStandardMaterial({ color: 0xf8f6f0, roughness: 0.20, metalness: 0.04 });
    var stoneGeo = new THREE.SphereGeometry(0.0094, 10, 6);
    stoneGeo.scale(1.0, 0.35, 1.0);

    var step3d = (0.44 * (436 / 512)) / 18; // 约 0.0208m
    var boardTopY = 1.44 + 0.045 + 0.0032;

    var blackPlacements = [
      [3, 3], [3, 4], [4, 3], [2, 5], [5, 2],
      [-3, 3], [-4, 3], [-3, 5], [-2, 6], [-5, 2],
      [-3, -3], [-4, -3], [-3, -5], [-5, -2],
      [3, -3], [4, -3], [3, -5], [5, -4],
      [0, 0], [1, 0], [-1, 1], [0, -1], [2, -1], [-2, 0]
    ];
    var whitePlacements = [
      [4, 4], [5, 3], [3, 5], [2, 4], [6, 4],
      [-4, 4], [-5, 3], [-3, 4], [-5, 5], [-4, 2],
      [-4, -4], [-5, -4], [-3, -4], [-4, -5],
      [4, -4], [5, -3], [4, -5], [3, -4],
      [0, 1], [-1, 0], [1, -1], [0, 2], [-1, -1], [1, 1]
    ];

    blackPlacements.forEach(function (pt) {
      var sm = new THREE.Mesh(stoneGeo, blackStoneMat);
      sm.position.set(pt[0] * step3d, boardTopY, pt[1] * step3d);
      g.add(sm);
    });
    whitePlacements.forEach(function (pt) {
      var sm = new THREE.Mesh(stoneGeo, whiteStoneMat);
      sm.position.set(pt[0] * step3d, boardTopY, pt[1] * step3d);
      g.add(sm);
    });

    // 5. 绣墩与丝缎坐垫（南北两相对席：石鼓绣墩，其上置大红锦缎厚坐垫，让人舒适入座）
    var stoolMat = new THREE.MeshStandardMaterial({
      map: woodTexture(),
      color: 0x422d20,
      roughness: 0.65
    });
    var cushionMat = new THREE.MeshStandardMaterial({
      color: 0xa32d2c, // 经典朱红锦缎
      roughness: 0.78
    });
    var goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37, // 金色滚边与鼓钉
      roughness: 0.35,
      metalness: 0.6
    });

    [-1, 1].forEach(function (dir) {
      var sz = dir * 0.85;
      var stoolG = new THREE.Group();
      stoolG.position.set(0, 0, sz);

      // 绣墩底座与鼓形腰腹
      addMesh(new THREE.CylinderGeometry(0.20, 0.23, 0.08, 20), stoolMat, 0, 0.84, 0, { parent: stoolG, cast: true, receive: true });
      addMesh(new THREE.CylinderGeometry(0.24, 0.20, 0.22, 20), stoolMat, 0, 0.98, 0, { parent: stoolG, cast: true });
      addMesh(new THREE.CylinderGeometry(0.21, 0.24, 0.06, 20), stoolMat, 0, 1.11, 0, { parent: stoolG, cast: true });

      // 金色鼓钉纹饰
      for (var d = 0; d < 12; d++) {
        var da = (d / 12) * Math.PI * 2;
        addMesh(new THREE.SphereGeometry(0.010, 6, 6), goldTrimMat,
          Math.cos(da) * 0.22, 1.11, Math.sin(da) * 0.22, { parent: stoolG });
        addMesh(new THREE.SphereGeometry(0.010, 6, 6), goldTrimMat,
          Math.cos(da) * 0.21, 0.86, Math.sin(da) * 0.21, { parent: stoolG });
      }

      // 柔软大红锦缎坐垫（厚实饱满，让人安心落座）
      var cMesh = addMesh(new THREE.CylinderGeometry(0.235, 0.245, 0.08, 24), cushionMat, 0, 1.17, 0, { parent: stoolG, cast: true });
      cMesh.name = (dir > 0) ? 'pavilionCushionSouth' : 'pavilionCushionNorth';
      // 坐垫金丝滚边
      var ringMesh = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.014, 8, 28), goldTrimMat);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.position.set(0, 1.17, 0);
      stoolG.add(ringMesh);

      g.add(stoolG);
    });

    g.position.set(8.5, WATER_Y, 8.5);
    scene.add(g);
  }`;

// Use regex with \r?\n
const pavilionEndRegex = /g\.position\.set\(8\.5,\s*WATER_Y,\s*8\.5\);\r?\n\s*scene\.add\(g\);\r?\n\s*\}/;
if (!pavilionEndRegex.test(code)) {
  console.error('pavilionEndRegex not matched');
  process.exit(1);
}
code = code.replace(pavilionEndRegex, tableAndCushionCode);

// 3. Update buildStoneLanterns: remove the 3 lanterns in water, keep 1 on pavilion platform edge
const spotsTargetRegex = /function\s+buildStoneLanterns\(\)\s*\{[\s\S]*?var\s+spots\s*=\s*\[[\s\S]*?\];/;
const newSpotsCode = `function buildStoneLanterns() {
    var spots = [
      // 1. 庭院与水岸石灯笼（湖滨观景点与引桥引道）
      [-21.5, 0.08, 5.2, 1.05],  // 小飞虹西桥堍古石径旁
      [23.6, 0.08, -3.2, 0.95],  // 涵青书斋月洞门步道旁
      [-9.8, 0.08, 13.5, 1.0],   // 西南岸曲廊外石径旁

      // 【荷风四面水亭石灯笼】：原水池中3座多余石灯均已移除（绝不在水中），仅留1座立于水亭西南石基边缘（标高1.14m，不设于水中）
      [6.1, 1.14, 11.0, 0.92],

      // 2. 【主屋四个角落石灯笼】：依柱座四角平地而设，烘托正殿庄重雅致
      [-15.0, 0.08, -2.2, 1.0],  // 主屋前西南角（近西侧登桥石阶）
      [15.0, 0.08, -2.2, 1.0],   // 主屋前东南角（近东侧水亭与书斋径）
      [-15.0, 0.08, -18.2, 1.0], // 主屋后西北角（近后院净房通道）
      [15.0, 0.08, -18.2, 1.0],  // 主屋后东北角（近东北竹林小憩石径）

      // 3. 【厕所门口石灯笼】：西北净院引道与房门
      [-31.0, 0.08, -23.2, 0.95], // 茅厕房门台阶东侧石坪（门前引路灯）
      [-30.4, 0.08, -17.4, 0.95]  // 茅厕四面合围南墙月洞门入口外（院门石灯）
    ];`;

if (!spotsTargetRegex.test(code)) {
  console.error('spotsTargetRegex not matched');
  process.exit(1);
}
code = code.replace(spotsTargetRegex, newSpotsCode);

// 4. Update getGroundHeight for Pavilion (elevated to 1.14m floor)
const groundHeightPavilionRegex = /\/\/\s*6\.\s*走廊至水亭横跨平桥[\s\S]*?\/\/\s*8\.\s*月洞门延伸石阶/;
const newGroundHeightCode = `// 6. 走廊至水亭横跨平桥（x: 0.8 ~ 5.2, z=8.5, 标高 0.65m 至 1.14m 丝滑微调衔接）
    if (x >= 0.8 && x <= 5.2 && Math.abs(z - 8.5) <= 1.4) {
      var bHeight = 0.65;
      if (x < 1.8) {
        var tCorr = (x - 0.8) / 1.0;
        bHeight = THREE.MathUtils.lerp(0.56, 0.65, THREE.MathUtils.smoothstep(tCorr, 0, 1));
      }
      if (x > 3.8) {
        var tPav = (x - 3.8) / 1.4;
        bHeight = THREE.MathUtils.lerp(0.65, 1.14, THREE.MathUtils.smoothstep(tPav, 0, 1));
      }
      if (Math.abs(z - 8.5) > 1.0) {
        var tBEdge = (Math.abs(z - 8.5) - 1.0) / 0.4;
        return THREE.MathUtils.lerp(bHeight, 0.34, THREE.MathUtils.smoothstep(tBEdge, 0, 1));
      }
      return bHeight;
    }

    // 7. 荷风四面水亭（中心 (8.5, 8.5)，半径 4.2m，地面标高 1.14m）
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) {
      return 1.14;
    }

    // 8. 月洞门延伸石阶`;

if (!groundHeightPavilionRegex.test(code)) {
  console.error('groundHeightPavilionRegex not matched');
  process.exit(1);
}
code = code.replace(groundHeightPavilionRegex, newGroundHeightCode);

// 5. Add sitting interaction variables and update updateWalkMode and bindRoamingControls
const walkModeTargetRegex = /function\s+updateWalkMode\(dt\)\s*\{/;
const sittingVarsAndWalkMode = `
  // ---------------- 荷风四面水亭 · 坐垫对弈交互系统 ----------------
  var isSitting = false;
  var sitEyeY = 1.14 + 0.38 + 0.60; // 2.12m 坐姿人眼标高
  var sitSouthPos = new THREE.Vector3(8.5, sitEyeY, 9.35); // 南坐席（面北朝向棋盘）
  var sitNorthPos = new THREE.Vector3(8.5, sitEyeY, 7.65); // 北坐席（面南朝向棋盘）
  var activeSitPos = sitSouthPos;

  function sitDown(seat) {
    if (viewMode !== 'walk') {
      switchViewMode('walk');
    }
    isSitting = true;
    activeSitPos = (seat === 'north') ? sitNorthPos : sitSouthPos;
    playerYaw = (seat === 'north') ? 0 : Math.PI; // 正对棋盘
    playerPitch = -0.36; // 俯角注视棋盘
    var promptEl = document.getElementById('pavilion-seat-prompt');
    var hudEl = document.getElementById('pavilion-sitting-hud');
    if (promptEl) promptEl.style.display = 'none';
    if (hudEl) hudEl.style.display = 'block';
  }

  function standUp() {
    if (!isSitting) return;
    isSitting = false;
    var hudEl = document.getElementById('pavilion-sitting-hud');
    if (hudEl) hudEl.style.display = 'none';
    playerPos.y = getGroundHeight(playerPos.x, playerPos.z) + 1.65;
  }

  window.sitDown = sitDown;
  window.standUp = standUp;
  window.isSitting = function () { return isSitting; };

  function updateWalkMode(dt) {
    var promptEl = document.getElementById('pavilion-seat-prompt');
    var hudEl = document.getElementById('pavilion-sitting-hud');
    var distToTable = Math.hypot(playerPos.x - 8.5, playerPos.z - 8.5);

    if (isSitting) {
      // 坐姿状态：平滑定位于坐垫上，允许自由环顾四周与注视棋盘
      var sitDamp = 1.0 - Math.exp(-12.0 * Math.min(dt, 0.05));
      playerPos.x = THREE.MathUtils.lerp(playerPos.x, activeSitPos.x, sitDamp);
      playerPos.y = THREE.MathUtils.lerp(playerPos.y, activeSitPos.y, sitDamp);
      playerPos.z = THREE.MathUtils.lerp(playerPos.z, activeSitPos.z, sitDamp);
      camera.position.copy(playerPos);

      var dirX = Math.sin(playerYaw) * Math.cos(playerPitch);
      var dirY = Math.sin(playerPitch);
      var dirZ = -Math.cos(playerYaw) * Math.cos(playerPitch);
      camera.lookAt(camera.position.x + dirX, camera.position.y + dirY, camera.position.z + dirZ);

      if (promptEl) promptEl.style.display = 'none';
      if (hudEl) hudEl.style.display = 'block';
      return;
    }

    // 未入座时：在亭内靠近石桌与坐垫（距离 < 2.3m）浮现提示
    if (promptEl) {
      if (viewMode === 'walk' && distToTable < 2.3) {
        promptEl.style.display = 'block';
      } else {
        promptEl.style.display = 'none';
      }
    }
    if (hudEl) hudEl.style.display = 'none';
`;

if (!walkModeTargetRegex.test(code)) {
  console.error('walkModeTargetRegex not matched');
  process.exit(1);
}
code = code.replace(walkModeTargetRegex, sittingVarsAndWalkMode);

// 6. In switchViewMode: standUp() if sitting
const switchModeRegex = /function\s+switchViewMode\(newMode\)\s*\{/;
const newSwitchModeCode = `function switchViewMode(newMode) {
    if (isSitting) {
      standUp();
    }`;
code = code.replace(switchModeRegex, newSwitchModeCode);

// 7. In bindRoamingControls: keydown handler for E to sit down and WASD/Space to stand up
const keydownTargetRegex = /if\s*\(viewMode\s*===\s*'walk'\)\s*\{\s*if\s*\(isW\)\s*\{/;
const newKeydownCode = `if (viewMode === 'walk') {
        if (isSitting) {
          if (isW || isS || isA || isD || code === 'Space' || key === ' ' || code === 'KeyE' || key === 'e' || code === 'Escape' || key === 'escape') {
            standUp();
            e.preventDefault();
            return;
          }
        } else {
          if (code === 'KeyE' || key === 'e') {
            var distToT = Math.hypot(playerPos.x - 8.5, playerPos.z - 8.5);
            if (distToT < 2.5) {
              sitDown(playerPos.z < 8.5 ? 'north' : 'south');
              e.preventDefault();
              return;
            }
          }
        }
        if (isW) {`;

if (!keydownTargetRegex.test(code)) {
  console.error('keydownTargetRegex not matched');
  process.exit(1);
}
code = code.replace(keydownTargetRegex, newKeydownCode);

// 8. Hook click events for seat prompt and stand up button
const bindControlsEndRegex = /if\s*\(btnWalk\)\s*btnWalk\.addEventListener\('click',\s*function\s*\(\)\s*\{\s*switchViewMode\('walk'\);\s*\}\);/;
const clickEventsCode = `if (btnWalk) btnWalk.addEventListener('click', function () { switchViewMode('walk'); });

    var promptEl = document.getElementById('pavilion-seat-prompt');
    if (promptEl) {
      promptEl.addEventListener('click', function (e) {
        e.stopPropagation();
        sitDown(playerPos.z < 8.5 ? 'north' : 'south');
      });
    }

    var btnStandUp = document.getElementById('btn-stand-up');
    if (btnStandUp) {
      btnStandUp.addEventListener('click', function (e) {
        e.stopPropagation();
        standUp();
      });
    }`;

if (!bindControlsEndRegex.test(code)) {
  console.error('bindControlsEndRegex not matched');
  process.exit(1);
}
code = code.replace(bindControlsEndRegex, clickEventsCode);

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js updated successfully');
