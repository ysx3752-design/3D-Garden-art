const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// 1. Update TIMES presets for Shinkai/Ghibli and Cinematic Dusk
const timesRegex = /var\s+TIMES\s*=\s*\{[\s\S]*?\n\s*\};\r?\n\r?\n\s*var\s+WEATHER/;
const newTimesCode = `var TIMES = {
    morning: {
      label: '清晨', clock: '06:20', baseTemp: 14,
      // 新海诚/吉卜力风格：明丽清透的淡蓝天顶、晨光初晓的暖金低斜朝阳，拉长亭桥倒影
      skyTop: 0x1d5a98, skyBottom: 0xc8e4f7, glow: 0xffe2ac,
      sunColor: 0xfff1d2, sunIntensity: 2.8, elevation: 26, azimuth: -54,
      ambient: 0.18, hemiSky: 0x9bd8ff, hemiGround: 0x2e4426, hemi: 1.05,
      exposure: 1.08, fogColor: 0xcfe4f5, fogDensity: 0.0034,
      moon: 0, glowIntensity: 0.15, star: 0, celestial: 0xfffaea,
      firefly: 0
    },
    noon: {
      label: '正午', clock: '12:30', baseTemp: 25,
      // 吉卜力盛夏晴朗白昼：饱满蓝天、清亮绿水与分明屋檐落影
      skyTop: 0x1668be, skyBottom: 0xcde8fc, glow: 0xfff6db,
      sunColor: 0xfffef4, sunIntensity: 3.2, elevation: 48, azimuth: -34,
      ambient: 0.20, hemiSky: 0xa4dbff, hemiGround: 0x324d28, hemi: 1.15,
      exposure: 1.04, fogColor: 0xd6eaf8, fogDensity: 0.0028,
      moon: 0, glowIntensity: 0, star: 0, celestial: 0xffffff,
      firefly: 0
    },
    dusk: {
      label: '黄昏', clock: '18:40', baseTemp: 20,
      // 高级黄昏电影感：低角度金红晚霞、超长戏剧感拉长阴影、紫金暮色天际
      skyTop: 0x482f64, skyBottom: 0xe88752, glow: 0xff994a,
      sunColor: 0xff9548, sunIntensity: 2.4, elevation: 13, azimuth: 68,
      ambient: 0.16, hemiSky: 0x9e6f98, hemiGround: 0x423223, hemi: 0.85,
      exposure: 1.12, fogColor: 0xde956c, fogDensity: 0.0038,
      moon: 0, glowIntensity: 0.95, star: 0.15, celestial: 0xff9e58,
      firefly: 0.8
    },
    night: {
      label: '夜晚', clock: '21:10', baseTemp: 12,
      // 诗意江南静谧水乡月夜：冷调月光与幽蓝天幕，暖黄灯火交相辉映
      skyTop: 0x091426, skyBottom: 0x182a44, glow: 0x32486c,
      sunColor: 0x8aa8d8, sunIntensity: 0.38, elevation: 36, azimuth: 118,
      ambient: 0.10, hemiSky: 0x1c2b44, hemiGround: 0x101814, hemi: 0.42,
      exposure: 1.16, fogColor: 0x141f30, fogDensity: 0.0048,
      moon: 0.70, glowIntensity: 1.6, star: 0.95, celestial: 0xe3eaf8,
      firefly: 1.0
    }
  };

  var WEATHER`;

if (!timesRegex.test(code)) {
  console.error('timesRegex not matched');
  process.exit(1);
}
code = code.replace(timesRegex, newTimesCode);

// 2. Update buildLights
const buildLightsRegex = /function\s+buildLights\(\)\s*\{[\s\S]*?scene\.add\(moonLight\.target\);\r?\n\s*\}/;
const newBuildLightsCode = `function buildLights() {
    // 3. 半球光（HemisphereLight）补光：天空色淡蓝色，地面反射色暗草绿，彻底解决阴影死黑问题，注入新海诚/吉卜力通透水彩色调
    hemiLight = new THREE.HemisphereLight(0x9bd8ff, 0x2e4426, 0.95);
    scene.add(hemiLight);

    // 辅助环境弱光：柔和微暖基底
    ambientLight = new THREE.AmbientLight(0xfffaec, 0.16);
    scene.add(ambientLight);

    // 2. 主方向光（DirectionalLight）模拟太阳：低斜侧射角使建筑、亭桥与柳树投射出清晰拉长、层次丰富的画意长影
    sunLight = new THREE.DirectionalLight(0xfff3db, 2.8);
    sunLight.position.set(78, 56, 68);
    sunLight.target.position.set(0, 0, 4);
    sunLight.castShadow = true;

    // 2. 优化阴影相机视锥体与高精度阴影贴图（2048x2048）
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.near = 5;
    sunLight.shadow.camera.far = 340;
    sunLight.shadow.camera.left = -64;
    sunLight.shadow.camera.right = 64;
    sunLight.shadow.camera.top = 64;
    sunLight.shadow.camera.bottom = -64;
    sunLight.shadow.bias = -0.00035;
    sunLight.shadow.normalBias = 0.038; // 彻底消除曲面柱体与屋檐的阶梯状阴影条纹（shadow acne）
    sunLight.shadow.radius = 2.0;       // PCFSoft 柔化半影边缘，呈现吉卜力/新海诚手绘动画柔光质感
    sunLight.shadow.camera.updateProjectionMatrix();

    scene.add(sunLight);
    scene.add(sunLight.target);

    moonLight = new THREE.DirectionalLight(0x9cb4dc, 0);
    moonLight.position.set(-65, 90, -80);
    scene.add(moonLight);
    scene.add(moonLight.target);
  }`;

