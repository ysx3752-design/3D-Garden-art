const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// =========================================================================
// 1. Procedural Courtyard Brick Paver Texture
// =========================================================================
const textureMarker = 'function grassTexture() {';
const paverTextureCode = `function courtyardBrickTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#4c4a46';
      ctx.fillRect(0, 0, w, h);

      var brickW = 64;
      var brickH = 32;
      var rows = h / brickH;
      var cols = w / brickW;

      for (var r = 0; r < rows; r++) {
        var rowOffset = (r % 2 === 0) ? 0 : (brickW / 2);
        for (var c = -1; c <= cols; c++) {
          var bx = c * brickW + rowOffset;
          var by = r * brickH;

          // Individual brick shade variation
          var randVal = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
          var noise = (randVal - Math.floor(randVal)) - 0.5;
          var shade = Math.floor(76 + noise * 22);
          ctx.fillStyle = 'rgb(' + shade + ',' + (shade - 2) + ',' + (shade - 5) + ')';
          ctx.fillRect(bx + 1.5, by + 1.5, brickW - 3, brickH - 3);

          // Subtle brick bevel highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
          ctx.fillRect(bx + 1.5, by + 1.5, brickW - 3, 1.2);
          ctx.fillRect(bx + 1.5, by + 1.5, 1.2, brickH - 3);

          // Brick bottom shadow
          ctx.fillStyle = 'rgba(15, 14, 13, 0.35)';
          ctx.fillRect(bx + 1.5, by + brickH - 2.5, brickW - 3, 1.0);
        }
      }

      // Mortar joint grid lines
      ctx.fillStyle = '#262422';
      for (var y = 0; y <= h; y += brickH) {
        ctx.fillRect(0, y - 1, w, 2);
      }
      for (var r2 = 0; r2 < rows; r2++) {
        var rOffset = (r2 % 2 === 0) ? 0 : (brickW / 2);
        for (var x = rOffset; x <= w + brickW; x += brickW) {
          ctx.fillRect(x - 1, r2 * brickH, 2, brickH);
        }
      }

      speckle(ctx, w, h, 3500, '#1f1e1c', 0.35, 1.3);
      speckle(ctx, w, h, 2000, '#88847d', 0.25, 1.2);
    }, 12, 12);
  }

  `;

code = code.replace(textureMarker, paverTextureCode + textureMarker);

// Update stoneTexture and plinthStoneMat to use brick paver texture
code = code.replace(
  `var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.90 });`,
  `var stoneMat = new THREE.MeshStandardMaterial({ map: courtyardBrickTexture(), color: 0x8a877e, roughness: 0.88 });`
);
code = code.replace(
  `var plinthStoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.88 });`,
  `var plinthStoneMat = new THREE.MeshStandardMaterial({ map: courtyardBrickTexture(), color: 0x828078, roughness: 0.86 });`
);

// =========================================================================
// 2. Remove Flying Saucer Grass & Outer Cone Trees
// =========================================================================
// Remove the 5 circular lawns in buildGround
const oldCircLawns = `    // 3. 周边平缓微起伏微地形（保持平地舒展原则，仅做两三处极低扁平绿毯衬托，高差不过 0.05m，南侧与东侧视野绝无任何隆起地形
    [[-32, 30, 9], [32, 30, 9], [0, 27, 6], [-50, 6, 10], [50, 6, 10]].forEach(function (lawn) {
      addMesh(new THREE.CircleGeometry(lawn[2], 12), grassMat,
        lawn[0], 0.03, lawn[1], { rotX: -Math.PI / 2, receive: true });
      addMesh(new THREE.CircleGeometry(lawn[2] * 0.42, 10), mossMat,
        lawn[0] + 1.6, 0.05, lawn[1] - 1.2, { rotX: -Math.PI / 2, receive: true });
    });`;

const newCircLawns = `    // 外围飞碟状草地已完全移除，保持主体建筑纯粹裸露`;
code = code.replace(oldCircLawns, newCircLawns);

