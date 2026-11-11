const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// =========================================================================
// 1. UPDATE TEXTURES: roofTexture, roofNormalTexture, plasterTexture, woodTexture, waterNormalTexture
// =========================================================================

const newTexturesCode = `
  /* ---------------- 3. 精致手绘/物理混合纹理生成系统 ---------------- */

  // 1. 瓦片屋顶纹理与法线贴图：连续筒瓦与板瓦瓦楞起伏，彻底告别方块堆砌
  function roofTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      // 黛瓦底色：深灰略带墨青
      ctx.fillStyle = '#2d3237';
      ctx.fillRect(0, 0, w, h);

      var flutes = 16; // 16 道纵向连续瓦垄
      var fluteW = w / flutes;

      for (var f = 0; f < flutes; f++) {
        var fx = f * fluteW;
        // 瓦垄高光与阴影渐变（模拟半圆筒瓦圆弧高光与板瓦凹槽深影）
        var grad = ctx.createLinearGradient(fx, 0, fx + fluteW, 0);
        grad.addColorStop(0.0, '#1c2024'); // 瓦槽深处阴影
        grad.addColorStop(0.18, '#2a3036');
        grad.addColorStop(0.50, '#4f575f'); // 瓦背中央圆弧高光
        grad.addColorStop(0.82, '#2a3036');
        grad.addColorStop(1.0, '#1a1e22'); // 邻接处交缝阴影
        ctx.fillStyle = grad;
        ctx.fillRect(fx, 0, fluteW, h);

        // 横向瓦片叠压接缝与滴水轮廓线（每隔 32px 一道叠瓦痕）
        ctx.fillStyle = 'rgba(15, 18, 20, 0.45)';
        for (var y = 0; y < h; y += 32) {
          ctx.fillRect(fx, y, fluteW, 2.5);
          // 瓦当微弱弧形小亮边
          ctx.fillStyle = 'rgba(110, 120, 130, 0.22)';
          ctx.fillRect(fx + 2, y + 2.5, fluteW - 4, 1.2);
          ctx.fillStyle = 'rgba(15, 18, 20, 0.45)';
        }
      }

      // 微弱青瓦矿物颗粒杂色
      speckle(ctx, w, h, 2500, '#586169', 0.15, 1.2);
      speckle(ctx, w, h, 1800, '#181b1e', 0.20, 1.4);
    }, 4, 4);
  }

  function roofNormalTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      var img = ctx.createImageData(w, h);
      var data = img.data;
      var flutes = 16;
      var fluteW = w / flutes;

      for (var y = 0; y < h; y++) {
        var tilePhase = Math.sin((y % 32) / 32 * Math.PI);
        for (var x = 0; x < w; x++) {
          var u = (x % fluteW) / fluteW;
          // 正弦半圆筒瓦横向法线微扰
          var nx = -Math.sin(u * Math.PI * 2.0) * 0.75;
          // 纵向叠瓦轻微坡度法线微扰
          var ny = -tilePhase * 0.25;
          var nz = Math.sqrt(Math.max(0.001, 1.0 - nx * nx - ny * ny));

          var idx = (y * w + x) * 4;
          data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
          data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
          data[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, 4, 4, false);
  }

  // 2. 白墙灰泥颗粒纹理：增加柔和糙度，避免死白与塑料感
  function plasterTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f6f3eb';
      ctx.fillRect(0, 0, w, h);
      // 细腻江南石灰糙面杂点与微风化斑
      speckle(ctx, w, h, 3500, '#ded8cb', 0.35, 1.4);
      speckle(ctx, w, h, 1600, '#ede8dc', 0.45, 1.6);
      speckle(ctx, w, h, 800, '#b8b09f', 0.14, 2.0);
      // 极轻微的微风化细丝
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = '#a8a090';
      ctx.lineWidth = 1.0;
      for (var i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, 0);
        ctx.lineTo(Math.random() * w, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, 4, 4);
  }

  // 3. 古建栗壳/红木柱细腻木纹与导管噪点贴图
  function woodTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#563c27'; // 醇厚栗壳色
      ctx.fillRect(0, 0, w, h);

      // 顺纹木纤维
      for (var y = 0; y < h; y += 2) {
        var alpha = 0.15 + Math.random() * 0.25;
        ctx.strokeStyle = (y % 6 === 0) ? 'rgba(54, 34, 18, ' + alpha + ')' : 'rgba(112, 80, 54, ' + (alpha * 0.7) + ')';
        ctx.lineWidth = 1.0 + Math.random() * 1.5;
        ctx.beginPath();
        var wave = Math.sin(y * 0.05) * 3;
        ctx.moveTo(0, y + wave);
        ctx.bezierCurveTo(w * 0.35, y + wave + (Math.random() * 4 - 2), w * 0.7, y + wave - (Math.random() * 4 - 2), w, y + wave);
        ctx.stroke();
      }

      // 木质导管与木眼微噪点（木纹噪点）
      speckle(ctx, w, h, 4000, '#362214', 0.28, 1.2);
      speckle(ctx, w, h, 2000, '#825c3c', 0.18, 1.4);
    }, 2, 4);
  }

  // 4. 水面动态法线纹理（高频微澜与开阔平波）
  function waterNormalTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      var img = ctx.createImageData(w, h);
      var data = img.data;
      for (var y = 0; y < h; y++) {
        var vy = y / h * Math.PI * 2;
        for (var x = 0; x < w; x++) {
          var vx = x / w * Math.PI * 2;
          // 双波叠加法线
          var nx = Math.sin(vx * 3.0 + vy * 1.5) * 0.5 + Math.cos(vx * 5.0 - vy * 3.0) * 0.35;
          var ny = Math.cos(vy * 3.0 + vx * 1.5) * 0.5 + Math.sin(vy * 4.0 - vx * 2.0) * 0.35;
          var nz = Math.sqrt(Math.max(0.01, 1.0 - (nx * nx + ny * ny) * 0.3));

          var idx = (y * w + x) * 4;
          data[idx] = Math.floor((nx * 0.4 + 0.5) * 255);
          data[idx + 1] = Math.floor((ny * 0.4 + 0.5) * 255);
          data[idx + 2] = Math.floor(nz * 255);
          data[idx + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    }, 1, 1, false);
  }
`;