if (!buildLightsRegex.test(code)) {
  console.error('buildLightsRegex not matched');
  process.exit(1);
}
code = code.replace(buildLightsRegex, newBuildLightsCode);

// 3. Update createRenderer
const createRendererRegex = /function\s+createRenderer\(\)\s*\{[\s\S]*?return\s+r;\r?\n\s*\}\s*catch\s*\(error\)/;
const newCreateRendererCode = `function createRenderer() {
    if (typeof THREE === 'undefined' || !THREE.WebGLRenderer) return null;
    try {
      var r = new THREE.WebGLRenderer({
        canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
      });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

      // 1. 启用物理正确光照（遵循能量守恒与真实距离衰减）
      r.physicallyCorrectLights = true;
      r.useLegacyLights = false;

      // 6. 色彩空间（Color Space）设置为 sRGB，开启 ToneMapping（ACESFilmicToneMapping）与曝光微调
      r.outputEncoding = THREE.sRGBEncoding;
      if (r.outputColorSpace) r.outputColorSpace = THREE.SRGBColorSpace;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.08;

      // 1. 启用阴影贴图（PCFSoftShadowMap 软阴影）
      r.shadowMap.enabled = true;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      return r;
    } catch (error)`;

if (!createRendererRegex.test(code)) {
  console.error('createRendererRegex not matched');
  process.exit(1);
}
code = code.replace(createRendererRegex, newCreateRendererCode);

// 4. Add SSAO implementation and hook into boot and frame
const ssaoImplementationCode = `
  /* ---------------- 16.8 环境光遮蔽（SSAO 屏幕空间环境光遮蔽系统） ---------------- */
  var ssaoEnabled = true;
  var ssaoRenderTarget = null;
  var ssaoScene = null;
  var ssaoCamera = null;
  var ssaoMaterial = null;
  var ssaoQuad = null;

  function initSSAO(width, height) {
    if (!renderer) return;
    if (ssaoRenderTarget) ssaoRenderTarget.dispose();

    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(64, Math.floor((width || 1280) * dpr));
    var h = Math.max(64, Math.floor((height || 720) * dpr));

    ssaoRenderTarget = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType
    });
    ssaoRenderTarget.depthTexture = new THREE.DepthTexture(w, h);
    ssaoRenderTarget.depthTexture.type = THREE.UnsignedIntType;

    if (!ssaoScene) {
      ssaoScene = new THREE.Scene();
      ssaoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      var vertShader = [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = vec4(position.xy, 0.0, 1.0);',
        '}'
      ].join('\\n');

      var fragShader = [
        'uniform sampler2D tDiffuse;',
        'uniform sampler2D tDepth;',
        'uniform mat4 projInverse;',
        'uniform vec2 resolution;',
        'uniform float aoRadius;',
        'uniform float aoIntensity;',
        'uniform float aoPower;',
        'varying vec2 vUv;',
        '',
        'float rand(vec2 coord) {',
        '  return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);',
        '}',
        '',
        'vec3 getViewPos(vec2 uv) {',
        '  float d = texture2D(tDepth, uv).r;',
        '  vec4 ndc = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);',
        '  vec4 v = projInverse * ndc;',
        '  return v.xyz / max(v.w, 0.00001);',
        '}',
        '',
        'void main() {',
        '  vec4 col = texture2D(tDiffuse, vUv);',
        '  float d = texture2D(tDepth, vUv).r;',
        '  if (d >= 0.9998) {',
        '    gl_FragColor = col;',
        '    return;',
        '  }',
        '',
        '  vec3 pos = getViewPos(vUv);',
        '  vec3 normal = normalize(cross(dFdx(pos), dFdy(pos)));',
        '',
        '  float occ = 0.0;',
        '  float totalWeight = 0.0;',
        '  float noise = rand(vUv * resolution * 0.35);',
        '',
        '  const int SAMPLES = 12;',
        '  for (int i = 0; i < SAMPLES; i++) {',
        '    float fi = float(i);',
        '    float angle = fi * 2.399963 + noise * 6.283185;',
        '    float distNorm = (fi + 1.0) / float(SAMPLES);',
        '    float r = distNorm * aoRadius;',
        '    vec2 dir2 = vec2(cos(angle), sin(angle));',
        '    vec2 offsetUv = vUv + (dir2 * r * 42.0) / max(-pos.z, 0.6) / resolution;',
        '    if (offsetUv.x >= 0.0 && offsetUv.x <= 1.0 && offsetUv.y >= 0.0 && offsetUv.y <= 1.0) {',
        '      vec3 samplePos = getViewPos(offsetUv);',
        '      vec3 diff = samplePos - pos;',
        '      float dist = length(diff);',
        '      float normalDot = dot(normal, normalize(diff));',
        '      if (dist > 0.02 && dist < aoRadius * 2.2 && normalDot > 0.04) {',
        '        float falloff = 1.0 - smoothstep(0.0, aoRadius * 2.2, dist);',
        '        occ += normalDot * falloff;',
        '      }',
        '      totalWeight += 1.0;',
        '    }',
        '  }',
        '',
        '  float ao = 0.0;',
        '  if (totalWeight > 0.0) {',
        '    ao = clamp(pow((occ / float(SAMPLES)) * aoIntensity, aoPower), 0.0, 0.72);',
        '  }',
        '  vec3 aoTint = vec3(0.06, 0.08, 0.10);',
        '  vec3 result = mix(col.rgb * (1.0 - ao), aoTint, ao * 0.06);',
        '  gl_FragColor = vec4(result, col.a);',
        '}'
      ].join('\\n');

      ssaoMaterial = new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          tDiffuse: { value: null },
          tDepth: { value: null },
          projInverse: { value: new THREE.Matrix4() },
          resolution: { value: new THREE.Vector2(w, h) },
          aoRadius: { value: 0.90 },
          aoIntensity: { value: 1.25 },
          aoPower: { value: 1.5 }
        },
        depthWrite: false,
        depthTest: false
      });

      ssaoQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), ssaoMaterial);
      ssaoScene.add(ssaoQuad);
    } else {
      ssaoMaterial.uniforms.resolution.value.set(w, h);
    }
  }

  window.setSSAO = function (enabled) { ssaoEnabled = !!enabled; };
  window.setSSAORadius = function (r) { if (ssaoMaterial) ssaoMaterial.uniforms.aoRadius.value = r; };
  window.setSSAOIntensity = function (i) { if (ssaoMaterial) ssaoMaterial.uniforms.aoIntensity.value = i; };
`;