// Remove outer pines and outer willows outside walls
const oldVegPines = `    // 苍劲罗汉松与黑松：聚集成团、错落生姿，彻底打破整齐排列
    // 西北角古松聚落（三株合抱，高低偃仰）
    buildPine(-33, 0.08, -37, 1.45, 0.14);
    buildPine(-36.5, 0.08, -39.5, 1.15, -0.10);
    buildPine(-30.5, 0.08, -40.5, 0.95, 0.22);

    // 东北角盘松群落（双株依偎）
    buildPine(32.5, 0.08, -37, 1.35, -0.12);
    buildPine(35.5, 0.08, -40, 1.05, 0.16);

    // 后园庭院苍松组团
    buildPine(8.5, 0.08, -24.5, 1.3, 0.08);
    buildPine(12.5, 0.08, -26.5, 0.95, -0.15);
    buildPine(-14.5, 0.08, -26.5, 1.25, 0.10);
    buildPine(-21.0, 0.08, -21.0, 1.2, 0.08);`;

// Outer cone pines removed! Keep only small courtyards' natural accent trees if desired, or completely remove triangle cone trees
const newVegPines = `    // 剔除外墙遮挡建筑的三角锥松树，让主体院墙与大门完全暴露展现`;
code = code.replace(oldVegPines, newVegPines);

// Remove outer willows along south wall outside
code = code.replace(
  `buildWillow(28, 0.08, 26, 1.3);       // 南院墙外旷地\n    buildWillow(-28, 0.08, 26, 1.3);      // 南院墙外旷地\n    buildWillow(-14, 0.08, 29, 1.3);      // 正门外西侧旷地（让开中轴门景）\n    buildWillow(14, 0.08, 29, 1.3);       // 正门外东侧旷地（让开中轴门景）`,
  `// 外围树木已移除，正面主体大门楼与四面院墙完全暴露`
);

// Update diorama pedestal: replace outer green slope with unified deep dark grey slate / earth stone
code = code.replace(
  `var northSlope = new THREE.Mesh(new THREE.PlaneGeometry(74, 16), new THREE.MeshStandardMaterial({\n      map: grassTexture(),\n      color: 0x7aa056,\n      roughness: 0.90\n    }));`,
  `var northSlope = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, 16), new THREE.MeshStandardMaterial({\n      map: courtyardBrickTexture(),\n      color: 0x3a3c40,\n      roughness: 0.88\n    }));`
);

code = code.replace(
  `southPlaza.position.set(CX, 0.02, 28);`,
  `southPlaza.material = new THREE.MeshStandardMaterial({ map: courtyardBrickTexture(), color: 0x3e4045, roughness: 0.86 });\n    southPlaza.position.set(CX, 0.02, 28);`
);

