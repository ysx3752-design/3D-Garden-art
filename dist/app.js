/* ============================================================
 * 江南水乡 · 园林生态漫境 — 平地基底的大地图与多殿阁空间系统
 *
 * 核心造园规划（全部位于同一标高的平地之上，无任何高地形起伏）：
 *   1. 基底与地势：
 *      - 600 米全景平地地坪，无山体、无台地、无坡地，也不设远景山峦；
 *      - 所有建筑、亭廊、院墙、植被、假山叠石、水系与船只均直接坐落在平地标高（y = 0），不悬空、不移位；
 *      - 殿阁门前朝南，开门即是一望无际的开阔荷花主池与平缓水岸，视野完全开朗。
 *   2. 主屋主导的大地图格局（主殿与数座水榭亭廊，不再设周边小屋与侧屋）：
 *      - 【远香正殿】：重檐歇山主殿，须弥座汉白玉雕栏台基，正对南向宽广湖面；
 *      - 【涵青书斋雅院】：东苑幽静的四合书斋庭院，芭蕉修竹相映；
 *      - 【四面合围院墙与南面正门门楼】：三开间重檐门楼，园内唯一可通行出入口；
 *      - 【问梅揽胜阁】：后园平地上的六角飞檐高阁；
 *      - 【荷风四面水亭】：湖心悬挑敞水六角水榭；
 *      - 【直廊系统】：主屋前侧笔直廊道自湖岸直抵主屋台阶，可通行。
 *   3. 严格空间防穿插隔离：
 *      - 所有树木、罗汉松、垂柳、春桃与修竹均具备独立安全坐标，不穿透任何亭子、楼阁与走廊内部。
 *   4. 景观全景占满，杜绝缩放空白：
 *      - 600 米平坦地坪、环城水巷与平地林木环抱；
 *        远景不再设山体，由渐变天穹与大气雾自然收束天际线。
 * ============================================================ */