// Insert ssaoImplementationCode before createRenderer
code = code.replace('function createRenderer()', ssaoImplementationCode + '\n  function createRenderer()');

// 5. Update render call in frame() to use SSAO
const renderCallRegex = /renderer\.render\(scene,\s*camera\);\r?\n\s*state\.ready\s*=\s*true;/;
const newRenderCall = `if (ssaoEnabled && ssaoRenderTarget && !isMobile) {
      renderer.setRenderTarget(ssaoRenderTarget);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
      ssaoMaterial.uniforms.tDiffuse.value = ssaoRenderTarget.texture;
      ssaoMaterial.uniforms.tDepth.value = ssaoRenderTarget.depthTexture;
      ssaoMaterial.uniforms.projInverse.value.copy(camera.projectionMatrixInverse);
      renderer.render(ssaoScene, ssaoCamera);
    } else {
      renderer.render(scene, camera);
    }
    state.ready = true;`;

if (!renderCallRegex.test(code)) {
  console.error('renderCallRegex not matched');
  process.exit(1);
}
code = code.replace(renderCallRegex, newRenderCall);

// 6. Update resize to update SSAO resolution
const resizeFuncRegex = /function\s+resize\(\)\s*\{[\s\S]*?renderer\.setSize\(w,\s*h\);/;
const newResizeFunc = `function resize() {
    var stage = document.getElementById('stage');
    var w = stage ? stage.clientWidth : window.innerWidth;
    var h = stage ? stage.clientHeight : window.innerHeight;
    if (camera) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    if (renderer) {
      renderer.setSize(w, h);
      initSSAO(w, h);
    }`;

code = code.replace(resizeFuncRegex, newResizeFunc);

// 7. Update boot to call initSSAO
const bootFogRegex = /scene\.fog\s*=\s*new\s+THREE\.FogExp2\(0xd3dadf,\s*0\.0038\);/;
const newBootFog = `scene.fog = new THREE.FogExp2(0xcfe4f5, 0.0034);
    var stageEl = document.getElementById('stage');
    initSSAO(stageEl ? stageEl.clientWidth : 1280, stageEl ? stageEl.clientHeight : 720);`;

if (!bootFogRegex.test(code)) {
  console.error('bootFogRegex not matched');
  process.exit(1);
}
code = code.replace(bootFogRegex, newBootFog);

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js graphics optimization successfully applied!');
