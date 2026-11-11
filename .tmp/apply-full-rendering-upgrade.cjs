const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// =========================================================================
// 1. Textures: grassTexture() & earthNoiseTexture()
// =========================================================================
const textureInsertionMarker = 'function plasterTexture() {';
const newTextures = `function grassTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#628046';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 6500, '#506c36', 0.45, 1.5);
      speckle(ctx, w, h, 4800, '#759853', 0.42, 1.4);
      speckle(ctx, w, h, 2800, '#88aa64', 0.32, 1.8);
      speckle(ctx, w, h, 1400, '#3f5627', 0.35, 2.2);
      ctx.globalAlpha = 0.09;
      ctx.strokeStyle = '#94ba70';
      ctx.lineWidth = 1.2;
      for (var i = 0; i < 50; i++) {
        ctx.beginPath();
        var gx = Math.random() * w;
        var gy = Math.random() * h;
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + (Math.random() - 0.5) * 14, gy + (Math.random() - 0.5) * 14);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }, 6, 6);
  }

  function earthNoiseTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#726d56';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 5500, '#5c5742', 0.50, 1.5);
      speckle(ctx, w, h, 3800, '#8a8368', 0.42, 1.8);
      speckle(ctx, w, h, 2000, '#4a4533', 0.35, 2.2);
      speckle(ctx, w, h, 1000, '#a49e80', 0.28, 1.3);
    }, 4, 4);
  }

  `;

code = code.replace(textureInsertionMarker, newTextures + textureInsertionMarker);

// =========================================================================
// 2. Lighting & Atmosphere: Lower sun angle, Light-blue hemi/ambient, FogExp2
// =========================================================================
// Lower sun angle (elevation Y=23m instead of 56m)
code = code.replace(
  'sunLight.position.set(78, 56, 68);',
  'sunLight.position.set(48, 23, 42);'
);
code = code.replace(
  'hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x2e4426, 0.95);',
  'hemiLight = new THREE.HemisphereLight(0xb4deff, 0x3d5436, 1.25);'
);
code = code.replace(
  'ambientLight = new THREE.AmbientLight(0xfffaec, 0.16);',
  'ambientLight = new THREE.AmbientLight(0xc6def2, 0.38);'
);

// FogExp2 setup in boot()
code = code.replace(
  /scene\.fog\s*=\s*new THREE\.FogExp2\(0xcfe4f5,\s*0\.0034\);/,
  'scene.fog = new THREE.FogExp2(0xd6eaf8, 0.0078);'
);

// Fog & light in initParams()
code = code.replace(
  'fogColor: 0xcfe4f5, fogDensity: 0.0034,',
  'fogColor: 0xd6eaf8, fogDensity: 0.0078,'
);
code = code.replace(
  'hemiSky: 0x9bd8ff, hemiGround: 0x2e4426, hemi: 1.05,',
  'hemiSky: 0xb4deff, hemiGround: 0x3d5436, hemi: 1.25,'
);
code = code.replace(
  'sunIntensity: 2.8, ambient: 0.16,',
  'sunIntensity: 2.85, ambient: 0.38,'
);

// =========================================================================
// 3. Water Shader & Reflection: Luminous cyan-green, Sky reflection fallback, ripples
// =========================================================================
// Water material initialization in buildWater()
code = code.replace(
  /waterMat = new THREE\.MeshStandardMaterial\(\{[\s\S]*?color:\s*COL\.water[\s\S]*?\}\);/,
  `waterMat = new THREE.MeshStandardMaterial({
      color: 0x44c2b4, roughness: 0.03, metalness: 0.15, transparent: true, opacity: 0.90,
      side: THREE.DoubleSide,
      normalMap: waterNormalTexture(),
      normalScale: new THREE.Vector2(0.45, 0.45)
    });`
);

// Clear color during updateWaterReflection to bright sky blue
const oldUpdateWaterReflect = `renderer.setRenderTarget(waterReflectTarget);
    renderer.render(scene, waterMirrorCam);
    renderer.setRenderTarget(null);`;

const newUpdateWaterReflect = `renderer.setRenderTarget(waterReflectTarget);
    var oldClearCol = new THREE.Color();
    renderer.getClearColor(oldClearCol);
    var oldClearAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0xa8d4f0, 1.0);
    renderer.render(scene, waterMirrorCam);
    renderer.setClearColor(oldClearCol, oldClearAlpha);
    renderer.setRenderTarget(null);`;