(function () {
  'use strict';

  /* ---------------- 1. 预设与工具 ---------------- */

  var canvas = document.getElementById('scene');
  var hud = document.getElementById('hud');
  var loader = document.getElementById('loader');
  var loaderFill = document.getElementById('loader-fill');
  var loaderText = document.getElementById('loader-text');
  var fallback = document.getElementById('fallback');
  var live = document.getElementById('live');
  var glyphHost = document.getElementById('weather-glyph');
  var weatherNameEl = document.getElementById('weather-name');
  var tempEl = document.getElementById('temp');
  var clockEl = document.getElementById('clock');
  var dateEl = document.getElementById('date');
  var foldBtn = document.getElementById('fold');
  var foldText = document.getElementById('fold-text');

  var narrowQuery = window.matchMedia('(max-width: 800px)');
  var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var isMobile = narrowQuery.matches || ((navigator.maxTouchPoints || 0) > 0 && window.innerWidth <= 1024);
  var reducedMotion = motionQuery.matches;

  var GLYPHS = {
    sunny: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6"></path></svg>',
    cloudy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.3 16.2h9.2a3.3 3.3 0 0 0 .2-6.6 4.8 4.8 0 0 0-9.1-1.4A3.5 3.5 0 0 0 7.3 16.2z"></path><path d="M9 19.4h6"></path></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.3 13.6h9.2a3.3 3.3 0 0 0 .2-6.6 4.8 4.8 0 0 0-9.1-1.4A3.5 3.5 0 0 0 7.3 13.6z"></path><path d="M9 16.6l-.9 3M12.4 16.6l-.9 3M15.8 16.6l-.9 3"></path></svg>',
    snow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7.3 13.6h9.2a3.3 3.3 0 0 0 .2-6.6 4.8 4.8 0 0 0-9.1-1.4A3.5 3.5 0 0 0 7.3 13.6z"></path><path d="M9.4 17.4h1.6M10.2 16.6v1.6M14.4 17.4H16M15.2 16.6v1.6"></path></svg>',
    fog: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8.6 11.4h8.4a2.9 2.9 0 0 0 .2-5.8 4.2 4.2 0 0 0-7.9-1.2A3.1 3.1 0 0 0 8.6 11.4z"></path><path d="M4.6 15h14.8M6.8 18.2h11M9 21.2h7"></path></svg>'
  };

  var TIMES = {
    morning: {
      label: '清晨', clock: '06:20', baseTemp: 14,
      skyTop: 0x2c466c, skyBottom: 0xdcb692, glow: 0xffcb90,
      sunColor: 0xffd4a6, sunIntensity: 1.15, elevation: 11, azimuth: -82,
      ambient: 0.32, hemiSky: 0xa8c5dc, hemiGround: 0x76755a, hemi: 0.50,
      exposure: 1.04, fogColor: 0xd3dadf, fogDensity: 0.0038,
      moon: 0, glowIntensity: 0.15, star: 0, celestial: 0xffeecc,
      firefly: 0
    },
    noon: {
      label: '正午', clock: '12:30', baseTemp: 25,
      skyTop: 0x2767a5, skyBottom: 0xd2e5f2, glow: 0xfff2ce,
      sunColor: 0xfff6dc, sunIntensity: 1.85, elevation: 64, azimuth: -16,
      ambient: 0.44, hemiSky: 0xc2ddf2, hemiGround: 0x8b876a, hemi: 0.65,
      exposure: 1.0, fogColor: 0xdde7f0, fogDensity: 0.0018,
      moon: 0, glowIntensity: 0, star: 0, celestial: 0xfffaea,
      firefly: 0
    },
    dusk: {
      label: '黄昏', clock: '18:40', baseTemp: 20,
      skyTop: 0x4d3d6a, skyBottom: 0xe89260, glow: 0xffaf6a,
      sunColor: 0xffb578, sunIntensity: 0.98, elevation: 8, azimuth: 76,
      ambient: 0.32, hemiSky: 0xa087b3, hemiGround: 0x6e6250, hemi: 0.45,
      exposure: 1.08, fogColor: 0xc49b88, fogDensity: 0.0042,
      moon: 0, glowIntensity: 0.85, star: 0.15, celestial: 0xffb272,
      firefly: 0.8
    },
    night: {
      label: '夜晚', clock: '21:10', baseTemp: 12,
      skyTop: 0x0a1428, skyBottom: 0x1a2c46, glow: 0x394f72,
      sunColor: 0x9cb4dc, sunIntensity: 0.22, elevation: 36, azimuth: 116,
      ambient: 0.18, hemiSky: 0x324368, hemiGround: 0x242a32, hemi: 0.32,
      exposure: 1.15, fogColor: 0x162237, fogDensity: 0.0052,
      moon: 0.65, glowIntensity: 1.25, star: 0.92, celestial: 0xe3eaf8,
      firefly: 1.0
    }
  };

  var WEATHER = {
    sunny: {
      label: '晴', tempOffset: 3, sunMul: 1.0, ambientMul: 1.0, hemiMul: 1.0,
      skyDim: 0, skyDesat: 0, fogMul: 0.85, fogTint: null, fogTintAmt: 0,
      exposureMul: 1.02, waterRough: 0.03, waterTint: 0x95c2c7, waterTintAmt: 0.35,
      wetness: 0, rain: 0, snow: 0, shadowMul: 1.0, glowMul: 0.75,
      groundTint: 0xffffff, groundTintAmt: 0, roofTint: 0xffffff, roofTintAmt: 0,
      petal: 1.0
    },
    cloudy: {
      label: '阴', tempOffset: 0, sunMul: 0.32, ambientMul: 1.35, hemiMul: 1.1,
      skyDim: 0.32, skyDesat: 0.44, fogMul: 1.5, fogTint: 0xc8c9c4, fogTintAmt: 0.5,
      exposureMul: 0.98, waterRough: 0.22, waterTint: 0x8ba2a6, waterTintAmt: 0.5,
      wetness: 0.05, rain: 0, snow: 0, shadowMul: 0.28, glowMul: 0.9,
      groundTint: 0xbdb9a8, groundTintAmt: 0.15, roofTint: 0xffffff, roofTintAmt: 0,
      petal: 0.6
    },
    rain: {
      label: '雨', tempOffset: -1, sunMul: 0.14, ambientMul: 1.25, hemiMul: 1.0,
      skyDim: 0.50, skyDesat: 0.62, fogMul: 2.8, fogTint: 0x9ba4a8, fogTintAmt: 0.75,
      exposureMul: 0.92, waterRough: 0.14, waterTint: 0x768f96, waterTintAmt: 0.58,
      wetness: 1.0, rain: 1.0, snow: 0, shadowMul: 0.12, glowMul: 1.2,
      groundTint: 0x5a5649, groundTintAmt: 0.38, roofTint: 0x3f494e, roofTintAmt: 0.35,
      petal: 0.2
    },
    snow: {
      label: '雪', tempOffset: -12, sunMul: 0.20, ambientMul: 1.5, hemiMul: 1.15,
      skyDim: 0.44, skyDesat: 0.68, fogMul: 2.2, fogTint: 0xd8dce2, fogTintAmt: 0.8,
      exposureMul: 0.98, waterRough: 0.75, waterTint: 0xdde7f0, waterTintAmt: 0.85,
      wetness: 0.2, rain: 0, snow: 1.0, shadowMul: 0.22, glowMul: 1.0,
      groundTint: 0xf5f8fb, groundTintAmt: 0.94, roofTint: 0xfcfdff, roofTintAmt: 0.96,
      petal: 0
    },
    fog: {
      label: '雾', tempOffset: -1, sunMul: 0.10, ambientMul: 1.35, hemiMul: 1.05,
      skyDim: 0.52, skyDesat: 0.82, fogMul: 5.0, fogTint: 0xd2d5ce, fogTintAmt: 0.9,
      exposureMul: 0.95, waterRough: 0.28, waterTint: 0xa4aca8, waterTintAmt: 0.6,
      wetness: 0.35, rain: 0, snow: 0, shadowMul: 0.05, glowMul: 1.25,
      groundTint: 0xc6c7be, groundTintAmt: 0.3, roofTint: 0xc6cbcc, roofTintAmt: 0.25,
      petal: 0.3
    }
  };

  var COL = {
    plaster: 0xf7f4ec,
    plasterWall: 0xeeebe1,
    roof: 0x454b50,
    roofDark: 0x34383c,
    roofRidge: 0x282b2e,
    wood: 0x6d5037,
    woodDark: 0x463222,
    woodFloor: 0x7e6145,
    stone: 0xa6a399,
    stoneDark: 0x7a766c,
    stoneStep: 0xb9b6ac,
    earth: 0x7b775f,
    grass: 0x698051,
    moss: 0x4d6437,
    bambooStem: 0x638949,
    bambooLeaf: 0x557e3a,
    willow: 0x6f9255,
    pineNeedle: 0x385236,
    blossomPink: 0xf8a6b8,
    blossomDeep: 0xe2708a,
    shrubGreen: 0x516d3b,
    shrubLight: 0x6c8e51,
    hydrangeaBlue: 0x92b1d3,
    hydrangeaPink: 0xdea8c3,
    reed: 0x75895b,
    reedHead: 0x624c36,
    lotusLeaf: 0x587946,
    lotusPetal: 0xf8bed0,
    lotusCenter: 0xf5ca44,
    water: 0x72a4aa,
    waterDeep: 0x33575e,
    boatHull: 0x493220,
    boatCanopy: 0x252728,
    lanternRed: 0xcc3e2e,
    lanternWarm: 0xffa044
  };

  function clamp(v, min, max) { return v < min ? min : (v > max ? max : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function deg(rad) { return rad * Math.PI / 180; }

  function makeRandom(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function directionFrom(elevation, azimuth) {
    var e = deg(elevation);
    var a = deg(azimuth);
    return new THREE.Vector3(Math.cos(e) * Math.sin(a), Math.sin(e), Math.cos(e) * Math.cos(a)).normalize();
  }

  /* ---------------- 2. 状态与补间 ---------------- */

  var state = {
    weather: 'sunny',
    time: 'morning',
    // 默认收起 HUD 控制区：卡片仅留天气/时间/温度/日期读数，保证不遮挡主建筑；点「展开」即见两组切换控件
    collapsed: true,
    ready: false
  };

  var params = {};
  var target = {};
  var tween = null;
  var TRANSITION_MS = 900;

  function computeTarget() {
    var tw = TIMES[state.time];
    var w = WEATHER[state.weather];
    var fogColor = new THREE.Color(tw.fogColor);
    if (w.fogTint) fogColor.lerp(new THREE.Color(w.fogTint), w.fogTintAmt);

    var skyTop = new THREE.Color(tw.skyTop).lerp(new THREE.Color(0x9fa3a3), w.skyDesat);
    var skyBottom = new THREE.Color(tw.skyBottom).lerp(new THREE.Color(0x9fa3a3), w.skyDesat);
    skyTop.lerp(fogColor, w.skyDim * 0.75);
    skyBottom.lerp(fogColor, w.skyDim * 0.75);

    target = {
      sunIntensity: tw.sunIntensity * w.sunMul,
      sunColor: new THREE.Color(tw.sunColor).lerp(fogColor, w.skyDim * 0.5),
      elevation: tw.elevation,
      azimuth: tw.azimuth,
      ambient: tw.ambient * w.ambientMul,
      hemiSky: new THREE.Color(tw.hemiSky).lerp(fogColor, w.skyDim * 0.6),
      hemiGround: new THREE.Color(tw.hemiGround),
      hemi: tw.hemi * w.hemiMul,
      exposure: tw.exposure * w.exposureMul,
      fogColor: fogColor,
      fogDensity: tw.fogDensity * w.fogMul,
      skyTop: skyTop,
      skyBottom: skyBottom,
      glowColor: new THREE.Color(tw.glow),
      glow: 0.35 * (1 - w.skyDim * 0.5),
      star: tw.star,
      moon: tw.moon,
      glowIntensity: tw.glowIntensity * w.glowMul,
      celestial: new THREE.Color(tw.celestial).lerp(fogColor, w.skyDim * 0.5),
      celestialOpacity: 0.95 * (1 - w.skyDim * 0.75),
      waterRoughness: w.waterRough,
      waterColor: new THREE.Color(tw.skyBottom).lerp(new THREE.Color(w.waterTint), w.waterTintAmt),
      wetness: w.wetness,
      groundTintColor: new THREE.Color(w.groundTint),
      groundTintAmt: w.groundTintAmt,
      roofTintColor: new THREE.Color(w.roofTint),
      roofTintAmt: w.roofTintAmt,
      rainAmount: w.rain,
      snowAmount: w.snow,
      shadowStrength: w.shadowMul,
      fireflyAmount: tw.firefly * (1 - w.rain * 0.8) * (1 - w.snow),
      petalAmount: w.petal * (1 - tw.moon * 0.6)
    };
    return target;
  }

  function copyParams(from, to) {
    Object.keys(from).forEach(function (key) {
      if (from[key] instanceof THREE.Color) {
        if (!(to[key] instanceof THREE.Color)) to[key] = from[key].clone();
        else to[key].copy(from[key]);
      } else {
        to[key] = from[key];
      }
    });
  }

  function snapshotParams() {
    var copy = {};
    Object.keys(params).forEach(function (key) {
      copy[key] = params[key] instanceof THREE.Color ? params[key].clone() : params[key];
    });
    return copy;
  }

  function startTween() {
    if (!state.ready || reducedMotion) {
      copyParams(target, params);
      tween = null;
      return;
    }
    tween = { from: snapshotParams(), start: performance.now(), duration: TRANSITION_MS };
  }

  function updateTween(now) {
    if (!tween) return;
    var k = clamp((now - tween.start) / tween.duration, 0, 1);
    var e = easeOutCubic(k);
    Object.keys(target).forEach(function (key) {
      var from = tween.from[key];
      var to = target[key];
      if (to instanceof THREE.Color) {
        if (params[key] instanceof THREE.Color) params[key].copy(from).lerp(to, e);
        else params[key] = to.clone();
      } else {
        params[key] = lerp(from, to, e);
      }
    });
    if (k >= 1) tween = null;
  }

  function initParams() {
    ['sunIntensity', 'ambient', 'hemi', 'exposure', 'fogDensity', 'elevation', 'azimuth',
      'star', 'moon', 'glowIntensity', 'glow', 'celestialOpacity', 'waterRoughness', 'wetness',
      'groundTintAmt', 'roofTintAmt', 'rainAmount', 'snowAmount', 'shadowStrength',
      'fireflyAmount', 'petalAmount'
    ].forEach(function (k) { params[k] = 0; });
    ['sunColor', 'hemiSky', 'hemiGround', 'fogColor', 'skyTop', 'skyBottom', 'glowColor',
      'celestial', 'waterColor', 'groundTintColor', 'roofTintColor'
    ].forEach(function (k) { params[k] = new THREE.Color(0xffffff); });
    computeTarget();
    copyParams(target, params);
  }

  /* ---------------- 3. Canvas 纹理生成 ---------------- */

  function makeTexture(w, h, drawFn, repeatX, repeatY, isColor) {
    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    drawFn(c.getContext('2d'), w, h);
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 1, repeatY || 1);
    tex.anisotropy = 4;
    if (isColor !== false) tex.encoding = THREE.sRGBEncoding;
    return tex;
  }

  function speckle(ctx, w, h, count, color, alpha, size) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (var i = 0; i < count; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, size, size);
    }
    ctx.globalAlpha = 1;
  }

  function earthTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#6e7355';
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 0.55;
      for (var i = 0; i < 40; i++) {
        ctx.fillStyle = i % 3 === 0 ? '#596d3f' : (i % 3 === 1 ? '#7e8263' : '#4e6135');
        ctx.beginPath();
        ctx.ellipse(Math.random() * w, Math.random() * h, 12 + Math.random() * 28, 8 + Math.random() * 20, Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, w, h, 3000, '#464c2f', 0.35, 1.6);
      speckle(ctx, w, h, 1500, '#8d9272', 0.28, 1.4);
    }, 45, 45);
  }

  function plasterTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#f7f4ec';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 900, '#ded9cc', 0.32, 1.4);
      speckle(ctx, w, h, 400, '#ffffff', 0.45, 1.2);
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = '#b7b0a2';
      for (var i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * w, 0);
        ctx.lineTo(Math.random() * w, h);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }, 4, 4);
  }

  function roofTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#444a4f';
      ctx.fillRect(0, 0, w, h);
      var rows = 8;
      var rowH = h / rows;
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < 10; c++) {
          var offset = (r % 2) * (w / 20);
          var x = c * (w / 10) + offset;
          ctx.fillStyle = ['#4e5459', '#3f4449', '#545b61'][Math.floor(Math.random() * 3)];
          ctx.fillRect(x + 0.8, r * rowH + 0.8, w / 10 - 1.6, rowH - 1.6);
        }
        ctx.fillStyle = '#2c3135';
        ctx.fillRect(0, r * rowH, w, 1.6);
      }
      speckle(ctx, w, h, 700, '#6d757b', 0.22, 1.3);
    }, 8, 6);
  }

  function stoneTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#9b9890';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 1800, '#7c7971', 0.45, 1.5);
      speckle(ctx, w, h, 900, '#b8b5ac', 0.35, 1.3);
    }, 6, 6);
  }

  function woodTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#6a4e36';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#543d29';
      ctx.lineWidth = 1.2;
      for (var y = 2; y < h; y += 4 + Math.random() * 3) {
        ctx.globalAlpha = 0.4 + Math.random() * 0.3;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.33, y + Math.random() * 2 - 1, w * 0.66, y + Math.random() * 2 - 1, w, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      speckle(ctx, w, h, 400, '#402e1e', 0.3, 1.2);
    }, 4, 4);
  }

  function boatCanopyTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#242627';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#35373a';
      ctx.lineWidth = 1.5;
      for (var x = 0; x < w; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      speckle(ctx, w, h, 600, '#3f4245', 0.3, 1.2);
    }, 4, 2);
  }

  function streakTexture() {
    return makeTexture(8, 32, function (ctx, w, h) {
      var g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, 'rgba(226,238,248,0.95)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(w / 2 - 1, 0, 2, h);
    }, 1, 1, false);
  }

  function dotTexture() {
    return makeTexture(32, 32, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.55, 'rgba(255,255,255,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 1, 1, false);
  }

  function petalTexture() {
    return makeTexture(32, 32, function (ctx, w, h) {
      var cx = w / 2; var cy = h / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 12, 7, Math.PI / 4, 0, Math.PI * 2);
      var g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 14);
      g.addColorStop(0, 'rgba(255,215,230,0.95)');
      g.addColorStop(0.7, 'rgba(245,140,170,0.85)');
      g.addColorStop(1, 'rgba(220,90,130,0)');
      ctx.fillStyle = g;
      ctx.fill();
    }, 1, 1, false);
  }

  function fireflyTexture() {
    return makeTexture(32, 32, function (ctx, w, h) {
      var cx = w / 2; var cy = h / 2;
      var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16);
      g.addColorStop(0, 'rgba(235,255,140,1.0)');
      g.addColorStop(0.35, 'rgba(180,240,80,0.75)');
      g.addColorStop(0.7, 'rgba(120,220,50,0.3)');
      g.addColorStop(1, 'rgba(100,200,40,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 1, 1, false);
  }

  function waterfallFoamTexture() {
    return makeTexture(32, 32, function (ctx, w, h) {
      var g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.5, 'rgba(230,245,255,0.6)');
      g.addColorStop(1, 'rgba(210,235,250,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }, 1, 1, false);
  }

  /* ---------------- 4. 场景基础对象 ---------------- */

  var renderer = null;
  var scene = null;
  var camera = null;
  var controls = null;
  var sunLight = null;
  var moonLight = null;
  var hemiLight = null;
  var ambientLight = null;
  var sky = null;
  var skyUniforms = null;
  var stars = null;
  var celestial = null;

  var water = null;
  var waterGeo = null;
  var waterBaseY = null;
  var waterMat = null;
  var streamWater = null;
  var streamGeo = null;
  var streamBaseY = null;
  var eastStreamWater = null;
  var eastStreamGeo = null;
  var eastStreamBaseY = null;
  var outerCanalWater = null;

  var groundMat = null;
  var roofMats = [];
  var snowCoverMats = [];
  var windowPanels = [];
  var lampLights = [];
  var lampMaterial = null;
  var lampGlowMat = null;
  var stoneLanternGlowMat = null;
  var willowTrees = [];

  var waterShaderUniforms = {
    uTime: { value: 0 },
    uRainAmount: { value: 0 }
  };

  var windShaderUniforms = {
    uTime: { value: 0 },
    uWindStrength: { value: 0.3 }
  };

  var snowShaderUniform = {
    uSnowAmount: { value: 0 }
  };

  function applySnowAccumulation(mat, snowIntensity, isRoof) {
    if (!mat) return mat;
    snowIntensity = (snowIntensity !== undefined) ? snowIntensity : 1.0;
    isRoof = !!isRoof;
    mat.customProgramCacheKey = function () {
      return 'snow_' + (isRoof ? 'r_' : 'g_') + snowIntensity.toFixed(2);
    };
    var prevOnBefore = mat.onBeforeCompile;
    mat.onBeforeCompile = function (shader, renderer) {
      if (prevOnBefore) prevOnBefore(shader, renderer);
      shader.uniforms.uSnowAmount = snowShaderUniform.uSnowAmount;

      shader.fragmentShader = 'uniform float uSnowAmount;\n' + shader.fragmentShader;

      var snowThreshold = isRoof ? 'smoothstep(-0.25, 0.15, snowUp)' : 'smoothstep(0.05, 0.52, snowUp)';
      var minUp = isRoof ? '-0.25' : '0.05';

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_physical_fragment>',
        '  if (uSnowAmount > 0.005) {\n' +
        '    vec3 viewUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);\n' +
        '    float snowUp = dot(normal, viewUp);\n' +
        '    if (snowUp > ' + minUp + ') {\n' +
        '      float snowFactor = ' + snowThreshold + ' * uSnowAmount * ' + snowIntensity.toFixed(2) + ';\n' +
        '      vec3 snowColor = vec3(0.97, 0.98, 1.0);\n' +
        '      diffuseColor.rgb = mix(diffuseColor.rgb, snowColor, snowFactor * 0.96);\n' +
        '      roughnessFactor = mix(roughnessFactor, 0.96, snowFactor);\n' +
        '      metalnessFactor = mix(metalnessFactor, 0.02, snowFactor);\n' +
        '    }\n' +
        '  }\n' +
        '#include <lights_physical_fragment>'
      );
    };
    return mat;
  }

  var rain = null;
  var snow = null;
  var petals = null;
  var fireflies = null;

  var koiGroup = [];
  var redKoiData = null;
  var turtleData = null;
  var geeseData = [];
  var leftKoiGroup = []; // 左侧新增大水池锦鲤群
  var boatMesh = null;
  var boatLanternLight = null;

  // 坐标布局常数
  // 再次抬高的水面标高：水波振幅 ±0.13，波峰 0.47、波谷 0.21，
  // 波谷仍远高于池底 0.02，水面波动时不会露出池底或下方地皮；
  // 所有水面物体的标高均以本常量为基准或另行抬高，保证不被水淹。
  var WATER_Y = 0.34;
  // 水面与池底严格闭锁在围栏以内，外部不露出一丝水域
  var LAKE_EDGE = 0.0;
  // 大湖布局：东西横跨 x: -17.5 ~ +17.5（宽 35m），南北跨 z: -1.5 ~ +18.2（深 19.7m），严丝合缝紧锁于围栏内界
  var LAKE_X = 0.0;
  var LAKE_Z = 8.35;
  var LAKE_W = 35.0;
  var LAKE_D = 19.7;
  var HALL_Z = -10; // 远香正殿在北岸 (z=-10)，面朝正南 (+z 湖面)，坐落于平地之上（z < -10 为后园平地）

  function addMesh(geo, mat, x, y, z, opts) {
    var mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x || 0, y || 0, z || 0);
    opts = opts || {};
    if (opts.rotX) mesh.rotation.x = opts.rotX;
    if (opts.rotY) mesh.rotation.y = opts.rotY;
    if (opts.rotZ) mesh.rotation.z = opts.rotZ;
    if (opts.scale) mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
    if (opts.cast) mesh.castShadow = true;
    if (opts.receive) mesh.receiveShadow = true;
    (opts.parent || scene).add(mesh);
    return mesh;
  }

  function lanternMaterial() {
    if (!lampGlowMat) {
      lampGlowMat = new THREE.MeshStandardMaterial({
        color: COL.lanternRed, emissive: COL.lanternWarm, emissiveIntensity: 0, roughness: 0.55
      });
    }
    return lampGlowMat;
  }

  function stoneLanternGlow() {
    if (!stoneLanternGlowMat) {
      stoneLanternGlowMat = new THREE.MeshStandardMaterial({
        color: 0xffd27d, emissive: 0xffa033, emissiveIntensity: 0, roughness: 0.45
      });
    }
    return stoneLanternGlowMat;
  }

  /* ---------------- 5. 平地全景地形基底（全部为平地，不生成任何高地形） ---------------- */

  function buildGround() {
    // 1. 超大 600m 全景大地坪（彻底占满视野，无任何空白边界）
    var ground = addMesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshStandardMaterial({ map: earthTexture(), roughness: 0.94, metalness: 0.04 }),
      0, 0, 0, { rotX: -Math.PI / 2, receive: true }
    );
    groundMat = ground.material;
    applySnowAccumulation(groundMat, 1.0);

    var grassMat = new THREE.MeshStandardMaterial({ color: COL.grass, roughness: 0.92, flatShading: true });
    applySnowAccumulation(grassMat, 1.0);
    var mossMat = new THREE.MeshStandardMaterial({ color: COL.moss, roughness: 0.95, flatShading: true });
    applySnowAccumulation(mossMat, 1.0);
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.90 });
    applySnowAccumulation(stoneMat, 1.0);
    var plinthStoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.88 });
    applySnowAccumulation(plinthStoneMat, 1.0);

    // 2. 正殿基础台座（全部采用灰色青石台基，彻底由绿草皮改为灰色石质，与主殿台座质感完美融合）
    //    南面正中留出 9.6m 宽台阶洞口：踏步自水面直登台座，不再被台座土体埋住、挡住去路
    (function () {
      var PLINTH_W = 34, PLINTH_H = 0.95, PLINTH_D = 18;
      var STAIR_OPEN = 9.6;
      var PLINTH_BACK = HALL_Z - PLINTH_D / 2;      // -19
      var PLINTH_FRONT = HALL_Z + PLINTH_D / 2;     // -1
      var SLOT_BACK = HALL_Z + PLINTH_D / 2 - 1.6;  // -2.6 洞口后沿
      // 洞口之后：满宽台座（灰色石质台基）
      addMesh(new THREE.BoxGeometry(PLINTH_W, PLINTH_H, SLOT_BACK - PLINTH_BACK), plinthStoneMat,
        0, PLINTH_H / 2, (PLINTH_BACK + SLOT_BACK) / 2, { receive: true, cast: !isMobile });
      // 洞口两侧：夹出通行洞口的翼墙式台座（灰色石质台基）
      var sideW = (PLINTH_W - STAIR_OPEN) / 2;
      [-1, 1].forEach(function (side) {
        addMesh(new THREE.BoxGeometry(sideW, PLINTH_H, PLINTH_FRONT - SLOT_BACK), plinthStoneMat,
          side * (STAIR_OPEN / 2 + sideW / 2), PLINTH_H / 2, (SLOT_BACK + PLINTH_FRONT) / 2,
          { receive: true, cast: !isMobile });
      });
    })();

    // 2.1 正殿后堂平坦庭院（深度 4.5m，提供典雅后院退让进深）
    addMesh(new THREE.BoxGeometry(32, 1.0, 4.5), stoneMat, 0, 0.5, -21.25, { receive: true });
    // 后院青石界石压边（贴地压边石，非坡地）
    addMesh(new THREE.BoxGeometry(34, 0.45, 0.6), stoneMat, 0, 1.0, -23.5, { receive: true, cast: !isMobile });

    // 3. 平地绿茵：全部贴在平地标高上的薄层草甸与苔痕，不产生任何隆起地形
    [[-32, 30, 9], [32, 30, 9], [0, 27, 6], [-50, 6, 10], [50, 6, 10]].forEach(function (lawn) {
      addMesh(new THREE.CircleGeometry(lawn[2], 12), grassMat,
        lawn[0], 0.03, lawn[1], { rotX: -Math.PI / 2, receive: true });
      addMesh(new THREE.CircleGeometry(lawn[2] * 0.42, 10), mossMat,
        lawn[0] + 1.6, 0.05, lawn[1] - 1.2, { rotX: -Math.PI / 2, receive: true });
    });
  }

  /* ---------------- 6. 水系、溪涧与飞瀑（殿前宽广开阔大湖，无遮挡开朗大局） ---------------- */

  function buildWater() {
    var bedMat = new THREE.MeshStandardMaterial({ color: COL.waterDeep, roughness: 0.98 });

    // 1. 大湖池底：覆盖整片主水面，严格闭合在围栏内
    addMesh(new THREE.PlaneGeometry(LAKE_W, LAKE_D), bedMat,
      LAKE_X, 0.02, LAKE_Z, { rotX: -Math.PI / 2, receive: true });

    // 2. 殿前大水池：东西横跨 x: -17.5 ~ +17.5，南北纵深 z: -1.5 ~ +18.2，严格在围栏以内，围栏外部绝无溢出水域
    var segX = isMobile ? 48 : 64;
    var segZ = isMobile ? 32 : 48;
    waterGeo = new THREE.PlaneGeometry(LAKE_W, LAKE_D, segX, segZ);
    waterGeo.rotateX(-Math.PI / 2);
    waterBaseY = new Float32Array(waterGeo.attributes.position.array.length);
    waterBaseY.set(waterGeo.attributes.position.array);

    waterMat = new THREE.MeshStandardMaterial({
      color: COL.water, roughness: 0.09, metalness: 0.32, transparent: true, opacity: 0.93,
      side: THREE.DoubleSide
    });

    // 动态水面：雨天 Shader 程序化生成高密涟漪法线（适度疏朗20%），雨停后平静如镜积水倒影，雪天冰封雪盖
    waterMat.onBeforeCompile = function (shader) {
      shader.uniforms.uWaterTime = waterShaderUniforms.uTime;
      shader.uniforms.uRainRipple = waterShaderUniforms.uRainAmount;
      shader.uniforms.uSnowAmount = snowShaderUniform.uSnowAmount;

      shader.vertexShader = 'varying vec3 vGardenWorldPos;\n' + shader.vertexShader.replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n  vGardenWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

      shader.fragmentShader = 'uniform float uWaterTime;\nuniform float uRainRipple;\nuniform float uSnowAmount;\nvarying vec3 vGardenWorldPos;\n' +
        'vec2 hashRipple(vec2 p) {\n' +
        '  p = fract(p * vec2(5.3983, 5.4427));\n' +
        '  p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));\n' +
        '  return fract(vec2(p.x * p.y * 95.4337, p.x * p.y * 97.597));\n' +
        '}\n' +
        'vec2 calcRipples(vec2 uv, float t) {\n' +
        '  vec2 p = uv * 2.8;\n' + // 降低 20% 空间密度，涟漪疏落有致更显自然
        '  vec2 ip = floor(p);\n' +
        '  vec2 fp = fract(p);\n' +
        '  vec2 totalGrad = vec2(0.0);\n' +
        '  for (int j = -1; j <= 1; j++) {\n' +
        '    for (int i = -1; i <= 1; i++) {\n' +
        '      vec2 g = vec2(float(i), float(j));\n' +
        '      vec2 cell = ip + g;\n' +
        '      vec2 rnd = hashRipple(cell);\n' +
        '      float phase = fract(t * 1.5 + rnd.x);\n' +
        '      vec2 delta = fp - (g + rnd);\n' +
        '      float d = length(delta);\n' +
        '      float waveRadius = phase * 0.62;\n' +
        '      float waveDist = d - waveRadius;\n' +
        '      float wave = sin(clamp(waveDist * 28.0, -3.14159, 3.14159));\n' +
        '      float fade = (1.0 - phase) * smoothstep(waveRadius + 0.16, waveRadius, d) * smoothstep(0.0, waveRadius, d);\n' +
        '      if (d > 0.001) totalGrad += (delta / d) * wave * fade;\n' +
        '    }\n' +
        '  }\n' +
        '  return totalGrad;\n' +
        '}\n' + shader.fragmentShader;

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\n' +
        '  if (uRainRipple > 0.005) {\n' +
        '    vec2 rGrad = calcRipples(vGardenWorldPos.xz, uWaterTime) + calcRipples(vGardenWorldPos.xz * 1.6 + vec2(17.3, 31.7), uWaterTime * 1.35) * 0.45;\n' +
        '    vec3 worldNorm = normalize(vec3(-rGrad.x * 1.25 * uRainRipple, 1.0, -rGrad.y * 1.25 * uRainRipple));\n' +
        '    normal = normalize((viewMatrix * vec4(worldNorm, 0.0)).xyz);\n' +
        '  }\n'
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        '#include <color_fragment>\n' +
        '  if (uRainRipple > 0.01) {\n' +
        '    vec2 rGradRing = calcRipples(vGardenWorldPos.xz, uWaterTime);\n' +
        '    float rippleFoam = length(rGradRing);\n' +
        '    diffuseColor.rgb += vec3(0.08, 0.12, 0.14) * clamp(rippleFoam * 0.70, 0.0, 1.0) * uRainRipple;\n' +
        '  }\n' +
        '  if (uSnowAmount > 0.005) {\n' +
        '    vec3 iceSnow = vec3(0.91, 0.94, 0.98);\n' +
        '    diffuseColor.rgb = mix(diffuseColor.rgb, iceSnow, uSnowAmount * 0.95);\n' +
        '  }\n'
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\n' +
        '  if (uSnowAmount > 0.005) {\n' +
        '    roughnessFactor = mix(roughnessFactor, 0.88, uSnowAmount);\n' +
        '  }\n'
      );
    };
    water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(LAKE_X, WATER_Y, LAKE_Z);
    water.receiveShadow = true;
    scene.add(water);

    // 3. 【左侧西侧月牙水湾深湾】：紧贴西侧弧形栅栏全面铺展，水面饱满充盈，小飞虹石拱桥横跨其上
    // 采用精准的顺滑多边形轮廓，严密贴合栅栏走向，池岸严格吻合石拱桥底端两角（[-26.24, 4.77] 与 [-24.67, 8.01]）
    var bayShape = new THREE.Shape();
    var bayPoints3D = [
      [-17.4, -1.4],
      [-20.5, -2.4],
      [-23.4, -2.85],
      [-25.8, -1.2],
      [-26.8, 1.5],
      [-26.24, 4.77], // 紧扣小飞虹拱桥西桥台北角
      [-24.67, 8.01], // 紧扣小飞虹拱桥西桥台南角（桥下水流直通）
      [-25.8, 11.0],
      [-23.4, 15.35],
      [-20.5, 16.5],
      [-17.4, 17.3]
    ];
    bayShape.moveTo(bayPoints3D[0][0], -bayPoints3D[0][1]);
    for (var bi = 1; bi < bayPoints3D.length; bi++) {
      bayShape.lineTo(bayPoints3D[bi][0], -bayPoints3D[bi][1]);
    }
    bayShape.lineTo(bayPoints3D[0][0], -bayPoints3D[0][1]);

    streamGeo = new THREE.ShapeGeometry(bayShape, 24);
    streamGeo.rotateX(-Math.PI / 2);
    streamBaseY = new Float32Array(streamGeo.attributes.position.array.length);
    streamBaseY.set(streamGeo.attributes.position.array);

    streamWater = new THREE.Mesh(streamGeo, waterMat);
    streamWater.position.set(0, WATER_Y, 0);
    streamWater.receiveShadow = true;
    scene.add(streamWater);

    var bayBedGeo = new THREE.ShapeGeometry(bayShape, 16);
    bayBedGeo.rotateX(-Math.PI / 2);
    addMesh(bayBedGeo, bedMat, 0, 0.02, 0, { receive: true });

    // 3.2 【右侧东侧水亭侧不规则水池水湾】：打破原死板直线水岸，呈现“两湾夹一矶”的自然曲折形态
    // 包含东北涵青水湾、东侧探水石矶、东南阔水荷湾，形态跌宕起伏，绝不与西侧月牙单弧雷同对称
    var eastBayShape = new THREE.Shape();
    var eastBayPoints3D = [
      [17.4, -1.4],
      [20.2, -0.8],
      [22.4, 2.0],
      [21.6, 5.0],
      [19.5, 8.0],  // 东向探水石矶（隔水遥对荷风水亭）
      [21.2, 10.5],
      [24.2, 13.5], // 东南深阔荷花幽湾
      [23.4, 16.0],
      [20.8, 17.5],
      [17.4, 18.0]
    ];
    eastBayShape.moveTo(eastBayPoints3D[0][0], -eastBayPoints3D[0][1]);
    for (var ebi = 1; ebi < eastBayPoints3D.length; ebi++) {
      eastBayShape.lineTo(eastBayPoints3D[ebi][0], -eastBayPoints3D[ebi][1]);
    }
    eastBayShape.lineTo(eastBayPoints3D[0][0], -eastBayPoints3D[0][1]);

    eastStreamGeo = new THREE.ShapeGeometry(eastBayShape, 24);
    eastStreamGeo.rotateX(-Math.PI / 2);
    eastStreamBaseY = new Float32Array(eastStreamGeo.attributes.position.array.length);
    eastStreamBaseY.set(eastStreamGeo.attributes.position.array);

    eastStreamWater = new THREE.Mesh(eastStreamGeo, waterMat);
    eastStreamWater.position.set(0, WATER_Y, 0);
    eastStreamWater.receiveShadow = true;
    scene.add(eastStreamWater);

    var eastBayBedGeo = new THREE.ShapeGeometry(eastBayShape, 16);
    eastBayBedGeo.rotateX(-Math.PI / 2);
    addMesh(eastBayBedGeo, bedMat, 0, 0.02, 0, { receive: true });

    // 4. 池岸自然青石驳岸
    buildEmbankment();

    // 5. 【木质栅栏护栏】：全面严密围护水域，并在小飞虹桥头预留畅达登桥豁口
    buildWoodenLakeFence();

    // 6. 亲水码头与溪涧汀步
    buildWaterWharf();
    buildSteppingStones();
  }

  // 5.1 【木质栅栏护栏】：全面严密围护主屋左侧大水池、西月牙湾以及右侧水亭池周围
  function buildWoodenLakeFence() {
    var g = new THREE.Group();
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.82 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.80 });

    var fenceWaypoints = [
      // 1.1 北岸东段（中轴直廊西侧至斜向登殿台阶东侧）
      [[-1.8, -1.5], [-5.5, -1.5], [-9.0, -1.5]],
      // 1.2 【斜向登殿通道豁口】：x: -9.0 ~ -13.0 留出通达豁口，供小飞虹斜向石阶无缝直通主屋前堂
      // 1.3 北岸西段（斜向登殿台阶西侧至西弧形水湾起点）
      [[-13.0, -1.5], [-17.5, -1.5]],
      // 2.1 西侧月牙水湾北段木栅栏（自北岸延展至小飞虹石拱桥北侧端柱）
      [[-17.5, -1.5], [-23.5, -3.0], [-26.0, -1.0], [-27.0, 1.5], [-26.24, 4.77]],
      // 2.2 【小飞虹桥头畅达通途】：[-26.24, 4.77] 至 [-24.67, 8.01] 间 3.6m 桥面入口完全敞开，绝不与石桥重叠！
      // 2.3 西侧月牙水湾南段木栅栏（自小飞虹石拱桥南侧端柱延伸至西南拐角）
      [[-24.67, 8.01], [-25.8, 11.0], [-23.5, 15.5], [-17.5, 17.5]],
      // 3. 西南角至西码头西侧
      [[-17.5, 17.5], [-17.5, 18.2], [-14.5, 18.2]],
      // 4. 西码头东侧至中轴长走廊南端
      [[-9.5, 18.2], [-5.0, 18.2], [-1.8, 18.2]],
      // 5. 中轴长走廊南端东侧至东南拐角
      [[1.8, 18.2], [7.0, 18.2], [12.0, 18.2], [17.5, 18.2]],
      // 6. 【东岸亭子侧自然曲折木栅栏】：紧扣不规则水池岸线，依水就势，形成折角多姿的水滨围护
      [
        [17.5, -1.5],
        [20.4, -0.9],
        [22.6, 1.9],
        [21.8, 4.9],
        [19.7, 7.9],  // 随石矶探水收束
        [21.4, 10.4],
        [24.4, 13.4], // 随东南荷湾展开
        [23.6, 15.9],
        [21.0, 17.4],
        [17.5, 18.2]
      ],
      // 7. 北岸东段（东北角至水亭石阶东侧）
      [[17.5, -1.5], [12.5, -1.5]],
      // 8. 水亭石阶西侧至长走廊东侧
      [[8.8, -1.5], [5.0, -1.5], [1.8, -1.5]]
    ];

    fenceWaypoints.forEach(function (path) {
      for (var i = 0; i < path.length - 1; i++) {
        var p1 = path[i];
        var p2 = path[i + 1];
        var dx = p2[0] - p1[0];
        var dz = p2[1] - p1[1];
        var len = Math.hypot(dx, dz);
        if (len < 0.2) continue;
        var mx = (p1[0] + p2[0]) / 2;
        var mz = (p1[1] + p2[1]) / 2;
        var rotY = -Math.atan2(dz, dx);

        var seg = new THREE.Group();
        seg.position.set(mx, 0, mz);
        seg.rotation.y = rotY;

        // 地栿下枋
        addMesh(new THREE.BoxGeometry(len, 0.08, 0.08), woodDarkMat, 0, 0.22, 0, { parent: seg });
        // 寻杖上扶手横木
        addMesh(new THREE.BoxGeometry(len, 0.10, 0.10), woodMat, 0, 0.82, 0, { parent: seg });
        // 中间均布木直棂立条
        var slatCount = Math.max(1, Math.round(len / 0.28));
        for (var s = 0; s <= slatCount; s++) {
          var sx = -len / 2 + (len * s) / slatCount;
          addMesh(new THREE.BoxGeometry(0.04, 0.52, 0.04), woodDarkMat, sx, 0.52, 0, { parent: seg });
        }
        // 端部木望柱
        [-len / 2, len / 2].forEach(function (px) {
          addMesh(new THREE.CylinderGeometry(0.07, 0.08, 0.85, 8), woodDarkMat, px, 0.45, 0, { parent: seg, cast: true });
          addMesh(new THREE.SphereGeometry(0.09, 8, 8), woodDarkMat, px, 0.90, 0, { parent: seg });
        });

        g.add(seg);
      }
    });

    scene.add(g);
  }

  function buildEmbankment() {
    var rockMat = new THREE.MeshStandardMaterial({
      map: stoneTexture(), color: 0xb5b2a6, roughness: 0.88, flatShading: true
    });
    snowCoverMats.push(rockMat);
    applySnowAccumulation(rockMat, 0.9);
    var rectCount = isMobile ? 80 : 130;
    var eastRockCount = isMobile ? 22 : 36;
    var totalCount = rectCount + eastRockCount;
    var bank = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.70, 0), rockMat, totalCount);
    var m = new THREE.Matrix4(); var q = new THREE.Quaternion(); var p = new THREE.Vector3(); var s = new THREE.Vector3();
    var rnd = makeRandom(31);

    var idx = 0;
    for (var i = 0; i < rectCount; i++) {
      var ang = (i / rectCount) * Math.PI * 2;
      var rx = LAKE_X + Math.cos(ang) * (LAKE_W / 2 + 0.4) + (rnd() - 0.5) * 0.9;
      var rz = LAKE_Z + Math.sin(ang) * (LAKE_D / 2 + 0.4) + (rnd() - 0.5) * 0.9;
      var sc = 0.65 + rnd() * 0.85;
      // 避让码头、中轴直廊、走廊连桥、水亭石阶、西侧月牙湾，以及彻底消除原东侧死板直线叠石（rx > 16.5）
      var skip = (Math.abs(rx + 12.0) < 3.5 && Math.abs(rz - 15.0) < 3.0) ||
                 (Math.abs(rx) < 2.4 && Math.abs(rz - 18.0) < 2.0) ||
                 (Math.abs(rx - 3.0) < 2.2 && Math.abs(rz - 8.5) < 2.0) ||
                 (Math.abs(rx - 10.5) < 2.2 && Math.abs(rz - (-0.5)) < 2.0) ||
                 (Math.abs(rx + 20.5) < 2.5 && Math.abs(rz - 4.0) < 2.5) ||
                 (rx > 16.5 && rz > -2.0 && rz < 18.5) ||
                 (rx < -16.0 && rz > -0.5 && rz < 16.5) ||
                 (rx > -16.5 && rx < -10.5 && rz > -1.5 && rz < 3.2);
      p.set(rx, skip ? -120 : sc * 0.38, rz);
      q.setFromEuler(new THREE.Euler(rnd() * 0.4, rnd() * 3, rnd() * 0.4));
      s.set(sc, sc * 0.70, sc);
      m.compose(p, q, s);
      bank.setMatrixAt(idx++, m);
    }

    // 沿东侧不规则水湾（亭子侧）自然岸线与探水石矶铺设自然叠石驳岸
    var eastBayPts = [
      [17.4, -1.4], [20.2, -0.8], [22.4, 2.0], [21.6, 5.0], [19.5, 8.0],
      [21.2, 10.5], [24.2, 13.5], [23.4, 16.0], [20.8, 17.5], [17.4, 18.0]
    ];
    for (var k = 0; k < eastRockCount; k++) {
      var t = k / (eastRockCount - 1);
      var segIdx = Math.min(eastBayPts.length - 2, Math.floor(t * (eastBayPts.length - 1)));
      var segT = (t * (eastBayPts.length - 1)) - segIdx;
      var pA = eastBayPts[segIdx];
      var pB = eastBayPts[segIdx + 1];
      var erx = lerp(pA[0], pB[0], segT) + (rnd() - 0.5) * 0.40;
      var erz = lerp(pA[1], pB[1], segT) + (rnd() - 0.5) * 0.40;
      var esc = 0.65 + rnd() * 0.75;
      // 矶头（x ~ 19.5, z ~ 8.0）处堆叠更显苍古雄健的矾头叠石
      if (Math.hypot(erx - 19.5, erz - 8.0) < 2.0) {
        esc *= 1.30;
      }
      p.set(erx, esc * 0.38, erz);
      q.setFromEuler(new THREE.Euler(rnd() * 0.4, rnd() * 3, rnd() * 0.4));
      s.set(esc, esc * 0.70, esc);
      m.compose(p, q, s);
      bank.setMatrixAt(idx++, m);
    }

    bank.instanceMatrix.needsUpdate = true;
    bank.receiveShadow = true;
    bank.castShadow = !isMobile;
    scene.add(bank);
  }

  function buildWaterWharf() {
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.88 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var mossMat = new THREE.MeshStandardMaterial({ color: COL.moss, roughness: 0.95 });
    applySnowAccumulation(mossMat, 1.0);

    // 湖西南侧沉水青石踏步码头（位于左侧大水池西南角）
    addMesh(new THREE.BoxGeometry(5.0, 0.24, 1.5), stoneMat, 0, 0.44, 0, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(4.6, 0.24, 1.3), stoneMat, 0, 0.28, 1.1, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(4.2, 0.24, 1.2), stoneMat, 0, 0.14, 2.1, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(3.8, 0.24, 1.1), stoneMat, 0, 0.02, 3.0, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(3.7, 0.04, 1.0), mossMat, 0, 0.06, 3.0, { parent: g, receive: true });

    [-2.0, 2.0].forEach(function (bx) {
      addMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.85, 8), stoneMat, bx, 0.55, 0.2, { parent: g, cast: true });
      addMesh(new THREE.SphereGeometry(0.16, 8, 8), stoneMat, bx, 0.98, 0.2, { parent: g });
    });

    // 台阶基座
    addMesh(new THREE.BoxGeometry(5.6, 0.42, 4.6), stoneMat, 0, -0.21, 1.4, { parent: g, cast: true, receive: true });

    g.position.set(-12.0, 0.42, 14.5);
    scene.add(g);
  }

  function buildSteppingStones() {
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0x8a8880, roughness: 0.92, flatShading: true });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    // 漫水汀步：优雅横跨桥南开阔月牙水湾，连接西岸与西南码头，绝不与小飞虹桥墩或桥阶重叠穿模
    var steps = [
      [-21.5, 9.5], [-19.5, 10.8], [-17.5, 11.8], [-15.5, 12.5], [-13.5, 13.0]
    ];
    var rnd = makeRandom(75);
    steps.forEach(function (pt) {
      var h = 0.26 + rnd() * 0.06;
      var r = 0.55 + rnd() * 0.15;
      addMesh(new THREE.CylinderGeometry(r * 0.9, r, h, 7), stoneMat,
        pt[0], WATER_Y + h / 2 - 0.04, pt[1], { rotY: rnd() * Math.PI, cast: true, receive: true });
    });
  }

  

  /* ---------------- 7. 多主体殿堂建筑群（大地图多屋宇体系，全部坐落于平地） ---------------- */

  // 1. 【远香正殿】：北岸坐北朝南主殿，汉白玉台座直接坐落于平地，面朝湖水
  function buildMainHall() {
    var hall = new THREE.Group();
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: COL.plaster, roughness: 0.88 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.78 });
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.82 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);

    // 提高主屋基础与地板标高（自 1.2m 抬至 1.35m，并在其上架设独立实木金砖地坪，彻底根除地坪与地面共面频闪“屏山”Bug）
    var baseH = 1.35;
    var floorThickness = 0.22;
    var floorTopY = baseH + floorThickness; // Y = 1.57m 室内净地坪高度

    // 汉白玉台座（面朝正南 +z，高于地坪，石雕稳重）
    addMesh(new THREE.BoxGeometry(28, baseH, 15), stoneMat, 0, baseH / 2, HALL_Z, { parent: hall, cast: true, receive: true });

    // 独立架空室内实木金砖地坪：完全架于台座顶面之上，杜绝共面与底层穿透
    var floorMat = new THREE.MeshStandardMaterial({
      map: woodTexture(), color: 0x3d2b1c, roughness: 0.65, metalness: 0.05
    });
    addMesh(new THREE.BoxGeometry(23.8, floorThickness, 11.6), floorMat, 0, baseH + floorThickness / 2, HALL_Z,
      { parent: hall, receive: true });

    // 朝南垂带踏步台阶（从抬高的台座面向南面大湖延伸下来）
    var STAIR_TOP = 0.56;
    var STAIR_COUNT = 6;
    var STAIR_RUN = 0.44;
    var STAIR_FRONT = -0.10; // 最低一踏南缘 z
    for (var st = 0; st < STAIR_COUNT; st++) {
      var stepTop = STAIR_TOP + st * ((baseH - STAIR_TOP) / STAIR_COUNT);
      var sz = STAIR_FRONT - STAIR_RUN / 2 - st * STAIR_RUN;
      addMesh(new THREE.BoxGeometry(9, stepTop, STAIR_RUN), stoneMat, 0, stepTop / 2, sz, { parent: hall, cast: true, receive: true });
    }
    // 台座周围石雕莲花栏杆
    buildStoneBalustrade(hall, 28, 15, baseH, HALL_Z);

    // 金柱与柱础石（稳稳立于抬高的室内地板之上）
    var colXs = [-11.5, -4.5, 4.5, 11.5];
    var colZs = [HALL_Z - 5.8, HALL_Z, HALL_Z + 5.8];
    colXs.forEach(function (cx) {
      colZs.forEach(function (cz) {
        addMesh(new THREE.CylinderGeometry(0.38, 0.46, 0.25, 8), stoneMat, cx, floorTopY + 0.12, cz, { parent: hall });
        addMesh(new THREE.CylinderGeometry(0.28, 0.32, 5.2, 8), woodMat, cx, floorTopY + 2.8, cz, { parent: hall, cast: true });
      });
    });

    // 额枋梁架
    [-5.8, 5.8].forEach(function (dz) {
      addMesh(new THREE.BoxGeometry(26.4, 0.46, 0.42), woodDarkMat, 0, floorTopY + 5.2, HALL_Z + dz, { parent: hall, cast: true });
    });
    colXs.forEach(function (cx) {
      addMesh(new THREE.BoxGeometry(0.42, 0.46, 12), woodDarkMat, cx, floorTopY + 5.2, HALL_Z, { parent: hall, cast: true });
    });

    // 木斗拱出挑层
    var dougongXs = [-11.5, -9.2, -6.9, -4.5, -2.2, 0, 2.2, 4.5, 6.9, 9.2, 11.5];
    dougongXs.forEach(function (dx) {
      [-5.9, 5.9].forEach(function (dz) {
        addMesh(new THREE.BoxGeometry(0.48, 0.16, 0.48), woodDarkMat, dx, floorTopY + 5.5, HALL_Z + dz, { parent: hall });
        addMesh(new THREE.BoxGeometry(0.34, 0.14, 0.85), woodMat, dx, floorTopY + 5.65, HALL_Z + dz, { parent: hall });
      });
    });

    // 后墙（实墙）与两侧山墙
    addMesh(new THREE.BoxGeometry(24, 4.8, 0.4), plasterMat, 0, floorTopY + 2.4, HALL_Z - 5.8, { parent: hall, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(0.4, 4.8, 12), plasterMat, -12, floorTopY + 2.4, HALL_Z, { parent: hall, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(0.4, 4.8, 12), plasterMat, 12, floorTopY + 2.4, HALL_Z, { parent: hall, cast: true, receive: true });

    // 前立面：朝南开启的花格槅扇长门与两侧对称古典半透十字圆窗
    var frontShape = new THREE.Shape();
    frontShape.moveTo(-12, 0); frontShape.lineTo(12, 0); frontShape.lineTo(12, 4.8); frontShape.lineTo(-12, 4.8); frontShape.lineTo(-12, 0);
    var doorHole = new THREE.Path();
    doorHole.moveTo(-3.6, 0); doorHole.lineTo(3.6, 0); doorHole.lineTo(3.6, 4.0); doorHole.lineTo(-3.6, 4.0); doorHole.lineTo(-3.6, 0);
    frontShape.holes.push(doorHole);
    // 左右对称两扇古典圆形花窗（直径 2.9m）
    var leftWin = new THREE.Path();
    leftWin.absarc(-7.8, 2.4, 1.45, 0, Math.PI * 2, true);
    frontShape.holes.push(leftWin);
    var rightWin = new THREE.Path();
    rightWin.absarc(7.8, 2.4, 1.45, 0, Math.PI * 2, true);
    frontShape.holes.push(rightWin);

    addMesh(new THREE.ExtrudeGeometry(frontShape, { depth: 0.35, bevelEnabled: false }),
      plasterMat, 0, floorTopY, HALL_Z + 5.6, { parent: hall, cast: true, receive: true });

    // 半透纸窗材质（江南古典绢纸纱窗，透光柔和、质感细腻）
    var paperWindowMat = new THREE.MeshStandardMaterial({
      color: 0xf5f0e1,
      roughness: 0.88,
      metalness: 0.02,
      transparent: true,
      opacity: 0.68,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    // 左右两侧圆形窗户：均装饰古典十字木格，并附上半透纸窗
    [-7.8, 7.8].forEach(function (wx) {
      // 外凸木质圆框
      addMesh(new THREE.TorusGeometry(1.48, 0.09, 6, 32), woodDarkMat, wx, floorTopY + 2.4, HALL_Z + 5.96, { parent: hall });
      // 半透纸窗盘面
      addMesh(new THREE.CircleGeometry(1.44, 32), paperWindowMat, wx, floorTopY + 2.4, HALL_Z + 5.78, { parent: hall });
      // 正中“十字”木花格
      addMesh(new THREE.BoxGeometry(2.88, 0.07, 0.08), woodDarkMat, wx, floorTopY + 2.4, HALL_Z + 5.80, { parent: hall });
      addMesh(new THREE.BoxGeometry(0.07, 2.88, 0.08), woodDarkMat, wx, floorTopY + 2.4, HALL_Z + 5.80, { parent: hall });
    });

    // 大门外框架系统：实木门槛、门楣与两侧立柱，彻底遮盖开孔缝隙，彻底杜绝任何视角的屏闪
    addMesh(new THREE.BoxGeometry(7.4, 0.18, 0.42), woodDarkMat, 0, floorTopY + 0.09, HALL_Z + 5.78, { parent: hall, cast: true });
    addMesh(new THREE.BoxGeometry(7.4, 0.22, 0.42), woodDarkMat, 0, floorTopY + 4.0, HALL_Z + 5.78, { parent: hall, cast: true });
    addMesh(new THREE.BoxGeometry(0.16, 3.82, 0.40), woodDarkMat, -3.62, floorTopY + 2.0, HALL_Z + 5.78, { parent: hall, cast: true });
    addMesh(new THREE.BoxGeometry(0.16, 3.82, 0.40), woodDarkMat, 3.62, floorTopY + 2.0, HALL_Z + 5.78, { parent: hall, cast: true });
    addMesh(new THREE.BoxGeometry(0.08, 3.82, 0.16), woodDarkMat, 0, floorTopY + 2.0, HALL_Z + 5.82, { parent: hall });

    // 四扇加高主殿槅扇长门（门高提升至 3.76m，自门槛直插门楣内槽，下接门槛、上扣门楣，零缝隙、零共面屏闪）
    var doorLeafXs = [-2.65, -0.90, 0.90, 2.65];
    for (var d = 0; d < 4; d++) {
      var dx2 = doorLeafXs[d];
      // 主门扇板（高 3.76m，稳坐门槛之上）
      addMesh(new THREE.BoxGeometry(1.72, 3.76, 0.08), woodMat, dx2, floorTopY + 2.06, HALL_Z + 5.78, { parent: hall });
      // 上段花格窗心饰面
      addMesh(new THREE.BoxGeometry(1.42, 1.70, 0.04), woodDarkMat, dx2, floorTopY + 2.75, HALL_Z + 5.83, { parent: hall });
      // 下段裙板饰面
      addMesh(new THREE.BoxGeometry(1.42, 1.40, 0.04), woodDarkMat, dx2, floorTopY + 1.05, HALL_Z + 5.83, { parent: hall });
    }

    // 中门金黄古典铺首衔环（辅首铜环）
    var ringMat = new THREE.MeshStandardMaterial({ color: 0xd4a43b, metalness: 0.85, roughness: 0.25 });
    [-0.22, 0.22].forEach(function (rx) {
      addMesh(new THREE.SphereGeometry(0.05, 6, 6), ringMat, rx, floorTopY + 1.88, HALL_Z + 5.85, { parent: hall });
      addMesh(new THREE.TorusGeometry(0.08, 0.018, 6, 12), ringMat, rx, floorTopY + 1.82, HALL_Z + 5.86, { parent: hall });
    });

    // 已删除主屋走向水亭的圆形景墙（按要求只删墙体），台阶与水上平桥保持完整敞开通行

    // 室内屏风案几（置于抬高的地板之上）
    var screenMat = new THREE.MeshStandardMaterial({ color: 0xded8ca, roughness: 0.85 });
    addMesh(new THREE.BoxGeometry(5.4, 3.2, 0.15), screenMat, 0, floorTopY + 1.8, HALL_Z - 2.0, { parent: hall });
    addMesh(new THREE.BoxGeometry(5.6, 0.16, 0.22), woodDarkMat, 0, floorTopY + 3.5, HALL_Z - 2.0, { parent: hall });
    addMesh(new THREE.BoxGeometry(2.6, 0.82, 0.95), woodDarkMat, 0, floorTopY + 0.42, HALL_Z + 0.8, { parent: hall });

    // 重檐歇山屋顶
    addMesh(new THREE.BoxGeometry(31, 0.52, 17.5), roofMat, 0, floorTopY + 6.0, HALL_Z, { parent: hall, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(26, 0.65, 14), roofMat, 0, floorTopY + 7.0, HALL_Z, { parent: hall, cast: true });
    addMesh(new THREE.BoxGeometry(20, 1.85, 10.5), roofMat, 0, floorTopY + 8.1, HALL_Z, { parent: hall, cast: true });
    var hallRidgeMat = new THREE.MeshStandardMaterial({ color: COL.roofRidge, roughness: 0.75 });
    roofMats.push(hallRidgeMat);
    applySnowAccumulation(hallRidgeMat, 1.0, true);
    addMesh(new THREE.BoxGeometry(16, 0.76, 1.2), hallRidgeMat,
      0, floorTopY + 9.15, HALL_Z, { parent: hall, cast: true });

    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (dir) {
      addMesh(new THREE.BoxGeometry(4.8, 0.38, 1.6), roofMat,
        dir[0] * 14.2, floorTopY + 6.5, HALL_Z + dir[1] * 8.2,
        { parent: hall, rotZ: -dir[0] * 0.38, cast: true });
    });

    // 暖光与宫灯
    lampMaterial = new THREE.MeshBasicMaterial({ color: 0xffb566, transparent: true, opacity: 0 });
    windowPanels.push(addMesh(new THREE.PlaneGeometry(6.0, 3.2), lampMaterial, 0, floorTopY + 2.0, HALL_Z + 5.4, { parent: hall }));

    colXs.forEach(function (lx) {
      addMesh(new THREE.SphereGeometry(0.38, 10, 8), lanternMaterial(), lx, floorTopY + 5.1, HALL_Z + 5.7, { parent: hall });
      var light = new THREE.PointLight(COL.lanternWarm, 0, 18, 2);
      light.position.set(lx, floorTopY + 5.1, HALL_Z + 5.7);
      hall.add(light);
      lampLights.push(light);
    });

    scene.add(hall);
  }

  // 主殿汉白玉/青石平台雕花栏杆：合围前、左、右、后四面，样式统一样式（灰石栏板与小圆头望柱）
  function buildStoneBalustrade(parent, w, d, h, centerZ) {
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.88 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var xMin = -w / 2 + 0.2; // -13.8 (西侧外缘)
    var xMax = w / 2 - 0.2;  // 13.8 (东侧外缘)
    var zFront = centerZ + d / 2 - 0.2; // -2.7 (南侧前缘)
    var zBack = centerZ - d / 2 + 0.2;  // -17.3 (北侧后缘)

    // 辅助函数：生成标准圆柱望柱与顶部圆球柱头
    function addBalusterPost(px, pz) {
      addMesh(new THREE.CylinderGeometry(0.10, 0.12, 0.88, 6), stoneMat, px, h + 0.46, pz, { parent: parent, cast: true });
      addMesh(new THREE.SphereGeometry(0.12, 6, 6), stoneMat, px, h + 0.92, pz, { parent: parent });
    }

    // 1. 【南面（前侧）灰色栏杆】：保留正南面台阶出入口（-5.5 ~ 5.5），东西两段护栏延伸至角柱
    // 1.1 前南侧西段：x: xMin (-13.8) ~ -5.5，长 8.3m
    var fL_len = -5.5 - xMin;
    addMesh(new THREE.BoxGeometry(fL_len, 0.54, 0.16), stoneMat, (xMin + (-5.5)) / 2, h + 0.38, zFront, { parent: parent, cast: true });
    for (var p = 0; p <= 5; p++) {
      addBalusterPost(xMin + p * (fL_len / 5), zFront);
    }
    // 1.2 前南侧东段：x: 5.5 ~ xMax (13.8)，长 8.3m
    var fR_len = xMax - 5.5;
    addMesh(new THREE.BoxGeometry(fR_len, 0.54, 0.16), stoneMat, (5.5 + xMax) / 2, h + 0.38, zFront, { parent: parent, cast: true });
    for (var p2 = 0; p2 <= 5; p2++) {
      addBalusterPost(5.5 + p2 * (fR_len / 5), zFront);
    }

    // 2. 【西面（左侧）灰色栏杆】：自前角 (zFront) 连续延伸至后角 (zBack)，长 14.6m
    var sideLen = zFront - zBack; // 14.6m
    var sideMidZ = (zFront + zBack) / 2; // -10.0 (HALL_Z)
    addMesh(new THREE.BoxGeometry(0.16, 0.54, sideLen), stoneMat, xMin, h + 0.38, sideMidZ, { parent: parent, cast: true });
    for (var pL = 1; pL < 8; pL++) {
      addBalusterPost(xMin, zBack + pL * (sideLen / 8));
    }

    // 3. 【东面（右侧）灰色栏杆】：自前角 (zFront) 连续延伸至后角 (zBack)，长 14.6m
    addMesh(new THREE.BoxGeometry(0.16, 0.54, sideLen), stoneMat, xMax, h + 0.38, sideMidZ, { parent: parent, cast: true });
    for (var pR = 1; pR < 8; pR++) {
      addBalusterPost(xMax, zBack + pR * (sideLen / 8));
    }

    // 4. 【北面（后侧）灰色栏杆】：横跨整座后平台（xMin 至 xMax），长 27.6m
    var backLen = xMax - xMin; // 27.6m
    addMesh(new THREE.BoxGeometry(backLen, 0.54, 0.16), stoneMat, 0, h + 0.38, zBack, { parent: parent, cast: true });
    for (var pB = 0; pB <= 16; pB++) {
      addBalusterPost(xMin + pB * (backLen / 16), zBack);
    }
  }

  // 原「见山双层楼阁」（主屋左侧，x=-22）与「鸳鸯水榭大厅」（主屋左前侧，x=-19）已按要求整体移除：
// 主屋两侧不再设侧屋，主池西岸保持开阔通透，仅留岸线、溪涧与林木。

  // 4. 【涵青书斋雅院】：东苑幽深典雅的四合书斋小院，后侧为平地竹林
  function buildEastStudy() {
    var g = new THREE.Group();
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: COL.plaster, roughness: 0.9 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.8 });
    var woodDark = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.85 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);

    // 书斋主堂（面朝水岸，后侧为平地竹林）
    addMesh(new THREE.BoxGeometry(13.6, 0.6, 7.6), stoneMat, 0, 0.3, 0, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(12.2, 3.8, 6.4), plasterMat, 0, 2.5, 0, { parent: g, cast: true });

    // 书斋槅扇窗与书案
    for (var i = 0; i < 4; i++) {
      addMesh(new THREE.BoxGeometry(1.5, 2.8, 0.08), woodDark, -3.45 + i * 2.3, 2.2, 3.22, { parent: g });
    }
    // 雅致卷棚顶
    addMesh(new THREE.BoxGeometry(14.2, 0.45, 8.2), roofMat, 0, 4.6, 0, { parent: g, cast: true });
    addMesh(new THREE.BoxGeometry(9.6, 1.2, 5.0), roofMat, 0, 5.3, 0, { parent: g, cast: true });

    // 书斋前开敞亲水青石露台（紧贴水岸，亲水观景）
    addMesh(new THREE.BoxGeometry(11.6, 0.22, 3.8), stoneMat, 0, 0.11, 4.8, { parent: g, receive: true });

    // 坐标：东岸平地（x: 27.0, z: -8.0），与正殿东侧大屋檐彻底拉开 4m 宽敞庭院距离，绝无穿模
    g.position.set(27.0, 0, -8.0);
    g.rotation.y = -0.06;
    scene.add(g);
  }

  // 4B. 【主屋左侧西北角四面合围小院落与小茅厕】
  // 按照要求将带圆形的月洞门墙移至主屋左侧西北角落，新筑南墙（带圆形月洞门）与东墙，
  // 与外围大墙（北院墙与西院墙）紧密组合成四面合围独立小院，院内幽静雅致，布置古典小茅厕、铺石引道与竹石小景
  function buildOuthouseCourtyard() {
    var g = new THREE.Group();
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: COL.plaster, roughness: 0.9 });
    var copingMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.8 });
    roofMats.push(copingMat);
    applySnowAccumulation(copingMat, 1.0, true);
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var woodDark = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.85 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.8 });
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.88 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);

    // 1. 新筑东侧合围墙：自北院墙（z = -32）向南延伸至南墙角（z = -19），位置 x = -26.0
    var eastWallLen = 13.0; // z: -32 到 -19
    var eastWallZ = (-32 + -19) / 2; // -25.5
    var eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.2, eastWallLen), plasterMat);
    eastWall.position.set(-26.0, 1.6, eastWallZ);
    eastWall.castShadow = true;
    eastWall.receiveShadow = true;
    g.add(eastWall);

    var eastCoping = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.35, eastWallLen + 0.4), copingMat);
    eastCoping.position.set(-26.0, 3.35, eastWallZ);
    eastCoping.castShadow = true;
    g.add(eastCoping);

    // 2. 新筑南侧合围墙（即用户指定的“带圆形的墙”）：自西院墙（x = -38）延至新筑东墙（x = -26），位置 z = -19.0
    // 墙宽 12m，高 3.2m，正中开凿直径 2.3m 古典圆形月洞门
    var southWallW = 12.0;
    var southWallX = (-38 + -26) / 2; // -32.0
    var southWallZ = -19.0;

    var moonWallShape = new THREE.Shape();
    moonWallShape.moveTo(-southWallW / 2, 0);
    moonWallShape.lineTo(southWallW / 2, 0);
    moonWallShape.lineTo(southWallW / 2, 3.2);
    moonWallShape.lineTo(-southWallW / 2, 3.2);
    moonWallShape.lineTo(-southWallW / 2, 0);

    // 圆形月洞门门洞：中心标高 1.55m，半径 1.15m（高敞通透）
    var moonDoorHole = new THREE.Path();
    moonDoorHole.absarc(0, 1.55, 1.15, 0, Math.PI * 2, true);
    moonWallShape.holes.push(moonDoorHole);

    var moonWallGeo = new THREE.ExtrudeGeometry(moonWallShape, { depth: 0.40, bevelEnabled: false });
    var moonWallMesh = new THREE.Mesh(moonWallGeo, plasterMat);
    moonWallMesh.position.set(southWallX, 0, southWallZ - 0.20);
    moonWallMesh.castShadow = true;
    moonWallMesh.receiveShadow = true;
    g.add(moonWallMesh);

    // 月洞门黑色瓦顶压顶
    var southCoping = new THREE.Mesh(new THREE.BoxGeometry(southWallW + 0.6, 0.35, 0.9), copingMat);
    southCoping.position.set(southWallX, 3.35, southWallZ);
    southCoping.castShadow = true;
    g.add(southCoping);

    // 月洞门南北两侧古典红木/深木圆形门框包边
    addMesh(new THREE.TorusGeometry(1.17, 0.07, 6, 24), woodDark,
      southWallX, 1.55, southWallZ + 0.21, { parent: g });
    addMesh(new THREE.TorusGeometry(1.17, 0.07, 6, 24), woodDark,
      southWallX, 1.55, southWallZ - 0.21, { parent: g });

    // 月洞门下青石过槛与门外引道踏步
    addMesh(new THREE.BoxGeometry(2.6, 0.16, 1.2), stoneMat,
      southWallX, 0.08, southWallZ, { parent: g, receive: true });
    addMesh(new THREE.BoxGeometry(2.4, 0.12, 2.2), stoneMat,
      southWallX, 0.06, southWallZ + 1.6, { parent: g, receive: true });

    // 3. 【小院内布局与小茅厕（净房小屋）】
    // 坐落于四面合围幽静小院深处：中心坐标 x = -32.5, z = -25.5
    var privyG = new THREE.Group();
    var pX = -32.5, pZ = -25.5;

    // 茅厕台基：稳固青石台座
    addMesh(new THREE.BoxGeometry(4.6, 0.30, 3.6), stoneMat, 0, 0.15, 0, { parent: privyG, cast: true, receive: true });
    // 前方登台青石踏步
    addMesh(new THREE.BoxGeometry(1.6, 0.15, 0.6), stoneMat, 0, 0.075, 2.05, { parent: privyG, receive: true });

    // 茅厕白粉实墙身
    addMesh(new THREE.BoxGeometry(4.0, 2.4, 3.0), plasterMat, 0, 0.30 + 1.2, 0, { parent: privyG, cast: true, receive: true });
    // 四角立柱与檐枋
    [[-1.85, -1.35], [1.85, -1.35], [-1.85, 1.35], [1.85, 1.35]].forEach(function (c) {
      addMesh(new THREE.CylinderGeometry(0.10, 0.11, 2.4, 6), woodDark, c[0], 0.30 + 1.2, c[1], { parent: privyG, cast: true });
    });
    // 额枋
    addMesh(new THREE.BoxGeometry(4.1, 0.16, 0.18), woodDark, 0, 0.30 + 2.35, 1.38, { parent: privyG });

    // 南面门洞与掩映木格板门
    addMesh(new THREE.BoxGeometry(1.1, 1.95, 0.06), woodMat, -0.15, 0.30 + 1.0, 1.52, { parent: privyG, rotY: 0.35 });
    // 门洞边框
    addMesh(new THREE.BoxGeometry(1.3, 0.10, 0.12), woodDark, 0, 0.30 + 2.02, 1.50, { parent: privyG });
    [-0.60, 0.60].forEach(function (bx) {
      addMesh(new THREE.BoxGeometry(0.10, 2.0, 0.12), woodDark, bx, 0.30 + 1.0, 1.50, { parent: privyG });
    });

    // 南立面装饰古典通气木雕花窗
    addMesh(new THREE.BoxGeometry(0.80, 0.80, 0.10), woodDark, 1.15, 0.30 + 1.45, 1.50, { parent: privyG });
    addMesh(new THREE.BoxGeometry(0.68, 0.04, 0.05), woodMat, 1.15, 0.30 + 1.45, 1.50, { parent: privyG });
    addMesh(new THREE.BoxGeometry(0.04, 0.68, 0.05), woodMat, 1.15, 0.30 + 1.45, 1.50, { parent: privyG });

    // 歇山小木屋顶（黑瓦飞檐，江南茅舍雅致风韵）
    addMesh(new THREE.BoxGeometry(5.2, 0.35, 4.2), roofMat, 0, 0.30 + 2.55, 0, { parent: privyG, cast: true });
    addMesh(new THREE.BoxGeometry(4.2, 0.55, 3.0), roofMat, 0, 0.30 + 2.95, 0, { parent: privyG, cast: true });
    addMesh(new THREE.BoxGeometry(3.2, 0.85, 1.8), roofMat, 0, 0.30 + 3.40, 0, { parent: privyG, cast: true });
    // 正脊
    addMesh(new THREE.BoxGeometry(3.0, 0.28, 0.32), new THREE.MeshStandardMaterial({ color: COL.roofRidge }),
      0, 0.30 + 3.95, 0, { parent: privyG, cast: true });

    // 檐下小暖光壁灯
    addMesh(new THREE.SphereGeometry(0.16, 8, 8), lanternMaterial(), 1.15, 0.30 + 2.15, 1.62, { parent: privyG });
    var pLight = new THREE.PointLight(COL.lanternWarm, 0, 8, 2);
    pLight.position.set(1.15, 0.30 + 2.15, 1.62);
    privyG.add(pLight);
    lampLights.push(pLight);

    privyG.position.set(pX, 0, pZ);
    g.add(privyG);

    // 4. 【院内青石漫步汀步】：自月洞门（z = -19）通向小茅厕门前（z = -24）
    var pathPts = [
      [-32.0, -19.9], [-32.2, -21.1], [-32.4, -22.3], [-32.5, -23.5]
    ];
    pathPts.forEach(function (pt) {
      addMesh(new THREE.CylinderGeometry(0.55, 0.60, 0.10, 7), stoneMat,
        pt[0], 0.05, pt[1], { parent: g, rotY: 0.4, receive: true });
    });

    // 5. 【小院内幽雅小景】：净手青石水钵 + 秀石两拳 + 角隅翠竹
    // 净手水钵（茅厕门前东侧）
    addMesh(new THREE.CylinderGeometry(0.28, 0.22, 0.42, 8), stoneMat, -30.5, 0.21, -24.2, { parent: g, cast: true });
    addMesh(new THREE.CylinderGeometry(0.24, 0.01, 0.06, 8), new THREE.MeshStandardMaterial({ color: COL.waterDeep, roughness: 0.1 }),
      -30.5, 0.43, -24.2, { parent: g });
    // 水钵旁小叠石
    addMesh(new THREE.DodecahedronGeometry(0.35, 0), stoneMat, -30.1, 0.22, -24.0, { parent: g, cast: true });
    // 小院西南角翠竹数竿
    for (var b = 0; b < 6; b++) {
      var bx = -36.5 + (b % 3) * 0.45;
      var bz = -21.0 + Math.floor(b / 3) * 0.55;
      addMesh(new THREE.CylinderGeometry(0.04, 0.05, 3.6, 5),
        new THREE.MeshStandardMaterial({ color: 0x486b3e, roughness: 0.8 }),
        bx, 1.8, bz, { parent: g });
      addMesh(new THREE.IcosahedronGeometry(0.42, 0),
        new THREE.MeshStandardMaterial({ color: 0x5a824e, roughness: 0.8 }),
        bx, 3.3, bz, { parent: g });
    }

    scene.add(g);
  }

  // 【香洲水上石舫】已整体删除（用户要求）：石船船身、舱楼、灯组与停泊坐标一并移除，原址回归空旷水面。

  // 6. 【荷风四面水亭】：湖心六角水榭亭台
  // 6. 【荷风四面水亭】：走廊右侧（用户视角东侧）水上六角水榭亭台
  function buildLakePavilion() {
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0xbeb9af, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.woodDark, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);

    var pavR = 4.2;
    addMesh(new THREE.CylinderGeometry(pavR, pavR + 0.4, 0.8, 6), stoneMat, 0, 0.4, 0, { parent: g, cast: true, receive: true });

    // 6 根朱红/栗壳色檐柱
    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      addMesh(new THREE.CylinderGeometry(0.15, 0.18, 3.4, 6), woodMat,
        Math.cos(a) * (pavR - 0.8), 2.2, Math.sin(a) * (pavR - 0.8), { parent: g, cast: true });
    }

    // 5 面寻杖勾栏与吴王靠坐槛（西面留空作为主入口，正对走廊连桥）
    for (var j = 0; j < 6; j++) {
      var a2 = (j / 6) * Math.PI * 2;
      var a3 = ((j + 1) / 6) * Math.PI * 2;
      var mx = (Math.cos(a2) + Math.cos(a3)) / 2 * (pavR - 0.8);
      var mz = (Math.sin(a2) + Math.sin(a3)) / 2 * (pavR - 0.8);

      // 判定西面入口：朝向负 x（长走廊方向），不设栏杆
      if (mx < -1.8) continue;

      var len = Math.hypot(Math.cos(a2) - Math.cos(a3), Math.sin(a2) - Math.sin(a3)) * (pavR - 0.8);
      var rotY = -Math.atan2(Math.sin(a3) - Math.sin(a2), Math.cos(a3) - Math.cos(a2));

      addMesh(new THREE.BoxGeometry(len, 0.08, 0.35), woodMat, mx, 1.0, mz, { parent: g, rotY: rotY });
      addMesh(new THREE.BoxGeometry(len, 0.12, 0.08), woodMat, mx * 1.06, 1.45, mz * 1.06, { parent: g, rotY: rotY });
    }

    // 六角攒尖宝顶屋面
    addMesh(new THREE.ConeGeometry(pavR + 0.6, 2.3, 6), roofMat, 0, 4.8, 0, { parent: g, cast: true });
    for (var r = 0; r < 6; r++) {
      var ra = (r / 6) * Math.PI * 2;
      addMesh(new THREE.BoxGeometry(2.1, 0.20, 0.35), roofMat,
        Math.cos(ra) * 3.8, 4.15, Math.sin(ra) * 3.8,
        { parent: g, rotY: -ra, rotZ: 0.33, cast: true });
    }
    addMesh(new THREE.SphereGeometry(0.36, 10, 8),
      new THREE.MeshStandardMaterial({ color: COL.roofRidge }), 0, 6.1, 0, { parent: g, cast: true });

    // 亭心悬挂八角宫灯
    addMesh(new THREE.SphereGeometry(0.38, 10, 8), lanternMaterial(), 0, 3.4, 0, { parent: g });
    var light = new THREE.PointLight(COL.lanternWarm, 0, 16, 2);
    light.position.set(0, 3.4, 0);
    g.add(light);
    lampLights.push(light);

    // 位于走廊右侧（用户视角东侧，x: 8.5, z: 8.5），坐落于水池中心
    g.position.set(8.5, WATER_Y, 8.5);
    scene.add(g);
  }

  // 7. 【主屋前侧长走廊】：还原直廊沿主屋中轴（x=0）自南岸湖畔一直北伸，连接正殿前阶
  function buildCoveredCorridor() {
    var g = new THREE.Group();
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.woodDark, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var floorMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.9 });
    snowCoverMats.push(floorMat);
    applySnowAccumulation(floorMat, 1.0);
    var pierMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.9 });
    snowCoverMats.push(pierMat);
    applySnowAccumulation(pierMat, 0.85);

    // 廊面标高 = 主屋最低一踏顶面 0.56m：二者同一通行面，穿廊而出即踏台阶登堂；
    // 且高于水位 0.34m，行于廊上不会被水没脚
    var DECK_TOP = 0.56;
    var DECK_THICK = 0.18;
    var deckY = DECK_TOP - DECK_THICK / 2;
    var width = 2.4;
    var colH = 2.0;
    var colY = deckY + colH / 2;
    var roofY = deckY + colH + 0.14;
    var pierH = deckY + 0.7;
    var pierY = deckY - pierH / 2;      // 柱脚落地/入水生根

    // 一条笔直的南北向长直廊：沿主屋中轴（x=0）自南岸（z=17.6）一直北伸，
    // 北端与主屋最低一踏的南缘（z=-0.10）严丝合缝对接 —— 穿廊而出即踏上台阶登堂
    var CORRIDOR_NORTH = -0.10;
    var runs = [
      { along: 'z', fixed: 0, from: 17.6, to: CORRIDOR_NORTH }
    ];

    runs.forEach(function (run) {
      var length = Math.abs(run.to - run.from);
      var mid = (run.from + run.to) / 2;
      var seg = new THREE.Group();
      if (run.along === 'z') {
        seg.position.set(run.fixed, 0, mid);
        seg.rotation.y = Math.PI / 2;
      } else {
        seg.position.set(mid, 0, run.fixed);
      }

      // 地栿石板（可通行的廊地面）
      addMesh(new THREE.BoxGeometry(length, DECK_THICK, width), floorMat, 0, deckY, 0, { parent: seg, receive: true });

      // 西侧完整栏杆扶手（面向西侧庭院园林）
      var westSidePz = -1 * (width / 2 - 0.15);
      addMesh(new THREE.BoxGeometry(length, 0.10, 0.30), woodMat, 0, DECK_TOP + 0.55, westSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(length, 0.12, 0.08), woodMat, 0, DECK_TOP + 1.02, westSidePz, { parent: seg });

      // 东侧栏杆扶手（面向右侧水池）：在 z = 7.3 ~ 9.7 处预留通往右侧湖心水亭连桥的出入口
      var eastSidePz = 1 * (width / 2 - 0.15);
      // 北段栏杆 (z from -0.10 to 7.3)
      var lenNorth = 7.3 - (-0.10);
      var midNorthX = mid - (-0.10 + 7.3) / 2;
      addMesh(new THREE.BoxGeometry(lenNorth, 0.10, 0.30), woodMat, midNorthX, DECK_TOP + 0.55, eastSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(lenNorth, 0.12, 0.08), woodMat, midNorthX, DECK_TOP + 1.02, eastSidePz, { parent: seg });

      // 南段栏杆 (z from 9.7 to 17.6)
      var lenSouth = 17.6 - 9.7;
      var midSouthX = mid - (9.7 + 17.6) / 2;
      addMesh(new THREE.BoxGeometry(lenSouth, 0.10, 0.30), woodMat, midSouthX, DECK_TOP + 0.55, eastSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(lenSouth, 0.12, 0.08), woodMat, midSouthX, DECK_TOP + 1.02, eastSidePz, { parent: seg });

      // 廊柱：端柱 + 按跨度均布的落地柱
      var midCount = Math.max(0, Math.round(length / 4.5) - 1);
      var postXs = [-length / 2 + 0.3, length / 2 - 0.3];
      for (var mi = 1; mi <= midCount; mi++) {
        var px = -length / 2 + (length * mi) / (midCount + 1);
        if (Math.abs(px - (mid - 8.5)) > 1.2) { // 避开连桥通道
          postXs.push(px);
        }
      }
      postXs.forEach(function (px) {
        [-1, 1].forEach(function (side) {
          var pz = side * (width / 2 - 0.15);
          addMesh(new THREE.CylinderGeometry(0.12, 0.15, colH, 6), woodMat, px, colY, pz, { parent: seg, cast: true });
          addMesh(new THREE.CylinderGeometry(0.13, 0.16, pierH, 6), pierMat, px, pierY, pz, { parent: seg, cast: true });
        });
      });

      // 廊顶与正脊
      addMesh(new THREE.BoxGeometry(length + 0.4, 0.24, width + 0.6), roofMat, 0, roofY, 0, { parent: seg, cast: true });
      addMesh(new THREE.BoxGeometry(length + 0.4, 0.16, 0.32),
        new THREE.MeshStandardMaterial({ color: COL.roofRidge, roughness: 0.75 }), 0, roofY + 0.2, 0, { parent: seg, cast: true });

      // 廊内悬挂经典宫灯
      [3.0, 8.5, 14.0].forEach(function (lz) {
        var lx = mid - lz;
        addMesh(new THREE.SphereGeometry(0.24, 8, 8), lanternMaterial(), lx, roofY - 0.36, 0, { parent: seg });
      });

      g.add(seg);
    });

    // 南端上岸踏步：自廊面 0.56m 降至南岸平地，供人自湖岸登上直廊
    addMesh(new THREE.BoxGeometry(3.0, 0.56, 0.5), floorMat, 0, 0.28, 18.05, { receive: true, cast: true });

    scene.add(g);
  }

  // 8. 桥梁系统：走廊至水亭平桥 + 月洞门延伸石阶平桥 + 西侧小飞虹石拱桥
  function buildBridges() {
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.88 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.82 });
    snowCoverMats.push(woodDarkMat);
    applySnowAccumulation(woodDarkMat, 0.85);

    // 1. 【走廊至水亭横跨平桥】：自长走廊东缘（x=1.2, z=8.5）横跨水面至水亭西入口（x=4.6, z=8.5）
    var corrBridgeG = new THREE.Group();
    var bLen = 3.6;
    var bMidX = (1.2 + 4.8) / 2; // 3.0
    // 桥面板（厚青石，平坦舒适通行）
    addMesh(new THREE.BoxGeometry(bLen, 0.16, 1.8), stoneMat, bMidX, 0.65, 8.5, { parent: corrBridgeG, cast: true, receive: true });
    // 入水生根的青石桥墩
    [1.9, 4.1].forEach(function (bx) {
      addMesh(new THREE.BoxGeometry(0.40, 0.9, 1.6), stoneMat, bx, 0.25, 8.5, { parent: corrBridgeG, cast: true });
    });
    // 南北两侧低矮寻杖望柱栏杆
    [-1, 1].forEach(function (side) {
      var bz = 8.5 + side * 0.85;
      addMesh(new THREE.BoxGeometry(bLen, 0.08, 0.08), woodDarkMat, bMidX, 0.95, bz, { parent: corrBridgeG });
      addMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.40, 6), woodDarkMat, 1.4, 0.90, bz, { parent: corrBridgeG });
      addMesh(new THREE.CylinderGeometry(0.06, 0.07, 0.40, 6), woodDarkMat, 4.6, 0.90, bz, { parent: corrBridgeG });
    });
    scene.add(corrBridgeG);

    // 2. 【月洞门延伸石阶】：自主殿东台座（y=1.35m）月洞门（x=10.5, z=-2.5）向南延伸下来的 4 级踏步石阶
    var stoneStepsG = new THREE.Group();
    var stSteps = [
      [10.5, 1.15, -1.8, 1.8, 0.45],
      [10.5, 0.95, -1.1, 1.8, 0.45],
      [10.2, 0.78, -0.4, 1.8, 0.45],
      [9.8, 0.62, 0.4, 1.8, 0.50]
    ];
    stSteps.forEach(function (st) {
      addMesh(new THREE.BoxGeometry(st[3], 0.22, st[4]), stoneMat, st[0], st[1], st[2],
        { parent: stoneStepsG, cast: true, receive: true });
    });

    // 跨越水面的九曲青石板平桥（由月洞门石阶通往亭台北侧入口 x=8.5, z=4.4）
    var bridgeWaypoints = [
      [9.8, 0.4, 0.62],
      [9.2, 1.8, 0.64],
      [8.8, 3.2, 0.68],
      [8.5, 4.4, 0.72] // 接入水亭北侧台座
    ];

    for (var b = 0; b < bridgeWaypoints.length - 1; b++) {
      var p1 = bridgeWaypoints[b];
      var p2 = bridgeWaypoints[b + 1];
      var dx = p2[0] - p1[0];
      var dz = p2[1] - p1[1];
      var len = Math.hypot(dx, dz);
      var mx = (p1[0] + p2[0]) / 2;
      var mz = (p1[1] + p2[1]) / 2;
      var my = (p1[2] + p2[2]) / 2;
      var rotY = -Math.atan2(dz, dx);

      addMesh(new THREE.BoxGeometry(len + 0.15, 0.16, 1.5), stoneMat, mx, my, mz,
        { parent: stoneStepsG, rotY: rotY, cast: true, receive: true });

      var pierH = my + 0.6;
      addMesh(new THREE.BoxGeometry(0.35, pierH, 1.3), stoneMat, p1[0], my - pierH / 2, p1[1],
        { parent: stoneStepsG, cast: true });
    }
    scene.add(stoneStepsG);

    // 3. 【小飞虹石拱桥】：横跨西侧庭院溪涧
    var archG = new THREE.Group();
    var archWidth = 3.6;
    var archR = 2.4;
    var archShape = new THREE.Shape();
    archShape.moveTo(-5.5, 0); archShape.lineTo(-5.5, 0.5);
    for (var a = 0; a <= 14; a++) {
      var t = a / 14;
      var px = -5.5 + t * 11.0;
      var py = 0.5 + Math.sin(t * Math.PI) * 1.58;
      archShape.lineTo(px, py);
    }
    archShape.lineTo(5.5, 0);
    var archHole = new THREE.Path();
    archHole.absarc(0, 0, archR, 0, Math.PI, false);
    archShape.holes.push(archHole);

    var archGeo = new THREE.ExtrudeGeometry(archShape, { depth: archWidth, bevelEnabled: false });
    addMesh(archGeo, stoneMat, 0, 0, -archWidth / 2, { parent: archG, cast: true, receive: true });

    for (var s = 0; s < 9; s++) {
      var t1 = s / 9;
      var x1 = -4.7 + t1 * 4.3;
      var y1 = 0.5 + Math.sin((t1 * 0.5) * Math.PI) * 1.55;
      addMesh(new THREE.BoxGeometry(0.50, 0.12, archWidth - 0.1), stoneMat, x1, y1 + 0.05, 0, { parent: archG, receive: true });
      var x2 = 4.7 - t1 * 4.3;
      addMesh(new THREE.BoxGeometry(0.50, 0.12, archWidth - 0.1), stoneMat, x2, y1 + 0.05, 0, { parent: archG, receive: true });
    }
    addMesh(new THREE.BoxGeometry(1.3, 0.14, archWidth - 0.1), stoneMat, 0, 2.12, 0, { parent: archG, receive: true });

    [-archWidth / 2 + 0.15, archWidth / 2 - 0.15].forEach(function (bz) {
      for (var p = 0; p <= 6; p++) {
        var pt = p / 6;
        var px = -4.9 + pt * 9.8;
        var py = 0.5 + Math.sin(pt * Math.PI) * 1.58;
        addMesh(new THREE.CylinderGeometry(0.10, 0.12, 0.85, 6), stoneMat, px, py + 0.45, bz, { parent: archG, cast: true });
        addMesh(new THREE.SphereGeometry(0.12, 6, 6), stoneMat, px, py + 0.88, bz, { parent: archG });
      }
      for (var s2 = 0; s2 < 6; s2++) {
        var pt2 = (s2 + 0.5) / 6;
        var px2 = -4.9 + pt2 * 9.8;
        var py2 = 0.5 + Math.sin(pt2 * Math.PI) * 1.58;
        addMesh(new THREE.BoxGeometry(1.5, 0.38, 0.08), stoneMat, px2, py2 + 0.38, bz, { parent: archG, cast: true });
      }
    });

    // 桥墩水下扎基（坚实扎入池底，消除悬空）
    [-4.8, 4.8].forEach(function (px) {
      addMesh(new THREE.BoxGeometry(2.0, 0.75, archWidth), stoneMat, px, -0.10, 0,
        { parent: archG, cast: true, receive: true });
    });

    // 【西侧桥头登桥石台基与踏步】：底端严密吻合水池边缘，彻底去除外延草地的长石阶，绝不延伸至草地上！
    // 踏步与西岸草坪齐平接榫（px = -5.35），石台基础深扎池底，与水池弧岸岸线密接一体
    var westBaseH = 0.46 + 0.32;
    addMesh(new THREE.BoxGeometry(0.90, westBaseH, archWidth), stoneMat, -5.35, 0.46 - westBaseH / 2, 0,
      { parent: archG, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(0.96, 0.12, archWidth + 0.06), stoneMat, -5.35, 0.46 + 0.06, 0,
      { parent: archG, cast: true, receive: true });

    // 西端立面水下护岸基石（深入水下，与岸线密接）
    addMesh(new THREE.BoxGeometry(0.35, 0.65, archWidth + 0.2), stoneMat, -5.60, 0.08, 0,
      { parent: archG, cast: true });

    // 西端桥头两侧古典青石端柱与抱鼓雕饰（位于 px = -5.35，精准对齐外侧木栅栏两端，绝不重叠）
    [-1, 1].forEach(function (side) {
      var sideZ = side * (archWidth / 2 - 0.15);
      // 端望柱
      addMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.95, 8), stoneMat, -5.35, 0.46 + 0.48, sideZ,
        { parent: archG, cast: true });
      addMesh(new THREE.SphereGeometry(0.15, 8, 8), stoneMat, -5.35, 0.46 + 0.98, sideZ,
        { parent: archG });
      // 望柱抱鼓石
      addMesh(new THREE.CylinderGeometry(0.16, 0.20, 0.40, 8), stoneMat, -5.35, 0.46 + 0.20, side * (archWidth / 2 + 0.14),
        { parent: archG, cast: true });
    });

    // 【东侧斜向青石台阶】：沿桥身斜向轴线平稳顺降至主屋台基前沿，彻底截掉延伸到主屋平台上的冲突部分！
    // 阶面面宽 3.6m，踏步与主殿前基座边缘（Z = -1.0）严密吻合接榫，绝不伸入主屋平台与平台护栏冲突
    var eastSteps = [
      { px: 5.4, y: 0.42, len: 0.65, w: 3.6 },
      { px: 6.1, y: 0.30, len: 0.65, w: 3.6 },
      { px: 6.8, y: 0.18, len: 0.65, w: 3.6 },
      { px: 7.5, y: 0.06, len: 0.70, w: 3.6 } // 终端青石踏步落坪，前沿精准对齐主屋基座前线（Z=-1.0），不侵占平台
    ];
    eastSteps.forEach(function (st) {
      // 扎实石砌基础（自池底/地面稳固托起）
      var eBaseH = st.y + 0.35;
      addMesh(new THREE.BoxGeometry(st.len, eBaseH, st.w), stoneMat, st.px, st.y - eBaseH / 2, 0,
        { parent: archG, cast: true, receive: true });
      // 踏步厚实青石踏面
      addMesh(new THREE.BoxGeometry(st.len + 0.05, 0.12, st.w + 0.06), stoneMat, st.px, st.y + 0.06, 0,
        { parent: archG, cast: true, receive: true });
    });

    // 斜向台阶两侧青石护栏（自 px = 5.2 延展至 px = 7.5，端柱优雅收于主屋平台外侧，绝不伸入平台）
    [-1, 1].forEach(function (side) {
      var sideZ = side * (archWidth / 2 - 0.15);
      // 斜栏扶手
      addMesh(new THREE.BoxGeometry(2.4, 0.14, 0.14), stoneMat, 6.35, 0.24 + 0.38, sideZ,
        { parent: archG, cast: true });
      // 地栿下枋
      addMesh(new THREE.BoxGeometry(2.4, 0.12, 0.12), stoneMat, 6.35, 0.24 + 0.12, sideZ,
        { parent: archG });
      // 间歇立柱
      [5.4, 6.45, 7.5].forEach(function (wpx) {
        var wy = 0.42 - ((wpx - 5.4) / (7.5 - 5.4)) * 0.36;
        addMesh(new THREE.CylinderGeometry(0.10, 0.12, 0.85, 6), stoneMat, wpx, wy + 0.44, sideZ,
          { parent: archG, cast: true });
        addMesh(new THREE.SphereGeometry(0.12, 6, 6), stoneMat, wpx, wy + 0.88, sideZ,
          { parent: archG });
      });
      // 阶梯落坪处古典抱鼓石
      addMesh(new THREE.CylinderGeometry(0.16, 0.20, 0.45, 8), stoneMat, 7.5, 0.06 + 0.24, side * (archWidth / 2 + 0.14),
        { parent: archG, cast: true });
    });

    // 小飞虹石拱桥整体抬高标高（由 y=0 抬升至 y=0.28m），彻底避开水波起伏冲刷，绝不淹水
    archG.position.set(-20.5, 0.28, 4.0);
    archG.rotation.y = 0.45;
    scene.add(archG);

    // 4. 【主殿前堂西侧登台青石石阶与转角合围石坪】：全面消除拐角空缺，形成浑然一体的宽阔转角石台
    // 规整正向铺砌于主殿台基南沿（Z: -0.15 ~ -1.10），踏步面宽 3.4m，下接满铺转角大石坪直通桥头
    var plinthStepsG = new THREE.Group();

    // 彻底填满桥头至登台石阶间的转角空缺（满铺转角青石大坪，宽 3.8m，深 2.4m，彻底消除“拐角空一块”）
    var cornerBaseH = 0.38 + 0.15;
    // 基础扎实入地
    addMesh(new THREE.BoxGeometry(3.8, cornerBaseH, 2.4), stoneMat, -13.0, 0.38 - cornerBaseH / 2, 1.05,
      { parent: plinthStepsG, cast: true, receive: true });
    // 满铺青石踏面（厚实平整，标高 0.38m，与桥头落坪及第一级踏步底端完全齐平一体）
    addMesh(new THREE.BoxGeometry(3.86, 0.09, 2.46), stoneMat, -13.0, 0.38 + 0.045, 1.05,
      { parent: plinthStepsG, cast: true, receive: true });

    // 4级踏步自南向北平稳登台（自 Z: -0.15 逐级升至 Z: -1.05 主殿台基表面）
    var pSteps = [
      { z: -0.15, y: 0.42, w: 3.4, d: 0.38 },
      { z: -0.45, y: 0.60, w: 3.3, d: 0.38 },
      { z: -0.75, y: 0.78, w: 3.2, d: 0.38 },
      { z: -1.05, y: 0.95, w: 3.2, d: 0.42 } // 顶层踏步平整搭入主殿台基表面（Z = -1.0 ~ -1.25，Y = 0.95），无缝衔接
    ];
    pSteps.forEach(function (st) {
      // 坚实台阶基石（下扎地面）
      addMesh(new THREE.BoxGeometry(st.w, st.y, st.d), stoneMat, -13.0, st.y / 2, st.z,
        { parent: plinthStepsG, cast: true, receive: true });
      // 踏步厚石踏面
      addMesh(new THREE.BoxGeometry(st.w + 0.05, 0.09, st.d + 0.04), stoneMat, -13.0, st.y + 0.045, st.z,
        { parent: plinthStepsG, cast: true, receive: true });
    });

    // 踏步两侧与转角水际线护岸垂带、望柱与古典抱鼓石
    // 西侧（靠主屋平台墙体）：直向垂带
    var westX = -13.0 - 1.68;
    addMesh(new THREE.BoxGeometry(0.20, 0.22, 1.35), stoneMat, westX, 0.68, -0.60,
      { parent: plinthStepsG, rotX: 0.42, cast: true, receive: true });
    addMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 6), stoneMat, westX, 0.95 + 0.21, -1.18,
      { parent: plinthStepsG, cast: true });
    addMesh(new THREE.SphereGeometry(0.13, 6, 6), stoneMat, westX, 0.95 + 0.48, -1.18,
      { parent: plinthStepsG });

    // 东侧（靠池水岸线）：自台阶顶端顺延包覆整座转角大石坪水际线，连接至石桥右肩
    var eastX = -13.0 + 1.68;
    // 台阶段斜垂带与扶手
    addMesh(new THREE.BoxGeometry(0.20, 0.22, 1.35), stoneMat, eastX, 0.68, -0.60,
      { parent: plinthStepsG, rotX: 0.42, cast: true, receive: true });
    // 台阶顶端望柱
    addMesh(new THREE.CylinderGeometry(0.12, 0.14, 0.42, 6), stoneMat, eastX, 0.95 + 0.21, -1.18,
      { parent: plinthStepsG, cast: true });
    addMesh(new THREE.SphereGeometry(0.13, 6, 6), stoneMat, eastX, 0.95 + 0.48, -1.18,
      { parent: plinthStepsG });

    // 【靠水侧完整青石安全护栏与扶手】：沿东临水侧与南临水侧一体环绕，上设标准高度寻杖扶手、中枋与望柱
    // 1) 东临水侧护栏（Z: -0.15 ~ 2.25，长 2.4m）
    // 上寻杖扶手（齐腰古典扶手，标高 Y=1.10m）
    addMesh(new THREE.BoxGeometry(0.14, 0.12, 2.4), stoneMat, eastX, 0.38 + 0.70, 1.05,
      { parent: plinthStepsG, cast: true });
    // 中枋横木
    addMesh(new THREE.BoxGeometry(0.08, 0.08, 2.4), stoneMat, eastX, 0.38 + 0.44, 1.05,
      { parent: plinthStepsG });
    // 地栿下基石枋
    addMesh(new THREE.BoxGeometry(0.20, 0.18, 2.4), stoneMat, eastX, 0.38 + 0.12, 1.05,
      { parent: plinthStepsG, cast: true, receive: true });

    // 东侧护栏均匀立柱与古典望柱
    [-0.15, 1.05, 2.25].forEach(function (wz) {
      addMesh(new THREE.CylinderGeometry(0.11, 0.13, 0.78, 6), stoneMat, eastX, 0.38 + 0.42, wz,
        { parent: plinthStepsG, cast: true });
      addMesh(new THREE.SphereGeometry(0.13, 6, 6), stoneMat, eastX, 0.38 + 0.84, wz,
        { parent: plinthStepsG });
    });
    // 护栏中间古典直棂立枋
    [0.25, 0.65, 1.45, 1.85].forEach(function (sz) {
      addMesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), stoneMat, eastX, 0.38 + 0.42, sz,
        { parent: plinthStepsG });
    });

    // 2) 南临水侧拐角短栏与扶手（自 eastX 向西延伸至石桥右肩护栏，长 1.2m，Z = 2.25）
    var southMidX = (eastX + (-12.45)) / 2; // -11.88
    var southLen = Math.abs(eastX - (-12.45)); // 1.13
    // 南临水扶手
    addMesh(new THREE.BoxGeometry(southLen, 0.12, 0.14), stoneMat, southMidX, 0.38 + 0.70, 2.25,
      { parent: plinthStepsG, cast: true });
    // 南临水中枋
    addMesh(new THREE.BoxGeometry(southLen, 0.08, 0.08), stoneMat, southMidX, 0.38 + 0.44, 2.25,
      { parent: plinthStepsG });
    // 南临水地栿
    addMesh(new THREE.BoxGeometry(southLen, 0.18, 0.20), stoneMat, southMidX, 0.38 + 0.12, 2.25,
      { parent: plinthStepsG, cast: true, receive: true });
    // 南临水直棂立枋
    addMesh(new THREE.BoxGeometry(0.05, 0.42, 0.05), stoneMat, southMidX, 0.38 + 0.42, 2.25,
      { parent: plinthStepsG });

    scene.add(plinthStepsG);
  }


  function buildWalls() {
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: COL.plaster, roughness: 0.9 });
    var copingMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.8 });
    roofMats.push(copingMat);
    applySnowAccumulation(copingMat, 1.0, true);

    // 四面合围游龙云墙：北、西、东三面连续闭合，南面仅留 12m 正门门域（x -6 ~ 6），
    // 墙端与门楼侧垛墙搭接，围合后园平地与南池，四向环视皆见墙
    var segments = [
      [-38, -32, 76, true],   // 北院墙：x -38 → 38
      [-38, -32, 52, false],  // 西院墙：z -32 → 20
      [38, -32, 52, false],   // 东院墙：z -32 → 20
      [-38, 20, 32, true],    // 南院墙西段：x -38 → -6
      [6, 20, 32, true]       // 南院墙东段：x 6 → 38
    ];

    segments.forEach(function (seg) {
      var g = new THREE.Group();
      var length = seg[2];
      var isX = seg[3];
      var wall = new THREE.Mesh(new THREE.BoxGeometry(isX ? length : 0.5, 3.5, isX ? 0.5 : length), plasterMat);
      wall.position.y = 1.75;
      wall.castShadow = true;
      wall.receiveShadow = true;
      g.add(wall);

      var coping = new THREE.Mesh(new THREE.BoxGeometry(isX ? length + 0.8 : 1.0, 0.40, isX ? 1.0 : length + 0.8), copingMat);
      coping.position.y = 3.65;
      coping.castShadow = true;
      g.add(coping);

      if (isX) g.position.set(seg[0] + length / 2, 0, seg[1]);
      else g.position.set(seg[0], 0, seg[1] + length / 2);
      scene.add(g);
    });

    // 漏窗：南墙两组与东西院墙各一组；窗框随墙面走向布置、仅凸出墙面 0.06m，不穿出墙体
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.85 });
    [[-20, 20, 'z'], [22, 20, 'z'], [-38, -14, 'x'], [38, -14, 'x']].forEach(function (wp) {
      var zWall = wp[2] === 'z';
      addMesh(new THREE.BoxGeometry(zWall ? 1.6 : 0.62, 1.6, zWall ? 0.62 : 1.6), woodDarkMat, wp[0], 2.3, wp[1]);
      addMesh(new THREE.BoxGeometry(zWall ? 1.4 : 0.1, 0.06, zWall ? 0.1 : 1.4), woodDarkMat, wp[0], 2.3, wp[1]);
      addMesh(new THREE.BoxGeometry(zWall ? 0.1 : 0.06, 1.4, zWall ? 0.06 : 0.1), woodDarkMat, wp[0], 2.3, wp[1]);
    });
  }

  /* ---------------- 7B. 南面正门门楼（四面合围院墙的唯一出入口） ----------------
     三开间重檐门楼：中央门洞净宽 5m 可通行，左右两垛实墙落于青石台基，
     南侧三级石阶自平地登台，北侧石甬道接直廊南端上岸踏步，
     南、北两面各悬匾额，四角起翘，夜间两盏门灯亮暖光。 */

  function buildMainGate() {
    var g = new THREE.Group();
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: COL.plaster, roughness: 0.9 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var ridgeMat = new THREE.MeshStandardMaterial({ color: COL.roofRidge, roughness: 0.74 });
    roofMats.push(ridgeMat);
    applySnowAccumulation(ridgeMat, 1.0, true);
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.8 });
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.84 });
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.88 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var stoneMat2 = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.9 });
    snowCoverMats.push(stoneMat2);
    applySnowAccumulation(stoneMat2, 1.0);
    var boardMat = new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.6 });
    var goldMat = new THREE.MeshStandardMaterial({ color: 0xb08a3c, roughness: 0.5, metalness: 0.28 });

    var GZ = 21.3;      // 门楼中轴：南院墙线 z=20 自门楼中穿过
    var OW = 5.0;       // 中央门洞净宽
    var BY = 0.32;      // 门槛石台标高
    var WH = 4.6;       // 门垛墙与檐柱高度

    // 1) 青石台基：坐落平地；南侧三级石阶登台；北侧石甬道与直廊南端上岸踏步同高（0.56m）搭接
    addMesh(new THREE.BoxGeometry(16.0, BY, 5.2), stoneMat2, 0, BY / 2, GZ, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(10.0, 0.22, 0.9), stoneMat2, 0, 0.11, GZ + 3.05, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(10.8, 0.11, 0.9), stoneMat2, 0, 0.055, GZ + 3.95, { parent: g, cast: true, receive: true });
    addMesh(new THREE.BoxGeometry(6.2, 0.56, 0.4), stoneMat, 0, 0.28, 18.5, { parent: g, cast: true, receive: true });

    // 2) 三开间门屋：左右两垛实墙 + 中央门洞
    [-1, 1].forEach(function (side) {
      addMesh(new THREE.BoxGeometry(3.6, WH, 5.2), plasterMat, side * (OW / 2 + 1.8), BY + WH / 2, GZ,
        { parent: g, cast: true, receive: true });
    });

    // 3) 门洞四根檐柱（贴门垛内侧，柱头承下檐）
    [-1, 1].forEach(function (side) {
      [-1, 1].forEach(function (side2) {
        addMesh(new THREE.CylinderGeometry(0.26, 0.28, WH, 8), woodMat,
          side * (OW / 2 - 0.15), BY + WH / 2, GZ + side2 * 2.05, { parent: g, cast: true });
      });
    });

    // 4) 南向（园外）与北向（园内）匾额，描金边框
    [-1, 1].forEach(function (side) {
      var pz = GZ + side * 2.28;
      addMesh(new THREE.BoxGeometry(2.9, 0.7, 0.16), boardMat, 0, 4.45, pz, { parent: g, cast: true });
      addMesh(new THREE.BoxGeometry(2.42, 0.42, 0.05), goldMat, 0, 4.45, pz + side * 0.10, { parent: g });
    });

    // 5) 重檐门楼顶：下檐搭于门垛墙顶，四角起翘；上层矮墙承上檐，正脊置脊兽
    addMesh(new THREE.BoxGeometry(19.0, 0.50, 7.0), roofMat, 0, 5.05, GZ, { parent: g, cast: true });
    addMesh(new THREE.BoxGeometry(16.2, 0.90, 5.6), plasterMat, 0, 5.75, GZ, { parent: g, cast: true });
    addMesh(new THREE.BoxGeometry(13.6, 0.40, 4.8), roofMat, 0, 6.40, GZ, { parent: g, cast: true });
    addMesh(new THREE.BoxGeometry(9.4, 0.50, 1.1), ridgeMat, 0, 6.85, GZ, { parent: g, cast: true });
    [-1, 1].forEach(function (side) {
      addMesh(new THREE.ConeGeometry(0.42, 0.9, 4), ridgeMat, side * 4.7, 7.35, GZ, { parent: g, cast: true });
    });
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (c) {
      addMesh(new THREE.BoxGeometry(3.0, 0.26, 0.6), roofMat,
        c[0] * 8.4, 5.30, GZ + c[1] * 3.3,
        { parent: g, rotZ: -c[0] * 0.24, rotX: -c[1] * 0.22, cast: true });
    });

    // 6) 门楼灯笼两盏：悬于下檐外侧，夜间亮暖色点光源
    [-1, 1].forEach(function (side) {
      addMesh(new THREE.SphereGeometry(0.30, 10, 10), lanternMaterial(), side * 7.2, 4.35, GZ + 3.0, { parent: g });
      var lamp = new THREE.PointLight(COL.lanternWarm, 0, 14, 2);
      lamp.position.set(side * 7.2, 4.35, GZ + 3.0);
      g.add(lamp);
      lampLights.push(lamp);
    });

    scene.add(g);
  }

  /* ---------------- 8. 狮子林假山奇峰群与平地揽胜阁（石根全部落在平地标高上） ---------------- */

  function buildLionRockeries() {
    var rockMat = new THREE.MeshStandardMaterial({
      map: stoneTexture(), color: 0x86847e, roughness: 0.94, flatShading: true
    });
    snowCoverMats.push(rockMat);
    applySnowAccumulation(rockMat, 0.9);
    var rnd = makeRandom(37);
    var items = [];

    // 假山主峰群：平地堆叠的湖石峰林，石体下缘一律埋入平地（y 轴中心不高于石体半高），
    // 布置在主殿后方平地庭院（z: -30 ~ -24），既不悬空，也不压盖屋脊
    for (var i = 0; i < (isMobile ? 24 : 42); i++) {
      var rockScale = 1.0 + rnd() * 1.5;
      items.push([-8 + (rnd() - 0.5) * 16, rockScale * (0.30 + rnd() * 0.5), -27 + (rnd() - 0.5) * 6, rockScale]);
    }
    // 溪涧西侧平地叠石（石根落地）
    for (var w = 0; w < 12; w++) {
      var westScale = 1.1 + rnd() * 1.4;
      items.push([-20.5 + (rnd() - 0.5) * 4.5, westScale * (0.30 + rnd() * 0.5), -25.5 + (rnd() - 0.5) * 4.5, westScale]);
    }
    // 远香正殿后院特置太湖石立峰（透漏瘦皱名石特置，优雅点缀后堂庭院）
    items.push([-10, 1.5, -21.0, 1.2]);
    items.push([10, 1.5, -21.0, 1.2]);
    // 象形狮子奇石：平地上错落散布（石根落地，不悬空）
    for (var s = 0; s < 5; s++) {
      var lionScale = 1.3 + rnd() * 1.5;
      items.push([4 + s * 3.2 + (rnd() - 0.5) * 1.2, lionScale * (0.30 + rnd() * 0.5), -27.5 + (rnd() - 0.5) * 2.5, lionScale]);
    }
    // 湖心小石岛与池畔叠石（石根没入水面以下，露出水面成岛）
    for (var k = 0; k < 6; k++) {
      var islandScale = 0.7 + rnd() * 0.9;
      items.push([5.0 + (rnd() - 0.5) * 3.0, islandScale * (0.30 + rnd() * 0.4), 3.0 + (rnd() - 0.5) * 3.0, islandScale]);
    }

    var rock = new THREE.InstancedMesh(rockGeometry(13), rockMat, items.length);
    var m = new THREE.Matrix4(); var q = new THREE.Quaternion(); var p = new THREE.Vector3(); var s = new THREE.Vector3();
    for (var idx = 0; idx < items.length; idx++) {
      p.set(items[idx][0], items[idx][1], items[idx][2]);
      q.setFromEuler(new THREE.Euler(rnd() * 0.3, rnd() * Math.PI, rnd() * 0.3));
      s.set(items[idx][3], items[idx][3] * 1.25, items[idx][3]);
      m.compose(p, q, s);
      rock.setMatrixAt(idx, m);
    }
    rock.instanceMatrix.needsUpdate = true;
    rock.castShadow = !isMobile;
    rock.receiveShadow = true;
    scene.add(rock);

    // 揽胜阁（问梅阁形制）：立于主殿后方平地上的六角飞檐高阁（不再位于山巅）
    buildHilltopPavilion();
  }

  function rockGeometry(seed) {
    var geo = new THREE.IcosahedronGeometry(1, 1);
    var rnd = makeRandom(seed);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var n = 0.68 + rnd() * 0.62;
      var y = pos.getY(i);
      pos.setXYZ(i, pos.getX(i) * n, y * (y > 0 ? 1.5 : 0.7), pos.getZ(i) * n);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function buildHilltopPavilion() {
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.woodDark, roughness: 0.8 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.78 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);

    addMesh(new THREE.CylinderGeometry(4.2, 4.6, 0.8, 6), stoneMat, 0, 0.4, 0, { parent: g, cast: true, receive: true });

    for (var i = 0; i < 6; i++) {
      var a = (i / 6) * Math.PI * 2;
      addMesh(new THREE.CylinderGeometry(0.15, 0.18, 3.2, 6), woodMat,
        Math.cos(a) * 3.2, 2.1, Math.sin(a) * 3.2, { parent: g, cast: true });
    }

    addMesh(new THREE.ConeGeometry(4.6, 2.4, 6), roofMat, 0, 4.8, 0, { parent: g, cast: true });
    for (var r = 0; r < 6; r++) {
      var ra = (r / 6) * Math.PI * 2;
      addMesh(new THREE.BoxGeometry(2.0, 0.20, 0.35), roofMat,
        Math.cos(ra) * 3.8, 4.1, Math.sin(ra) * 3.8,
        { parent: g, rotY: -ra, rotZ: 0.34, cast: true });
    }
    addMesh(new THREE.SphereGeometry(0.32, 8, 8),
      new THREE.MeshStandardMaterial({ color: COL.roofRidge }), 0, 6.2, 0, { parent: g, cast: true });

    addMesh(new THREE.SphereGeometry(0.32, 8, 8), lanternMaterial(), 0, 3.3, 0, { parent: g });
    var light = new THREE.PointLight(COL.lanternWarm, 0, 15, 2);
    light.position.set(0, 3.3, 0);
    g.add(light);
    lampLights.push(light);

    // 位于主殿后方平地上（x: 26, y: 0, z: -26），台座直接落地，不悬空
    g.position.set(26.0, 0, -26.0);
    scene.add(g);
  }

  /* ---------------- 9. 周边小屋已按要求整体移除（不再生成外围水乡民居聚落） ---------------- */

