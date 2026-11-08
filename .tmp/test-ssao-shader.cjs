const THREE = require('./vendor/three.min.js');

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const frag = `
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform mat4 projInverse;
uniform vec2 resolution;
uniform float cameraNear;
uniform float cameraFar;
uniform float aoRadius;
uniform float aoIntensity;
uniform float aoPower;
varying vec2 vUv;

float rand(vec2 coord) {
  return fract(sin(dot(coord, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 getViewPos(vec2 uv) {
  float d = texture2D(tDepth, uv).r;
  vec4 ndc = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vec4 v = projInverse * ndc;
  return v.xyz / max(v.w, 0.00001);
}

void main() {
  vec4 col = texture2D(tDiffuse, vUv);
  float d = texture2D(tDepth, vUv).r;

  // Sky background (no AO)
  if (d >= 0.9998) {
    gl_FragColor = col;
    return;
  }

  vec3 pos = getViewPos(vUv);
  vec3 normal = normalize(cross(dFdx(pos), dFdy(pos)));

  float occ = 0.0;
  float totalWeight = 0.0;
  float noise = rand(vUv * resolution * 0.35);

  const int SAMPLES = 12;
  for (int i = 0; i < SAMPLES; i++) {
    float fi = float(i);
    float angle = fi * 2.399963 + noise * 6.283185;
    float distNorm = (fi + 1.0) / float(SAMPLES);
    float r = distNorm * aoRadius;

    vec2 dir2 = vec2(cos(angle), sin(angle));
    vec2 offsetUv = vUv + (dir2 * r * 45.0) / max(-pos.z, 0.5) / resolution;

    if (offsetUv.x >= 0.0 && offsetUv.x <= 1.0 && offsetUv.y >= 0.0 && offsetUv.y <= 1.0) {
      vec3 samplePos = getViewPos(offsetUv);
      vec3 diff = samplePos - pos;
      float dist = length(diff);
      float normalDot = dot(normal, normalize(diff));

      if (dist > 0.02 && dist < aoRadius * 2.0 && normalDot > 0.05) {
        float falloff = 1.0 - smoothstep(0.0, aoRadius * 2.0, dist);
        occ += normalDot * falloff;
      }
      totalWeight += 1.0;
    }
  }

  float ao = 0.0;
  if (totalWeight > 0.0) {
    ao = clamp(pow((occ / float(SAMPLES)) * aoIntensity, aoPower), 0.0, 0.75);
  }

  // Soft anime contact tint (slightly tinted dark slate/green rather than pure black)
  vec3 aoTint = vec3(0.08, 0.10, 0.12);
  vec3 result = mix(col.rgb * (1.0 - ao), aoTint, ao * 0.08);
  gl_FragColor = vec4(result, col.a);
}
`;

const mat = new THREE.ShaderMaterial({
  vertexShader: vert,
  fragmentShader: frag,
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    projInverse: { value: new THREE.Matrix4() },
    resolution: { value: new THREE.Vector2(1280, 720) },
    cameraNear: { value: 0.1 },
    cameraFar: { value: 1000 },
    aoRadius: { value: 0.95 },
    aoIntensity: { value: 1.1 },
    aoPower: { value: 1.6 }
  }
});

console.log('ShaderMaterial initialized successfully without syntax errors!');