code = code.replace(oldUpdateWaterReflect, newUpdateWaterReflect);

// Water color_fragment hook: luminous turquoise cyan-green + sky/pavilion reflection
const oldWaterColorFragHook = `  vec2 ndc = (vClipPos.xy / max(vClipPos.w, 0.0001)) * 0.5 + 0.5;\\n' +
        '  vec2 waveDistort = vec2(sin(vGardenWorldPos.x * 2.8 + uWaterTime * 2.0), cos(vGardenWorldPos.z * 2.8 + uWaterTime * 1.6)) * 0.015;\\n' +
        '  vec2 reflectUv = clamp(vec2(1.0 - ndc.x, ndc.y) + waveDistort, 0.001, 0.999);\\n' +
        '  vec3 reflectedScene = texture2D(uReflectTexture, reflectUv).rgb;\\n' +
        '  vec3 viewD = normalize(vViewPosition);\\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 3.0), 0.35, 0.90);\\n' +
        '  vec3 deepWaterCol = vec3(0.18, 0.34, 0.38);\\n' +
        '  diffuseColor.rgb = mix(deepWaterCol, reflectedScene * 1.18, fresnel);\\n'`;

const newWaterColorFragHook = `  vec2 ndc = (vClipPos.xy / max(vClipPos.w, 0.0001)) * 0.5 + 0.5;\\n' +
        '  vec2 waveDistort = vec2(sin(vGardenWorldPos.x * 2.6 + uWaterTime * 1.9), cos(vGardenWorldPos.z * 2.6 + uWaterTime * 1.5)) * 0.018;\\n' +
        '  vec2 reflectUv = clamp(vec2(1.0 - ndc.x, ndc.y) + waveDistort, 0.001, 0.999);\\n' +
        '  vec3 reflectedScene = texture2D(uReflectTexture, reflectUv).rgb;\\n' +
        '  vec3 skyBlueFallback = mix(vec3(0.58, 0.80, 0.96), vec3(0.84, 0.92, 0.99), clamp(vGardenWorldPos.y * 0.06 + 0.5, 0.0, 1.0));\\n' +
        '  vec3 finalReflect = max(reflectedScene, skyBlueFallback * 0.82);\\n' +
        '  vec3 viewD = normalize(vViewPosition);\\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 2.5), 0.36, 0.92);\\n' +
        '  vec3 waterCyanGreen = vec3(0.24, 0.74, 0.68);\\n' +
        '  vec3 waterHighlight = vec3(0.42, 0.88, 0.82);\\n' +
        '  diffuseColor.rgb = mix(waterCyanGreen, finalReflect * 1.15, fresnel);\\n' +
        '  diffuseColor.rgb += waterHighlight * (1.0 - fresnel) * 0.20;\\n'`;

code = code.replace(oldWaterColorFragHook, newWaterColorFragHook);

// =========================================================================
// 4. Ground Textures: Apply grassTexture() & earthNoiseTexture()
// =========================================================================
code = code.replace(
  'var grassMat = new THREE.MeshStandardMaterial({ color: COL.grass, roughness: 0.92, flatShading: true });',
  'var grassMat = new THREE.MeshStandardMaterial({ map: grassTexture(), color: 0x82a65e, roughness: 0.90 });'
);
code = code.replace(
  'var mossMat = new THREE.MeshStandardMaterial({ color: COL.moss, roughness: 0.95, flatShading: true });',
  'var mossMat = new THREE.MeshStandardMaterial({ map: grassTexture(), color: 0x58783d, roughness: 0.94 });'
);

// Apply grassTexture to northSlope in buildDioramaPedestal
code = code.replace(
  `var northSlope = new THREE.Mesh(new THREE.PlaneGeometry(SIZE, 16), new THREE.MeshStandardMaterial({\n      color: COL.grass,\n      roughness: 0.90\n    }));`,
  `var northSlope = new THREE.Mesh(new THREE.PlaneGeometry(74, 16), new THREE.MeshStandardMaterial({\n      map: grassTexture(),\n      color: 0x7aa056,\n      roughness: 0.90\n    }));`
);