// Replace plasterTexture, roofTexture, stoneTexture, woodTexture block
const texturesBlockRegex = /function\s+plasterTexture\(\)\s*\{[\s\S]*?function\s+boatCanopyTexture\(\)/;
const replacementTexturesBlock = newTexturesCode + '\n  function stoneTexture() {\n    return makeTexture(128, 128, function (ctx, w, h) {\n      ctx.fillStyle = "#9b9890";\n      ctx.fillRect(0, 0, w, h);\n      speckle(ctx, w, h, 1800, "#7c7971", 0.45, 1.5);\n      speckle(ctx, w, h, 900, "#b8b5ac", 0.35, 1.3);\n    }, 6, 6);\n  }\n\n  function boatCanopyTexture()';

if (!texturesBlockRegex.test(code)) {
  console.error('texturesBlockRegex not matched');
  process.exit(1);
}
code = code.replace(texturesBlockRegex, replacementTexturesBlock);

// =========================================================================
// 2. ROCKERY: createOrganicRockGeometry using IcosahedronGeometry(1.0, 2) + vertex displacement
// =========================================================================

const newRockGeometryCode = `function rockGeometry(seed) {
    // 采用细分度 2 的正二十面体（80 面平滑网格），消除生硬折角
    var geo = new THREE.IcosahedronGeometry(1.0, 2);
    var pos = geo.attributes.position;
    var rnd = makeRandom(seed || 42);
    var v = new THREE.Vector3();

    var freq1 = 2.2 + rnd() * 0.8;
    var freq2 = 3.6 + rnd() * 1.0;

    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var dir = v.clone().normalize();

      // 多阶三维噪声微扰：模拟太湖石经亿万年水流溶蚀的“透、漏、瘦、皱”自然圆润凹凸
      var d1 = Math.sin(v.x * freq1 + v.y * 2.1) * 0.20;
      var d2 = Math.cos(v.y * freq2 + v.z * 2.6) * 0.16;
      var d3 = Math.sin((v.x + v.z) * 3.4) * 0.10;
      // 太湖石空窍与凹坑特征
      var hollow = (Math.sin(v.y * 4.8 + v.x * 3.0) > 0.65) ? -0.18 : 0.0;

      var radius = 1.0 + d1 + d2 + d3 + hollow;
      // 底部平稳入土、上部峰峦起伏
      var yFactor = v.y > 0 ? (1.0 + v.y * 0.4) : (0.75 + v.y * 0.15);

      pos.setXYZ(i, dir.x * radius, dir.y * radius * yFactor, dir.z * radius);
    }

    geo.computeVertexNormals();
    return geo;
  }`;

const oldRockGeoRegex = /function\s+rockGeometry\(seed\)\s*\{[\s\S]*?geo\.computeVertexNormals\(\);\r?\n\s*return\s+geo;\r?\n\s*\}/;
if (!oldRockGeoRegex.test(code)) {
  console.error('oldRockGeoRegex not matched');
  process.exit(1);
}
code = code.replace(oldRockGeoRegex, newRockGeometryCode);

// Remove flatShading: true on rockMat in buildLionRockeries
code = code.replace(/flatShading:\s*true\s*,\s*color:\s*0x86847e/, 'color: 0x86847e, roughness: 0.82');
code = code.replace(/color:\s*0x86847e,\s*roughness:\s*0\.94,\s*flatShading:\s*true/, 'color: 0x86847e, roughness: 0.82');

// =========================================================================
// 3. VEGETATION: BLOSSOM TREE FLUFFY CANOPY & BAMBOO TILT / LEAF CLUSTERS
// =========================================================================

const newBlossomTreeCode = `function buildBlossomTree(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x3d2b1f, roughness: 0.86 });
    // 三色渐变桃花水彩材质：柔粉、明粉与深红内影，平滑法线、告别多面体硬球
    var flowerPink = new THREE.MeshStandardMaterial({ color: 0xf8a8bc, roughness: 0.72 });
    var flowerLight = new THREE.MeshStandardMaterial({ color: 0xffccd7, roughness: 0.68 });
    var flowerDeep = new THREE.MeshStandardMaterial({ color: 0xde6382, roughness: 0.78 });
    scale = scale || 1;

    // 苍劲主干与自然曲折分枝
    addMesh(new THREE.CylinderGeometry(0.24, 0.44, 4.0, 8), bark, 0, 2.0, 0,
      { parent: g, rotZ: 0.22, cast: true });
    addMesh(new THREE.CylinderGeometry(0.15, 0.24, 2.8, 6), bark, 0.8, 3.8, 0.4,
      { parent: g, rotZ: 0.55, rotX: -0.3, cast: true });
    addMesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 6), bark, -0.7, 3.6, -0.3,
      { parent: g, rotZ: -0.45, rotX: 0.3, cast: true });

    // 吉卜力云朵状柔和树冠：由 22 团大小交织、平滑相扣的小圆球簇融合成蓬松花海
    var blossomSpheres = [
      // 树冠核心层
      [0.2, 5.2, 0.1, 1.45, flowerPink],
      [-0.6, 5.5, 0.3, 1.35, flowerLight],
      [0.8, 5.4, -0.3, 1.30, flowerDeep],
      [0.0, 6.2, 0.0, 1.25, flowerLight],
      // 外延飘逸花簇
      [1.7, 4.6, 0.5, 1.15, flowerPink],
      [2.2, 4.3, 0.8, 0.85, flowerLight],
      [-1.6, 4.4, -0.5, 1.10, flowerDeep],
      [-2.1, 4.1, -0.8, 0.82, flowerPink],
      [0.4, 4.8, 1.6, 1.05, flowerLight],
      [-0.4, 4.9, -1.5, 1.00, flowerDeep],
      [1.3, 5.9, -0.6, 1.10, flowerPink],
      [-1.1, 5.8, 0.7, 1.08, flowerLight],
      [0.1, 6.7, -0.2, 0.95, flowerLight],
      // 下垂边缘小花团
      [1.9, 3.8, 0.3, 0.75, flowerPink],
      [-1.8, 3.7, 0.2, 0.72, flowerPink],
      [0.2, 4.1, 1.8, 0.68, flowerLight],
      [-0.2, 4.2, -1.7, 0.70, flowerDeep],
      [1.2, 4.0, -1.4, 0.72, flowerPink],
      [-1.3, 4.0, 1.3, 0.70, flowerLight],
      [0.9, 6.5, 0.5, 0.78, flowerLight],
      [-0.8, 6.4, -0.4, 0.75, flowerPink],
      [0.0, 7.1, 0.1, 0.65, flowerLight]
    ];

    var sphereGeo = new THREE.SphereGeometry(1.0, 14, 10);
    blossomSpheres.forEach(function (f) {
      var bm = new THREE.Mesh(sphereGeo, f[4]);
      bm.position.set(f[0], f[1], f[2]);
      bm.scale.set(f[3], f[3] * 0.85, f[3]);
      bm.castShadow = true;
      bm.receiveShadow = true;
      g.add(bm);
    });

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
  }`;

const oldBlossomTreeRegex = /function\s+buildBlossomTree\(x,\s*y,\s*z,\s*scale\)\s*\{[\s\S]*?scene\.add\(g\);\r?\n\s*\}/;
if (!oldBlossomTreeRegex.test(code)) {
  console.error('oldBlossomTreeRegex not matched');
  process.exit(1);
}
code = code.replace(oldBlossomTreeRegex, newBlossomTreeCode);

// Update Bamboo Groves: natural tilt, segmented stalks and multi-tier branching leaf clusters
const newBambooCode = `function buildBambooGroves() {
    var stemMat = new THREE.MeshStandardMaterial({
      color: 0x5b8a45, roughness: 0.55
    });
    var leafMat = new THREE.MeshStandardMaterial({
      color: 0x527a38, roughness: 0.72, side: THREE.DoubleSide
    });

    function applyWindToBambooMat(mat, isLeaf) {
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uWindTime = windShaderUniforms.uTime;
        shader.uniforms.uWindStrength = windShaderUniforms.uWindStrength;
        shader.vertexShader = 'uniform float uWindTime;\\nuniform float uWindStrength;\\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\\n' +
          '  float hFactor = ' + (isLeaf ? '1.0' : 'clamp((transformed.y + 4.1) / 8.2, 0.0, 1.0)') + ';\\n' +
          '  float sway = sin(uWindTime * 2.4 + transformed.x * 0.4 + transformed.z * 0.3) * 0.38;\\n' +
          '  transformed.x += sway * hFactor * hFactor * uWindStrength;\\n' +
          '  transformed.z += sway * 0.6 * hFactor * hFactor * uWindStrength;\\n'
        );
      };
    }
    applyWindToBambooMat(stemMat, false);
    applyWindToBambooMat(leafMat, true);

    var groves = [
      { x: -32, z: 0, r: 3.2, n: isMobile ? 35 : 70, seed: 43 },
      { x: 33, z: -16, r: 3.0, n: isMobile ? 30 : 60, seed: 49 },
      { x: 0, z: -55, r: 12.0, n: isMobile ? 35 : 70, seed: 55 },
      { x: -75, z: -55, r: 24, n: isMobile ? 30 : 65, seed: 61 },
      { x: 80, z: -60, r: 24, n: isMobile ? 30 : 65, seed: 67 }
    ];

    var total = 0;
    groves.forEach(function (g) { total += g.n; });

    // 单竿几何体（细致8边圆柱）与4层分枝簇状竹叶
    var stemGeo = new THREE.CylinderGeometry(0.06, 0.11, 8.4, 8);
    var leafClusterGeo = new THREE.ConeGeometry(0.85, 0.28, 4);
    leafClusterGeo.rotateX(Math.PI / 2);

    var stems = new THREE.InstancedMesh(stemGeo, stemMat, total);
    var leaves = new THREE.InstancedMesh(leafClusterGeo, leafMat, total * 4);

    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var p = new THREE.Vector3();
    var s = new THREE.Vector3();

    var sIdx = 0;
    var lIdx = 0;

    groves.forEach(function (g) {
      var rnd = makeRandom(g.seed);
      for (var i = 0; i < g.n; i++) {
        var a = rnd() * Math.PI * 2;
        var r = Math.sqrt(rnd()) * g.r;
        var bx = g.x + Math.cos(a) * r;
        var bz = g.z + Math.sin(a) * r;

        // 随机轻微自然倾斜（竹竿向光与随风自然侧倾）
        var tiltX = (rnd() - 0.5) * 0.18;
        var tiltZ = (rnd() - 0.5) * 0.22;
        var sc = 0.88 + rnd() * 0.42;

        p.set(bx, 4.2 * sc, bz);
        q.setFromEuler(new THREE.Euler(tiltX, rnd() * Math.PI, tiltZ));
        s.set(sc, sc, sc);
        m.compose(p, q, s);
        stems.setMatrixAt(sIdx, m);
        sIdx++;

        // 竿身4层高低错落扇状竹叶簇
        var leafHeights = [4.8, 6.0, 7.1, 8.2];
        for (var lh = 0; lh < 4; lh++) {
          var curH = leafHeights[lh] * sc;
          var lx = bx + Math.sin(tiltX) * curH * 0.35;
          var lz = bz + Math.sin(tiltZ) * curH * 0.35;
          p.set(lx, curH, lz);
          q.setFromEuler(new THREE.Euler(
            tiltX + (rnd() - 0.5) * 0.35,
            rnd() * Math.PI * 2,
            tiltZ + (rnd() - 0.5) * 0.35
          ));
          var lScale = (1.1 - lh * 0.15) * sc;
          s.set(lScale, lScale * 0.5, lScale);
          m.compose(p, q, s);
          leaves.setMatrixAt(lIdx, m);
          lIdx++;
        }
      }
    });

    stems.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    stems.castShadow = !isMobile;
    leaves.castShadow = !isMobile;
    leaves.receiveShadow = true;
    scene.add(stems);
    scene.add(leaves);
  }`;

const oldBambooRegex = /function\s+buildBambooGroves\(\)\s*\{[\s\S]*?scene\.add\(leaves\);\r?\n\s*\}/;
if (!oldBambooRegex.test(code)) {
  console.error('oldBambooRegex not matched');
  process.exit(1);
}
code = code.replace(oldBambooRegex, newBambooCode);

// =========================================================================
// 4. ROOF MATERIALS: Lower roughness (0.44), add normalMap and metalness 0.12
// =========================================================================

// Replace roofMat initialization across the file to include normalMap and moist glossy roughness 0.44
code = code.replace(/map:\s*roofTexture\(\),\s*color:\s*COL\.roof,\s*roughness:\s*0\.78/g,
  'map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x363c42, roughness: 0.44, metalness: 0.12');

code = code.replace(/map:\s*roofTexture\(\),\s*color:\s*COL\.roof,\s*roughness:\s*0\.8/g,
  'map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x363c42, roughness: 0.44, metalness: 0.12');

// Plaster wall roughness set to 0.90
code = code.replace(/map:\s*plasterTexture\(\),\s*color:\s*COL\.plaster,\s*roughness:\s*0\.88/g,
  'map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01');
code = code.replace(/map:\s*plasterTexture\(\),\s*color:\s*COL\.plaster,\s*roughness:\s*0\.9/g,
  'map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01');

// Wood material roughness 0.70 with fine wood texture
code = code.replace(/map:\s*woodTexture\(\),\s*color:\s*COL\.woodDark,\s*roughness:\s*0\.8/g,
  'map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.04');
code = code.replace(/map:\s*woodTexture\(\),\s*color:\s*COL\.woodDark,\s*roughness:\s*0\.82/g,
  'map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.04');

// =========================================================================
// 5. WATER SHADER & PLANAR REFLECTION
// =========================================================================

const waterReflectionInitCode = `
  /* ---------------- 16.9 水面动态倒影与水波着色器系统 ---------------- */
  var waterMirrorCam = null;
  var waterReflectTarget = null;
  var waterNormalTex = null;

  function initWaterReflector() {
    if (!renderer) return;
    if (waterReflectTarget) waterReflectTarget.dispose();

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var rw = Math.floor(512 * dpr);
    var rh = Math.floor(512 * dpr);

    waterReflectTarget = new THREE.WebGLRenderTarget(rw, rh, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    });

    waterMirrorCam = new THREE.PerspectiveCamera(50, 1, 0.1, 800);
    waterNormalTex = waterNormalTexture();
  }

  function updateWaterReflection() {
    if (!renderer || !waterMirrorCam || !waterReflectTarget || isMobile) return;
    if (!water || !camera) return;

    // 镜像相机位姿（关于水面标高 WATER_Y = 0.34 镜像对称）
    var waterPlaneY = WATER_Y;
    waterMirrorCam.position.copy(camera.position);
    waterMirrorCam.position.y = 2.0 * waterPlaneY - camera.position.y;

    // 计算观察目标点镜像
    var camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    var targetDist = 20.0;
    var lookTarget = camera.position.clone().add(camDir.multiplyScalar(targetDist));
    lookTarget.y = 2.0 * waterPlaneY - lookTarget.y;

    waterMirrorCam.up.set(0, 1, 0);
    waterMirrorCam.lookAt(lookTarget);
    waterMirrorCam.fov = camera.fov;
    waterMirrorCam.aspect = camera.aspect;
    waterMirrorCam.near = camera.near;
    waterMirrorCam.far = camera.far;
    waterMirrorCam.updateProjectionMatrix();

    // 临时隐藏水面与下雪粒子，渲染镜面倒影纹理
    water.visible = false;
    if (streamWater) streamWater.visible = false;
    if (eastStreamWater) eastStreamWater.visible = false;

    renderer.setRenderTarget(waterReflectTarget);
    renderer.render(scene, waterMirrorCam);
    renderer.setRenderTarget(null);

    water.visible = true;
    if (streamWater) streamWater.visible = true;
    if (eastStreamWater) eastStreamWater.visible = true;
  }
`;

// Insert waterReflectionInitCode before createRenderer
code = code.replace('function createRenderer()', waterReflectionInitCode + '\n  function createRenderer()');

// Update buildWater to hook up planar reflection & dynamic normal map
const oldWaterMatShaderRegex = /waterMat\.onBeforeCompile\s*=\s*function\s*\(shader\)\s*\{[\s\S]*?waterGeo\.computeVertexNormals\(\);/m;
const newWaterMatShader = `waterMat.normalMap = waterNormalTexture();
    waterMat.normalScale = new THREE.Vector2(0.65, 0.65);
    waterMat.roughness = 0.04;
    waterMat.metalness = 0.88;

    waterMat.onBeforeCompile = function (shader) {
      shader.uniforms.uWaterTime = waterShaderUniforms.uTime;
      shader.uniforms.uReflectTexture = { value: waterReflectTarget ? waterReflectTarget.texture : null };
      shader.uniforms.uWaterNormal = { value: waterNormalTexture() };
      shader.uniforms.uRainRipple = waterShaderUniforms.uRainAmount;
      shader.uniforms.uSnowAmount = snowShaderUniform.uSnowAmount;

      shader.vertexShader = 'varying vec3 vGardenWorldPos;\\nvarying vec4 vClipPos;\\n' + shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\\n  vGardenWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;\\n  vClipPos = gl_Position;'
      );

      shader.fragmentShader = 'uniform float uWaterTime;\\nuniform sampler2D uReflectTexture;\\nuniform sampler2D uWaterNormal;\\nuniform float uRainRipple;\\nuniform float uSnowAmount;\\nvarying vec3 vGardenWorldPos;\\nvarying vec4 vClipPos;\\n' +
        shader.fragmentShader.replace(
          '#include <map_fragment>',
          '#include <map_fragment>\\n' +
          '  // 屏幕投影坐标与动态水纹法线扰动\\n' +
          '  vec2 ndc = (vClipPos.xy / vClipPos.w) * 0.5 + 0.5;\\n' +
          '  vec2 waveUv1 = vGardenWorldPos.xz * 0.05 + vec2(uWaterTime * 0.02, uWaterTime * 0.015);\\n' +
          '  vec2 waveUv2 = vGardenWorldPos.zx * 0.035 - vec2(uWaterTime * 0.014, uWaterTime * 0.02);\\n' +
          '  vec2 n1 = texture2D(uWaterNormal, waveUv1).rg * 2.0 - 1.0;\\n' +
          '  vec2 n2 = texture2D(uWaterNormal, waveUv2).rg * 2.0 - 1.0;\\n' +
          '  vec2 waveDistort = (n1 + n2) * 0.022;\\n' +
          '  vec2 reflectUv = clamp(vec2(1.0 - ndc.x, ndc.y) + waveDistort, 0.001, 0.999);\\n' +
          '  vec3 reflectedScene = texture2D(uReflectTexture, reflectUv).rgb;\\n' +
          '  // 菲涅尔反射率：侧看亭子与天际倒影极其明晰，俯视则透现碧水游鱼\\n' +
          '  vec3 viewD = normalize(vViewPosition);\\n' +
          '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 3.0), 0.35, 0.95);\\n' +
          '  vec3 deepWaterCol = vec3(0.18, 0.36, 0.40);\\n' +
          '  diffuseColor.rgb = mix(deepWaterCol, reflectedScene * 1.15, fresnel);\\n'
        );
    };`;

code = code.replace(oldWaterMatShaderRegex, newWaterMatShader);

// Update frame() to call updateWaterReflection()
code = code.replace('updateTween(now);', 'updateTween(now);\n    updateWaterReflection();');

// Update boot() to call initWaterReflector()
code = code.replace('initSSAO(', 'initWaterReflector();\n    initSSAO(');

// =========================================================================
// 6. ENVIRONMENTAL DETAILS: Moss, Pebbles, and Fallen Blossom Petals
// =========================================================================

const envDetailsCode = `
  /* ---------------- 13.5 环境细节系统（池岸青苔、散落卵石与飘零花瓣） ---------------- */

  function buildEnvironmentalDetails() {
    var detailsGroup = new THREE.Group();

    // 1. 池岸水线与石基青苔（湿润墨绿苍苔）
    var mossMat = new THREE.MeshStandardMaterial({
      color: 0x486c38,
      roughness: 0.94,
      metalness: 0.02
    });

    var mossSpots = [
      // 荷风水亭石基边缘青苔
      [5.5, 0.36, 7.2, 1.8, 0.12, 0.8],
      [5.8, 0.36, 10.2, 1.6, 0.12, 0.9],
      [11.5, 0.36, 8.5, 1.5, 0.12, 1.0],
      // 直廊入水石桥墩与石阶青苔
      [1.8, 0.36, 8.5, 0.8, 0.10, 1.4],
      [3.8, 0.36, 8.5, 0.8, 0.10, 1.4],
      // 临水石码头与石岸青苔
      [-10.2, 0.36, 13.8, 2.2, 0.10, 0.9],
      [-13.5, 0.36, 15.2, 2.0, 0.10, 0.8],
      [-14.0, 0.36, 2.0, 2.4, 0.10, 0.7]
    ];
    mossSpots.forEach(function (ms) {
      addMesh(new THREE.BoxGeometry(ms[3], ms[4], ms[5]), mossMat, ms[0], ms[1], ms[2], { parent: detailsGroup, receive: true });
    });

    // 2. 散落池畔的圆润扁平卵石（不同大小高低错落、天然鹅卵石色泽）
    var pebbleMat1 = new THREE.MeshStandardMaterial({ color: 0x767879, roughness: 0.72 });
    var pebbleMat2 = new THREE.MeshStandardMaterial({ color: 0x585a5b, roughness: 0.68 });
    var pebbleMat3 = new THREE.MeshStandardMaterial({ color: 0x8a7f72, roughness: 0.75 });
    var pebbleMats = [pebbleMat1, pebbleMat2, pebbleMat3];

    var pebbleGeo = new THREE.SphereGeometry(1.0, 8, 6);
    var rndPebble = makeRandom(88);

    // 沿水岸、码头石阶边缘与假山脚散落50颗卵石
    for (var p = 0; p < 50; p++) {
      var px, pz, py;
      var zone = p % 4;
      if (zone === 0) {
        // 西南石径与水岸边
        px = -11.0 + (rndPebble() - 0.5) * 4.0;
        pz = 14.5 + (rndPebble() - 0.5) * 3.0;
        py = 0.38;
      } else if (zone === 1) {
        // 小飞虹西引桥畔石汀步周遭
        px = -21.0 + (rndPebble() - 0.5) * 3.5;
        pz = 6.0 + (rndPebble() - 0.5) * 4.0;
        py = 0.38;
      } else if (zone === 2) {
        // 水亭北侧九曲平桥石岸
        px = 8.8 + (rndPebble() - 0.5) * 2.5;
        pz = 3.5 + (rndPebble() - 0.5) * 2.0;
        py = 0.38;
      } else {
        // 假山石脚与竹林入口泥地
        px = -8.0 + (rndPebble() - 0.5) * 8.0;
        pz = -22.0 + (rndPebble() - 0.5) * 4.0;
        py = 0.12;
      }

      var pScale = 0.12 + rndPebble() * 0.18;
      var pm = new THREE.Mesh(pebbleGeo, pebbleMats[p % 3]);
      pm.position.set(px, py + pScale * 0.25, pz);
      pm.scale.set(pScale, pScale * 0.45, pScale * (0.8 + rndPebble() * 0.4));
      pm.rotation.set(rndPebble() * 0.2, rndPebble() * Math.PI, rndPebble() * 0.2);
      pm.castShadow = true;
      pm.receiveShadow = true;
      detailsGroup.add(pm);
    }

    // 3. 散落石板路、水榭平台与池畔水面的飘落粉红花瓣（江南落樱落桃诗意）
    var petalMat = new THREE.MeshStandardMaterial({
      color: 0xf8a8bc,
      roughness: 0.65,
      side: THREE.DoubleSide
    });
    var petalGeo = new THREE.CircleGeometry(0.065, 5);
    petalGeo.rotateX(Math.PI / 2);

    var rndPetal = makeRandom(99);
    for (var fl = 0; fl < 65; fl++) {
      var fx, fz, fy;
      var fZone = fl % 3;
      if (fZone === 0) {
        // 飘落在水亭石阶与木槛周围
        fx = 8.5 + (rndPetal() - 0.5) * 4.0;
        fz = 8.5 + (rndPetal() - 0.5) * 4.0;
        fy = 1.15;
      } else if (fZone === 1) {
        // 飘落在直廊桥面与石栏杆旁
        fx = 3.0 + (rndPetal() - 0.5) * 3.0;
        fz = 8.5 + (rndPetal() - 0.5) * 1.4;
        fy = 0.74;
      } else {
        // 飘落在桃花树下石岸与池畔水面上
        fx = 12.0 + (rndPetal() - 0.5) * 6.0;
        fz = 12.0 + (rndPetal() - 0.5) * 6.0;
        fy = 0.36; // 轻浮于微澜水面之上
      }

      var pMesh = new THREE.Mesh(petalGeo, petalMat);
      pMesh.position.set(fx, fy + 0.005, fz);
      pMesh.rotation.set((rndPetal() - 0.5) * 0.3, rndPetal() * Math.PI * 2, (rndPetal() - 0.5) * 0.3);
      var scP = 0.8 + rndPetal() * 0.6;
      pMesh.scale.set(scP, scP, scP);
      pMesh.receiveShadow = true;
      detailsGroup.add(pMesh);
    }

    scene.add(detailsGroup);
  }
`;

// Insert buildEnvironmentalDetails before function buildVegetation()
code = code.replace('function buildVegetation() {', envDetailsCode + '\n  function buildVegetation() {');

// Call buildEnvironmentalDetails() in STEPS (step 7)
code = code.replace('buildVegetation(); buildPath();', 'buildVegetation(); buildPath(); buildEnvironmentalDetails();');

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js refinement script finished successfully!');
