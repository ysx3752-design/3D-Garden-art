const fs = require('fs');

let code = fs.readFileSync('.tmp/test-run.js', 'utf8');

// Normalize line endings for replacement
const isCRLF = code.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

// Find waterMat.onBeforeCompile
const marker = 'waterMat.onBeforeCompile = function (shader) {';
const idx = code.indexOf(marker);
if (idx === -1) {
  throw new Error('waterMat.onBeforeCompile not found');
}

// Find the end of onBeforeCompile function (the matching closing bracket before `water = new THREE.Mesh`)
const meshIdx = code.indexOf('water = new THREE.Mesh(waterGeo, waterMat);', idx);
if (meshIdx === -1) {
  throw new Error('water = new THREE.Mesh not found');
}

// We will replace the whole onBeforeCompile body
const newOnBeforeCompile = `waterMat.onBeforeCompile = function (shader) {
      waterCustomShader = shader;
      shader.uniforms.uReflectTexture = { value: waterReflectTarget ? waterReflectTarget.texture : null };
      shader.uniforms.uWaterTime = waterShaderUniforms.uTime;
      shader.uniforms.uRainRipple = waterShaderUniforms.uRainAmount;
      shader.uniforms.uSnowAmount = snowShaderUniform.uSnowAmount;

      shader.vertexShader = 'varying vec3 vGardenWorldPos;\\nvarying vec4 vClipPos;\\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\\n  vClipPos = gl_Position;'
      ).replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\\n  vGardenWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

      shader.fragmentShader = 'uniform sampler2D uReflectTexture;\\nuniform float uWaterTime;\\nuniform float uRainRipple;\\nuniform float uSnowAmount;\\nvarying vec3 vGardenWorldPos;\\nvarying vec4 vClipPos;\\n' +
        'vec2 hashRipple(vec2 p) {\\n' +
        '  p = fract(p * vec2(5.3983, 5.4427));\\n' +
        '  p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));\\n' +
        '  return fract(vec2(p.x * p.y * 95.4337, p.x * p.y * 97.597));\\n' +
        '}\\n' +
        'vec2 calcRipples(vec2 uv, float t) {\\n' +
        '  vec2 p = uv * 2.8;\\n' +
        '  vec2 ip = floor(p);\\n' +
        '  vec2 fp = fract(p);\\n' +
        '  vec2 totalGrad = vec2(0.0);\\n' +
        '  for (int j = -1; j <= 1; j++) {\\n' +
        '    for (int i = -1; i <= 1; i++) {\\n' +
        '      vec2 g = vec2(float(i), float(j));\\n' +
        '      vec2 cell = ip + g;\\n' +
        '      vec2 rnd = hashRipple(cell);\\n' +
        '      float phase = fract(t * 1.5 + rnd.x);\\n' +
        '      vec2 delta = fp - (g + rnd);\\n' +
        '      float d = length(delta);\\n' +
        '      float waveRadius = phase * 0.62;\\n' +
        '      float waveDist = d - waveRadius;\\n' +
        '      float wave = sin(clamp(waveDist * 28.0, -3.14159, 3.14159));\\n' +
        '      float fade = (1.0 - phase) * smoothstep(waveRadius + 0.16, waveRadius, d) * smoothstep(0.0, waveRadius, d);\\n' +
        '      if (d > 0.001) totalGrad += (delta / d) * wave * fade;\\n' +
        '    }\\n' +
        '  }\\n' +
        '  return totalGrad;\\n' +
        '}\\n' + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\\n' +
        '  if (uRainRipple > 0.005) {\\n' +
        '    vec2 rGrad = calcRipples(vGardenWorldPos.xz, uWaterTime) + calcRipples(vGardenWorldPos.xz * 1.6 + vec2(17.3, 31.7), uWaterTime * 1.35) * 0.45;\\n' +
        '    vec3 worldNorm = normalize(vec3(-rGrad.x * 1.25 * uRainRipple, 1.0, -rGrad.y * 1.25 * uRainRipple));\\n' +
        '    normal = normalize((viewMatrix * vec4(worldNorm, 0.0)).xyz);\\n' +
        '  }\\n'
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\\n' +
        '  vec2 ndc = (vClipPos.xy / max(vClipPos.w, 0.0001)) * 0.5 + 0.5;\\n' +
        '  vec2 waveDistort = vec2(sin(vGardenWorldPos.x * 2.8 + uWaterTime * 2.0), cos(vGardenWorldPos.z * 2.8 + uWaterTime * 1.6)) * 0.015;\\n' +
        '  vec2 reflectUv = clamp(vec2(1.0 - ndc.x, ndc.y) + waveDistort, 0.001, 0.999);\\n' +
        '  vec3 reflectedScene = texture2D(uReflectTexture, reflectUv).rgb;\\n' +
        '  vec3 viewD = normalize(vViewPosition);\\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 3.0), 0.35, 0.90);\\n' +
        '  vec3 deepWaterCol = vec3(0.18, 0.34, 0.38);\\n' +
        '  diffuseColor.rgb = mix(deepWaterCol, reflectedScene * 1.18, fresnel);\\n' +
        '  if (uRainRipple > 0.01) {\\n' +
        '    vec2 rGradRing = calcRipples(vGardenWorldPos.xz, uWaterTime);\\n' +
        '    float rippleFoam = length(rGradRing);\\n' +
        '    diffuseColor.rgb += vec3(0.08, 0.12, 0.14) * clamp(rippleFoam * 0.70, 0.0, 1.0) * uRainRipple;\\n' +
        '  }\\n' +
        '  if (uSnowAmount > 0.005) {\\n' +
        '    vec3 iceSnow = vec3(0.91, 0.94, 0.98);\\n' +
        '    diffuseColor.rgb = mix(diffuseColor.rgb, iceSnow, uSnowAmount * 0.95);\\n' +
        '  }\\n'
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\\n' +
        '  if (uSnowAmount > 0.005) {\\n' +
        '    roughnessFactor = mix(roughnessFactor, 0.88, uSnowAmount);\\n' +
        '  }\\n'
      );
    };
    `;

// Replace from idx to meshIdx
code = code.substring(0, idx) + newOnBeforeCompile + code.substring(meshIdx);

// Also brighten roof slightly for moist glazed sheen under ACES filmic
code = code.replace(/color:\s*0x363c42,\s*roughness:\s*0\.44,\s*metalness:\s*0\.12/g,
  'color: 0x444b52, roughness: 0.38, metalness: 0.15');

fs.writeFileSync('.tmp/test-run.js', code, 'utf8');
console.log('Water reflection shader successfully injected into .tmp/test-run.js!');