// =========================================================================
// 5. Clustered Pines & Organic Vegetation
// =========================================================================
const oldPines = `    // 苍劲罗汉松与黑松：全部改植于平地，树根落在平地标高，树冠避让院墙与假山
    buildPine(-34, 0.08, -38, 1.35, 0.12);  // 西北院墙外平地古松（墙外栽植，松冠不搭墙）
    buildPine(-21.0, 0.08, -21.0, 1.2, 0.08); // 西北庭院平地盘松（彻底移离新筑茅厕东墙与假山石）
    buildPine(6, 0.08, -24, 1.3, 0.08);     // 主殿后方平地迎客松（退至后园，不穿墙）
    buildPine(34, 0.08, -27.5, 1.0, -0.09); // 东北后园平地苍松（缩冠并退离东北墙角）
    buildPine(-14.5, 0.08, -27.5, 1.25, 0.10); // 后园西侧疏朗古松（避让叠石，不穿墙）
    buildPine(18, 0.08, -24, 1.3, -0.07);   // 后园东侧平地苍松（退至后园，不穿墙）`;

const newPines = `    // 苍劲罗汉松与黑松：聚集成团、错落生姿，彻底打破整齐排列
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

code = code.replace(oldPines, newPines);

// =========================================================================
// 6. Post-processing: Enhanced SSAO + FXAA Anti-Aliasing
// =========================================================================
// Boost SSAO parameters
code = code.replace('aoRadius: { value: 0.90 },', 'aoRadius: { value: 1.25 },');
code = code.replace('aoIntensity: { value: 1.25 },', 'aoIntensity: { value: 1.65 },');
code = code.replace('aoPower: { value: 1.5 }', 'aoPower: { value: 1.3 }');

// Add FXAA edge smoothing to SSAO fragment shader
const oldSSAOFragReturn = `  vec3 aoTint = vec3(0.06, 0.08, 0.10);',
        '  vec3 result = mix(col.rgb * (1.0 - ao), aoTint, ao * 0.06);',
        '  gl_FragColor = vec4(result, col.a);',
        '}'`;

const newSSAOFragReturn = `  vec3 aoTint = vec3(0.04, 0.06, 0.08);',
        '  vec3 shaded = mix(col.rgb * (1.0 - ao), aoTint, ao * 0.08);',
        '  vec2 rcpFrame = 1.0 / resolution;',
        '  vec3 rgbNW = texture2D(tDiffuse, vUv + vec2(-0.5, -0.5) * rcpFrame).rgb;',
        '  vec3 rgbNE = texture2D(tDiffuse, vUv + vec2(0.5, -0.5) * rcpFrame).rgb;',
        '  vec3 rgbSW = texture2D(tDiffuse, vUv + vec2(-0.5, 0.5) * rcpFrame).rgb;',
        '  vec3 rgbSE = texture2D(tDiffuse, vUv + vec2(0.5, 0.5) * rcpFrame).rgb;',
        '  vec3 luma = vec3(0.299, 0.587, 0.114);',
        '  float lumaNW = dot(rgbNW, luma);',
        '  float lumaNE = dot(rgbNE, luma);',
        '  float lumaSW = dot(rgbSW, luma);',
        '  float lumaSE = dot(rgbSE, luma);',
        '  float lumaM  = dot(col.rgb, luma);',
        '  float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));',
        '  float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));',
        '  vec2 dir = vec2(-((lumaNW + lumaNE) - (lumaSW + lumaSE)), ((lumaNW + lumaSW) - (lumaNE + lumaSE)));',
        '  float dirReduce = max((lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * (1.0 / 128.0)), 1.0 / 384.0);',
        '  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);',
        '  dir = min(vec2(8.0), max(vec2(-8.0), dir * rcpDirMin)) * rcpFrame;',
        '  vec3 rgbA = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);',
        '  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture2D(tDiffuse, vUv + dir * -0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);',
        '  float lumaB = dot(rgbB, luma);',
        '  vec3 aaCol = (lumaB < lumaMin || lumaB > lumaMax) ? rgbA : rgbB;',
        '  vec3 finalColor = mix(shaded, aaCol * (1.0 - ao), 0.45);',
        '  gl_FragColor = vec4(finalColor, col.a);',
        '}'`;

code = code.replace(oldSSAOFragReturn, newSSAOFragReturn);

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js successfully updated with all 4 rendering dimensions!');