// 原 buildWaterTownBuffer 生成的南侧、东侧、西侧共 11 座马头墙民居小屋已全部删除，
// 水巷两岸保持开阔平地与林木，不再有周边小屋遮挡视线。

  /* ---------------- 10. 江南乌篷船 ---------------- */

  function buildBoats() {
    var hullMat = new THREE.MeshStandardMaterial({
      map: woodTexture(), color: 0x422d1c, roughness: 0.82
    });
    var woodDark = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.85 });
    var awningMat = new THREE.MeshStandardMaterial({
      color: 0x2e2720, roughness: 0.92, side: THREE.DoubleSide
    });

    var g = new THREE.Group();

    // 船体（尖艏方艉乌篷木船，长约 5.6m，浮于东湖东南码头水侧）
    var hullShape = new THREE.Shape();
    hullShape.moveTo(0, -2.6);
    hullShape.bezierCurveTo(0.72, -1.8, 0.88, 0.2, 0.72, 2.3);
    hullShape.lineTo(-0.72, 2.3);
    hullShape.bezierCurveTo(-0.88, 0.2, -0.72, -1.8, 0, -2.6);

    var hullGeo = new THREE.ExtrudeGeometry(hullShape, { depth: 0.46, bevelEnabled: false });
    hullGeo.rotateX(Math.PI / 2);
    addMesh(hullGeo, hullMat, 0, 0.18, 0, { parent: g, cast: true, receive: true });

    // 半圆形竹篾乌篷
    var awningGeo = new THREE.CylinderGeometry(0.78, 0.78, 2.4, 14, 1, true, 0, Math.PI);
    addMesh(awningGeo, awningMat, 0, 0.58, 0.1, { parent: g, rotX: Math.PI / 2, cast: true });

    [-0.8, 0.0, 0.8].forEach(function (z) {
      var ribGeo = new THREE.TorusGeometry(0.79, 0.025, 6, 14, Math.PI);
      addMesh(ribGeo, woodDark, 0, 0.58, 0.1 + z, { parent: g, rotY: Math.PI / 2 });
    });

    // 船头船尾木甲板与木舱隔
    [-1.8, 1.8].forEach(function (z) {
      addMesh(new THREE.BoxGeometry(1.2, 0.08, 0.9), hullMat, 0, 0.38, z, { parent: g });
      var ribGeo = new THREE.BoxGeometry(1.22, 0.24, 0.08);
      addMesh(ribGeo, woodDark, 0, 0.30, z - 0.44, { parent: g });
      addMesh(ribGeo, woodDark, 0, 0.30, z + 0.44, { parent: g });
    });

    addMesh(new THREE.BoxGeometry(0.6, 0.22, 0.9), woodDark, 0, 0.3, 0, { parent: g });

    // 木橹
    var oar = new THREE.Group();
    addMesh(new THREE.CylinderGeometry(0.06, 0.07, 3.4, 6), woodDark, 0, 0.9, 0, { parent: oar });
    addMesh(new THREE.BoxGeometry(0.32, 1.3, 0.05), hullMat, 0, 0.25, 0, { parent: oar });
    oar.position.set(0.70, 0.38, 3.3);
    oar.rotation.set(0.42, 0.32, -0.62);
    g.add(oar);

    // 缆绳系岸
    var ropeMat = new THREE.MeshBasicMaterial({ color: 0x483a2d });
    addMesh(new THREE.CylinderGeometry(0.02, 0.02, 2.4, 4), ropeMat,
      -0.65, 0.32, 0.9, { parent: g, rotZ: 0.52, rotY: 0.82 });

    // 船头风雨微光孤灯
    addMesh(new THREE.SphereGeometry(0.25, 10, 8), lanternMaterial(), 0, 0.75, -2.2, { parent: g });
    boatLanternLight = new THREE.PointLight(COL.lanternWarm, 0, 9, 2);
    boatLanternLight.position.set(0, 0.75, -2.2);
    g.add(boatLanternLight);
    lampLights.push(boatLanternLight);

    // 停泊在左侧大水池西南码头东侧开阔水面（x=-8.2, z=14.8），船身完全浮于水中，侧舷傍码头系泊，绝无穿石
    g.position.set(-8.2, WATER_Y + 0.14, 14.8);
    g.rotation.y = 0.05;
    scene.add(g);
    boatMesh = g;
  }

  /* ---------------- 11. 水池生灵：一条红鲤、一只小乌龟、两只白鹅 ---------------- */

  function buildFish() {
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1 });

    // 1. 【一条红鲤】：体态修长饱满，朱红艳丽，摆尾游弋于荷风水亭周围碧波之间
    var koiG = new THREE.Group();
    var redMat = new THREE.MeshStandardMaterial({
      color: 0xee2c14, roughness: 0.32, metalness: 0.18
    });
    var finMat = new THREE.MeshStandardMaterial({
      color: 0xff3b1d, roughness: 0.28, transparent: true, opacity: 0.88, side: THREE.DoubleSide
    });
    var whiteBellyMat = new THREE.MeshStandardMaterial({
      color: 0xffebe0, roughness: 0.35, metalness: 0.12
    });
    var eyeGoldMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3 });

    // 流线型锦鲤主鱼身（长约 0.96m）
    addMesh(new THREE.ConeGeometry(0.20, 0.96, 8), redMat, 0, 0, 0,
      { parent: koiG, rotX: -Math.PI / 2, scale: [0.72, 1.0, 1.15] });
    // 渐变柔和鱼腹
    addMesh(new THREE.ConeGeometry(0.16, 0.86, 8), whiteBellyMat, 0, -0.04, 0.02,
      { parent: koiG, rotX: -Math.PI / 2, scale: [0.65, 0.9, 1.0] });

    // 鱼首吻部与两须
    addMesh(new THREE.SphereGeometry(0.14, 8, 8), redMat, 0, 0, -0.48, { parent: koiG, scale: [0.75, 0.9, 1.1] });
    [-0.05, 0.05].forEach(function (bx) {
      addMesh(new THREE.CylinderGeometry(0.008, 0.004, 0.12, 4), whiteBellyMat, bx, -0.04, -0.58,
        { parent: koiG, rotX: 0.6, rotZ: bx > 0 ? -0.3 : 0.3 });
      // 灵动金睛鱼目
      addMesh(new THREE.SphereGeometry(0.035, 6, 6), eyeGoldMat, bx * 1.8, 0.04, -0.42, { parent: koiG });
      addMesh(new THREE.SphereGeometry(0.022, 6, 6), eyeMat, bx * 1.95, 0.04, -0.42, { parent: koiG });
    });

    // 挺拔背鳍
    var dorsal = new THREE.Group();
    addMesh(new THREE.PlaneGeometry(0.12, 0.36), finMat, 0, 0.16, -0.05,
      { parent: dorsal, rotY: Math.PI / 2, rotZ: -0.35 });
    koiG.add(dorsal);

    // 左右胸鳍（轻柔划水）
    var leftPec = addMesh(new THREE.PlaneGeometry(0.16, 0.28), finMat, -0.16, -0.04, -0.18,
      { parent: koiG, rotZ: 0.7, rotX: 0.4 });
    var rightPec = addMesh(new THREE.PlaneGeometry(0.16, 0.28), finMat, 0.16, -0.04, -0.18,
      { parent: koiG, rotZ: -0.7, rotX: 0.4 });

    // 尾部节点与飘逸大尾鳍（独立旋转节段）
    var tailNode = new THREE.Group();
    tailNode.position.set(0, 0, 0.48);
    var tailFin = addMesh(new THREE.PlaneGeometry(0.32, 0.45), finMat, 0, 0, 0.24,
      { parent: tailNode, rotY: Math.PI / 2 });
    koiG.add(tailNode);

    var koiDepth = WATER_Y - 0.08;
    koiG.position.set(14.0, koiDepth, 12.0);
    scene.add(koiG);

    redKoiData = {
      group: koiG,
      tailNode: tailNode,
      tailFin: tailFin,
      leftPec: leftPec,
      rightPec: rightPec,
      depth: koiDepth,
      x: 14.0,
      z: 12.0,
      heading: 0.5,
      speed: 0.82,
      seed: 15.2
    };

    // 2. 【一只小乌龟】：趴伏慢游于荷风亭畔近汀步石侧，龟壳纹理分明、四肢划水
    var tutG = new THREE.Group();
    var shellDarkMat = new THREE.MeshStandardMaterial({ color: 0x2d3a22, roughness: 0.82 }); // 墨绿苔痕龟甲
    var shellRimMat = new THREE.MeshStandardMaterial({ color: 0x827038, roughness: 0.85 });  // 边缘金边
    var plastronMat = new THREE.MeshStandardMaterial({ color: 0xd0c498, roughness: 0.78 });  // 腹甲
    var skinMat = new THREE.MeshStandardMaterial({ color: 0x3b4a2e, roughness: 0.75 });      // 四肢皮肤

    // 隆起椭圆龟壳（长约 0.52m）
    addMesh(new THREE.SphereGeometry(0.24, 8, 8), shellDarkMat, 0, 0.05, 0,
      { parent: tutG, scale: [0.82, 0.42, 1.15], cast: true });
    addMesh(new THREE.TorusGeometry(0.24, 0.035, 6, 12), shellRimMat, 0, 0.02, 0,
      { parent: tutG, rotX: Math.PI / 2, scale: [0.84, 1.18, 1.0] });
    // 平底腹甲
    addMesh(new THREE.BoxGeometry(0.36, 0.04, 0.48), plastronMat, 0, -0.02, 0, { parent: tutG });

    // 龟首与伸缩颈部（微仰探头，两只乌亮小黑眼）
    var tutHead = new THREE.Group();
    addMesh(new THREE.CylinderGeometry(0.04, 0.05, 0.16, 6), skinMat, 0, 0.05, -0.28,
      { parent: tutHead, rotX: -0.45 });
    addMesh(new THREE.ConeGeometry(0.065, 0.14, 6), skinMat, 0, 0.09, -0.38,
      { parent: tutHead, rotX: -Math.PI / 2, scale: [1, 0.8, 1] });
    [-0.045, 0.045].forEach(function (ex) {
      addMesh(new THREE.SphereGeometry(0.016, 4, 4), eyeMat, ex, 0.10, -0.36, { parent: tutHead });
    });
    tutG.add(tutHead);

    // 四肢蹼爪
    var flipperFrontL = addMesh(new THREE.BoxGeometry(0.14, 0.025, 0.18), skinMat, -0.22, 0, -0.15,
      { parent: tutG, rotY: 0.6, rotZ: -0.2 });
    var flipperFrontR = addMesh(new THREE.BoxGeometry(0.14, 0.025, 0.18), skinMat, 0.22, 0, -0.15,
      { parent: tutG, rotY: -0.6, rotZ: 0.2 });
    var flipperBackL = addMesh(new THREE.BoxGeometry(0.12, 0.025, 0.16), skinMat, -0.19, 0, 0.20,
      { parent: tutG, rotY: -0.5, rotZ: -0.2 });
    var flipperBackR = addMesh(new THREE.BoxGeometry(0.12, 0.025, 0.16), skinMat, 0.19, 0, 0.20,
      { parent: tutG, rotY: 0.5, rotZ: 0.2 });
    // 小尾尖
    addMesh(new THREE.ConeGeometry(0.03, 0.12, 4), skinMat, 0, 0, 0.32, { parent: tutG, rotX: Math.PI / 2 });

    tutG.position.set(5.8, WATER_Y - 0.02, 12.4);
    scene.add(tutG);

    turtleData = {
      group: tutG,
      head: tutHead,
      fL: flipperFrontL,
      fR: flipperFrontR,
      bL: flipperBackL,
      bR: flipperBackR,
      baseX: 5.8,
      baseZ: 12.4
    };

    // 3. 【两只白鹅】：鹅鹅鹅，曲项向天歌。白毛浮绿水，红掌拨清波
    geeseData = [];
    var gooseWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfcfcfc, roughness: 0.62, metalness: 0.02
    });
    var beakOrangeMat = new THREE.MeshStandardMaterial({
      color: 0xf76a0c, roughness: 0.45
    });
    var knobRedMat = new THREE.MeshStandardMaterial({
      color: 0xd82b12, roughness: 0.40
    });
    var feetRedMat = new THREE.MeshStandardMaterial({
      color: 0xee5a08, roughness: 0.55
    });

    for (var gIdx = 0; gIdx < 2; gIdx++) {
      var gooseG = new THREE.Group();

      // 丰满洁白鹅身（浮于水面）
      addMesh(new THREE.SphereGeometry(0.28, 8, 8), gooseWhiteMat, 0, 0.08, 0,
        { parent: gooseG, scale: [0.78, 0.68, 1.25], cast: true });
      // 翘起的尾羽
      addMesh(new THREE.ConeGeometry(0.16, 0.32, 6), gooseWhiteMat, 0, 0.18, 0.34,
        { parent: gooseG, rotX: 0.7, scale: [0.9, 0.5, 1] });

      // 两侧收拢的翼羽
      [-0.18, 0.18].forEach(function (wx) {
        addMesh(new THREE.BoxGeometry(0.06, 0.18, 0.42), gooseWhiteMat, wx, 0.12, -0.02,
          { parent: gooseG, rotZ: wx > 0 ? -0.15 : 0.15 });
      });

      // 优美优雅的 S 形曲项长颈与鹅头
      var neckG = new THREE.Group();
      neckG.position.set(0, 0.14, -0.26);

      // 下段颈部
      addMesh(new THREE.CylinderGeometry(0.07, 0.09, 0.28, 6), gooseWhiteMat, 0, 0.12, -0.05,
        { parent: neckG, rotX: -0.32 });
      // 上段昂扬长颈
      addMesh(new THREE.CylinderGeometry(0.055, 0.07, 0.26, 6), gooseWhiteMat, 0, 0.32, -0.12,
        { parent: neckG, rotX: 0.28 });
      // 圆润鹅头
      addMesh(new THREE.SphereGeometry(0.08, 7, 7), gooseWhiteMat, 0, 0.44, -0.09,
        { parent: neckG, scale: [0.85, 1.0, 1.15] });
      // 额头朱红肉瘤（公鹅标致额包）
      addMesh(new THREE.SphereGeometry(0.045, 6, 6), knobRedMat, 0, 0.50, -0.14, { parent: neckG });
      // 鲜橙黄色扁平喙（鹅嘴）
      addMesh(new THREE.ConeGeometry(0.045, 0.16, 5), beakOrangeMat, 0, 0.42, -0.22,
        { parent: neckG, rotX: -Math.PI / 2, scale: [1.2, 0.55, 1] });
      // 细巧小黑目
      [-0.05, 0.05].forEach(function (ex) {
        addMesh(new THREE.SphereGeometry(0.015, 4, 4), eyeMat, ex, 0.45, -0.11, { parent: neckG });
      });
      gooseG.add(neckG);

      // 水下红掌（红掌拨清波，位于水面下透明可见）
      var feetL = addMesh(new THREE.BoxGeometry(0.10, 0.02, 0.15), feetRedMat, -0.12, -0.08, 0.08,
        { parent: gooseG, rotY: 0.3 });
      var feetR = addMesh(new THREE.BoxGeometry(0.10, 0.02, 0.15), feetRedMat, 0.12, -0.08, 0.08,
        { parent: gooseG, rotY: -0.3 });

      var initGx = gIdx === 0 ? 12.0 : 13.5;
      var initGz = gIdx === 0 ? 14.0 : 15.0;
      gooseG.position.set(initGx, WATER_Y + 0.08, initGz);
      scene.add(gooseG);

      geeseData.push({
        group: gooseG,
        neck: neckG,
        feetL: feetL,
        feetR: feetR,
        x: initGx,
        z: initGz,
        heading: -0.8,
        speed: gIdx === 0 ? 0.58 : 0.55,
        seed: gIdx === 0 ? 42.1 : 99.4,
        isLeader: gIdx === 0
      });
    }

    // 4. 【左侧新增大水池锦鲤群】：4 条色彩斑斓的锦鲤在左侧大水池中欢快畅游
    leftKoiGroup = [];
    var leftColors = [0xee3818, 0xf6be28, 0xffffff, 0x2e2720];
    var leftRnd = makeRandom(53);
    for (var lk = 0; lk < 4; lk++) {
      var lFish = new THREE.Group();
      var cCol = leftColors[lk];
      var fMat = new THREE.MeshStandardMaterial({ color: cCol, roughness: 0.35, metalness: 0.15 });
      var tMat = new THREE.MeshStandardMaterial({ color: cCol, roughness: 0.30, transparent: true, opacity: 0.85, side: THREE.DoubleSide });

      addMesh(new THREE.ConeGeometry(0.16, 0.82, 7), fMat, 0, 0, 0,
        { parent: lFish, rotX: -Math.PI / 2, scale: [0.72, 1.0, 1.15] });
      // 头部吻端与眼（位于 -z）
      addMesh(new THREE.SphereGeometry(0.12, 6, 6), fMat, 0, 0, -0.42, { parent: lFish });
      [-0.045, 0.045].forEach(function (ex) {
        addMesh(new THREE.SphereGeometry(0.02, 4, 4), eyeMat, ex * 1.8, 0.03, -0.38, { parent: lFish });
      });
      // 摆动尾节（位于 +z）
      var lTail = new THREE.Group();
      lTail.position.set(0, 0, 0.42);
      addMesh(new THREE.PlaneGeometry(0.26, 0.38), tMat, 0, 0, 0.20, { parent: lTail, rotY: Math.PI / 2 });
      lFish.add(lTail);
      // 胸鳍
      addMesh(new THREE.PlaneGeometry(0.14, 0.22), tMat, -0.14, -0.03, -0.15, { parent: lFish, rotZ: 0.7, rotX: 0.4 });
      addMesh(new THREE.PlaneGeometry(0.14, 0.22), tMat, 0.14, -0.03, -0.15, { parent: lFish, rotZ: -0.7, rotX: 0.4 });

      var lOrbitR = 5.2 + leftRnd() * 4.0;
      var lSpeed = 0.32 + leftRnd() * 0.22;
      var lPhase = leftRnd() * Math.PI * 2;
      var lDepth = WATER_Y - 0.08 - leftRnd() * 0.05;
      lFish.position.set(-12.0, lDepth, 8.0);
      scene.add(lFish);

      leftKoiGroup.push({
        group: lFish,
        tail: lTail,
        cx: -12.5 + (leftRnd() - 0.5) * 4.0,
        cz: 8.5 + (leftRnd() - 0.5) * 5.0,
        rx: lOrbitR,
        rz: lOrbitR * 0.72,
        speed: lSpeed,
        phase: lPhase,
        depth: lDepth,
        wiggleSpeed: 4.8 + leftRnd() * 2.5
      });
    }
  }

  var eastShoreRockPts = [
    [17.4, -1.4], [20.2, -0.8], [22.4, 2.0], [21.6, 5.0], [19.5, 8.0],
    [21.2, 10.5], [24.2, 13.5], [23.4, 16.0], [20.8, 17.5], [17.4, 18.0]
  ];

  function distToSegmentWithClosest(px, pz, ax, az, bx, bz) {
    var dx = bx - ax, dz = bz - az;
    var l2 = dx * dx + dz * dz;
    if (l2 === 0) return { dist: Math.hypot(px - ax, pz - az), cx: ax, cz: az };
    var t = ((px - ax) * dx + (pz - az) * dz) / l2;
    t = Math.max(0, Math.min(1, t));
    var cx = ax + t * dx, cz = az + t * dz;
    return { dist: Math.hypot(px - cx, pz - cz), cx: cx, cz: cz };
  }

  function getClosestEastRock(px, pz) {
    var minDist = 999;
    var bestCx = 0, bestCz = 0;
    for (var i = 0; i < eastShoreRockPts.length - 1; i++) {
      var res = distToSegmentWithClosest(px, pz, eastShoreRockPts[i][0], eastShoreRockPts[i][1], eastShoreRockPts[i + 1][0], eastShoreRockPts[i + 1][1]);
      if (res.dist < minDist) {
        minDist = res.dist;
        bestCx = res.cx;
        bestCz = res.cz;
      }
    }
    return { dist: minDist, cx: bestCx, cz: bestCz };
  }

  function updateWaterAgent(agent, dt, elapsed, leader) {
    var steer = 0;
    var t = elapsed + agent.seed;

    // 1. 拟真有机游弋偏航力（多频谐波自然摆游）
    steer += Math.sin(t * 0.65) * 0.48 + Math.cos(t * 1.35) * 0.30;

    // 2. 鸭鹅伴游跟随逻辑（后鹅温柔追随领头鹅）
    if (leader) {
      var fdx = leader.x - agent.x;
      var fdz = leader.z - agent.z;
      var fdist = Math.hypot(fdx, fdz);
      var targetDist = 1.8;
      if (fdist > targetDist) {
        var targetAngle = Math.atan2(fdx, fdz);
        var fdiff = targetAngle - agent.heading;
        while (fdiff > Math.PI) fdiff -= Math.PI * 2;
        while (fdiff < -Math.PI) fdiff += Math.PI * 2;
        steer += fdiff * 1.8;
      }
    }

    // 3. 湖心水亭避障力场（圆心 x: 8.5, z: 8.5，台基 R=4.6m）
    var pavX = 8.5, pavZ = 8.5;
    var safeR = 5.8, hardR = 5.3;
    var pdx = agent.x - pavX;
    var pdz = agent.z - pavZ;
    var pDist = Math.hypot(pdx, pdz);

    if (pDist < safeR) {
      var awayAngle = Math.atan2(pdx, pdz);
      var diff = awayAngle - agent.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      var urgency = (safeR - pDist) / (safeR - hardR + 0.1);
      var turnSign = diff >= 0 ? 1 : -1;
      steer += turnSign * urgency * 4.5;
    }

    // 4. 湖心小石岛叠石群避障（x: 4.8, z: 3.5, R=1.8m）
    var isX = 4.8, isZ = 3.5;
    var isDist = Math.hypot(agent.x - isX, agent.z - isZ);
    if (isDist < 3.2) {
      var isAngle = Math.atan2(agent.x - isX, agent.z - isZ);
      var isDiff = isAngle - agent.heading;
      while (isDiff > Math.PI) isDiff -= Math.PI * 2;
      while (isDiff < -Math.PI) isDiff += Math.PI * 2;
      steer += isDiff * 3.5;
    }

    // 5. 东侧自然叠石驳岸与石矶避障（多段连续精确距离检测，提前柔和回航，永不穿石）
    var rockInfo = getClosestEastRock(agent.x, agent.z);
    var rockClearance = rockInfo.cx - agent.x;
    if (rockInfo.dist < 3.0 || rockClearance < 2.5) {
      var awayX = agent.x - rockInfo.cx;
      if (awayX > -0.5) awayX = -1.2;
      var awayZ = agent.z - rockInfo.cz;
      var rockAngle = Math.atan2(awayX, awayZ);
      var rDiff = rockAngle - agent.heading;
      while (rDiff > Math.PI) rDiff -= Math.PI * 2;
      while (rDiff < -Math.PI) rDiff += Math.PI * 2;
      var rUrgency = Math.max(0, 1.0 - rockInfo.dist / 3.0);
      steer += rDiff * (2.5 + rUrgency * 3.0);
    }

    // 6. 水岸与长走廊柔性排斥
    // 西侧中轴长走廊（x ~ 3.2）
    if (agent.x < 5.0) {
      var cFactor = (5.0 - agent.x) / 1.0;
      var cDiff = (Math.PI / 2) - agent.heading;
      steer += Math.sin(cDiff) * cFactor * 3.5;
    }
    // 北侧主殿水岸（z ~ 1.0）
    if (agent.z < 3.2) {
      var nFactor = (3.2 - agent.z) / 1.0;
      var nDiff = 0 - agent.heading;
      steer += Math.sin(nDiff) * nFactor * 3.5;
    }
    // 南侧湖岸栅栏（z ~ 16.5）
    if (agent.z > 14.5) {
      var sFactor = (agent.z - 14.5) / 1.2;
      var sDiff = Math.PI - agent.heading;
      steer += Math.sin(sDiff) * sFactor * 3.5;
    }

    // 水亭西侧平桥避让（x: 1.5 ~ 5.0, z: 8.5 +/- 1.3）
    if (agent.x < 5.2 && Math.abs(agent.z - 8.5) < 1.6) {
      steer += (agent.z >= 8.5 ? 1 : -1) * 3.5;
    }

    // 转角角加速度限幅与角速度积分
    steer = Math.max(-3.5, Math.min(3.5, steer));
    agent.heading += steer * dt;
    while (agent.heading > Math.PI) agent.heading -= Math.PI * 2;
    while (agent.heading < -Math.PI) agent.heading += Math.PI * 2;

    // 质点向前行进
    agent.x += Math.sin(agent.heading) * agent.speed * dt;
    agent.z += Math.cos(agent.heading) * agent.speed * dt;

    // 几何硬包络碰撞约束（彻底杜绝任何帧率下的穿模与卡模）
    // 亭台硬包络
    var curPdx = agent.x - pavX;
    var curPdz = agent.z - pavZ;
    var curDist = Math.hypot(curPdx, curPdz);
    if (curDist < hardR) {
      var push = hardR / (curDist || 1);
      agent.x = pavX + curPdx * push;
      agent.z = pavZ + curPdz * push;
    }
    // 湖心小石岛硬包络
    var curIsDist = Math.hypot(agent.x - isX, agent.z - isZ);
    if (curIsDist < 2.2) {
      var isPush = 2.2 / (curIsDist || 1);
      agent.x = isX + (agent.x - isX) * isPush;
      agent.z = isZ + (agent.z - isZ) * isPush;
    }
    // 东侧驳岸叠石硬包络（绝对禁止逾越至石头内）
    var curRock = getClosestEastRock(agent.x, agent.z);
    if (curRock.dist < 1.8 || agent.x > curRock.cx - 1.8) {
      agent.x = Math.min(agent.x, curRock.cx - 1.8);
      if (Math.sin(agent.heading) > 0) {
        agent.heading = Math.PI - agent.heading;
      }
    }
    agent.x = Math.max(4.2, agent.x);
    agent.z = Math.max(2.0, Math.min(15.5, agent.z));
  }

  function updateFish(dt, elapsed) {
    if (reducedMotion) return;
    if (typeof dt !== 'number' || dt <= 0 || dt > 0.1) dt = 0.016;
    if (typeof elapsed !== 'number') elapsed = performance.now() * 0.001;

    // 1. 更新一条红鲤游弋状态（自主随机巡游避障：吻端朝向游动方向，绕避水亭，彻底不穿模）
    if (redKoiData) {
      var k = redKoiData;
      updateWaterAgent(k, dt, elapsed, null);

      k.group.position.x = k.x;
      k.group.position.z = k.z;
      k.group.position.y = k.depth + Math.sin(elapsed * 2.2) * 0.025;
      // 模型头部朝向 -z，加 Math.PI 确保鱼嘴向前游动
      k.group.rotation.y = k.heading + Math.PI;
      k.group.rotation.z = Math.sin(elapsed * 1.5) * 0.08;
      k.tailNode.rotation.y = Math.sin(elapsed * 5.2) * 0.38;
      k.leftPec.rotation.z = 0.7 + Math.sin(elapsed * 3.5) * 0.25;
      k.rightPec.rotation.z = -0.7 - Math.sin(elapsed * 3.5) * 0.25;
    }

    // 2. 更新一只小乌龟慢游与划水（修正朝向：龟首朝向游动前方）
    if (turtleData) {
      var t = turtleData;
      var tAng = elapsed * 0.15;
      var tx = t.baseX + Math.sin(tAng) * 0.8;
      var tz = t.baseZ + Math.cos(tAng * 0.8) * 0.6;
      var tvx = 0.8 * 0.15 * Math.cos(tAng);
      var tvz = -0.6 * 0.15 * 0.8 * Math.sin(tAng * 0.8);
      var tHeading = Math.atan2(tvx, tvz);

      t.group.position.x = tx;
      t.group.position.z = tz;
      t.group.position.y = (WATER_Y - 0.02) + Math.sin(elapsed * 1.2) * 0.015;
      t.group.rotation.y = tHeading + Math.PI;

      // 四肢交替划水
      var stroke = Math.sin(elapsed * 2.8);
      t.fL.rotation.y = 0.6 + stroke * 0.35;
      t.fR.rotation.y = -0.6 - stroke * 0.35;
      t.bL.rotation.y = -0.5 - stroke * 0.30;
      t.bR.rotation.y = 0.5 + stroke * 0.30;
      t.head.rotation.y = Math.sin(elapsed * 0.8) * 0.15;
    }

    // 3. 更新两只白鹅浮水与曲项向天（自主伴游避障：鹅首向前拨波游水，柔和绕避水亭）
    for (var gi = 0; gi < geeseData.length; gi++) {
      var g = geeseData[gi];
      var gLeader = gi > 0 ? geeseData[0] : null;
      updateWaterAgent(g, dt, elapsed, gLeader);

      g.group.position.x = g.x;
      g.group.position.z = g.z;
      // 随水波起伏（白毛浮绿水）
      g.group.position.y = (WATER_Y + 0.08) + Math.sin(elapsed * 2.4 + g.seed) * 0.025;
      // 模型鹅头朝向 -z，加 Math.PI 确保曲项鹅首向前游弋
      g.group.rotation.y = g.heading + Math.PI;
      g.group.rotation.z = Math.sin(elapsed * 2.0 + g.seed) * 0.04;

      // 鹅颈轻微点水律动
      g.neck.rotation.x = Math.sin(elapsed * 1.8 + g.seed) * 0.12;
      // 红掌在水下交替划动（红掌拨清波）
      var paddle = Math.sin(elapsed * 3.2 + g.seed);
      g.feetL.rotation.x = paddle * 0.45;
      g.feetR.rotation.x = -paddle * 0.45;
    }

    // 4. 更新左侧新增大水池锦鲤群游弋（严格头部朝向游动方向）
    for (var lki = 0; lki < leftKoiGroup.length; lki++) {
      var lkItem = leftKoiGroup[lki];
      var lAng = elapsed * lkItem.speed + lkItem.phase;
      var lkx = lkItem.cx + Math.cos(lAng) * lkItem.rx;
      var lkz = lkItem.cz + Math.sin(lAng * 0.85) * lkItem.rz;
      var ldx = -Math.sin(lAng) * lkItem.rx;
      var ldz = Math.cos(lAng * 0.85) * (lkItem.rz * 0.85);
      var lHeading = Math.atan2(ldx, ldz);

      lkItem.group.position.x = lkx;
      lkItem.group.position.z = lkz;
      lkItem.group.position.y = lkItem.depth + Math.sin(elapsed * 2.0 + lkItem.phase) * 0.025;
      lkItem.group.rotation.y = lHeading + Math.PI;
      lkItem.tail.rotation.y = Math.sin(elapsed * lkItem.wiggleSpeed) * 0.36;
    }
  }


  function buildBambooGroves() {
    var stemMat = new THREE.MeshStandardMaterial({
      color: COL.bambooStem, roughness: 0.65, flatShading: true
    });
    var leafMat = new THREE.MeshStandardMaterial({
      color: COL.bambooLeaf, roughness: 0.82, flatShading: true
    });

    // 植被反馈：风力驱动竹林向风向倾斜摇摆（根部扎地不移，竿尖与竹叶顺风摇曳）
    function applyWindToBambooMat(mat, isLeaf) {
      mat.onBeforeCompile = function (shader) {
        shader.uniforms.uWindTime = windShaderUniforms.uTime;
        shader.uniforms.uWindStrength = windShaderUniforms.uWindStrength;
        shader.vertexShader = 'uniform float uWindTime;\nuniform float uWindStrength;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\n' +
          '  float hFactor = ' + (isLeaf ? '1.0' : 'clamp((transformed.y + 4.1) / 8.2, 0.0, 1.0)') + ';\n' +
          '  float sway = sin(uWindTime * 2.4 + transformed.x * 0.4 + transformed.z * 0.3) * 0.38;\n' +
          '  transformed.x += sway * hFactor * hFactor * uWindStrength;\n' +
          '  transformed.z += sway * 0.6 * hFactor * hFactor * uWindStrength;\n'
        );
      };
    }
    applyWindToBambooMat(stemMat, false);
    applyWindToBambooMat(leafMat, true);

    // 严格规划在院落空白平地与外围林带，绝对避开所有建筑轮廓
    var groves = [
      { x: -32, z: 0, r: 3.2, n: isMobile ? 40 : 80, seed: 43 },    // 西侧外院竹林（再收进，竹梢不穿西墙）
      { x: 33, z: -16, r: 3.0, n: isMobile ? 35 : 70, seed: 49 },   // 东北竹林（再收进，竹梢不穿东墙）
      { x: 0, z: -55, r: 12.0, n: isMobile ? 40 : 80, seed: 55 },   // 正殿后方平地竹海
      { x: -75, z: -55, r: 24, n: isMobile ? 35 : 75, seed: 61 },   // 外围西侧竹海
      { x: 80, z: -60, r: 24, n: isMobile ? 35 : 75, seed: 67 }     // 外围东侧竹海
    ];

    var total = 0;
    groves.forEach(function (g) { total += g.n; });

    var stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.08, 0.12, 8.2, 5), stemMat, total);
    var leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1.3, 0), leafMat, total);
    var m = new THREE.Matrix4(); var q = new THREE.Quaternion(); var p = new THREE.Vector3(); var s = new THREE.Vector3();
    var idx = 0;

    groves.forEach(function (g) {
      var rnd = makeRandom(g.seed);
      for (var i = 0; i < g.n; i++) {
        var a = rnd() * Math.PI * 2;
        var r = Math.sqrt(rnd()) * g.r;
        var x = g.x + Math.cos(a) * r;
        var z = g.z + Math.sin(a) * r;
        var tilt = (rnd() - 0.5) * 0.20;
        var sc = 0.85 + rnd() * 0.48;

        p.set(x, 4.1 * sc, z);
        q.setFromEuler(new THREE.Euler(tilt, rnd() * Math.PI, tilt * 0.5));
        s.set(sc, sc, sc);
        m.compose(p, q, s);
        stems.setMatrixAt(idx, m);

        p.set(x + Math.sin(tilt) * 1.8, 7.8 * sc, z + Math.cos(tilt) * 1.2);
        q.setFromEuler(new THREE.Euler(rnd() * 0.4, rnd() * 3, rnd() * 0.3));
        s.set(1.5 + rnd() * 0.8, 0.65 + rnd() * 0.4, 1.5 + rnd() * 0.8);
        m.compose(p, q, s);
        leaves.setMatrixAt(idx, m);

        idx += 1;
      }
    });

    stems.instanceMatrix.needsUpdate = true;
    leaves.instanceMatrix.needsUpdate = true;
    stems.castShadow = !isMobile;
    scene.add(stems);
    scene.add(leaves);
  }

  function buildWillow(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.woodDark, roughness: 0.88 });
    var leaf = new THREE.MeshStandardMaterial({ color: COL.willow, roughness: 0.85, flatShading: true });
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.26, 0.46, 4.8, 7), bark, 0, 2.4, 0,
      { parent: g, rotZ: 0.18, cast: true });

    [[2.6, 5.0], [2.1, 6.0], [1.5, 6.9]].forEach(function (item) {
      addMesh(new THREE.IcosahedronGeometry(item[0], 0), leaf, 0.4, item[1], 0,
        { parent: g, cast: true, scale: [1.1, 0.72, 1.1] });
    });

    var branches = [];
    for (var i = 0; i < 16; i++) {
      var a = (i / 16) * Math.PI * 2;
      var dist = 1.35 + (i % 3) * 0.38;
      var brMesh = addMesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6, 4), leaf,
        Math.cos(a) * dist + 0.4, 3.8, Math.sin(a) * dist,
        { parent: g, rotZ: Math.cos(a) * 0.30, rotX: Math.sin(a) * 0.30 });
      branches.push({ mesh: brMesh, baseRotZ: Math.cos(a) * 0.30, baseRotX: Math.sin(a) * 0.30, phase: a + i });
    }

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
    willowTrees.push({ group: g, branches: branches, baseX: x, baseZ: z });
  }

  function buildBlossomTree(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x3d2b1f, roughness: 0.9 });
    var flowerPink = new THREE.MeshStandardMaterial({ color: COL.blossomPink, roughness: 0.82, flatShading: true });
    var flowerDeep = new THREE.MeshStandardMaterial({ color: COL.blossomDeep, roughness: 0.80, flatShading: true });
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.24, 0.44, 4.0, 6), bark, 0, 2.0, 0,
      { parent: g, rotZ: 0.22, cast: true });
    addMesh(new THREE.CylinderGeometry(0.15, 0.24, 2.8, 5), bark, 0.8, 3.8, 0.4,
      { parent: g, rotZ: 0.55, rotX: -0.3, cast: true });
    addMesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 5), bark, -0.7, 3.6, -0.3,
      { parent: g, rotZ: -0.45, rotX: 0.3, cast: true });

    var flowers = [
      [1.8, 4.6, 0.6, 1.7, flowerPink],
      [-1.5, 4.5, -0.5, 1.6, flowerDeep],
      [0.3, 5.4, 0.2, 1.9, flowerPink],
      [1.2, 6.0, -0.4, 1.4, flowerDeep],
      [-0.9, 5.8, 0.8, 1.5, flowerPink]
    ];
    flowers.forEach(function (f) {
      addMesh(new THREE.IcosahedronGeometry(f[3], 1), f[4], f[0], f[1], f[2],
        { parent: g, cast: true, scale: [1, 0.78, 1] });
    });

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
  }

  function buildPine(x, y, z, scale, rotZ) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x423022, roughness: 0.92 });
    var needle = new THREE.MeshStandardMaterial({ color: COL.pineNeedle, roughness: 0.90, flatShading: true });
    applySnowAccumulation(needle, 0.85);
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.24, 0.40, 5.0, 6), bark, 0, 2.5, 0,
      { parent: g, rotZ: rotZ || -0.20, cast: true });
    [[2.6, 2.3, 4.6], [2.2, 2.0, 6.0], [1.5, 1.8, 7.3]].forEach(function (item) {
      addMesh(new THREE.ConeGeometry(item[0], item[1], 7), needle, -0.3, item[2], 0, { parent: g, cast: true });
    });

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
  }

  function buildMagnolia(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x4a3a2d, roughness: 0.88 });
    var whitePetal = new THREE.MeshStandardMaterial({ color: 0xfffcf5, roughness: 0.75, flatShading: true });
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.22, 0.42, 4.4, 6), bark, 0, 2.2, 0,
      { parent: g, rotZ: -0.16, cast: true });
    addMesh(new THREE.CylinderGeometry(0.14, 0.22, 2.6, 5), bark, 0.7, 3.8, -0.3,
      { parent: g, rotZ: 0.48, cast: true });

    [
      [1.4, 4.4, -0.4, 1.2], [-1.2, 4.2, 0.4, 1.3],
      [0.2, 5.2, 0.1, 1.4], [0.8, 5.8, 0.6, 1.1]
    ].forEach(function (cup) {
      addMesh(new THREE.ConeGeometry(cup[3] * 0.9, cup[3] * 1.5, 6), whitePetal,
        cup[0], cup[1], cup[2], { parent: g, cast: true, rotX: Math.PI });
    });

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
  }

  function buildPlantain(x, y, z, scale) {
    var g = new THREE.Group();
    var stemMat = new THREE.MeshStandardMaterial({ color: 0x5a7d38, roughness: 0.72 });
    var leafMat = new THREE.MeshStandardMaterial({ color: 0x48752c, roughness: 0.75, side: THREE.DoubleSide });
    scale = scale || 1;

    addMesh(new THREE.CylinderGeometry(0.16, 0.22, 2.2, 6), stemMat, 0, 1.1, 0, { parent: g, cast: true });

    for (var i = 0; i < 5; i++) {
      var a = (i / 5) * Math.PI * 2;
      var lg = new THREE.Group();
      addMesh(new THREE.PlaneGeometry(0.85, 2.6, 2, 4), leafMat, 0, 1.2, 0,
        { parent: lg, cast: true, rotX: 0.45 });
      lg.rotation.y = a;
      lg.rotation.z = 0.42;
      lg.position.set(0, 1.8, 0);
      g.add(lg);
    }

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
  }

  function buildShrubs() {
    var greenMat = new THREE.MeshStandardMaterial({ color: COL.shrubGreen, roughness: 0.88, flatShading: true });
    applySnowAccumulation(greenMat, 0.9);
    var lightGreenMat = new THREE.MeshStandardMaterial({ color: COL.shrubLight, roughness: 0.88, flatShading: true });
    applySnowAccumulation(lightGreenMat, 0.9);
    var pinkMat = new THREE.MeshStandardMaterial({ color: COL.hydrangeaPink, roughness: 0.82, flatShading: true });
    applySnowAccumulation(pinkMat, 0.9);
    var blueMat = new THREE.MeshStandardMaterial({ color: COL.hydrangeaBlue, roughness: 0.82, flatShading: true });
    applySnowAccumulation(blueMat, 0.9);

    // 灌木花丛全部布置在围栏外陆地、南庭草坪与后院，绝不入水，严格避让主殿、书斋屋檐台座与东侧曲折水湾
    var shrubSpots = [
      [-16, 0.08, 20.5, 1.2, greenMat],     // 南围栏外草坪
      [15, 0.08, 20.5, 1.2, pinkMat],       // 南围栏外草坪
      [-10, 0.08, 21.5, 0.9, lightGreenMat],// 南步道旁草地
      [10, 0.08, 21.5, 0.9, blueMat],       // 南步道旁草地
      [22.8, 0.08, 8.0, 1.0, greenMat],     // 亭子东向石矶颈部外陆地
      [26.5, 0.08, 14.5, 1.1, lightGreenMat],// 东南阔水荷湾外东南草坪
      [-31, 0.08, 2, 1.0, pinkMat],         // 西侧围栏外草坪
      [-31, 0.08, 9, 1.1, greenMat],        // 西侧围栏外草坪
      [24.5, 0.08, 0.5, 0.95, greenMat],    // 东北涵青水湾外开阔草坪
      [-19.0, 0.08, -4.5, 0.95, pinkMat],   // 主殿西南开阔草地（彻底避开主殿西檐与台座）
      [-18.5, 0.08, -18.5, 1.0, greenMat],  // 主殿西北后角开阔草地（彻底避开主殿后檐）
      [18.5, 0.08, -18.5, 1.0, pinkMat]     // 主殿东北后角开阔草地（彻底避开主殿后檐）
    ];

    shrubSpots.forEach(function (s) {
      var geo = new THREE.IcosahedronGeometry(s[3], 1);
      addMesh(geo, s[4], s[0], s[1] + s[3] * 0.72, s[2], { cast: true, receive: true, scale: [1, 0.82, 1] });
    });
  }

  function buildReeds() {
    var reedMat = new THREE.MeshStandardMaterial({ color: COL.reed, roughness: 0.84, flatShading: true });
    var headMat = new THREE.MeshStandardMaterial({ color: COL.reedHead, roughness: 0.88 });

    // 芦苇丛全部生于清池水湾深浅适中处，坐标精心避开主殿台阶基座、书斋台基与岸边围栏
    var clusters = [
      [-22.0, 1.0], [-26.5, 12.0], [-18, 17], [-10, 18], [22.2, 13.8], [16.5, 1.5], [8, 18], [-6, 1.0]
    ];
    var rnd = makeRandom(71);
    clusters.forEach(function (cl) {
      var count = isMobile ? 8 : 14;
      for (var i = 0; i < count; i++) {
        var rx = cl[0] + (rnd() - 0.5) * 2.2;
        var rz = cl[1] + (rnd() - 0.5) * 2.2;
        var h = 1.5 + rnd() * 0.9;
        addMesh(new THREE.CylinderGeometry(0.02, 0.035, h, 4), reedMat,
          rx, WATER_Y + h / 2 - 0.05, rz, { rotZ: (rnd() - 0.5) * 0.25, rotX: (rnd() - 0.5) * 0.25 });
        addMesh(new THREE.CylinderGeometry(0.04, 0.04, 0.38, 4), headMat, rx, WATER_Y + h, rz);
      }
    });
  }

  function buildLotus() {
    var leafMat = new THREE.MeshStandardMaterial({
      color: COL.lotusLeaf, roughness: 0.75, side: THREE.DoubleSide
    });
    var leafGeo = new THREE.CircleGeometry(0.78, 14, 0, Math.PI * 1.76);
    leafGeo.rotateX(-Math.PI / 2);

    var count = isMobile ? 28 : 55;
    var lotusLeaves = new THREE.InstancedMesh(leafGeo, leafMat, count);
    var m = new THREE.Matrix4(); var q = new THREE.Quaternion(); var p = new THREE.Vector3(); var s = new THREE.Vector3();
    var rnd = makeRandom(65);

    for (var i = 0; i < count; i++) {
      var lx = LAKE_X + (rnd() - 0.5) * (LAKE_W - 6);
      var lz = LAKE_Z + (rnd() - 0.5) * (LAKE_D - 6);
      if (Math.abs(lx) < 2.2) continue; // 避让主屋中轴水上长直廊
      if (Math.hypot(lx - 8.5, lz - 8.5) < 5.0) continue; // 避让右侧水亭
      if (lx < -10 && lx > -16 && lz > 12) continue; // 避让左侧西码头与乌篷船
      if (lx < -9.5 && lx > -26.0 && lz > -2.0 && lz < 9.5) continue; // 避让小飞虹拱桥、转角登台大石坪与石阶，防止荷叶卡在石台上

      p.set(lx, WATER_Y + 0.16 + rnd() * 0.04, lz);
      q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.15, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.15));
      var sc = 0.75 + rnd() * 0.8;
      s.set(sc, 1, sc);
      m.compose(p, q, s);
      lotusLeaves.setMatrixAt(i, m);
    }
    lotusLeaves.instanceMatrix.needsUpdate = true;
    scene.add(lotusLeaves);

    var petalMat = new THREE.MeshStandardMaterial({
      color: COL.lotusPetal, roughness: 0.65, flatShading: true
    });
    var centerMat = new THREE.MeshStandardMaterial({ color: COL.lotusCenter, roughness: 0.6 });

    var flowerCount = isMobile ? 9 : 16;
    for (var f = 0; f < flowerCount; f++) {
      var fx = LAKE_X + (rnd() - 0.5) * (LAKE_W - 8);
      var fz = LAKE_Z + (rnd() - 0.5) * (LAKE_D - 8);
      if (Math.abs(fx) < 2.2) continue;
      if (Math.hypot(fx - 8.5, fz - 8.5) < 5.0) continue;
      if (fx < -10 && fx > -16 && fz > 12) continue;
      if (fx < -9.5 && fx > -26.0 && fz > -2.0 && fz < 9.5) continue;

      var fg = new THREE.Group();
      addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 4), leafMat, 0, 0.25, 0, { parent: fg });
      addMesh(new THREE.CylinderGeometry(0.13, 0.09, 0.15, 6), centerMat, 0, 0.5, 0, { parent: fg });
      for (var pet = 0; pet < 6; pet++) {
        var pa = (pet / 6) * Math.PI * 2;
        addMesh(new THREE.ConeGeometry(0.18, 0.48, 4), petalMat,
          Math.cos(pa) * 0.16, 0.48, Math.sin(pa) * 0.16,
          { parent: fg, rotZ: Math.cos(pa) * 0.48, rotX: Math.sin(pa) * 0.48 });
      }
      fg.position.set(fx, WATER_Y + 0.16, fz);
      scene.add(fg);
    }
  }


  /* ---------------- 12.5 古典庭院石灯笼系统（傍水随径，黄昏自动点亮） ---------------- */

  function buildStoneLantern(x, y, z, scale) {
    scale = scale || 1.0;
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0x9e9b91, roughness: 0.90 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 0.9);
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), color: COL.roof, roughness: 0.85 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0);

    // 1. 基座（八角盘石）
    addMesh(new THREE.CylinderGeometry(0.38, 0.45, 0.22, 6), stoneMat, 0, 0.11, 0, { parent: g, cast: true, receive: true });
    // 2. 竿柱
    addMesh(new THREE.CylinderGeometry(0.14, 0.16, 0.72, 6), stoneMat, 0, 0.58, 0, { parent: g, cast: true });
    // 3. 中台
    addMesh(new THREE.CylinderGeometry(0.42, 0.28, 0.16, 6), stoneMat, 0, 1.02, 0, { parent: g, cast: true });
    // 4. 火舍（暖光照壁发光腔体）
    addMesh(new THREE.BoxGeometry(0.32, 0.38, 0.32), stoneLanternGlow(), 0, 1.28, 0, { parent: g });
    for (var c = 0; c < 4; c++) {
      var ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
      addMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.38, 4), stoneMat,
        Math.cos(ca) * 0.22, 1.28, Math.sin(ca) * 0.22, { parent: g });
    }
    // 5. 笠石（覆雪屋顶）
    addMesh(new THREE.ConeGeometry(0.55, 0.32, 6), roofMat, 0, 1.62, 0, { parent: g, cast: true });
    // 6. 宝珠
    addMesh(new THREE.SphereGeometry(0.10, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.5, metalness: 0.3 }), 0, 1.84, 0, { parent: g, cast: true });

    // 7. 内置暖黄色点光源（黄昏与夜晚联动照亮水岸与路径）
    var light = new THREE.PointLight(0xffaa44, 0, 8.5, 2.0);
    light.position.set(0, 1.28, 0);
    g.add(light);
    lampLights.push(light);

    g.position.set(x, y || 0, z);
    g.scale.set(scale, scale, scale);
    scene.add(g);
    return g;
  }

  function buildStoneLanterns() {
    var spots = [
      // 1. 庭院与水岸石灯笼（湖滨观景点与引桥引道）
      [2.2, 0.08, 6.8, 1.0],     // 中轴直廊水榭连桥畔
      [7.2, 0.08, 4.2, 0.95],    // 荷风四面水亭北石阶引桥畔
      [-21.5, 0.08, 5.2, 1.05],  // 小飞虹西桥堍古石径旁
      [23.6, 0.08, -3.2, 0.95],  // 涵青书斋月洞门步道旁
      [5.2, 0.08, 16.5, 1.0],    // 南岸赏荷青石步道旁
      [-9.8, 0.08, 13.5, 1.0],   // 西南岸曲廊外石径旁

      // 2. 【主屋四个角落石灯笼】：依柱座四角平地而设，烘托正殿庄重雅致
      [-15.0, 0.08, -2.2, 1.0],  // 主屋前西南角（近西侧登桥石阶）
      [15.0, 0.08, -2.2, 1.0],   // 主屋前东南角（近东侧水亭与书斋径）
      [-15.0, 0.08, -18.2, 1.0], // 主屋后西北角（近后院净房通道）
      [15.0, 0.08, -18.2, 1.0],  // 主屋后东北角（近东北竹林小憩石径）

      // 3. 【厕所门口石灯笼】：西北净院引道与房门
      [-31.0, 0.08, -23.2, 0.95], // 茅厕房门台阶东侧石坪（门前引路灯）
      [-30.4, 0.08, -17.4, 0.95]  // 茅厕四面合围南墙月洞门入口外（院门石灯）
    ];
    spots.forEach(function (sp) {
      buildStoneLantern(sp[0], sp[1], sp[2], sp[3]);
    });
  }

  function buildVegetation() {
    buildBambooGroves();

    // 依依垂柳：严格种植在平地陆地上，远离湖水与围栏，树根落地、绝不在水中
    buildWillow(-31, 0.08, 12, 1.25);     // 湖西南岸外陆地（退至围栏外陆地，绝不在水中）
    buildWillow(27.5, 0.08, 12.5, 1.2);   // 湖东南岸外平地（东侧不规则水湾外陆地）
    buildWillow(-26, 0.08, -8, 1.1);      // 西北后院平地（远香堂西侧平地，远离湖面）
    buildWillow(34, 0.08, 10, 1.15);      // 东岸平地（原植于主殿台座体内，移出避免穿台）
    buildWillow(28, 0.08, 26, 1.3);       // 南院墙外旷地
    buildWillow(-28, 0.08, 26, 1.3);      // 南院墙外旷地
    buildWillow(-14, 0.08, 29, 1.3);      // 正门外西侧旷地（让开中轴门景）
    buildWillow(14, 0.08, 29, 1.3);       // 正门外东侧旷地（让开中轴门景）

    // 春桃海棠花树：种在宽敞陆地花坛角隅与院墙转角，绝不种在水中，严格避开所有殿宇屋檐
    buildBlossomTree(-21.0, 0.08, -14.5, 1.15); // 主殿西院开阔草坪（彻底避开主殿西侧大屋檐）
    buildBlossomTree(21.0, 0.08, -16.0, 1.15);  // 主殿东院开阔草坪（彻底避开主殿东侧大屋檐）
    buildBlossomTree(26, 0.08, 4, 1.2);    // 书斋东侧草坪
    buildBlossomTree(-31, 0.08, 17, 1.2);  // 西南围栏外草地（远离湖水）
    buildBlossomTree(26, 0.08, 16, 1.2);   // 南岸步道东侧陆地
    buildBlossomTree(33.5, 0.08, -15.0, 1.1);   // 东院北草坪（彻底避开书斋屋顶）

    // 白玉兰：古典江南名卉，点缀两岸陆地
    buildMagnolia(-32, 0.08, 6, 1.15);    // 西侧围栏外平地（远离水岸与桥）
    buildMagnolia(30, 0.08, 6, 1.15);     // 东岸平地

    // 雨打芭蕉：江南深院点睛名景
    buildPlantain(24.5, 0.08, 3.5, 1.05); // 书斋月洞门旁南侧草坪（树根落地，避让水湾）
    buildPlantain(19.0, 0.08, -13.5, 1.0); // 主殿东庭院（移出主殿与书斋狭缝，蕉叶不穿檐）
    buildPlantain(-26, 0.08, -6, 0.95);   // 西北庭院平地（远离湖水）

    // 苍劲罗汉松与黑松：全部改植于平地，树根落在平地标高，树冠避让院墙与假山
    buildPine(-34, 0.08, -38, 1.35, 0.12);  // 西北院墙外平地古松（墙外栽植，松冠不搭墙）
    buildPine(-21.0, 0.08, -21.0, 1.2, 0.08); // 西北庭院平地盘松（彻底移离新筑茅厕东墙与假山石）
    buildPine(6, 0.08, -24, 1.3, 0.08);     // 主殿后方平地迎客松（退至后园，不穿墙）
    buildPine(34, 0.08, -27.5, 1.0, -0.09); // 东北后园平地苍松（缩冠并退离东北墙角）
    buildPine(-14.5, 0.08, -27.5, 1.25, 0.10); // 后园西侧疏朗古松（避让叠石，不穿墙）
    buildPine(18, 0.08, -24, 1.3, -0.07);   // 后园东侧平地苍松（退至后园，不穿墙）

    buildShrubs();
    buildStoneLanterns();
    buildReeds();
    buildLotus();
  }

  /* ---------------- 13. 青石小径与平地林木（不设任何远山体块） ---------------- */

  function buildPath() {
    var slabMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0xa6a398, roughness: 0.92 });
    snowCoverMats.push(slabMat);
    applySnowAccumulation(slabMat, 1.0);
    var routes = [
      [[0, 14], [-6, 16], [-12, 15], [-16, 10]],
      [[0, 14], [8, 16], [16, 17.5], [22, 18.5], [26, 15], [26, 9], [25, 3]]
    ];
    var slabs = [];
    routes.forEach(function (route, ri) {
      for (var i = 0; i < route.length - 1; i++) {
        var a = route[i];
        var b = route[i + 1];
        var steps = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.3));
        for (var s = 0; s < steps; s++) {
          var t = s / steps;
          var jitter = ((s + ri) % 2 === 0 ? 1 : -1) * 0.16;
          slabs.push([lerp(a[0], b[0], t) + jitter, 0.08, lerp(a[1], b[1], t) + jitter * 0.5]);
        }
      }
    });

    var mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1.5, 0.12, 1.05), slabMat, slabs.length);
    var m = new THREE.Matrix4(); var q = new THREE.Quaternion(); var p = new THREE.Vector3(); var s = new THREE.Vector3();
    for (var k = 0; k < slabs.length; k++) {
      p.set(slabs[k][0], slabs[k][1], slabs[k][2]);
      q.setFromEuler(new THREE.Euler(0, (k % 5) * 0.06, 0));
      s.set(1, 1, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(k, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }

  // 原「水墨远山」体块已按要求整体移除：场景不再生成任何远山、山峦与地形隆起，
// 远景天际线仅由渐变天穹与大气雾自然收束。

  /* ---------------- 14. 天空、星月、灯光与特效系统 ---------------- */

  function buildSky() {
    skyUniforms = {
      topColor: { value: new THREE.Color(0x2c466c) },
      bottomColor: { value: new THREE.Color(0xdcb692) },
      glowColor: { value: new THREE.Color(0xffcb90) },
      sunDirection: { value: new THREE.Vector3(0, 0.2, 1) },
      glowStrength: { value: 0.35 }
    };
    var skyMat = new THREE.ShaderMaterial({
      uniforms: skyUniforms,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      vertexShader: [
        'varying vec3 vWorld;',
        'void main() {',
        '  vWorld = normalize(position);',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 topColor;',
        'uniform vec3 bottomColor;',
        'uniform vec3 glowColor;',
        'uniform vec3 sunDirection;',
        'uniform float glowStrength;',
        'varying vec3 vWorld;',
        'void main() {',
        '  float h = clamp(vWorld.y * 0.5 + 0.5, 0.0, 1.0);',
        '  vec3 base = mix(bottomColor, topColor, pow(h, 0.85));',
        '  float d = max(dot(normalize(vWorld), normalize(sunDirection)), 0.0);',
        '  base += glowColor * pow(d, 6.0) * glowStrength;',
        '  gl_FragColor = vec4(base, 1.0);',
        '}'
      ].join('\n')
    });
    sky = new THREE.Mesh(new THREE.SphereGeometry(720, 32, 16), skyMat);
    scene.add(sky);

    var starCount = isMobile ? 450 : 1300;
    var pos = new Float32Array(starCount * 3);
    var rnd = makeRandom(117);
    for (var i = 0; i < starCount; i++) {
      var theta = rnd() * Math.PI * 2;
      var phi = Math.acos(rnd() * 0.92);
      var r = 550 + rnd() * 120;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) + 10;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    var starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    stars = new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 2.8, sizeAttenuation: false, map: dotTexture(),
      transparent: true, opacity: 0, depthWrite: false
    }));
    scene.add(stars);

    celestial = new THREE.Mesh(new THREE.CircleGeometry(10.0, 28), new THREE.MeshBasicMaterial({
      color: 0xffeecc, transparent: true, opacity: 0.95, depthWrite: false, fog: false
    }));
    var halo = new THREE.Mesh(new THREE.CircleGeometry(30, 28), new THREE.MeshBasicMaterial({
      color: 0xffe2ab, transparent: true, opacity: 0.16, depthWrite: false, fog: false
    }));
    celestial.add(halo);
    scene.add(celestial);
  }

  function buildLights() {
    hemiLight = new THREE.HemisphereLight(0xc2ddf2, 0x8b876a, 0.65);
    scene.add(hemiLight);
    ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xfff6dc, 1.6);
    sunLight.position.set(80, 115, 60);
    sunLight.castShadow = !isMobile;
    if (!isMobile) {
      sunLight.shadow.mapSize.set(1024, 1024);
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 480;
      sunLight.shadow.camera.left = -85;
      sunLight.shadow.camera.right = 85;
      sunLight.shadow.camera.top = 85;
      sunLight.shadow.camera.bottom = -85;
      sunLight.shadow.bias = -0.0006;
      sunLight.shadow.camera.updateProjectionMatrix();
    }
    scene.add(sunLight);
    scene.add(sunLight.target);

    moonLight = new THREE.DirectionalLight(0x9cb4dc, 0);
    moonLight.position.set(-65, 90, -80);
    scene.add(moonLight);
    scene.add(moonLight.target);
  }

  function buildPrecipitation(kind) {
    var count = isMobile ? (kind === 'snow' ? 1200 : 850) : (kind === 'snow' ? 2600 : 1900);
    var positions = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var speeds = new Float32Array(count);
    var rnd = makeRandom(kind === 'rain' ? 211 : 223);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * 180;
      positions[i * 3 + 1] = rnd() * 55;
      positions[i * 3 + 2] = -10 + (rnd() - 0.5) * 170;
      phases[i] = rnd() * Math.PI * 2;
      speeds[i] = 0.7 + rnd() * 0.7;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      size: kind === 'rain' ? 0.55 : 0.95,
      map: kind === 'rain' ? streakTexture() : dotTexture(),
      color: kind === 'rain' ? 0xdfeaf4 : 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    points.visible = false;
    points.frustumCulled = false;
    scene.add(points);
    return { points: points, geometry: geo, material: mat, phases: phases, speeds: speeds, count: count };
  }

  function buildPetals() {
    var count = isMobile ? 120 : 250;
    var positions = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var speeds = new Float32Array(count);
    var rnd = makeRandom(317);
    for (var i = 0; i < count; i++) {
      positions[i * 3] = (rnd() - 0.5) * 100;
      positions[i * 3 + 1] = 0.2 + rnd() * 14;
      positions[i * 3 + 2] = -5 + (rnd() - 0.5) * 90;
      phases[i] = rnd() * Math.PI * 2;
      speeds[i] = 0.5 + rnd() * 0.6;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.42,
      map: petalTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    scene.add(points);
    return { points: points, geometry: geo, material: mat, phases: phases, speeds: speeds, count: count };
  }

  function buildFireflies() {
    var count = isMobile ? 60 : 130;
    var positions = new Float32Array(count * 3);
    var phases = new Float32Array(count);
    var rnd = makeRandom(423);
    for (var i = 0; i < count; i++) {
      var rCluster = rnd();
      var cx = rCluster < 0.4 ? -16 + (rnd() - 0.5) * 16 : (rCluster < 0.7 ? 16 + (rnd() - 0.5) * 14 : (rnd() - 0.5) * 26);
      var cz = rCluster < 0.4 ? -12 + (rnd() - 0.5) * 16 : (rCluster < 0.7 ? -4 + (rnd() - 0.5) * 12 : LAKE_Z + (rnd() - 0.5) * 16);
      positions[i * 3] = cx;
      positions[i * 3 + 1] = 0.3 + rnd() * 3.6;
      positions[i * 3 + 2] = cz;
      phases[i] = rnd() * Math.PI * 2;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.46,
      map: fireflyTexture(),
      color: 0xedff88,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      sizeAttenuation: true
    });
    var points = new THREE.Points(geo, mat);
    scene.add(points);
    return { points: points, geometry: geo, material: mat, phases: phases, count: count };
  }

  function updateParticles(dt, elapsed) {
    var rainOn = params.rainAmount > 0.02;
    var snowOn = params.snowAmount > 0.02;
    rain.points.visible = rainOn;
    rain.material.opacity = params.rainAmount * 0.85;
    snow.points.visible = snowOn;
    snow.material.opacity = params.snowAmount * 0.9;

    var petalOn = params.petalAmount > 0.05;
    petals.points.visible = petalOn;
    petals.material.opacity = params.petalAmount * 0.85;

    var flyOn = params.fireflyAmount > 0.05;
    fireflies.points.visible = flyOn;
    fireflies.material.opacity = params.fireflyAmount * 0.95;

    if (reducedMotion) return;

    if (rainOn) {
      var rp = rain.geometry.attributes.position;
      for (var i = 0; i < rain.count; i++) {
        var y = rp.getY(i) - (24 * rain.speeds[i]) * dt;
        var x = rp.getX(i) + 4.5 * dt;
        if (y < -0.5) y += 55;
        if (x > 90) x -= 180;
        rp.setY(i, y);
        rp.setX(i, x);
      }
      rp.needsUpdate = true;
    }

    if (snowOn) {
      var sp = snow.geometry.attributes.position;
      for (var j = 0; j < snow.count; j++) {
        var sy = sp.getY(j) - (1.9 * snow.speeds[j]) * dt;
        var sx = sp.getX(j) + Math.sin(elapsed * 1.1 + snow.phases[j]) * 0.9 * dt;
        var sz = sp.getZ(j) + Math.cos(elapsed * 0.8 + snow.phases[j]) * 0.6 * dt;
        if (sy < -0.5) sy += 55;
        if (sx > 90) sx -= 180;
        if (sx < -90) sx += 180;
        if (sz > 75) sz -= 170;
        if (sz < -95) sz += 170;
        sp.setY(j, sy);
        sp.setX(j, sx);
        sp.setZ(j, sz);
      }
      sp.needsUpdate = true;
    }

    if (petalOn) {
      var pp = petals.geometry.attributes.position;
      for (var pIdx = 0; pIdx < petals.count; pIdx++) {
        var py = pp.getY(pIdx) - (0.8 * petals.speeds[pIdx]) * dt;
        var px = pp.getX(pIdx) + (1.2 + Math.sin(elapsed * 1.2 + petals.phases[pIdx]) * 0.7) * dt;
        var pz = pp.getZ(pIdx) + Math.cos(elapsed * 0.9 + petals.phases[pIdx]) * 0.6 * dt;
        if (py < 0.1) py += 14;
        if (px > 50) px -= 100;
        pp.setY(pIdx, py);
        pp.setX(pIdx, px);
        pp.setZ(pIdx, pz);
      }
      pp.needsUpdate = true;
    }

    if (flyOn) {
      var fp = fireflies.geometry.attributes.position;
      for (var fIdx = 0; fIdx < fireflies.count; fIdx++) {
        var ph = fireflies.phases[fIdx];
        var fy = fp.getY(fIdx) + Math.sin(elapsed * 2.2 + ph) * 0.015;
        var fx = fp.getX(fIdx) + Math.cos(elapsed * 1.5 + ph) * 0.018;
        var fz = fp.getZ(fIdx) + Math.sin(elapsed * 1.3 + ph) * 0.018;
        fp.setY(fIdx, fy);
        fp.setX(fIdx, fx);
        fp.setZ(fIdx, fz);
      }
      fp.needsUpdate = true;
    }
  }

  /* ---------------- 15. 相机与交互（南向北望：前景大湖、中景殿阁，全部位于平地） ---------------- */

  function buildCamera() {
    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1500);
    // 最佳经典全景视点：南岸向北眺望，前景大湖水榭、中景多座殿阁，后景后园平地林木与院墙
    // 四面院墙合围后，默认视角改设于正门中轴内侧、门楼檐线以北的南岸临水处：
    // 略高于人眼，水面前铺、直廊引导、主屋居中；主屋屋面落在 HUD 卡片下缘之外，回身即见正门与院墙
    camera.position.set(0, 5.2, 16.2);
    controls = new THREE.OrbitControls(camera, canvas);
    controls.target.set(0, 3.6, -6.0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.rotateSpeed = 0.62;
    controls.zoomSpeed = 0.8;
    controls.panSpeed = 0.7;
    controls.screenSpacePanning = false;
    controls.minDistance = 6;
    controls.maxDistance = 34; // 院墙合围后收紧缩放上限，远观亦不越出院墙之外
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = 1.48;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.autoRotate = false;
    controls.update();
    window.appCamera = camera;
    window.appControls = controls;
  }

  function clampView() {
    if (camera.position.y < 2.0) camera.position.y = 2.0;
    if (controls.target.y < 0.4) controls.target.y = 0.4;
    if (controls.target.y > 9.5) controls.target.y = 9.5;
  }

  /* ---------------- 15.5 漫游交互、第一人称行走与原生过程化声学合成 ---------------- */

  var viewMode = 'god'; // 'god' | 'walk' | 'tour'
  var playerPos = new THREE.Vector3(0, 1.73, 13.5);
  var playerYaw = 0;   // 0 = facing north (-z)
  var playerPitch = -0.05;
  var walkKeys = { forward: false, backward: false, left: false, right: false, sprint: false };
  var stepDistanceAccum = 0;
  var walkBobbing = 0;
  var isDraggingWalk = false;
  var lastDragX = 0;
  var lastDragY = 0;

  var tourProgress = 0;
  var tourCurve = null;
  var tourPoints = [
    new THREE.Vector3(0, 2.2, 18.2),     // 1. 南大门正门石阶，仰望三开间重檐门楼
    new THREE.Vector3(2.8, 1.95, 14.2),  // 2. 南庭绿渚柳树下，远眺池面碧波
    new THREE.Vector3(0.5, 1.95, 10.5),  // 3. 走上临水曲桥平步
    new THREE.Vector3(-1.6, 2.15, 8.5),  // 4. 步入临水水上直廊，框景透视
    new THREE.Vector3(-4.6, 2.2, 8.5),   // 5. 穿入湖心水榭亭内，环顾碧波与石灯笼
    new THREE.Vector3(-3.2, 1.95, 4.5),  // 6. 出水榭漫步沿湖石矶汀步
    new THREE.Vector3(3.5, 2.6, 5.2),    // 7. 走上青石拱桥桥顶，俯瞰游鸭与锦鲤
    new THREE.Vector3(12.5, 2.0, 5.8),   // 8. 下拱桥至东侧临水绿渚与芦苇丛
    new THREE.Vector3(23.5, 2.1, 1.0),   // 9. 经东侧石径至东书斋庭院
    new THREE.Vector3(18.0, 2.2, -6.5),  // 10. 仰观东书斋黛瓦卷棚与芭蕉竹影
    new THREE.Vector3(6.0, 2.7, -4.2),   // 11. 踏上主殿远香堂南向石阶月台
    new THREE.Vector3(-6.0, 2.7, -4.2),  // 12. 缓步主殿月台，赏莲花石雕栏杆与满池荷花
    new THREE.Vector3(-15.0, 2.1, -12.0),// 13. 绕至主殿西侧，步入狮子林太湖石假山群
    new THREE.Vector3(-12.0, 2.6, -24.0),// 14. 在假山奇峰怪石林立间穿梭
    new THREE.Vector3(0.0, 2.7, -26.0),  // 15. 假山幽径回望主殿宏伟屋脊
    new THREE.Vector3(12.0, 2.2, -22.0), // 16. 出假山至后园苍松翠竹林带
    new THREE.Vector3(7.5, 2.1, -10.0),  // 17. 穿过主殿东夹道回到南庭
    new THREE.Vector3(0, 2.2, 18.2)      // 18. 平滑闭合回到南大门
  ];

  // 地面高程判定（包含台阶、踏步、桥梁、走廊、亭榭、石台）
  function getGroundHeight(x, z) {
    // 1. 主殿远香堂台座与室内地坪 (1.45m)
    if (Math.abs(x) < 14.5 && z >= -16.5 && z <= -0.1) {
      return 1.45;
    }
    // 主殿朝南垂带台阶（自廊面 0.56m 升至台座 1.35m）
    if (Math.abs(x) < 5.0 && z >= -0.2 && z <= 0.6) {
      var stepRatio = (0.6 - z) / 0.8;
      return 0.56 + Math.max(0, Math.min(1.0, stepRatio)) * 0.89;
    }

    // 2. 南大门门楼台座与门内门外石阶
    if (Math.abs(x) < 7.5 && z >= 17.6 && z <= 22.5) {
      if (z > 20.6) {
        return 0.08 + Math.max(0, Math.min(1.0, (22.5 - z) / 1.9)) * 0.37;
      }
      return 0.45;
    }

    // 3. 水上中央直廊（中轴 x=0，自南端 z=17.6 至北端 z=-0.10，标高 0.56m）
    if (Math.abs(x) <= 1.5 && z >= -0.2 && z <= 17.6) {
      return 0.56;
    }

    // 4. 湖心水榭亭与平桥（标高 0.56m）
    if (Math.hypot(x - (-4.6), z - 8.5) <= 4.4) {
      return 0.56;
    }
    // 平桥（连接直廊与水榭）
    if (x >= -4.6 && x <= 0.5 && Math.abs(z - 8.5) <= 1.6) {
      return 0.56;
    }

    // 5. 青石拱桥（跨水起拱，桥顶标高约 1.62m）
    if (x >= 0.8 && x <= 12.2 && Math.abs(z - 5.5) <= 1.8) {
      var archT = (x - 6.5) / 5.5;
      return 0.35 + Math.max(0, (1.0 - archT * archT)) * 1.30;
    }

    // 6. 东书斋卷棚与前台
    if (x >= 21.0 && x <= 34.0 && z >= -13.0 && z <= -3.0) {
      return 0.56;
    }
    if (x >= 21.0 && x <= 34.0 && z >= -3.0 && z <= 1.5) {
      return 0.32;
    }

    // 7. 沿水石汀步
    if (Math.hypot(x - 0.2, z - 4.2) <= 1.2 || Math.hypot(x - (-1.8), z - 4.2) <= 1.2) {
      return 0.35;
    }

    // 默认平地地坪
    return 0.08;
  }

  // 判定是否允许通行（围墙阻隔、开阔深水区阻隔；桥梁、走廊、水榭、石径畅通无阻）
  function canWalk(x, z) {
    if (x < -36.5 || x > 36.5 || z < -30.5 || z > 21.5) return false;

    // 湖面开阔深水区阻挡
    var inLake = (x > -17.5 && x < 21.0 && z > 0.0 && z < 17.2);
    if (inLake) {
      // 允许通行的结构：
      // 1. 中央水上直廊
      if (Math.abs(x) <= 1.5 && z >= -0.2 && z <= 17.6) return true;
      // 2. 湖心水榭亭与平桥
      if (Math.hypot(x - (-4.6), z - 8.5) <= 4.4) return true;
      if (x >= -4.6 && x <= 0.5 && Math.abs(z - 8.5) <= 1.6) return true;
      // 3. 青石拱桥
      if (x >= 0.8 && x <= 12.2 && Math.abs(z - 5.5) <= 1.8) return true;
      // 4. 沿水石汀步
      if (Math.hypot(x - 0.2, z - 4.2) <= 1.2 || Math.hypot(x - (-1.8), z - 4.2) <= 1.2) return true;
      // 其它开阔深水区阻隔
      return false;
    }
    return true;
  }

  // Web Audio 原生实时声学合成（零外部音频文件，离线自洽）
  var audioCtx = null;
  var waterGainNode = null;
  var waterSourceNode = null;
  var audioInitialized = false;

  function initAudio() {
    if (audioInitialized) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();

      var bufferSize = Math.floor(audioCtx.sampleRate * 2.5);
      var noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var output = noiseBuffer.getChannelData(0);
      var b0 = 0, b1 = 0, b2 = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.45;
      }
      waterSourceNode = audioCtx.createBufferSource();
      waterSourceNode.buffer = noiseBuffer;
      waterSourceNode.loop = true;

      var filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 520;
      filter.Q.value = 2.2;

      var lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.40;
      var lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 140;
      lfo.connect(filter.frequency);
      lfo.start();

      waterGainNode = audioCtx.createGain();
      waterGainNode.gain.value = 0;

      waterSourceNode.connect(filter);
      filter.connect(waterGainNode);
      waterGainNode.connect(audioCtx.destination);
      waterSourceNode.start();

      audioInitialized = true;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  function resumeAudioOnGesture() {
    if (!audioInitialized) initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  // 播放踏上青石板清脆脚步声（纯原生算法合成）
  function playFootstep() {
    if (!audioCtx || audioCtx.state === 'suspended') return;
    try {
      var now = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145 + Math.random() * 25, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.042);
      oscGain.gain.setValueAtTime(0.14, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.048);

      var snapLen = Math.floor(audioCtx.sampleRate * 0.024);
      var snapBuf = audioCtx.createBuffer(1, snapLen, audioCtx.sampleRate);
      var snapData = snapBuf.getChannelData(0);
      for (var s = 0; s < snapLen; s++) {
        snapData[s] = (Math.random() * 2 - 1) * Math.exp(-s / (snapLen * 0.32));
      }
      var snapSrc = audioCtx.createBufferSource();
      snapSrc.buffer = snapBuf;
      var snapFilter = audioCtx.createBiquadFilter();
      snapFilter.type = 'bandpass';
      snapFilter.frequency.value = 1750 + Math.random() * 200;
      snapFilter.Q.value = 3.0;
      var snapGain = audioCtx.createGain();
      snapGain.gain.setValueAtTime(0.09, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.024);
      snapSrc.connect(snapFilter);
      snapFilter.connect(snapGain);
      snapGain.connect(audioCtx.destination);
      snapSrc.start(now);
    } catch (e) {}
  }

  // 根据人与池塘水体边界的真实距离调节流水潺潺声
  function updateWaterAudio(posX, posZ) {
    if (!audioCtx || !waterGainNode || audioCtx.state === 'suspended') return;
    try {
      var dx = Math.max(0, -18.5 - posX, posX - 21.5);
      var dz = Math.max(0, 0.3 - posZ, posZ - 16.5);
      var distToLake = Math.hypot(dx, dz);
      var maxAudibleDist = 18.0;
      var targetGain = 0;
      if (distToLake < maxAudibleDist) {
        var proximity = 1.0 - (distToLake / maxAudibleDist);
        targetGain = Math.pow(proximity, 1.4) * 0.32;
      }
      waterGainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.15);
    } catch (e) {}
  }

  function updateWalkMode(dt) {
    var moveX = 0;
    var moveZ = 0;
    if (walkKeys.forward) moveZ -= 1;
    if (walkKeys.backward) moveZ += 1;
    if (walkKeys.left) moveX -= 1;
    if (walkKeys.right) moveX += 1;

    var isMoving = (moveX !== 0 || moveZ !== 0);
    if (isMoving) {
      var len = Math.hypot(moveX, moveZ);
      moveX /= len;
      moveZ /= len;

      var speed = (walkKeys.sprint ? 5.2 : 3.2) * dt;

      var sinY = Math.sin(playerYaw);
      var cosY = Math.cos(playerYaw);

      var dx = (moveX * cosY + moveZ * sinY) * speed;
      var dz = (-moveX * sinY + moveZ * cosY) * speed;

      var nextX = playerPos.x + dx;
      var nextZ = playerPos.z + dz;

      var moved = false;
      if (canWalk(nextX, nextZ)) {
        playerPos.x = nextX;
        playerPos.z = nextZ;
        moved = true;
      } else if (canWalk(nextX, playerPos.z)) {
        playerPos.x = nextX;
        moved = true;
      } else if (canWalk(playerPos.x, nextZ)) {
        playerPos.z = nextZ;
        moved = true;
      }

      if (moved) {
        stepDistanceAccum += Math.hypot(dx, dz);
        if (stepDistanceAccum >= 1.25) {
          playFootstep();
          stepDistanceAccum = 0;
        }
        walkBobbing += speed * 6.5;
      }
    } else {
      walkBobbing = 0;
    }

    var targetEyeY = getGroundHeight(playerPos.x, playerPos.z) + 1.65;
    playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetEyeY, 0.22);

    var bobOffset = (isMoving && !reducedMotion) ? Math.sin(walkBobbing) * 0.024 : 0;
    camera.position.set(playerPos.x, playerPos.y + bobOffset, playerPos.z);

    var dirX = Math.sin(playerYaw) * Math.cos(playerPitch);
    var dirY = Math.sin(playerPitch);
    var dirZ = -Math.cos(playerYaw) * Math.cos(playerPitch);

    camera.lookAt(
      camera.position.x + dirX,
      camera.position.y + dirY,
      camera.position.z + dirZ
    );

    updateWaterAudio(playerPos.x, playerPos.z);
  }

  function updateTourMode(dt) {
    if (!tourCurve) {
      tourCurve = new THREE.CatmullRomCurve3(tourPoints, true, 'centripetal', 0.5);
    }
    // 约 46 秒环行导览一周
    tourProgress = (tourProgress + dt / 46.0) % 1.0;

    var curPos = tourCurve.getPointAt(tourProgress);
    var lookPos = tourCurve.getPointAt((tourProgress + 0.018) % 1.0);

    camera.position.lerp(curPos, 0.28);
    camera.lookAt(lookPos);

    var fillEl = document.getElementById('tour-progress-fill');
    if (fillEl) {
      fillEl.style.width = (tourProgress * 100).toFixed(1) + '%';
    }

    updateWaterAudio(camera.position.x, camera.position.z);
  }

  function switchViewMode(newMode) {
    if (newMode === viewMode) return;
    resumeAudioOnGesture();

    var prevMode = viewMode;
    viewMode = newMode;
    document.body.setAttribute('data-view', newMode);

    ['god', 'walk', 'tour'].forEach(function (m) {
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
      }
      camera.position.copy(playerPos);
    } else if (newMode === 'tour') {
      if (document.exitPointerLock && document.pointerLockElement) {
        document.exitPointerLock();
      }
      controls.enabled = false;
      tourProgress = 0;
    }
  }

  function bindRoamingControls() {
    var btnGod = document.getElementById('btn-mode-god');
    var btnWalk = document.getElementById('btn-mode-walk');
    var btnTour = document.getElementById('btn-mode-tour');
    var btnExitTour = document.getElementById('tour-exit-btn');

    if (btnGod) btnGod.addEventListener('click', function () { switchViewMode('god'); });
    if (btnWalk) btnWalk.addEventListener('click', function () { switchViewMode('walk'); });
    if (btnTour) btnTour.addEventListener('click', function () { switchViewMode('tour'); });
    if (btnExitTour) btnExitTour.addEventListener('click', function () { switchViewMode('god'); });

    window.addEventListener('keydown', function (e) {
      resumeAudioOnGesture();
      var key = e.key ? e.key.toLowerCase() : '';
      var code = e.code || '';

      var isW = (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup');
      var isS = (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown');
      var isA = (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft');
      var isD = (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright');

      if (viewMode === 'god' || viewMode === 'tour') {
        if (isW || isS || isA || isD) {
          switchViewMode('walk');
          if (isW) walkKeys.forward = true;
          if (isS) walkKeys.backward = true;
          if (isA) walkKeys.left = true;
          if (isD) walkKeys.right = true;
          e.preventDefault();
          return;
        }
        if (code === 'Escape' || key === 'escape' || code === 'Space' || key === ' ') {
          if (viewMode === 'tour') switchViewMode('god');
          return;
        }
      }

      if (viewMode === 'walk') {
        if (isW) { walkKeys.forward = true; e.preventDefault(); }
        if (isS) { walkKeys.backward = true; e.preventDefault(); }
        if (isA) { walkKeys.left = true; e.preventDefault(); }
        if (isD) { walkKeys.right = true; e.preventDefault(); }
        if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') { walkKeys.sprint = true; }
        if (code === 'Escape' || key === 'escape') {
          if (document.pointerLockElement) {
            document.exitPointerLock();
          } else {
            switchViewMode('god');
          }
        }
      }
    }, { capture: true });

    window.addEventListener('keyup', function (e) {
      var key = e.key ? e.key.toLowerCase() : '';
      var code = e.code || '';

      var isW = (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup');
      var isS = (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown');
      var isA = (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft');
      var isD = (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright');

      if (isW) walkKeys.forward = false;
      if (isS) walkKeys.backward = false;
      if (isA) walkKeys.left = false;
      if (isD) walkKeys.right = false;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || key === 'shift') walkKeys.sprint = false;
    }, { capture: true });

    canvas.addEventListener('click', function () {
      resumeAudioOnGesture();
      if (viewMode === 'walk' && canvas.requestPointerLock && !document.pointerLockElement) {
        canvas.requestPointerLock();
      } else if (viewMode === 'tour') {
        switchViewMode('walk');
      }
    });

    window.addEventListener('mousemove', function (e) {
      if (viewMode === 'walk') {
        if (document.pointerLockElement === canvas) {
          playerYaw -= e.movementX * 0.0022;
          playerPitch = clamp(playerPitch - e.movementY * 0.0022, -1.25, 1.25);
        } else if (isDraggingWalk) {
          var dx = e.clientX - lastDragX;
          var dy = e.clientY - lastDragY;
          lastDragX = e.clientX;
          lastDragY = e.clientY;
          playerYaw -= dx * 0.0035;
          playerPitch = clamp(playerPitch - dy * 0.0035, -1.25, 1.25);
        }
      }
    });

    canvas.addEventListener('mousedown', function (e) {
      resumeAudioOnGesture();
      if (viewMode === 'walk' && e.button === 0) {
        isDraggingWalk = true;
        lastDragX = e.clientX;
        lastDragY = e.clientY;
      }
    });

    window.addEventListener('mouseup', function () {
      isDraggingWalk = false;
    });

    canvas.addEventListener('touchstart', function (e) {
      resumeAudioOnGesture();
      if (viewMode === 'walk' && e.touches.length === 1) {
        isDraggingWalk = true;
        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      if (viewMode === 'walk' && isDraggingWalk && e.touches.length === 1) {
        var dx = e.touches[0].clientX - lastDragX;
        var dy = e.touches[0].clientY - lastDragY;
        lastDragX = e.touches[0].clientX;
        lastDragY = e.touches[0].clientY;
        playerYaw -= dx * 0.005;
        playerPitch = clamp(playerPitch - dy * 0.005, -1.2, 1.2);
      }
    }, { passive: true });

    canvas.addEventListener('touchend', function () {
      isDraggingWalk = false;
    }, { passive: true });
  }

  function bindKeyboard() {
    var held = { left: false, right: false, up: false, down: false, zin: false, zout: false };
    function applyKeys() {
      if (viewMode !== 'god') return;
      if (held.left || held.right || held.up || held.down) {
        var spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        if (held.left) spherical.theta += 0.055;
        if (held.right) spherical.theta -= 0.055;
        if (held.up) spherical.phi = clamp(spherical.phi - 0.055, controls.minPolarAngle, controls.maxPolarAngle);
        if (held.down) spherical.phi = clamp(spherical.phi + 0.055, controls.minPolarAngle, controls.maxPolarAngle);
        camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));
      }
      if (held.zin || held.zout) {
        var dir = camera.position.clone().sub(controls.target);
        var dist = clamp(dir.length() + (held.zout ? 2.5 : -2.5), controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(dir.setLength(dist));
      }
      controls.update();
    }
    canvas.addEventListener('keydown', function (event) {
      if (viewMode !== 'god') return;
      var key = event.key;
      if (key === 'ArrowLeft') { held.left = true; applyKeys(); }
      else if (key === 'ArrowRight') { held.right = true; applyKeys(); }
      else if (key === 'ArrowUp') { held.up = true; applyKeys(); }
      else if (key === 'ArrowDown') { held.down = true; applyKeys(); }
      else if (key === '+' || key === '=') { held.zin = true; applyKeys(); }
      else if (key === '-' || key === '_') { held.zout = true; applyKeys(); }
      else { return; }
      event.preventDefault();
    });
    canvas.addEventListener('keyup', function (event) {
      if (viewMode !== 'god') return;
      var key = event.key;
      if (key === 'ArrowLeft') held.left = false;
      else if (key === 'ArrowRight') held.right = false;
      else if (key === 'ArrowUp') held.up = false;
      else if (key === 'ArrowDown') held.down = false;
      else if (key === '+' || key === '=') held.zin = false;
      else if (key === '-' || key === '_') held.zout = false;
    });
  }

  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }

  /* ---------------- 16. HUD 与交互绑定 ---------------- */

  var WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  var timeAngles = {
    noon: 0,
    dusk: 90,
    night: 180,
    morning: 270
  };

  var timePoems = {
    morning: '卯时 · 东方拂晓晨光熹微',
    noon: '午时 · 日丽中天池波潋滟',
    dusk: '酉时 · 残阳向晚石灯初上',
    night: '子时 · 月白风清万籁俱寂'
  };

  function todayLabel() {
    var d = new Date();
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + WEEKDAYS[d.getDay()];
  }

  function updateCloudThumbPosition() {
    var thumb = document.getElementById('cloud-thumb');
    var track = document.getElementById('cloud-track');
    var activeNode = document.querySelector('.cloud-node[data-weather="' + state.weather + '"]');
    if (!thumb || !track || !activeNode) return;
    var trackRect = track.getBoundingClientRect();
    var nodeRect = activeNode.getBoundingClientRect();
    if (trackRect.width > 0) {
      var leftOffset = (nodeRect.left - trackRect.left) + (nodeRect.width - thumb.offsetWidth) / 2;
      thumb.style.left = leftOffset + 'px';
    }
    thumb.setAttribute('data-weather', state.weather);
  }

  function refreshHud(announce) {
    var tw = TIMES[state.time];
    var w = WEATHER[state.weather];
    glyphHost.innerHTML = GLYPHS[state.weather];
    weatherNameEl.textContent = w.label;
    tempEl.textContent = (tw.baseTemp + w.tempOffset) + '°';
    clockEl.textContent = tw.clock;
    dateEl.textContent = todayLabel();

    // 1. 更新云朵天气节点与祥云滑块
    Array.prototype.forEach.call(document.querySelectorAll('.cloud-node'), function (btn) {
      var isAct = btn.getAttribute('data-weather') === state.weather;
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
      if (isAct) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    updateCloudThumbPosition();

    // 2. 更新日晷指针与扇区状态
    var pointer = document.getElementById('sundial-pointer');
    if (pointer) {
      pointer.style.transform = 'rotate(' + (timeAngles[state.time] || 0) + 'deg)';
    }
    var sealEl = document.getElementById('sundial-seal');
    if (sealEl) sealEl.textContent = tw.label;
    var sealTextEl = document.getElementById('sundial-text');
    if (sealTextEl) sealTextEl.textContent = timePoems[state.time] || '';

    Array.prototype.forEach.call(document.querySelectorAll('.sd-sector'), function (btn) {
      var isAct = btn.getAttribute('data-time') === state.time;
      btn.setAttribute('aria-pressed', isAct ? 'true' : 'false');
      if (isAct) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    if (announce) {
      live.textContent = '已切换为' + w.label + '·' + tw.label + '，演示温度 ' + (tw.baseTemp + w.tempOffset) + ' 度';
    }
  }

  function setWeather(key) {
    if (!WEATHER[key] || state.weather === key) return;
    state.weather = key;
    computeTarget();
    startTween();
    refreshHud(true);
  }

  function setTime(key) {
    if (!TIMES[key] || state.time === key) return;
    state.time = key;
    computeTarget();
    startTween();
    refreshHud(true);
  }

  function applyCollapsed() {
    hud.setAttribute('data-collapsed', state.collapsed ? 'true' : 'false');
    foldBtn.setAttribute('aria-expanded', state.collapsed ? 'false' : 'true');
    foldText.textContent = state.collapsed ? '展开' : '收起';
  }

  function bindHud() {
    // 1. 拖动祥云切换天气
    var cloudTrack = document.getElementById('cloud-track');
    var cloudThumb = document.getElementById('cloud-thumb');
    var weatherKeys = ['sunny', 'cloudy', 'rain', 'snow', 'fog'];

    if (cloudTrack) {
      cloudTrack.addEventListener('click', function (e) {
        var node = e.target.closest('.cloud-node');
        if (node) {
          setWeather(node.getAttribute('data-weather'));
        }
      });
    }

    if (cloudThumb && cloudTrack) {
      var isDraggingCloud = false;

      function onCloudPointerDown(e) {
        isDraggingCloud = true;
        cloudThumb.classList.add('dragging');
        if (e.pointerId && cloudThumb.setPointerCapture) cloudThumb.setPointerCapture(e.pointerId);
        e.preventDefault();
      }

      function onCloudPointerMove(e) {
        if (!isDraggingCloud) return;
        var rect = cloudTrack.getBoundingClientRect();
        var clientX = e.clientX;
        var ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
        var targetIndex = Math.round(ratio * (weatherKeys.length - 1));
        var targetKey = weatherKeys[targetIndex];
        if (targetKey && targetKey !== state.weather) {
          setWeather(targetKey);
        }
      }

      function onCloudPointerUp(e) {
        if (!isDraggingCloud) return;
        isDraggingCloud = false;
        cloudThumb.classList.remove('dragging');
        if (e.pointerId && cloudThumb.hasPointerCapture && cloudThumb.hasPointerCapture(e.pointerId)) {
          cloudThumb.releasePointerCapture(e.pointerId);
        }
        updateCloudThumbPosition();
      }

      cloudThumb.addEventListener('pointerdown', onCloudPointerDown);
      window.addEventListener('pointermove', onCloudPointerMove);
      window.addEventListener('pointerup', onCloudPointerUp);
      window.addEventListener('pointercancel', onCloudPointerUp);
    }

    // 2. 拨动日晷指针与扇区切换时辰
    var sundial = document.getElementById('sundial');
    var sundialPointer = document.getElementById('sundial-pointer');

    if (sundial) {
      sundial.addEventListener('click', function (e) {
        var sec = e.target.closest('.sd-sector');
        if (sec) {
          setTime(sec.getAttribute('data-time'));
        }
      });

      var isDialDragging = false;

      function pickTimeFromAngle(angleDeg) {
        var norm = (angleDeg % 360 + 360) % 360;
        if (norm >= 315 || norm < 45) return 'noon';
        if (norm >= 45 && norm < 135) return 'dusk';
        if (norm >= 135 && norm < 225) return 'night';
        return 'morning';
      }

      function onDialPointerDown(e) {
        if (e.target.closest('.sd-sector')) return;
        isDialDragging = true;
        if (sundialPointer) sundialPointer.classList.add('dragging');
        if (e.pointerId && sundial.setPointerCapture) sundial.setPointerCapture(e.pointerId);
        onDialPointerMove(e);
        e.preventDefault();
      }

      function onDialPointerMove(e) {
        if (!isDialDragging) return;
        var rect = sundial.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = e.clientX - cx;
        var dy = e.clientY - cy;
        var deg = (Math.atan2(dy, dx) * 180 / Math.PI) + 90;
        var chosenTime = pickTimeFromAngle(deg);
        if (chosenTime && chosenTime !== state.time) {
          setTime(chosenTime);
        }
      }

      function onDialPointerUp(e) {
        if (!isDialDragging) return;
        isDialDragging = false;
        if (sundialPointer) sundialPointer.classList.remove('dragging');
        if (e.pointerId && sundial.hasPointerCapture && sundial.hasPointerCapture(e.pointerId)) {
          sundial.releasePointerCapture(e.pointerId);
        }
        refreshHud();
      }

      sundial.addEventListener('pointerdown', onDialPointerDown);
      window.addEventListener('pointermove', onDialPointerMove);
      window.addEventListener('pointerup', onDialPointerUp);
      window.addEventListener('pointercancel', onDialPointerUp);
    }

    window.addEventListener('resize', updateCloudThumbPosition);

    foldBtn.addEventListener('click', function () {
      state.collapsed = !state.collapsed;
      applyCollapsed();
      window.setTimeout(updateCloudThumbPosition, 260);
    });
    applyCollapsed();
  }

  /* ---------------- 16.5 植被风力动态反馈 ---------------- */

  function updateVegetation(dt, elapsed) {
    if (reducedMotion) return;
    windShaderUniforms.uTime.value = elapsed;
    var targetWind = 0.32 + (params.rainAmount ? 0.68 * params.rainAmount : 0) + (params.snowAmount ? 0.45 * params.snowAmount : 0);
    windShaderUniforms.uWindStrength.value = THREE.MathUtils.lerp(
      windShaderUniforms.uWindStrength.value, targetWind, 0.05
    );
    var wStr = windShaderUniforms.uWindStrength.value;

    for (var i = 0; i < willowTrees.length; i++) {
      var wt = willowTrees[i];
      var trunkSway = Math.sin(elapsed * 1.8 + wt.baseX * 0.2) * 0.05 * wStr;
      wt.group.rotation.z = trunkSway;
      for (var b = 0; b < wt.branches.length; b++) {
        var br = wt.branches[b];
        var bSway = Math.sin(elapsed * 2.8 + br.phase) * 0.24 * wStr;
        br.mesh.rotation.z = br.baseRotZ + bSway;
        br.mesh.rotation.x = br.baseRotX + bSway * 0.55;
      }
    }
  }

  /* ---------------- 17. 渲染循环 ---------------- */

  function applyParams() {
    var dir = directionFrom(params.elevation, params.azimuth);
    if (sunLight) {
      sunLight.position.copy(dir).multiplyScalar(150);
      sunLight.color.copy(params.sunColor);
      sunLight.intensity = params.sunIntensity * (0.45 + 0.55 * params.shadowStrength);
    }
    if (moonLight) moonLight.intensity = params.moon;

    if (hemiLight) {
      hemiLight.color.copy(params.hemiSky);
      hemiLight.groundColor.copy(params.hemiGround);
      hemiLight.intensity = params.hemi;
    }
    if (ambientLight) ambientLight.intensity = params.ambient;

    if (renderer) renderer.toneMappingExposure = params.exposure;

    if (scene && scene.fog) {
      scene.fog.color.copy(params.fogColor);
      scene.fog.density = params.fogDensity;
    }
    if (skyUniforms) {
      skyUniforms.topColor.value.copy(params.skyTop);
      skyUniforms.bottomColor.value.copy(params.skyBottom);
      skyUniforms.glowColor.value.copy(params.glowColor);
      skyUniforms.glowStrength.value = params.glow;
      skyUniforms.sunDirection.value.copy(dir);
    }

    if (stars && stars.material) stars.material.opacity = params.star * (0.75 + 0.25 * params.star);
    if (celestial && celestial.material) {
      celestial.material.color.copy(params.celestial);
      celestial.material.opacity = params.celestialOpacity;
    }

    snowShaderUniform.uSnowAmount.value = params.snowAmount;

    if (waterMat) {
      var isRaining = params.rainAmount > 0.02;
      var isSnowing = params.snowAmount > 0.02;

      if (isSnowing) {
        // 下雪时水面结冰覆雪：呈现淡白冰雪覆盖效果，粗糙度增大，完全呈现雪覆盖效果
        waterMat.color.copy(params.waterColor).lerp(new THREE.Color(0xdde8f2), params.snowAmount * 0.95);
        waterMat.roughness = THREE.MathUtils.lerp(0.02, 0.82, params.snowAmount);
        waterMat.metalness = THREE.MathUtils.lerp(0.3, 0.05, params.snowAmount);
        waterMat.opacity = THREE.MathUtils.lerp(0.93, 0.99, params.snowAmount);
      } else if (isRaining) {
        // 下雨时池塘水面产生密密麻麻的涟漪（由 Shader 动态生成法线与高频环纹）
        waterMat.color.copy(params.waterColor);
        waterMat.roughness = 0.14 + 0.14 * params.rainAmount;
        waterMat.metalness = 0.35 + 0.35 * params.wetness;
        waterMat.opacity = 0.93;
      } else {
        // 雨停后/晴朗/阴天：水面平静如镜，形成极其清澈的水洼与池塘倒影
        waterMat.color.copy(params.waterColor);
        waterMat.roughness = 0.02; // 极低粗糙度 = 镜面级积水倒影
        waterMat.metalness = 0.45;
        waterMat.opacity = 0.93;
      }
    }

    if (groundMat) {
      groundMat.roughness = 0.95 - 0.42 * params.wetness;
      groundMat.metalness = 0.06 * params.wetness;
      groundMat.color.setRGB(1, 1, 1).lerp(params.groundTintColor, params.groundTintAmt);
    }

    // 下雪时屋顶积雪变白覆盖
    if (roofMats && roofMats.length) {
      roofMats.forEach(function (mat) {
        if (mat) {
          mat.color.setHex(COL.roof).lerp(params.roofTintColor, params.roofTintAmt);
          if (params.snowAmount > 0.01) {
            mat.roughness = THREE.MathUtils.lerp(0.85, 0.98, params.snowAmount);
          } else {
            mat.roughness = 0.85;
          }
        }
      });
    }

    // 下雪时桥面、栏杆、汀步、码头、平台与石径呈现积雪覆盖效果
    if (snowCoverMats && snowCoverMats.length) {
      snowCoverMats.forEach(function (mat) {
        if (!mat) return;
        if (mat._baseColor === undefined) {
          mat._baseColor = mat.color.getHex();
          mat._baseRoughness = mat.roughness;
        }
        if (params.snowAmount > 0.01) {
          mat.color.setHex(mat._baseColor).lerp(new THREE.Color(0xf5f8fb), params.snowAmount * 0.92);
          mat.roughness = THREE.MathUtils.lerp(mat._baseRoughness, 0.96, params.snowAmount);
        } else {
          mat.color.setHex(mat._baseColor);
          mat.roughness = mat._baseRoughness;
        }
      });
    }

    // 光影联动：黄昏与夜晚庭院石灯笼和水榭内部自动亮起暖黄灯光
    if (stoneLanternGlowMat) {
      stoneLanternGlowMat.emissiveIntensity = params.glowIntensity * 1.55;
    }
    if (lampMaterial) lampMaterial.opacity = clamp(params.glowIntensity, 0, 1) * 0.78;
    if (lampGlowMat) lampGlowMat.emissiveIntensity = params.glowIntensity * 1.35;
    if (lampLights && lampLights.length) {
      lampLights.forEach(function (light) {
        if (light) light.intensity = params.glowIntensity * 1.8;
      });
    }
  }

  function updateWater(elapsed) {
    if (reducedMotion) return;
    waterShaderUniforms.uTime.value = elapsed;
    waterShaderUniforms.uRainAmount.value = THREE.MathUtils.lerp(
      waterShaderUniforms.uRainAmount.value, params.rainAmount, 0.08
    );
    // 下雪时水波凝结冻结成冰面
    var freezeWave = Math.max(0.04, 1.0 - params.snowAmount * 0.95);
    var pos = waterGeo.attributes.position;
    var arr = pos.array;
    for (var i = 0; i < arr.length; i += 3) {
      var x = waterBaseY[i];
      var z = waterBaseY[i + 2];
      arr[i + 1] = (Math.sin(x * 0.55 + elapsed * 1.1) * 0.055
        + Math.sin(z * 0.75 - elapsed * 0.9) * 0.045
        + Math.sin((x + z) * 0.35 + elapsed * 0.65) * 0.03) * freezeWave;
    }
    pos.needsUpdate = true;
    waterGeo.computeVertexNormals();

    if (streamGeo) {
      var spos = streamGeo.attributes.position;
      var sarr = spos.array;
      for (var j = 0; j < sarr.length; j += 3) {
        var sx = streamBaseY[j];
        var sz = streamBaseY[j + 2];
        sarr[j + 1] = (Math.sin(sz * 1.2 + elapsed * 2.2) * 0.04
          + Math.sin(sx * 1.5 + elapsed * 1.4) * 0.025) * freezeWave;
      }
      spos.needsUpdate = true;
      streamGeo.computeVertexNormals();
    }

    if (eastStreamGeo) {
      var epos = eastStreamGeo.attributes.position;
      var earr = epos.array;
      for (var ej = 0; ej < earr.length; ej += 3) {
        var ex = eastStreamBaseY[ej];
        var ez = eastStreamBaseY[ej + 2];
        earr[ej + 1] = (Math.sin(ez * 1.2 + elapsed * 2.2) * 0.04
          + Math.sin(ex * 1.5 + elapsed * 1.4) * 0.025) * freezeWave;
      }
      epos.needsUpdate = true;
      eastStreamGeo.computeVertexNormals();
    }

    if (boatMesh) {
      boatMesh.position.y = WATER_Y + 0.14 + Math.sin(elapsed * 1.4) * 0.025;
      boatMesh.rotation.z = Math.sin(elapsed * 1.1) * 0.035;
      boatMesh.rotation.x = Math.sin(elapsed * 0.8) * 0.02;
    }
  }

  function updateCelestial() {
    var dir = directionFrom(params.elevation, params.azimuth);
    celestial.position.copy(camera.position).add(dir.clone().multiplyScalar(480));
    celestial.lookAt(camera.position);
    sky.position.copy(camera.position);
    stars.position.copy(camera.position);
  }

  var lastTime = 0;
  var elapsedTotal = 0;

  function frame(now) {
    var dt = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 0.016;
    lastTime = now;
    elapsedTotal += dt;

    updateTween(now);
    applyParams();
    updateWater(elapsedTotal);
    updateVegetation(dt, elapsedTotal);
    updateFish(dt, elapsedTotal);
    updateParticles(dt, elapsedTotal);
    updateCelestial();
    if (viewMode === 'god') {
      controls.update();
      clampView();
    } else if (viewMode === 'walk') {
      updateWalkMode(dt);
    } else if (viewMode === 'tour') {
      updateTourMode(dt);
    }
    renderer.render(scene, camera);
    state.ready = true;
    window.requestAnimationFrame(frame);
  }

  /* ---------------- 18. 分步初始化与装配 ---------------- */

  function showFallback(message) {
    loader.setAttribute('data-done', 'true');
    loader.style.display = 'none';
    if (message) {
      var p = document.createElement('p');
      p.textContent = message;
      fallback.querySelector('.fallback-inner').appendChild(p);
    }
    fallback.hidden = false;
  }

  function createRenderer() {
    if (typeof THREE === 'undefined' || !THREE.WebGLRenderer) return null;
    try {
      var r = new THREE.WebGLRenderer({
        canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance'
      });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1;
      r.shadowMap.enabled = !isMobile;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      return r;
    } catch (error) {
      return null;
    }
  }

  var STEPS = [
    { label: '铺展平地大地图、开辟南向开朗大池…', run: function () { buildGround(); buildWater(); } },
    { label: '构筑远香正殿主殿群…', run: function () { buildMainHall(); } },
    { label: '建造涵青书斋雅院、西北净院与湖心水亭…', run: function () { buildEastStudy(); buildOuthouseCourtyard(); buildLakePavilion(); buildCoveredCorridor(); } },
    { label: '筑起小飞虹石桥、九曲平桥、四面云墙与正门门楼…', run: function () { buildBridges(); buildWalls(); buildMainGate(); } },
    { label: '于殿堂后方平地叠筑狮子林假山奇峰与揽胜阁…', run: function () { buildLionRockeries(); } },
    { label: '系泊乌篷船与放养锦鲤…', run: function () { buildBoats(); buildFish(); } },
    { label: '严格隔离植万竿修竹、垂柳春桃与荷花水生…', run: function () { buildVegetation(); buildPath(); } },
    { label: '点亮烟雨天光、夜月、飞花与夏夜流萤…', run: function () {
      buildSky();
      buildLights();
      rain = buildPrecipitation('rain');
      snow = buildPrecipitation('snow');
      petals = buildPetals();
      fireflies = buildFireflies();
    } }
  ];

  function runSteps(onDone) {
    var index = 0;
    function next() {
      if (index >= STEPS.length) { onDone(); return; }
      loaderText.textContent = STEPS[index].label;
      loaderFill.style.width = Math.round((index / STEPS.length) * 100) + '%';
      try {
        STEPS[index].run();
      } catch (error) {
        showFallback('水乡场景生成过程中出现异常，页面已停止渲染，但不会白屏。');
        return;
      }
      index += 1;
      loaderFill.style.width = Math.round((index / STEPS.length) * 100) + '%';
      window.setTimeout(next, reducedMotion ? 0 : 70);
    }
    next();
  }

  function boot() {
    renderer = createRenderer();
    if (!renderer || !THREE.OrbitControls) {
      showFallback();
      return;
    }
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xd3dadf, 0.0038);
    initParams();

    buildCamera();
    bindKeyboard();
    bindRoamingControls();
    bindHud();
    refreshHud(false);
    resize();

    runSteps(function () {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          try {
            applyParams();
          } catch (e) {
            console.error('applyParams error:', e);
          }
          try {
            renderer.render(scene, camera);
          } catch (e) {
            console.error('render error:', e);
          }
          refreshHud(false);
          loader.setAttribute('data-done', 'true');
          window.setTimeout(function () { loader.style.display = 'none'; }, 700);
          lastTime = 0;
          window.requestAnimationFrame(frame);
        });
      });
    });

    if (window.ResizeObserver) {
      new ResizeObserver(function () { resize(); }).observe(document.getElementById('stage'));
    }
    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', resize);
    if (narrowQuery.addEventListener) {
      narrowQuery.addEventListener('change', function () {
        isMobile = narrowQuery.matches;
        state.collapsed = narrowQuery.matches;
        applyCollapsed();
        resize();
      });
    }
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', function () { reducedMotion = motionQuery.matches; });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