// =========================================================================
// 3. Blossom Tree: Warm Golden/Amber Autumn Tone & Compact Scale
// =========================================================================
const oldBlossomTreeDef = `function buildBlossomTree(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x3d2b1f, roughness: 0.86 });
    var flowerPink = new THREE.MeshStandardMaterial({ color: 0xf8a8bc, roughness: 0.72 });
    var flowerLight = new THREE.MeshStandardMaterial({ color: 0xffccd7, roughness: 0.68 });
    var flowerDeep = new THREE.MeshStandardMaterial({ color: 0xde6382, roughness: 0.78 });
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.24, 0.44, 4.0, 8), bark, 0, 2.0, 0,
      { parent: g, rotZ: 0.22, cast: true });
    addMesh(new THREE.CylinderGeometry(0.15, 0.24, 2.8, 6), bark, 0.8, 3.8, 0.4,
      { parent: g, rotZ: 0.55, rotX: -0.3, cast: true });
    addMesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 6), bark, -0.7, 3.6, -0.3,
      { parent: g, rotZ: -0.45, rotX: 0.3, cast: true });

    var blossomSpheres = [
      [0.2, 5.2, 0.1, 1.45, flowerPink],
      [-0.6, 5.5, 0.3, 1.35, flowerLight],
      [0.8, 5.4, -0.3, 1.30, flowerDeep],
      [0.0, 6.2, 0.0, 1.25, flowerLight],
      [1.7, 4.6, 0.5, 1.15, flowerPink],
      [2.2, 4.3, 0.8, 0.85, flowerLight],
      [-1.6, 4.4, -0.5, 1.10, flowerDeep],
      [-2.1, 4.1, -0.8, 0.82, flowerPink],
      [0.4, 4.8, 1.6, 1.05, flowerLight],
      [-0.4, 4.9, -1.5, 1.00, flowerDeep],
      [1.3, 5.9, -0.6, 1.10, flowerPink],
      [-1.1, 5.8, 0.7, 1.08, flowerLight],
      [0.1, 6.7, -0.2, 0.95, flowerLight],
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

const newBlossomTreeDef = `function buildBlossomTree(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x3d2b1f, roughness: 0.86 });
    // 雅致金秋金桂与银杏暖黄配色（彻底告别粉色棉花糖质感）
    var leafGold = new THREE.MeshStandardMaterial({ color: 0xdca226, roughness: 0.68 });
    var leafAmber = new THREE.MeshStandardMaterial({ color: 0xf0be3e, roughness: 0.64 });
    var leafDeep = new THREE.MeshStandardMaterial({ color: 0xb57b18, roughness: 0.74 });

    // 大幅缩小体积（缩紧 40%），作为庭院精致点缀，绝不抢占主建筑风头
    var finalScale = (scale || 1) * 0.62;

    addMesh(new THREE.CylinderGeometry(0.18, 0.32, 3.2, 7), bark, 0, 1.6, 0,
      { parent: g, rotZ: 0.18, cast: true });
    addMesh(new THREE.CylinderGeometry(0.12, 0.18, 2.0, 6), bark, 0.5, 2.8, 0.3,
      { parent: g, rotZ: 0.45, rotX: -0.25, cast: true });
    addMesh(new THREE.CylinderGeometry(0.10, 0.16, 1.8, 6), bark, -0.5, 2.6, -0.2,
      { parent: g, rotZ: -0.40, rotX: 0.25, cast: true });

    var crownSpheres = [
      [0.1, 3.8, 0.1, 0.82, leafGold],
      [-0.4, 4.0, 0.2, 0.75, leafAmber],
      [0.5, 3.9, -0.2, 0.72, leafDeep],
      [0.0, 4.4, 0.0, 0.68, leafAmber],
      [1.1, 3.3, 0.3, 0.60, leafGold],
      [-1.0, 3.2, -0.3, 0.58, leafDeep],
      [0.3, 3.5, 1.0, 0.54, leafAmber],
      [-0.3, 3.5, -0.9, 0.52, leafDeep],
      [0.8, 4.5, -0.3, 0.56, leafGold],
      [-0.7, 4.4, 0.4, 0.55, leafAmber],
      [0.0, 4.9, 0.0, 0.46, leafAmber]
    ];

    var sphereGeo = new THREE.SphereGeometry(1.0, 12, 8);
    crownSpheres.forEach(function (f) {
      var bm = new THREE.Mesh(sphereGeo, f[4]);
      bm.position.set(f[0], f[1], f[2]);
      bm.scale.set(f[3], f[3] * 0.82, f[3]);
      bm.castShadow = true;
      bm.receiveShadow = true;
      g.add(bm);
    });

    g.position.set(x, y || 0, z);
    g.scale.set(finalScale, finalScale, finalScale);
    scene.add(g);
  }`;

code = code.replace(oldBlossomTreeDef, newBlossomTreeDef);

// Update fallen petals to warm golden autumn petals
code = code.replace(
  `color: 0xf8a8bc,\n      roughness: 0.65,`,
  `color: 0xdfab32,\n      roughness: 0.65,`
);

// =========================================================================
// 4. Water: Deep Cyan / Ink-Green Base, High Specular Reflection, No Milky Tint
// =========================================================================
code = code.replace(
  `waterMat = new THREE.MeshStandardMaterial({\n      color: 0x44c2b4, roughness: 0.03, metalness: 0.15, transparent: true, opacity: 0.90,`,
  `waterMat = new THREE.MeshStandardMaterial({\n      color: 0x1a4642, roughness: 0.008, metalness: 0.25, transparent: true, opacity: 0.94,`
);

// Color fragment in waterMat: deep ink-cyan body + high-contrast specular mirror reflection
const oldWaterColorFragCode = `  vec3 skyBlueFallback = mix(vec3(0.58, 0.80, 0.96), vec3(0.84, 0.92, 0.99), clamp(vGardenWorldPos.y * 0.06 + 0.5, 0.0, 1.0));\\n' +
        '  vec3 finalReflect = max(reflectedScene, skyBlueFallback * 0.82);\\n' +
        '  vec3 viewD = normalize(vViewPosition);\\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 2.5), 0.36, 0.92);\\n' +
        '  vec3 waterCyanGreen = vec3(0.24, 0.74, 0.68);\\n' +
        '  vec3 waterHighlight = vec3(0.42, 0.88, 0.82);\\n' +
        '  diffuseColor.rgb = mix(waterCyanGreen, finalReflect * 1.15, fresnel);\\n' +
        '  diffuseColor.rgb += waterHighlight * (1.0 - fresnel) * 0.20;\\n'`;

const newWaterColorFragCode = `  vec3 skyBlueFallback = mix(vec3(0.55, 0.78, 0.96), vec3(0.82, 0.92, 0.99), clamp(vGardenWorldPos.y * 0.06 + 0.5, 0.0, 1.0));\\n' +
        '  vec3 finalReflect = max(reflectedScene, skyBlueFallback * 0.88);\\n' +
        '  vec3 viewD = normalize(vViewPosition);\\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 2.0), 0.52, 0.98);\\n' +
        '  vec3 deepInkCyan = vec3(0.07, 0.22, 0.20);\\n' +
        '  diffuseColor.rgb = mix(deepInkCyan, finalReflect * 1.28, fresnel);\\n'`;

code = code.replace(oldWaterColorFragCode, newWaterColorFragCode);

// Also set pool bottom bedMat to dark deep cyan-slate
code = code.replace(
  `var bedMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0x485856, roughness: 0.95 });`,
  `var bedMat = new THREE.MeshStandardMaterial({ map: courtyardBrickTexture(), color: 0x142826, roughness: 0.95 });`
);

// =========================================================================
// 5. Sun Light: Fixed from Top-Left (West-South-West) -> Continuous Shadows to the Right (East)
// =========================================================================
// In applyParams(): explicitly set sunLight direction from upper-left
const oldApplySun = `    var dir = directionFrom(params.elevation, params.azimuth);
    if (sunLight) {
      sunLight.position.copy(dir).multiplyScalar(150);
      sunLight.color.copy(params.sunColor);
      sunLight.intensity = params.sunIntensity * (0.45 + 0.55 * params.shadowStrength);
    }`;

const newApplySun = `    // 固定光源方向：从左上方（西北偏西高空）倾斜照射，在右侧（东侧）地面与池面投下大片连贯的整体阴影
    var fixedSunDir = new THREE.Vector3(-0.64, 0.48, 0.50).normalize();
    if (sunLight) {
      sunLight.position.copy(fixedSunDir).multiplyScalar(150);
      sunLight.target.position.set(6.0, 0, -4.0);
      sunLight.target.updateMatrixWorld();
      sunLight.color.copy(params.sunColor);
      sunLight.intensity = params.sunIntensity * (0.45 + 0.55 * params.shadowStrength);
    }`;

code = code.replace(oldApplySun, newApplySun);

// Ensure sun shadow radius is 1.0 (crisp, cohesive shadow)
code = code.replace('sunLight.shadow.radius = 2.0;', 'sunLight.shadow.radius = 1.0;');

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js successfully updated with subtractive composition and color grading!');
