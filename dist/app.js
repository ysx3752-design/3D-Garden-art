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
      // 新海诚/吉卜力风格：明丽清透的淡蓝天顶、晨光初晓的暖金低斜朝阳，拉长亭桥倒影
      skyTop: 0x1d5a98, skyBottom: 0xc8e4f7, glow: 0xffe2ac,
      sunColor: 0xfff1d2, sunIntensity: 3.0, elevation: 26, azimuth: -54,
      ambient: 0.26, hemiSky: 0x9bd8ff, hemiGround: 0x36512d, hemi: 1.16,
      exposure: 1.14, fogColor: 0xcfe4f5, fogDensity: 0.0034,
      moon: 0, glowIntensity: 0.15, star: 0, celestial: 0xfffaea,
      firefly: 0
    },
    noon: {
      label: '正午', clock: '12:30', baseTemp: 25,
      // 吉卜力盛夏晴朗白昼：饱满蓝天、清亮绿水与分明屋檐落影
      skyTop: 0x1668be, skyBottom: 0xcde8fc, glow: 0xfff6db,
      sunColor: 0xfffef4, sunIntensity: 3.35, elevation: 48, azimuth: -34,
      ambient: 0.28, hemiSky: 0xa4dbff, hemiGround: 0x3b592f, hemi: 1.22,
      exposure: 1.12, fogColor: 0xd6eaf8, fogDensity: 0.0028,
      moon: 0, glowIntensity: 0, star: 0, celestial: 0xffffff,
      firefly: 0
    },
    dusk: {
      label: '黄昏', clock: '18:40', baseTemp: 20,
      // 高级黄昏电影感：低角度金红晚霞、超长戏剧感拉长阴影、紫金暮色天际
      skyTop: 0x482f64, skyBottom: 0xe88752, glow: 0xff994a,
      sunColor: 0xff9d52, sunIntensity: 2.9, elevation: 13, azimuth: 68,
      ambient: 0.26, hemiSky: 0xbe8cae, hemiGround: 0x54402b, hemi: 1.06,
      exposure: 1.20, fogColor: 0xde956c, fogDensity: 0.0036,
      moon: 0, glowIntensity: 0.95, star: 0.15, celestial: 0xff9e58,
      firefly: 0.8
    },
    night: {
      label: '夜晚', clock: '21:10', baseTemp: 12,
      // 诗意江南静谧水乡月夜：冷调月光与幽蓝天幕，暖黄灯火交相辉映
      skyTop: 0x18294a, skyBottom: 0x38506f, glow: 0x4a6389,
      sunColor: 0xa8c4ea, sunIntensity: 0.70, elevation: 36, azimuth: 118,
      ambient: 0.32, hemiSky: 0x47608a, hemiGround: 0x293732, hemi: 0.92,
      exposure: 1.24, fogColor: 0x263548, fogDensity: 0.0042,
      moon: 1.20, glowIntensity: 1.2, star: 0.9, celestial: 0xeaf1fc,
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
      label: '阴', tempOffset: 0, sunMul: 0.34, ambientMul: 1.42, hemiMul: 1.14,
      skyDim: 0.32, skyDesat: 0.44, fogMul: 1.5, fogTint: 0xc8c9c4, fogTintAmt: 0.5,
      exposureMul: 0.98, waterRough: 0.22, waterTint: 0x8ba2a6, waterTintAmt: 0.5,
      wetness: 0.05, rain: 0, snow: 0, shadowMul: 0.28, glowMul: 0.9,
      groundTint: 0xbdb9a8, groundTintAmt: 0.15, roofTint: 0xffffff, roofTintAmt: 0,
      petal: 0.6
    },
    rain: {
      label: '雨', tempOffset: -1, sunMul: 0.16, ambientMul: 1.38, hemiMul: 1.06,
      skyDim: 0.50, skyDesat: 0.62, fogMul: 2.8, fogTint: 0x9ba4a8, fogTintAmt: 0.75,
      exposureMul: 0.92, waterRough: 0.14, waterTint: 0x768f96, waterTintAmt: 0.58,
      wetness: 1.0, rain: 1.0, snow: 0, shadowMul: 0.12, glowMul: 1.2,
      groundTint: 0x5a5649, groundTintAmt: 0.38, roofTint: 0x3f494e, roofTintAmt: 0.35,
      petal: 0.2
    },
    snow: {
      label: '雪', tempOffset: -12, sunMul: 0.22, ambientMul: 1.62, hemiMul: 1.2,
      skyDim: 0.44, skyDesat: 0.68, fogMul: 2.2, fogTint: 0xd8dce2, fogTintAmt: 0.8,
      exposureMul: 0.98, waterRough: 0.75, waterTint: 0xdde7f0, waterTintAmt: 0.85,
      wetness: 0.2, rain: 0, snow: 1.0, shadowMul: 0.22, glowMul: 1.0,
      groundTint: 0xf5f8fb, groundTintAmt: 0.94, roofTint: 0xfcfdff, roofTintAmt: 0.96,
      petal: 0
    },
    fog: {
      label: '雾', tempOffset: -1, sunMul: 0.12, ambientMul: 1.5, hemiMul: 1.1,
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

  function roofTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#2d3237';
      ctx.fillRect(0, 0, w, h);
      var flutes = 16;
      var fluteW = w / flutes;
      for (var f = 0; f < flutes; f++) {
        var fx = f * fluteW;
        var grad = ctx.createLinearGradient(fx, 0, fx + fluteW, 0);
        grad.addColorStop(0.0, '#1c2024');
        grad.addColorStop(0.18, '#2a3036');
        grad.addColorStop(0.50, '#4f575f');
        grad.addColorStop(0.82, '#2a3036');
        grad.addColorStop(1.0, '#1a1e22');
        ctx.fillStyle = grad;
        ctx.fillRect(fx, 0, fluteW, h);

        ctx.fillStyle = 'rgba(15, 18, 20, 0.45)';
        for (var y = 0; y < h; y += 32) {
          ctx.fillRect(fx, y, fluteW, 2.5);
          ctx.fillStyle = 'rgba(110, 120, 130, 0.22)';
          ctx.fillRect(fx + 2, y + 2.5, fluteW - 4, 1.2);
          ctx.fillStyle = 'rgba(15, 18, 20, 0.45)';
        }
      }
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
          var nx = -Math.sin(u * Math.PI * 2.0) * 0.75;
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

  function plasterTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      ctx.fillStyle = '#f6f3eb';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 3500, '#ded8cb', 0.35, 1.4);
      speckle(ctx, w, h, 1600, '#ede8dc', 0.45, 1.6);
      speckle(ctx, w, h, 800, '#b8b09f', 0.14, 2.0);
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

  function stoneTexture() {
    return makeTexture(128, 128, function (ctx, w, h) {
      ctx.fillStyle = '#9b9890';
      ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, 1800, '#7c7971', 0.45, 1.5);
      speckle(ctx, w, h, 900, '#b8b5ac', 0.35, 1.3);
    }, 6, 6);
  }

  function woodTexture() {
    return makeTexture(512, 512, function (ctx, w, h) {
      ctx.fillStyle = '#563c27';
      ctx.fillRect(0, 0, w, h);
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
      speckle(ctx, w, h, 4000, '#362214', 0.28, 1.2);
      speckle(ctx, w, h, 2000, '#825c3c', 0.18, 1.4);
    }, 2, 4);
  }

  function waterNormalTexture() {
    return makeTexture(256, 256, function (ctx, w, h) {
      var img = ctx.createImageData(w, h);
      var data = img.data;
      for (var y = 0; y < h; y++) {
        var vy = y / h * Math.PI * 2;
        for (var x = 0; x < w; x++) {
          var vx = x / w * Math.PI * 2;
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
    ground.visible = false; // 600m 全景地坪不再渲染，避免沙盘外侧露出一望无际的平面
    applySnowAccumulation(groundMat, 1.0);

    // 沙盘顶面地坪：按 84m×84m 基座铺满（墙内庭园、南门广场、东西步道、后园连成一片），
    // 使树木、建筑、围墙、假山、汀步全部踩在实体地面上；水池的池底与水面覆盖其上，水池部分不受影响
    addMesh(new THREE.PlaneGeometry(84, 84), groundMat, 0, -0.01, -6,
      { rotX: -Math.PI / 2, receive: true });

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

    // 3. 平地绿茵：严格收敛于沙盘方格基座边界以内，杜绝穿模出墙与悬空
    // 移除原突破东西外墙悬浮在空中的飞碟状草甸([-50, 6], [50, 6])
    // 精确缩减南门前草坪半径并内收坐标，确保 z 最大边界严格在 32 以内（远低于基座南边缘 z=36）
    [[-25, 27, 4.8], [25, 27, 4.8], [0, 26, 4.0]].forEach(function (lawn) {
      addMesh(new THREE.CircleGeometry(lawn[2], 12), grassMat,
        lawn[0], 0.03, lawn[1], { rotX: -Math.PI / 2, receive: true });
      addMesh(new THREE.CircleGeometry(lawn[2] * 0.42, 10), mossMat,
        lawn[0] + 1.2, 0.05, lawn[1] - 0.8, { rotX: -Math.PI / 2, receive: true });
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
      color: COL.water, roughness: 0.04, metalness: 0.88, transparent: true, opacity: 0.93,
      side: THREE.DoubleSide,
      normalMap: waterNormalTexture(),
      normalScale: new THREE.Vector2(0.5, 0.5)
    });

    // 动态水面：雨天 Shader 程序化生成高密涟漪法线（适度疏朗20%），雨停后平静如镜积水倒影，雪天冰封雪盖
    waterMat.onBeforeCompile = function (shader) {
      waterCustomShader = shader;
      shader.uniforms.uReflectTexture = { value: waterReflectTarget ? waterReflectTarget.texture : null };
      shader.uniforms.uWaterTime = waterShaderUniforms.uTime;
      shader.uniforms.uRainRipple = waterShaderUniforms.uRainAmount;
      shader.uniforms.uSnowAmount = snowShaderUniform.uSnowAmount;

      shader.vertexShader = 'varying vec3 vGardenWorldPos;\nvarying vec4 vClipPos;\n' + shader.vertexShader.replace(
        '#include <project_vertex>',
        '#include <project_vertex>\n  vClipPos = gl_Position;'
      ).replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n  vGardenWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );

      shader.fragmentShader = 'uniform sampler2D uReflectTexture;\nuniform float uWaterTime;\nuniform float uRainRipple;\nuniform float uSnowAmount;\nvarying vec3 vGardenWorldPos;\nvarying vec4 vClipPos;\n' +
        'vec2 hashRipple(vec2 p) {\n' +
        '  p = fract(p * vec2(5.3983, 5.4427));\n' +
        '  p += dot(p.yx, p.xy + vec2(21.5351, 14.3137));\n' +
        '  return fract(vec2(p.x * p.y * 95.4337, p.x * p.y * 97.597));\n' +
        '}\n' +
        'vec2 calcRipples(vec2 uv, float t) {\n' +
        '  vec2 p = uv * 2.8;\n' +
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
        '  vec2 ndc = (vClipPos.xy / max(vClipPos.w, 0.0001)) * 0.5 + 0.5;\n' +
        '  vec2 waveDistort = vec2(sin(vGardenWorldPos.x * 2.8 + uWaterTime * 2.0), cos(vGardenWorldPos.z * 2.8 + uWaterTime * 1.6)) * 0.015;\n' +
        '  vec2 reflectUv = clamp(vec2(1.0 - ndc.x, ndc.y) + waveDistort, 0.001, 0.999);\n' +
        '  vec3 reflectedScene = texture2D(uReflectTexture, reflectUv).rgb;\n' +
        '  vec3 viewD = normalize(vViewPosition);\n' +
        '  float fresnel = clamp(pow(1.0 - max(0.0, -viewD.z), 3.0), 0.35, 0.90);\n' +
        '  vec3 deepWaterCol = vec3(0.18, 0.34, 0.38);\n' +
        '  diffuseColor.rgb = mix(deepWaterCol, reflectedScene * 1.18, fresnel);\n' +
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
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.78 });
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.82 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01 });
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: COL.wood, roughness: 0.8 });
    var woodDark = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.85 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01 });
    var copingMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
    roofMats.push(copingMat);
    applySnowAccumulation(copingMat, 1.0, true);
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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

  function buildLakePavilion() {
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0xbeb9af, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.04 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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
  }

  // 7. 【主屋前侧长走廊】：还原直廊沿主屋中轴（x=0）自南岸湖畔一直北伸，连接正殿前阶
  function buildCoveredCorridor() {
    var g = new THREE.Group();
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.04 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
    roofMats.push(roofMat);
    applySnowAccumulation(roofMat, 1.0, true);
    var floorMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stoneStep, roughness: 0.9 });
    snowCoverMats.push(floorMat);
    applySnowAccumulation(floorMat, 1.0);
    var pierMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.9 });
    snowCoverMats.push(pierMat);
    applySnowAccumulation(pierMat, 0.85);

    // 廊面标高 = 0.56m，廊柱净高提升至 3.35m（屋檐梁底标高约 3.98m），气势开朗舒朗，
    // 漫步其间视野通透，绝不压抑碰头，北端平顺衔接主屋朝南登堂石阶
    var DECK_TOP = 0.56;
    var DECK_THICK = 0.18;
    var deckY = DECK_TOP - DECK_THICK / 2;
    var width = 2.6;
    var colH = 3.35;
    var colY = deckY + colH / 2;
    var roofY = deckY + colH + 0.16;
    var pierH = deckY + 0.8;
    var pierY = deckY - pierH / 2;      // 柱脚落地/入水生根

    // 笔直南北向长直廊：沿主屋中轴（x=0）自南岸（z=17.6）向北一直延展至 z=-0.15，
    // 与主殿最低一阶垂带踏步（z=-0.10）严丝合缝接榫对接 —— 出廊即步步登阶登临主屋大门
    var CORRIDOR_NORTH = -0.15;
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

      // 西侧古典凭栏扶手与坐槛（面向西侧庭院假山园景）
      var westSidePz = -1 * (width / 2 - 0.15);
      addMesh(new THREE.BoxGeometry(length, 0.08, 0.28), woodMat, 0, DECK_TOP + 0.45, westSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(length, 0.10, 0.08), woodMat, 0, DECK_TOP + 0.90, westSidePz, { parent: seg });

      // 东侧栏杆扶手（面向右侧大湖）：在 z = 7.3 ~ 9.7 处敞开连通湖心水榭连桥
      var eastSidePz = 1 * (width / 2 - 0.15);
      // 北段栏杆 (z from -0.15 to 7.3)
      var lenNorth = 7.3 - (-0.15);
      var midNorthX = mid - (-0.15 + 7.3) / 2;
      addMesh(new THREE.BoxGeometry(lenNorth, 0.08, 0.28), woodMat, midNorthX, DECK_TOP + 0.45, eastSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(lenNorth, 0.10, 0.08), woodMat, midNorthX, DECK_TOP + 0.90, eastSidePz, { parent: seg });

      // 南段栏杆 (z from 9.7 to 17.6)
      var lenSouth = 17.6 - 9.7;
      var midSouthX = mid - (9.7 + 17.6) / 2;
      addMesh(new THREE.BoxGeometry(lenSouth, 0.08, 0.28), woodMat, midSouthX, DECK_TOP + 0.45, eastSidePz, { parent: seg });
      addMesh(new THREE.BoxGeometry(lenSouth, 0.10, 0.08), woodMat, midSouthX, DECK_TOP + 0.90, eastSidePz, { parent: seg });

      // 廊柱：端柱 + 按跨度均布的高大落地立柱
      var midCount = Math.max(0, Math.round(length / 4.5) - 1);
      var postXs = [-length / 2 + 0.3, length / 2 - 0.3];
      for (var mi = 1; mi <= midCount; mi++) {
        var px = -length / 2 + (length * mi) / (midCount + 1);
        if (Math.abs(px - (mid - 8.5)) > 1.2) { // 避开连桥出入口
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

      // 抬高的气派廊顶与正脊
      addMesh(new THREE.BoxGeometry(length + 0.4, 0.26, width + 0.6), roofMat, 0, roofY, 0, { parent: seg, cast: true });
      addMesh(new THREE.BoxGeometry(length + 0.4, 0.18, 0.32),
        new THREE.MeshStandardMaterial({ color: COL.roofRidge, roughness: 0.75 }), 0, roofY + 0.22, 0, { parent: seg, cast: true });

      // 廊内悬挂高雅古典宫灯（悬挂高度提升至 3.46m，高耸开朗，零遮挡视线）
      [3.0, 8.5, 14.0].forEach(function (lz) {
        var lx = mid - lz;
        addMesh(new THREE.SphereGeometry(0.24, 8, 8), lanternMaterial(), lx, roofY - 0.52, 0, { parent: seg });
        var cLight = new THREE.PointLight(COL.lanternWarm, 0, 10, 2);
        cLight.position.set(lx, roofY - 0.52, 0);
        seg.add(cLight);
        lampLights.push(cLight);
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
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01 });
    var copingMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
    roofMats.push(copingMat);
    applySnowAccumulation(copingMat, 1.0, true);
    var woodDarkMat = new THREE.MeshStandardMaterial({ color: COL.woodDark, roughness: 0.84 });
    snowCoverMats.push(woodDarkMat);
    applySnowAccumulation(woodDarkMat, 0.9);

    var wallH = 3.5;
    var wallThick = 0.50;
    var winY = 2.05; // 赏景黄金视平线高程

    // 辅助函数：在指定墙面位置放置一根木构杆件（自动适应南北墙 X-Y 面或东西墙 Z-Y 面）
    function addMuntin(parent, wx, wy, wz, dx, dy, len, thick, depth, rotAngle, isXWall) {
      if (isXWall) {
        addMesh(new THREE.BoxGeometry(len, thick, depth), woodDarkMat,
          wx + dx, wy + dy, wz,
          { parent: parent, rotZ: rotAngle || 0, cast: true, receive: true });
      } else {
        addMesh(new THREE.BoxGeometry(depth, thick, len), woodDarkMat,
          wx, wy + dy, wz + dx,
          { parent: parent, rotX: -(rotAngle || 0), cast: true, receive: true });
      }
    }

    // =========================================================================
    // 花窗雕刻 1：南墙 —— 【扇形花窗】（放大 1.5 倍，折扇形制、芭蕉摇曳，雅致迎客）
    // =========================================================================
    function createFanHole(cx, cy) {
      var hole = new THREE.Path();
      var pivotY = cy - 2.55; // 放大 1.5 倍（原 1.70 * 1.5）
      var r1 = 1.725;        // 放大 1.5 倍（原 1.15 * 1.5）
      var r2 = 3.375;        // 放大 1.5 倍（原 2.25 * 1.5）
      var halfA = 0.35;      // 保持优雅展开角
      var segs = 14;

      // 顺时针（Path 挖孔规范）
      var x0 = cx - Math.sin(halfA) * r2;
      var y0 = pivotY + Math.cos(halfA) * r2;
      hole.moveTo(x0, y0);
      for (var i = 1; i <= segs; i++) {
        var a = -halfA + (2 * halfA * i) / segs;
        hole.lineTo(cx + Math.sin(a) * r2, pivotY + Math.cos(a) * r2);
      }
      hole.lineTo(cx + Math.sin(halfA) * r1, pivotY + Math.cos(halfA) * r1);
      for (var j = segs - 1; j >= 0; j--) {
        var a2 = -halfA + (2 * halfA * j) / segs;
        hole.lineTo(cx + Math.sin(a2) * r1, pivotY + Math.cos(a2) * r1);
      }
      hole.closePath();
      return hole;
    }

    function buildFanOrnament(parent, wx, wy, wz, isXWall) {
      var pivotY = -2.55;
      var r1 = 1.725;
      var r2 = 3.375;
      var halfA = 0.35;
      var segs = 14;
      var frameThick = 0.085;
      var frameDepth = 0.56; // 窗框微凸出于墙体两面各 0.03m

      // 外弧边框与内弧边框
      for (var i = 0; i < segs; i++) {
        var aMid = -halfA + (halfA * 2 * (i + 0.5)) / segs;
        var arcLen = (r2 * halfA * 2) / segs + 0.03;
        var fx2 = Math.sin(aMid) * r2;
        var fy2 = pivotY + Math.cos(aMid) * r2;
        addMuntin(parent, wx, wy, wz, fx2, fy2, arcLen, frameThick, frameDepth, -aMid, isXWall);

        var arcLen1 = (r1 * halfA * 2) / segs + 0.03;
        var fx1 = Math.sin(aMid) * r1;
        var fy1 = pivotY + Math.cos(aMid) * r1;
        addMuntin(parent, wx, wy, wz, fx1, fy1, arcLen1, frameThick, frameDepth, -aMid, isXWall);
      }
      // 左右斜边收边框
      [-halfA, halfA].forEach(function (sideA) {
        var midR = (r1 + r2) / 2;
        var sx = Math.sin(sideA) * midR;
        var sy = pivotY + Math.cos(sideA) * midR;
        addMuntin(parent, wx, wy, wz, sx, sy, r2 - r1 + 0.05, frameThick, frameDepth, -sideA + Math.PI / 2, isXWall);
      });

      // 内部经典扇骨与横绋雕花（5 根主扇骨放射）
      var spokeAngles = [-0.24, -0.12, 0, 0.12, 0.24];
      spokeAngles.forEach(function (sa) {
        var midR2 = (r1 + r2) / 2;
        var kx = Math.sin(sa) * midR2;
        var ky = pivotY + Math.cos(sa) * midR2;
        addMuntin(parent, wx, wy, wz, kx, ky, r2 - r1 - 0.08, 0.045, 0.10, -sa + Math.PI / 2, isXWall);
      });
      // 扇面中部横绋连桥木篾（放大 1.5 倍半径：2.28m 与 2.82m）
      [2.28, 2.82].forEach(function (ribR) {
        for (var si = 0; si < segs - 2; si++) {
          var raMid = -halfA * 0.82 + (halfA * 1.64 * (si + 0.5)) / (segs - 2);
          var rx = Math.sin(raMid) * ribR;
          var ry = pivotY + Math.cos(raMid) * ribR;
          var rLen = (ribR * halfA * 1.64) / (segs - 2) + 0.03;
          addMuntin(parent, wx, wy, wz, rx, ry, rLen, 0.04, 0.08, -raMid, isXWall);
        }
      });
    }

    // =========================================================================
    // 花窗雕刻 2：北墙 —— 【八角海棠花窗】（放大 1.5 倍，端庄典雅、中轴对称、回纹格心）
    // =========================================================================
    function createOctagonHole(cx, cy) {
      var hole = new THREE.Path();
      var R = 1.17; // 原 0.78 * 1.5
      for (var k = 0; k < 8; k++) {
        var oa = (k / 8) * Math.PI * 2 + Math.PI / 8;
        var ox = cx + Math.cos(oa) * R;
        var oy = cy + Math.sin(oa) * R;
        if (k === 0) hole.moveTo(ox, oy);
        else hole.lineTo(ox, oy);
      }
      hole.closePath();
      return hole;
    }

    function buildOctagonOrnament(parent, wx, wy, wz, isXWall) {
      var R = 1.17; // 原 0.78 * 1.5
      var segLen = 2 * R * Math.sin(Math.PI / 8) + 0.03;
      var frameThick = 0.085;
      var frameDepth = 0.56;

      // 八角外框
      for (var k = 0; k < 8; k++) {
        var a1 = (k / 8) * Math.PI * 2 + Math.PI / 8;
        var a2 = ((k + 1) / 8) * Math.PI * 2 + Math.PI / 8;
        var mx = (Math.cos(a1) + Math.cos(a2)) / 2 * R;
        var my = (Math.sin(a1) + Math.sin(a2)) / 2 * R;
        var rot = Math.atan2(Math.sin(a2) - Math.sin(a1), Math.cos(a2) - Math.cos(a1));
        addMuntin(parent, wx, wy, wz, mx, my, segLen, frameThick, frameDepth, rot, isXWall);
      }

      // 同心内套八角边线
      var rInner = 0.96; // 原 0.64 * 1.5
      var innerLen = 2 * rInner * Math.sin(Math.PI / 8) + 0.03;
      for (var j = 0; j < 8; j++) {
        var ja1 = (j / 8) * Math.PI * 2 + Math.PI / 8;
        var ja2 = ((j + 1) / 8) * Math.PI * 2 + Math.PI / 8;
        var jmx = (Math.cos(ja1) + Math.cos(ja2)) / 2 * rInner;
        var jmy = (Math.sin(ja1) + Math.sin(ja2)) / 2 * rInner;
        var jrot = Math.atan2(Math.sin(ja2) - Math.sin(ja1), Math.cos(ja2) - Math.cos(ja1));
        addMuntin(parent, wx, wy, wz, jmx, jmy, innerLen, 0.042, 0.10, jrot, isXWall);
      }

      // 中央海棠回纹格心（十字骨架与 45 度交错方胜盘长）
      addMuntin(parent, wx, wy, wz, 0, 0, rInner * 2 - 0.08, 0.052, 0.09, 0, isXWall);
      addMuntin(parent, wx, wy, wz, 0, 0, rInner * 2 - 0.08, 0.052, 0.09, Math.PI / 2, isXWall);
      var diaR = 0.54; // 原 0.36 * 1.5
      for (var d = 0; d < 4; d++) {
        var da1 = (d / 4) * Math.PI * 2 + Math.PI / 4;
        var da2 = ((d + 1) / 4) * Math.PI * 2 + Math.PI / 4;
        var dmx = (Math.cos(da1) + Math.cos(da2)) / 2 * diaR;
        var dmy = (Math.sin(da1) + Math.sin(da2)) / 2 * diaR;
        var drot = Math.atan2(Math.sin(da2) - Math.sin(da1), Math.cos(da2) - Math.cos(da1));
        addMuntin(parent, wx, wy, wz, dmx, dmy, diaR * 1.414, 0.042, 0.08, drot, isXWall);
      }
    }

    // =========================================================================
    // 花窗雕刻 3：西墙 —— 【方形冰裂纹圆光花窗】（放大 1.5 倍，方形冰裂纹配月洞圆圈，诗意破冰迎春）
    // =========================================================================
    function createSquareHole(cx, cy) {
      var hole = new THREE.Path();
      var halfW = 1.08; // 原 0.72 * 1.5
      hole.moveTo(cx - halfW, cy - halfW);
      hole.lineTo(cx + halfW, cy - halfW);
      hole.lineTo(cx + halfW, cy + halfW);
      hole.lineTo(cx - halfW, cy + halfW);
      hole.closePath();
      return hole;
    }

    function buildCrackedIceOrnament(parent, wx, wy, wz, isXWall) {
      var halfW = 1.08; // 原 0.72 * 1.5
      var frameThick = 0.085;
      var frameDepth = 0.56;

      // 外方框四边
      addMuntin(parent, wx, wy, wz, 0, -halfW, halfW * 2, frameThick, frameDepth, 0, isXWall);
      addMuntin(parent, wx, wy, wz, 0, halfW, halfW * 2, frameThick, frameDepth, 0, isXWall);
      addMuntin(parent, wx, wy, wz, -halfW, 0, halfW * 2, frameThick, frameDepth, Math.PI / 2, isXWall);
      addMuntin(parent, wx, wy, wz, halfW, 0, halfW * 2, frameThick, frameDepth, Math.PI / 2, isXWall);

      // 中央圆光月洞木圈（放大 1.5 倍：半径 0.63m）
      var moonR = 0.63; // 原 0.42 * 1.5
      for (var m = 0; m < 8; m++) {
        var ma1 = (m / 8) * Math.PI * 2;
        var ma2 = ((m + 1) / 8) * Math.PI * 2;
        var mmx = (Math.cos(ma1) + Math.cos(ma2)) / 2 * moonR;
        var mmy = (Math.sin(ma1) + Math.sin(ma2)) / 2 * moonR;
        var mrot = Math.atan2(Math.sin(ma2) - Math.sin(ma1), Math.cos(ma2) - Math.cos(ma1));
        var mLen = 2 * moonR * Math.sin(Math.PI / 8) + 0.03;
        addMuntin(parent, wx, wy, wz, mmx, mmy, mLen, 0.052, 0.12, mrot, isXWall);
      }

      // 经典冰裂纹折线：连接外框与内圆圈的自然破冰纹理（全部坐标乘以 1.5）
      var scale = 1.5;
      var baseCracks = [
        // 4 组四角主裂纹
        { x1: -0.72 + 0.03, y1: -0.72 + 0.03, x2: -0.38, y2: -0.26 },
        { x1: -0.38, y1: -0.26, x2: -0.42 * 0.7, y2: -0.42 * 0.7 },
        { x1: 0.72 - 0.03, y1: -0.72 + 0.03, x2: 0.36, y2: -0.28 },
        { x1: 0.36, y1: -0.28, x2: 0.42 * 0.7, y2: -0.42 * 0.7 },
        { x1: -0.72 + 0.03, y1: 0.72 - 0.03, x2: -0.32, y2: 0.32 },
        { x1: -0.32, y1: 0.32, x2: -0.42 * 0.7, y2: 0.42 * 0.7 },
        { x1: 0.72 - 0.03, y1: 0.72 - 0.03, x2: 0.34, y2: 0.30 },
        { x1: 0.34, y1: 0.30, x2: 0.42 * 0.7, y2: 0.42 * 0.7 },
        // 4 组边框支裂纹
        { x1: 0, y1: -0.72 + 0.03, x2: 0.10, y2: -0.42 },
        { x1: 0, y1: 0.72 - 0.03, x2: -0.08, y2: 0.42 },
        { x1: -0.72 + 0.03, y1: 0, x2: -0.42, y2: -0.06 },
        { x1: 0.72 - 0.03, y1: 0, x2: 0.42, y2: 0.08 },
        // 横向斜贯冰花小叉
        { x1: -0.38, y1: -0.26, x2: -0.18, y2: -0.48 },
        { x1: 0.36, y1: -0.28, x2: 0.52, y2: -0.20 },
        { x1: -0.32, y1: 0.32, x2: -0.50, y2: 0.22 },
        { x1: 0.34, y1: 0.30, x2: 0.20, y2: 0.48 }
      ];

      baseCracks.forEach(function (ck) {
        var x1 = ck.x1 * scale;
        var y1 = ck.y1 * scale;
        var x2 = ck.x2 * scale;
        var y2 = ck.y2 * scale;
        var cx = (x1 + x2) / 2;
        var cy = (y1 + y2) / 2;
        var len = Math.hypot(x2 - x1, y2 - y1);
        var rot = Math.atan2(y2 - y1, x2 - x1);
        addMuntin(parent, wx, wy, wz, cx, cy, len + 0.02, 0.040, 0.085, rot, isXWall);
      });
    }

    // =========================================================================
    // 花窗雕刻 4：东墙 —— 【六角龟背花窗】（放大 1.5 倍，龟背长寿、六角透绿、竹影参差）
    // =========================================================================
    function createHexagonHole(cx, cy) {
      var hole = new THREE.Path();
      var R = 1.20; // 原 0.80 * 1.5
      for (var h = 0; h < 6; h++) {
        var ha = (h / 6) * Math.PI * 2;
        var hx = cx + Math.cos(ha) * R;
        var hy = cy + Math.sin(ha) * R;
        if (h === 0) hole.moveTo(hx, hy);
        else hole.lineTo(hx, hy);
      }
      hole.closePath();
      return hole;
    }

    function buildHexagonOrnament(parent, wx, wy, wz, isXWall) {
      var R = 1.20; // 原 0.80 * 1.5
      var segLen = R + 0.03; // 正六边形边长等于外接圆半径
      var frameThick = 0.085;
      var frameDepth = 0.56;

      // 外六边形框
      for (var h = 0; h < 6; h++) {
        var ha1 = (h / 6) * Math.PI * 2;
        var ha2 = ((h + 1) / 6) * Math.PI * 2;
        var hmx = (Math.cos(ha1) + Math.cos(ha2)) / 2 * R;
        var hmy = (Math.sin(ha1) + Math.sin(ha2)) / 2 * R;
        var hrot = Math.atan2(Math.sin(ha2) - Math.sin(ha1), Math.cos(ha2) - Math.cos(ha1));
        addMuntin(parent, wx, wy, wz, hmx, hmy, segLen, frameThick, frameDepth, hrot, isXWall);
      }

      // 同心内套六边形
      var rInner = 0.975; // 原 0.65 * 1.5
      var innerLen = rInner + 0.03;
      for (var j = 0; j < 6; j++) {
        var ja1 = (j / 6) * Math.PI * 2;
        var ja2 = ((j + 1) / 6) * Math.PI * 2;
        var jmx = (Math.cos(ja1) + Math.cos(ja2)) / 2 * rInner;
        var jmy = (Math.sin(ja1) + Math.sin(ja2)) / 2 * rInner;
        var jrot = Math.atan2(Math.sin(ja2) - Math.sin(ja1), Math.cos(ja2) - Math.cos(ja1));
        addMuntin(parent, wx, wy, wz, jmx, jmy, innerLen, 0.042, 0.10, jrot, isXWall);
      }

      // 龟背六角蜂巢格心（中心内接小六边形与 6 根放射状龟背主棱）
      var rCore = 0.525; // 原 0.35 * 1.5
      var coreLen = rCore + 0.02;
      for (var c = 0; c < 6; c++) {
        var ca1 = (c / 6) * Math.PI * 2;
        var ca2 = ((c + 1) / 6) * Math.PI * 2;
        var cmx = (Math.cos(ca1) + Math.cos(ca2)) / 2 * rCore;
        var cmy = (Math.sin(ca1) + Math.sin(ca2)) / 2 * rCore;
        var crot = Math.atan2(Math.sin(ca2) - Math.sin(ca1), Math.cos(ca2) - Math.cos(ca1));
        addMuntin(parent, wx, wy, wz, cmx, cmy, coreLen, 0.040, 0.08, crot, isXWall);

        // 自中心小六角顶点放射至内外圈顶点
        var rx = (Math.cos(ca1) * rCore + Math.cos(ca1) * rInner) / 2;
        var ry = (Math.sin(ca1) * rCore + Math.sin(ca1) * rInner) / 2;
        var rSpokeLen = rInner - rCore + 0.03;
        addMuntin(parent, wx, wy, wz, rx, ry, rSpokeLen, 0.040, 0.08, ca1, isXWall);
      }
    }

    // =========================================================================
    // 构建四面围墙与对应花窗系统（间距保持原有设计不变，窗体 1.5 倍雕刻）
    // =========================================================================

    // 1. 【北院墙】（全长 76m，Z = -32）：雕刻【八角海棠花窗】
    var northGroup = new THREE.Group();
    var northXs = [-31.5, -22.5, -13.5, -4.5, 4.5, 13.5, 22.5, 31.5];
    var northShape = new THREE.Shape();
    northShape.moveTo(-38, 0); northShape.lineTo(38, 0);
    northShape.lineTo(38, wallH); northShape.lineTo(-38, wallH);
    northShape.closePath();
    northXs.forEach(function (nx) {
      northShape.holes.push(createOctagonHole(nx, winY));
    });
    var northWallGeo = new THREE.ExtrudeGeometry(northShape, { depth: wallThick, bevelEnabled: false });
    var northMesh = new THREE.Mesh(northWallGeo, plasterMat);
    northMesh.position.set(0, 0, -32 - wallThick / 2);
    northMesh.castShadow = true;
    northMesh.receiveShadow = true;
    northGroup.add(northMesh);

    // 黛瓦压顶
    var northCoping = new THREE.Mesh(new THREE.BoxGeometry(76.8, 0.40, 1.0), copingMat);
    northCoping.position.set(0, 3.65, -32);
    northCoping.castShadow = true;
    northGroup.add(northCoping);

    // 8 组八角海棠雕花窗架
    northXs.forEach(function (nx) {
      buildOctagonOrnament(northGroup, nx, winY, -32, true);
    });
    scene.add(northGroup);

    // 2. 【南院墙】（分为西段与东段，Z = 20）：雕刻【扇形花窗】
    var southGroup = new THREE.Group();
    var southWestXs = [-31.5, -23.5, -15.5, -9.0];
    var southEastXs = [9.0, 15.5, 23.5, 31.5];

    // 南墙西段 (-38 到 -6)
    var swShape = new THREE.Shape();
    swShape.moveTo(-38, 0); swShape.lineTo(-6, 0);
    swShape.lineTo(-6, wallH); swShape.lineTo(-38, wallH);
    swShape.closePath();
    southWestXs.forEach(function (sx) {
      swShape.holes.push(createFanHole(sx, winY));
    });
    var swGeo = new THREE.ExtrudeGeometry(swShape, { depth: wallThick, bevelEnabled: false });
    var swMesh = new THREE.Mesh(swGeo, plasterMat);
    swMesh.position.set(0, 0, 20 - wallThick / 2);
    swMesh.castShadow = true;
    swMesh.receiveShadow = true;
    southGroup.add(swMesh);

    var swCoping = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.40, 1.0), copingMat);
    swCoping.position.set(-22, 3.65, 20);
    swCoping.castShadow = true;
    southGroup.add(swCoping);

    southWestXs.forEach(function (sx) {
      buildFanOrnament(southGroup, sx, winY, 20, true);
    });

    // 南墙东段 (6 到 38)
    var seShape = new THREE.Shape();
    seShape.moveTo(6, 0); seShape.lineTo(38, 0);
    seShape.lineTo(38, wallH); seShape.lineTo(6, wallH);
    seShape.closePath();
    southEastXs.forEach(function (sx) {
      seShape.holes.push(createFanHole(sx, winY));
    });
    var seGeo = new THREE.ExtrudeGeometry(seShape, { depth: wallThick, bevelEnabled: false });
    var seMesh = new THREE.Mesh(seGeo, plasterMat);
    seMesh.position.set(0, 0, 20 - wallThick / 2);
    seMesh.castShadow = true;
    seMesh.receiveShadow = true;
    southGroup.add(seMesh);

    var seCoping = new THREE.Mesh(new THREE.BoxGeometry(32.8, 0.40, 1.0), copingMat);
    seCoping.position.set(22, 3.65, 20);
    seCoping.castShadow = true;
    southGroup.add(seCoping);

    southEastXs.forEach(function (sx) {
      buildFanOrnament(southGroup, sx, winY, 20, true);
    });
    scene.add(southGroup);

    // 3. 【西院墙】（全长 52m，X = -38，沿 Z 向延展）：雕刻【方形冰裂纹圆光花窗】
    var westGroup = new THREE.Group();
    var westZs = [-26.0, -17.0, -8.0, 1.0, 9.5, 16.5];
    var westShape = new THREE.Shape();
    westShape.moveTo(0, 0); westShape.lineTo(52, 0);
    westShape.lineTo(52, wallH); westShape.lineTo(0, wallH);
    westShape.closePath();
    westZs.forEach(function (wz) {
      var localL = wz - (-32); // 转换到局部长度
      westShape.holes.push(createSquareHole(localL, winY));
    });
    var westGeo = new THREE.ExtrudeGeometry(westShape, { depth: wallThick, bevelEnabled: false });
    var westMesh = new THREE.Mesh(westGeo, plasterMat);
    westMesh.position.set(-38 - wallThick / 2, 0, -32);
    westMesh.rotation.y = -Math.PI / 2;
    westMesh.castShadow = true;
    westMesh.receiveShadow = true;
    westGroup.add(westMesh);

    var westCoping = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.40, 52.8), copingMat);
    westCoping.position.set(-38, 3.65, -6);
    westCoping.castShadow = true;
    westGroup.add(westCoping);

    westZs.forEach(function (wz) {
      buildCrackedIceOrnament(westGroup, -38, winY, wz, false);
    });
    scene.add(westGroup);

    // 4. 【东院墙】（全长 52m，X = 38，沿 Z 向延展）：雕刻【六角龟背花窗】
    var eastGroup = new THREE.Group();
    var eastZs = [-26.0, -17.0, -8.0, 1.0, 9.5, 16.5];
    var eastShape = new THREE.Shape();
    eastShape.moveTo(0, 0); eastShape.lineTo(52, 0);
    eastShape.lineTo(52, wallH); eastShape.lineTo(0, wallH);
    eastShape.closePath();
    eastZs.forEach(function (ez) {
      var localL2 = ez - (-32);
      eastShape.holes.push(createHexagonHole(localL2, winY));
    });
    var eastGeo = new THREE.ExtrudeGeometry(eastShape, { depth: wallThick, bevelEnabled: false });
    var eastMesh = new THREE.Mesh(eastGeo, plasterMat);
    eastMesh.position.set(38 - wallThick / 2, 0, -32);
    eastMesh.rotation.y = -Math.PI / 2;
    eastMesh.castShadow = true;
    eastMesh.receiveShadow = true;
    eastGroup.add(eastMesh);

    var eastCoping = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.40, 52.8), copingMat);
    eastCoping.position.set(38, 3.65, -6);
    eastCoping.castShadow = true;
    eastGroup.add(eastCoping);

    eastZs.forEach(function (ez) {
      buildHexagonOrnament(eastGroup, 38, winY, ez, false);
    });
    scene.add(eastGroup);
  }

  /* ---------------- 7B. 南面正门门楼（四面合围院墙的唯一出入口） ----------------
     三开间重檐门楼：中央门洞净宽 5m 可通行，左右两垛实墙落于青石台基，
     南侧三级石阶自平地登台，北侧石甬道接直廊南端上岸踏步，
     南、北两面各悬匾额，四角起翘，夜间两盏门灯亮暖光。 */

  function buildMainGate() {
    var g = new THREE.Group();
    var plasterMat = new THREE.MeshStandardMaterial({ map: plasterTexture(), color: 0xf7f4ec, roughness: 0.90, metalness: 0.01 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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
      map: stoneTexture(), color: 0x86847e, roughness: 0.82
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
    var geo = new THREE.IcosahedronGeometry(1.0, 2);
    var pos = geo.attributes.position;
    var rnd = makeRandom(seed || 42);
    var v = new THREE.Vector3();
    var freq1 = 2.2 + rnd() * 0.8;
    var freq2 = 3.6 + rnd() * 1.0;

    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      var dir = v.clone().normalize();
      var d1 = Math.sin(v.x * freq1 + v.y * 2.1) * 0.20;
      var d2 = Math.cos(v.y * freq2 + v.z * 2.6) * 0.16;
      var d3 = Math.sin((v.x + v.z) * 3.4) * 0.10;
      var hollow = (Math.sin(v.y * 4.8 + v.x * 3.0) > 0.65) ? -0.18 : 0.0;
      var radius = 1.0 + d1 + d2 + d3 + hollow;
      var yFactor = v.y > 0 ? (1.0 + v.y * 0.4) : (0.75 + v.y * 0.15);
      pos.setXYZ(i, dir.x * radius, dir.y * radius * yFactor, dir.z * radius);
    }
    geo.computeVertexNormals();
    return geo;
  }

  function buildHilltopPavilion() {
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: COL.stone, roughness: 0.9 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 1.0);
    var woodMat = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.04 });
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.15 });
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
      color: 0x5b8a45, roughness: 0.55
    });
    var leafMat = new THREE.MeshStandardMaterial({
      color: 0x527a38, roughness: 0.72, side: THREE.DoubleSide
    });

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

    var groves = [
      { x: -32, z: 0, r: 3.2, n: isMobile ? 35 : 70, seed: 43 },
      { x: 33, z: -16, r: 3.0, n: isMobile ? 30 : 60, seed: 49 },
      { x: 0, z: -40, r: 9.0, n: isMobile ? 35 : 70, seed: 55 },
      { x: -26, z: -40, r: 7.5, n: isMobile ? 30 : 65, seed: 61 },
      { x: 26, z: -40, r: 7.5, n: isMobile ? 30 : 65, seed: 67 }
    ];

    var total = 0;
    groves.forEach(function (g) { total += g.n; });

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
        var tiltX = (rnd() - 0.5) * 0.18;
        var tiltZ = (rnd() - 0.5) * 0.22;
        var sc = 0.88 + rnd() * 0.42;

        p.set(bx, 4.2 * sc, bz);
        q.setFromEuler(new THREE.Euler(tiltX, rnd() * Math.PI, tiltZ));
        s.set(sc, sc, sc);
        m.compose(p, q, s);
        stems.setMatrixAt(sIdx, m);
        sIdx++;

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
  }

  function buildWillow(x, y, z, scale) {
    var g = new THREE.Group();
    var bark = new THREE.MeshStandardMaterial({ map: woodTexture(), color: 0x483424, roughness: 0.70, metalness: 0.048 });
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

  /* ---------------- 11.5 假山后与草丛间的狸奴、仙鹤（若隐若现，点击或漫步靠近触发诗词） ---------------- */

  var critters = [];
  var critterRaycaster = null;
  var poemCardEl = null;
  var poemSealEl = null;
  var poemBodyEl = null;
  var poemSourceEl = null;
  var poemTimer = 0;
  var poemHideTimer = 0;
  var lastPoemAt = 0;

  // 与猫、鹤相关的古代诗词（公有领域作品，节选处已注明）
  var POEMS = {
    cat: [
      { text: '裹盐迎得小狸奴，尽护山房万卷书。\n惭愧家贫策勋薄，寒无毡坐食无鱼。', source: '宋 · 陆游《赠猫》' },
      { text: '秋来鼠辈欺猫死，窥瓮翻盘搅夜眠。\n闻道狸奴将数子，买鱼穿柳聘衔蝉。', source: '宋 · 黄庭坚《乞猫》' },
      { text: '风卷江湖雨暗村，四山声作海涛翻。\n溪柴火软蛮毡暖，我与狸奴不出门。', source: '宋 · 陆游《十一月四日风雨大作》其一' },
      { text: '似虎能缘木，如驹不伏辕。', source: '宋 · 陆游《得猫于近村以雪儿名之戏为作诗》节选' }
    ],
    crane: [
      { text: '自古逢秋悲寂寥，我言秋日胜春朝。\n晴空一鹤排云上，便引诗情到碧霄。', source: '唐 · 刘禹锡《秋词》' },
      { text: '昔人已乘黄鹤去，此地空余黄鹤楼。\n黄鹤一去不复返，白云千载空悠悠。', source: '唐 · 崔颢《黄鹤楼》节选' },
      { text: '鹤鸣于九皋，声闻于野。\n鱼在于渚，或潜在渊。', source: '《诗经 · 小雅 · 鹤鸣》节选' },
      { text: '高竹笼前无伴侣，乱鸡群里有风标。\n低头乍恐丹砂落，晒翅常疑白雪消。', source: '唐 · 白居易《池鹤》节选' }
    ]
  };

  function critterEyeMat() {
    return new THREE.MeshStandardMaterial({
      color: 0xd8c46a, emissive: 0x6a5a20, emissiveIntensity: 0.55, roughness: 0.42
    });
  }

  // 猫：低多边形蹲伏姿态，尾绕体侧、耳尖前倾，蹲坐在平地石根之间
  function buildCat(at) {
    var g = new THREE.Group();
    var fur = new THREE.MeshStandardMaterial({ color: at.fur, roughness: 0.9, flatShading: true });
    applySnowAccumulation(fur, 0.4);
    var furDark = new THREE.MeshStandardMaterial({ color: 0x2f2b26, roughness: 0.85, flatShading: true });
    var eyeMat = critterEyeMat();

    addMesh(new THREE.SphereGeometry(0.19, 10, 8), fur, 0, 0.21, -0.02, { parent: g, cast: true, scale: [0.92, 1.24, 1.1] });
    addMesh(new THREE.SphereGeometry(0.17, 10, 8), fur, 0, 0.16, -0.10, { parent: g, cast: true, scale: [1.02, 1.02, 1.05] });
    [-1, 1].forEach(function (s) {
      addMesh(new THREE.CylinderGeometry(0.035, 0.042, 0.17, 6), fur, s * 0.068, 0.085, 0.135, { parent: g, cast: true });
      addMesh(new THREE.SphereGeometry(0.045, 6, 5), furDark, s * 0.068, 0.016, 0.145, { parent: g, cast: true, scale: [1, 0.5, 1.3] });
      addMesh(new THREE.ConeGeometry(0.05, 0.10, 4), fur, s * 0.062, 0.52, 0.075, { parent: g, cast: true, rotZ: -s * 0.24 });
      addMesh(new THREE.SphereGeometry(0.021, 6, 5), eyeMat, s * 0.046, 0.455, 0.185, { parent: g });
    });
    addMesh(new THREE.SphereGeometry(0.115, 10, 8), fur, 0, 0.44, 0.075, { parent: g, cast: true, scale: [1.06, 0.96, 1] });
    addMesh(new THREE.SphereGeometry(0.052, 7, 6), furDark, 0, 0.415, 0.175, { parent: g, cast: true, scale: [1.15, 0.8, 0.9] });
    addMesh(new THREE.CylinderGeometry(0.03, 0.034, 0.24, 6), fur, 0.135, 0.07, -0.19, { parent: g, cast: true, rotZ: -1.15, rotY: -0.35 });
    addMesh(new THREE.CylinderGeometry(0.026, 0.03, 0.2, 6), fur, 0.24, 0.055, -0.24, { parent: g, cast: true, rotZ: -1.55, rotY: -0.6 });
    addMesh(new THREE.SphereGeometry(0.033, 6, 5), furDark, 0.29, 0.05, -0.27, { parent: g });

    g.position.set(at.x, 0, at.z);
    g.rotation.y = at.ry || 0;
    g.scale.setScalar(at.scale || 1);
    return g;
  }

  // 仙鹤：细长颈、丹顶、长喙、细高腿，立于岸草石隙之间
  function buildCrane(at) {
    var g = new THREE.Group();
    var feather = new THREE.MeshStandardMaterial({ color: 0xf2f4f1, roughness: 0.82, flatShading: true });
    applySnowAccumulation(feather, 0.35);
    var tipMat = new THREE.MeshStandardMaterial({ color: 0x2c3034, roughness: 0.8, flatShading: true });
    var crownMat = new THREE.MeshStandardMaterial({ color: 0xbf3b2c, roughness: 0.66 });
    var beakMat = new THREE.MeshStandardMaterial({ color: 0x4a463f, roughness: 0.75 });
    var legMat = new THREE.MeshStandardMaterial({ color: 0x53514a, roughness: 0.8 });

    [-1, 1].forEach(function (s) {
      addMesh(new THREE.CylinderGeometry(0.017, 0.021, 0.56, 5), legMat, s * 0.05, 0.28, 0, { parent: g, cast: true });
      addMesh(new THREE.BoxGeometry(0.06, 0.014, 0.075), legMat, s * 0.05, 0.008, 0.022, { parent: g });
      addMesh(new THREE.SphereGeometry(0.14, 9, 7), feather, s * 0.13, 0.72, -0.02, { parent: g, cast: true, scale: [0.5, 0.9, 1.15] });
      addMesh(new THREE.SphereGeometry(0.075, 7, 6), tipMat, s * 0.155, 0.68, -0.16, { parent: g, cast: true, scale: [0.5, 0.7, 1.1] });
    });
    addMesh(new THREE.SphereGeometry(0.165, 10, 8), feather, 0, 0.72, -0.02, { parent: g, cast: true, scale: [0.92, 0.92, 1.45] });
    addMesh(new THREE.ConeGeometry(0.09, 0.22, 5), tipMat, 0, 0.71, -0.34, { parent: g, cast: true, rotX: -1.85 });
    addMesh(new THREE.CylinderGeometry(0.03, 0.044, 0.46, 6), feather, 0, 1.0, 0.055, { parent: g, cast: true, rotX: -0.14 });
    addMesh(new THREE.SphereGeometry(0.068, 8, 6), feather, 0, 1.245, 0.125, { parent: g, cast: true, scale: [1, 0.95, 1.05] });
    addMesh(new THREE.SphereGeometry(0.034, 6, 5), crownMat, 0, 1.278, 0.108, { parent: g, cast: true });
    addMesh(new THREE.ConeGeometry(0.021, 0.23, 5), beakMat, 0, 1.235, 0.275, { parent: g, cast: true, rotX: Math.PI / 2 });

    g.position.set(at.x, 0, at.z);
    g.rotation.y = at.ry || 0;
    g.scale.setScalar(at.scale || 1);
    return g;
  }

  function buildCritters() {
    // 坐标均落在假山石群空隙、石群之后与灌木外缘的平地上，避开石体、灌木球心与水面
    var cats = [
      { x: 2.0, z: -29.0, ry: 2.35, fur: 0x8f7459, name: '狸奴' },
      { x: -17.4, z: -28.6, ry: 0.55, fur: 0x3a3835, name: '玄猫' },
      { x: -33.0, z: 9.9, ry: -0.9, fur: 0xd8ccb9, name: '雪儿' },
      { x: 28.3, z: 16.4, ry: 2.9, fur: 0x8f7459, name: '小狸' },
      { x: 23.4, z: 5.6, ry: -1.95, fur: 0x6a5c4c, name: '玳瑁' }
    ];
    var cranes = [
      { x: 6.0, z: -30.0, ry: 0.4, name: '霜翎' },
      { x: -18.6, z: -30.2, ry: 2.7, name: '素羽' },
      { x: -34.6, z: 2.6, ry: -1.3, name: '丹顶' },
      { x: 30.6, z: 12.0, ry: 2.5, name: '青皋' }
    ];

    cats.forEach(function (c) {
      var g = buildCat(c);
      c.kind = 'cat';
      c.pos = new THREE.Vector3(c.x, 0, c.z);
      c.lastPoem = -1;
      c.group = g;
      g.userData.critter = c;
      critters.push(c);
      scene.add(g);
    });
    cranes.forEach(function (c) {
      var g = buildCrane(c);
      c.kind = 'crane';
      c.pos = new THREE.Vector3(c.x, 0, c.z);
      c.lastPoem = -1;
      c.group = g;
      g.userData.critter = c;
      critters.push(c);
      scene.add(g);
    });
  }

  /* 诗词卡：点击命中的狸奴/仙鹤，或漫步模式走近它们时，随机抽取一首相关古诗词并淡入显示 */

  function ensurePoemCard() {
    if (poemCardEl) return;
    poemCardEl = document.getElementById('poem-card');
    poemSealEl = document.getElementById('poem-seal');
    poemBodyEl = document.getElementById('poem-body');
    poemSourceEl = document.getElementById('poem-source');
    var closeBtn = document.getElementById('poem-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        hidePoem();
      });
    }
  }

  function showPoem(critter) {
    ensurePoemCard();
    if (!poemCardEl || !critter) return;
    var now = performance.now();
    if (now - lastPoemAt < 1200) return;   // 连点或连续靠近时避免刷屏
    lastPoemAt = now;
    var list = POEMS[critter.kind];
    if (!list || !list.length) return;
    var idx = Math.floor(Math.random() * list.length);
    if (list.length > 1 && idx === critter.lastPoem) {
      idx = (idx + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length; // 同一只动物不连着重复同一首
    }
    critter.lastPoem = idx;
    poemSealEl.textContent = critter.kind === 'cat' ? '猫' : '鹤';
    poemCardEl.setAttribute('data-kind', critter.kind);
    poemBodyEl.textContent = list[idx].text;
    poemSourceEl.textContent = list[idx].source + ' · ' + critter.name;
    poemCardEl.hidden = false;
    window.clearTimeout(poemTimer);
    window.clearTimeout(poemHideTimer);
    window.requestAnimationFrame(function () { poemCardEl.classList.add('is-visible'); });
    poemTimer = window.setTimeout(hidePoem, 8200);
  }

  function hidePoem() {
    if (!poemCardEl) return;
    window.clearTimeout(poemTimer);
    poemCardEl.classList.remove('is-visible');
    poemHideTimer = window.setTimeout(function () { poemCardEl.hidden = true; }, 360);
  }

  function pickCritterAt(clientX, clientY) {
    if (!critters.length || !camera || !canvas) return;
    var ndcX = 0, ndcY = 0;
    // 仅在「漫步模式且已锁定指针」时以准星中心取点；其余情况（含从漫步切回后残留的锁定）一律用真实点击坐标
    var lockedAim = viewMode === 'walk' && document.pointerLockElement === canvas;
    if (!lockedAim) {
      var rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    }
    if (!critterRaycaster) critterRaycaster = new THREE.Raycaster();
    critterRaycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
    // 对整场景取最近命中：只有第一眼看到的是狸奴/仙鹤本体才响应，
    // 被叠石、灌木、荷叶挡住时不触发，与「若隐若现、需走近或换角度才能看见」一致
    var hits = critterRaycaster.intersectObjects(scene.children, true).filter(function (h) {
      return h.object.type !== 'Points' && h.object.visible;
    });
    if (!hits.length) return;
    var node = hits[0].object;
    while (node && !node.userData.critter) node = node.parent;
    if (node && node.userData.critter) showPoem(node.userData.critter);
  }

  // 漫步模式下与狸奴/仙鹤相距 2.5m 内自动触发；触发后 9 秒内不重复弹卡
  function updateCritterProximity() {
    if (viewMode !== 'walk' || !critters.length || !playerPos) return;
    if (performance.now() - lastPoemAt < 9000) return;
    for (var i = 0; i < critters.length; i++) {
      var c = critters[i];
      var dx = playerPos.x - c.pos.x;
      var dz = playerPos.z - c.pos.z;
      if (dx * dx + dz * dz < 6.25) {
        showPoem(c);
        break;
      }
    }
  }

  function buildLotus() {
    var leafMat = new THREE.MeshStandardMaterial({
      color: COL.lotusLeaf, roughness: 0.74, side: THREE.DoubleSide
    });
    var leafGeo = new THREE.CircleGeometry(0.78, 14, 0, Math.PI * 1.76);
    leafGeo.rotateX(-Math.PI / 2);

    // 荷叶与荷花群落中心精准规划：
    // 1. 【红色区域 1】：小飞虹石拱桥南侧开阔水面（z = 7.0 ~ 9.5 纯净水面区）
    // 2. 【红色区域 2】：汀步石西侧月牙水湾（汀步与西岸栅栏之间纯净水面区）
    // 3. 【红色区域 3】：乌篷木船右侧/南侧与直廊之间水面（木船与直廊间水道）
    // 4. 【彻底根治桥头穿模】：将石拱桥落坪石阶、临水石护栏与周围叠石区（x: -16.5 ~ -7.0, z: -1.5 ~ 4.5）设为绝对禁区！
    //    杜绝任何荷叶或花朵进入桥头石阶、扶手与假山石范围！
    var clusterCenters = [
      // 1. 西池中心开阔水域（疏朗点缀，远离任何建筑物）
      { cx: -10.5, cz: 10.5, r: 1.8, count: 5 },
      // 2. 【红色区域 1】：小飞虹石拱桥南侧开阔水面（远离桥体与桥头）
      { cx: -12.5, cz: 8.2, r: 1.6, count: 5 },
      // 3. 【红色区域 2】：汀步石西侧月牙水湾（汀步与西岸栅栏之间水域）
      { cx: -22.0, cz: 11.0, r: 1.8, count: 5 },
      // 4. 【红色区域 3】：乌篷木船与直廊之间水面（木船南侧/右侧开阔水面）
      { cx: -4.8, cz: 15.2, r: 1.5, count: 4 },
      // 5. 西池月牙水湾深处垂柳下（避开拱桥与西岸）
      { cx: -21.5, cz: -0.5, r: 1.4, count: 4 },
      // 6. 东池群落（水亭南侧碧波、东岸绿渚与东溪水面）
      { cx: 8.5, cz: 13.0, r: 3.2, count: 12 },
      { cx: 13.8, cz: 8.0, r: 2.8, count: 10 },
      { cx: 6.0, cz: 4.8, r: 2.6, count: 4 },
      { cx: 16.5, cz: 2.5, r: 2.0, count: 5 },
      { cx: 3.5, cz: 13.5, r: 1.8, count: 4 }
    ];

    var stepPts = [
      [-21.5, 9.5], [-19.5, 10.8], [-17.5, 11.8], [-15.5, 12.5], [-13.5, 13.0]
    ];

    // 高精度全景防穿模与防堆积检测判定
    function isValidLotusPos(x, z, placedArr) {
      // 1. 【核心禁区：拱桥东落坪石阶、转角大石坪、临水护栏与驳岸叠石区】：
      //    范围覆盖 x: -16.5 ~ -7.0, z: -1.5 ~ 4.5，彻底杜绝桥头台阶、栏杆与岩石任何穿模！
      if (x >= -16.5 && x <= -7.0 && z >= -1.5 && z <= 4.5) return false;

      // 2. 直廊平台（x=0，平台半宽 1.2m，附加荷叶半径保护区 2.1m）
      if (Math.abs(x) < 2.1 && z >= -1.0 && z <= 18.0) return false;
      // 3. 主殿汉白玉台座前沿踏步（z < -0.6m 且在主殿面宽范围内）
      if (z < -0.6 && Math.abs(x) < 14.0) return false;
      // 4. 西南亲水码头（x: -15.5 ~ -9.0, z: 12.0 ~ 18.0，带安全外延）
      if (x >= -15.5 && x <= -9.0 && z >= 12.0) return false;
      // 5. 乌篷木船主体（x=-8.2, z=14.8，外延包围盒保护）
      if (Math.hypot(x - (-8.2), z - 14.8) < 2.1) return false;
      if (x >= -9.6 && x <= -6.8 && z >= 12.0 && z <= 17.6) return false;
      // 6. 5 处青石漫水汀步石（严格避开汀步石体）
      for (var s = 0; s < stepPts.length; s++) {
        if (Math.hypot(x - stepPts[s][0], z - stepPts[s][1]) < 1.35) return false;
      }
      // 7. 小飞虹石拱桥桥身全域
      var dx = x - (-20.5);
      var dz = z - 4.0;
      var cosA = Math.cos(-0.45);
      var sinA = Math.sin(-0.45);
      var lx = dx * cosA - dz * sinA;
      var lz = dx * sinA + dz * cosA;
      if (Math.abs(lz) < 2.8 && lx > -6.5 && lx < 9.0) return false;
      // 8. 西岸岸线与木栅栏
      if (x < -24.8) return false;
      // 9. 南面合围墙体边缘
      if (z > 17.4) return false;
      // 10. 水亭荷风四面亭八角台座与栏杆
      if (Math.hypot(x - 8.5, z - 8.5) < 4.2) return false;
      // 11. 直廊通往水亭平桥
      if (x > 1.0 && x < 5.2 && Math.abs(z - 8.5) < 1.4) return false;
      // 12. 亭台北侧九曲平桥
      var bzPts = [[9.8, 0.4], [9.2, 1.8], [8.8, 3.2], [8.5, 4.4]];
      for (var b = 0; b < bzPts.length; b++) {
        if (Math.hypot(x - bzPts[b][0], z - bzPts[b][1]) < 1.4) return false;
      }
      // 13. 防重叠堆积：与已生成荷叶保持至少 0.68m 间距，留出清秀水影
      if (placedArr) {
        for (var p = 0; p < placedArr.length; p++) {
          if (Math.hypot(x - placedArr[p][0], z - placedArr[p][1]) < 0.68) return false;
        }
      }
      return true;
    }

    var totalLeaves = 0;
    clusterCenters.forEach(function (c) { totalLeaves += c.count; });
    var lotusLeaves = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var p = new THREE.Vector3();
    var s = new THREE.Vector3();
    var rnd = makeRandom(68);

    var placedLeaves = [];
    var leafIdx = 0;

    clusterCenters.forEach(function (c) {
      var placedInCluster = 0;
      for (var a = 0; a < c.count * 15 && placedInCluster < c.count; a++) {
        var ang = rnd() * Math.PI * 2;
        var dist = Math.sqrt(rnd()) * c.r;
        var lx = c.cx + Math.cos(ang) * dist;
        var lz = c.cz + Math.sin(ang) * dist;

        if (!isValidLotusPos(lx, lz, placedLeaves)) continue;

        placedLeaves.push([lx, lz]);
        placedInCluster++;

        p.set(lx, WATER_Y + 0.14 + (rnd() - 0.5) * 0.02, lz);
        q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.10, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.10));
        var sc = 0.70 + rnd() * 0.65;
        s.set(sc, 1, sc);
        m.compose(p, q, s);
        lotusLeaves.setMatrixAt(leafIdx++, m);
      }
    });

    lotusLeaves.count = leafIdx;
    lotusLeaves.instanceMatrix.needsUpdate = true;
    scene.add(lotusLeaves);

    // 荷花材质系统：粉荷、白荷、含苞玫瑰芙蕖，疏密相映、别具神采
    var petalPinkMat = new THREE.MeshStandardMaterial({ color: COL.lotusPetal, roughness: 0.58, flatShading: true });
    var petalWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfaf7ee, roughness: 0.55, flatShading: true });
    var petalRoseMat = new THREE.MeshStandardMaterial({ color: 0xeb7b98, roughness: 0.58, flatShading: true });
    var centerMat = new THREE.MeshStandardMaterial({ color: COL.lotusCenter, roughness: 0.5 });
    var stemMat = new THREE.MeshStandardMaterial({ color: 0x486b36, roughness: 0.85 });

    var flowerMats = [petalPinkMat, petalPinkMat, petalWhiteMat, petalRoseMat];

    // 荷花伴生分布：依托荷叶伴生盛放荷花，高低错落
    var flowerRnd = makeRandom(92);
    placedLeaves.forEach(function (leafPt, idx) {
      if (flowerRnd() > 0.52 && idx % 3 !== 0) return;

      var fOffsetAng = flowerRnd() * Math.PI * 2;
      var fOffsetDist = 0.18 + flowerRnd() * 0.28;
      var fx = leafPt[0] + Math.cos(fOffsetAng) * fOffsetDist;
      var fz = leafPt[1] + Math.sin(fOffsetAng) * fOffsetDist;

      if (!isValidLotusPos(fx, fz, null)) return;

      var fg = new THREE.Group();
      var stemH = 0.36 + flowerRnd() * 0.30;
      var curPetalMat = flowerMats[Math.floor(flowerRnd() * flowerMats.length)];

      // 荷梗
      addMesh(new THREE.CylinderGeometry(0.024, 0.024, stemH, 4), stemMat, 0, stemH / 2, 0, { parent: fg });

      // 金黄莲蓬莲心
      addMesh(new THREE.CylinderGeometry(0.12, 0.08, 0.14, 6), centerMat, 0, stemH + 0.05, 0, { parent: fg });

      // 双层花瓣（盛开或含苞）
      var isOpen = flowerRnd() > 0.25;
      var petCount = isOpen ? 8 : 5;
      for (var pet = 0; pet < petCount; pet++) {
        var pa = (pet / petCount) * Math.PI * 2 + (flowerRnd() - 0.5) * 0.3;
        var coneH = isOpen ? (0.42 + flowerRnd() * 0.15) : (0.36 + flowerRnd() * 0.1);
        var rotTilt = isOpen ? (0.40 + flowerRnd() * 0.18) : (0.15 + flowerRnd() * 0.1);
        addMesh(new THREE.ConeGeometry(0.14, coneH, 4), curPetalMat,
          Math.cos(pa) * 0.13, stemH + 0.06, Math.sin(pa) * 0.13,
          { parent: fg, rotZ: Math.cos(pa) * rotTilt, rotX: Math.sin(pa) * rotTilt });
      }

      fg.rotation.y = flowerRnd() * Math.PI * 2;
      fg.rotation.z = (flowerRnd() - 0.5) * 0.10;
      fg.position.set(fx, WATER_Y + 0.14, fz);
      scene.add(fg);
    });
  }

    /* ---------------- 12.5 古典庭院石灯笼系统（傍水随径，黄昏自动点亮） ---------------- */

  function buildStoneLantern(x, y, z, scale) {
    scale = scale || 1.0;
    var g = new THREE.Group();
    var stoneMat = new THREE.MeshStandardMaterial({ map: stoneTexture(), color: 0x9e9b91, roughness: 0.90 });
    snowCoverMats.push(stoneMat);
    applySnowAccumulation(stoneMat, 0.9);
    var roofMat = new THREE.MeshStandardMaterial({ map: roofTexture(), normalMap: roofNormalTexture(), normalScale: new THREE.Vector2(0.85, 0.85), color: 0x444b52, roughness: 0.38, metalness: 0.155 });
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
      [-21.5, 0.08, 5.2, 1.05],  // 小飞虹西桥堍古石径旁
      [23.6, 0.08, -3.2, 0.95],  // 涵青书斋月洞门步道旁
      [-9.8, 0.08, 13.5, 1.0],   // 西南岸曲廊外石径旁

      // 【荷风四面水亭石灯笼】：原水池中3座多余石灯均已移除（绝不在水中），仅留1座立于水亭西南石基边缘（标高1.14m，不设于水中）
      [5.6, 1.14, 7.2, 0.95],

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
      [5.5, 0.36, 7.2, 1.8, 0.12, 0.8],
      [5.8, 0.36, 10.2, 1.6, 0.12, 0.9],
      [11.5, 0.36, 8.5, 1.5, 0.12, 1.0],
      [1.8, 0.36, 8.5, 0.8, 0.10, 1.4],
      [3.8, 0.36, 8.5, 0.8, 0.10, 1.4],
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

    for (var p = 0; p < 50; p++) {
      var px, pz, py;
      var zone = p % 4;
      if (zone === 0) {
        px = -11.0 + (rndPebble() - 0.5) * 4.0;
        pz = 14.5 + (rndPebble() - 0.5) * 3.0;
        py = 0.38;
      } else if (zone === 1) {
        px = -21.0 + (rndPebble() - 0.5) * 3.5;
        pz = 6.0 + (rndPebble() - 0.5) * 4.0;
        py = 0.38;
      } else if (zone === 2) {
        px = 8.8 + (rndPebble() - 0.5) * 2.5;
        pz = 3.5 + (rndPebble() - 0.5) * 2.0;
        py = 0.38;
      } else {
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
        fx = 8.5 + (rndPetal() - 0.5) * 4.0;
        fz = 8.5 + (rndPetal() - 0.5) * 4.0;
        fy = 1.15;
      } else if (fZone === 1) {
        fx = 3.0 + (rndPetal() - 0.5) * 3.0;
        fz = 8.5 + (rndPetal() - 0.5) * 1.4;
        fy = 0.74;
      } else {
        fx = 12.0 + (rndPetal() - 0.5) * 6.0;
        fz = 12.0 + (rndPetal() - 0.5) * 6.0;
        fy = 0.36;
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

    // 南侧边缘青石护栏（低矮雅致栏板，高 0.65m；正门中轴区域留出宽畅通道，避免阻断与悬空冲突）
    for (var bx = -HALF + 2; bx <= HALF - 2; bx += 3.5) {
      if (Math.abs(bx) < 5.5) continue; // 门前主通道留白
      addMesh(new THREE.CylinderGeometry(0.08, 0.09, 0.72, 6), stoneMat, bx, 0.36, CZ + HALF - 0.5, { parent: dioramaGroup, cast: true });
      if (bx < HALF - 2 && Math.abs(bx + 1.75) >= 5.5) {
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

  var FULL_CAM_POS = new THREE.Vector3(-16.0, 11.5, 26.0);   // 当前大小1:1庭院全貌精选机位
  var FULL_TARGET = new THREE.Vector3(0, 2.0, 5.0);          // 庭院核心全景聚焦点

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
    controls.minDistance = 2.0;
    controls.maxDistance = 160.0; // 院墙合围后收紧缩放上限，远观亦不越出院墙之外
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = 1.48;
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    controls.autoRotate = false;
    controls.update();
    window.appCamera = camera;
    window.appScene = scene;
    window.switchViewMode = switchViewMode;
    window.setDioramaScale = setDioramaScale;
    window.appControls = controls;
    window.appSetPlayer = function(x, z, yaw, pitch) { playerPos.x = x; playerPos.z = z; if (yaw !== undefined) playerYaw = yaw; if (pitch !== undefined) playerPitch = pitch || 0; };
  }

  function clampView() {
    if (camera.position.y < 2.0) camera.position.y = 2.0;
    if (controls.target.y < 0.4) controls.target.y = 0.4;
    if (controls.target.y > 15.0) controls.target.y = 15.0;
  }

  /* ---------------- 15.5 漫游交互、第一人称行走与原生过程化声学合成 ---------------- */

  var viewMode = 'god'; // 'god' | 'walk'
  var playerPos = new THREE.Vector3(0, 1.73, 13.5);
  var playerYaw = 0;   // 0 = facing north (-z)
  var playerPitch = -0.05;
  var walkKeys = { forward: false, backward: false, left: false, right: false, sprint: false };
  var stepDistanceAccum = 0;
  var walkBobbing = 0;
  var isDraggingWalk = false;
  var lastDragX = 0;
  var lastDragY = 0;


  // 地面高程判定（包含台阶、踏步、桥梁、走廊、亭榭、石台）
  function getGroundHeight(x, z) {
    // 1. 小飞虹石拱桥（群中心 (-20.5, 4.0)，旋转 0.45 弧度）
    // 采用连续平滑引坡与高阶正弦平滑拱线，上桥、登顶、下桥如履平地，极致丝滑
    var archDx = x - (-20.5);
    var archDz = z - 4.0;
    var cosArch = 0.9004; // Math.cos(-0.45)
    var sinArch = -0.4350; // Math.sin(-0.45)
    var lx = archDx * cosArch - archDz * sinArch;
    var lz = archDx * sinArch + archDz * cosArch;

    if (Math.abs(lz) <= 2.6 && lx >= -7.2 && lx <= 8.8) {
      var bridgeH;
      if (lx < -4.8) {
        // 西侧桥头平缓引坡：从岸线地坪 0.15m / 水面 0.34m 丝滑平缓过渡至桥台 0.74m
        var tWest = THREE.MathUtils.clamp((lx - (-7.2)) / 2.4, 0, 1);
        var sWest = THREE.MathUtils.smoothstep(tWest, 0, 1);
        bridgeH = THREE.MathUtils.lerp(0.25, 0.74, sWest);
      } else if (lx > 5.0) {
        // 东侧桥头平缓石阶引坡：从 0.70m 丝滑降至主屋前地面 0.15m
        var tEast = THREE.MathUtils.clamp((lx - 5.0) / 3.8, 0, 1);
        var sEast = THREE.MathUtils.smoothstep(tEast, 0, 1);
        bridgeH = THREE.MathUtils.lerp(0.70, 0.15, sEast);
      } else {
        // 拱桥主拱段：连续完美的正弦圆拱曲线，最高峰标高 2.36m，曲线平滑无顿挫
        var tArch = (lx - (-4.8)) / 9.8;
        bridgeH = 0.74 + Math.sin(tArch * Math.PI) * 1.62;
      }

      // 横向边缘（栏杆与桥侧）平滑羽化，防止靠近边缘时镜头高度发生悬崖式跌落
      if (Math.abs(lz) > 1.8) {
        var edgeT = THREE.MathUtils.clamp((Math.abs(lz) - 1.8) / 0.8, 0, 1);
        var edgeSmooth = THREE.MathUtils.smoothstep(edgeT, 0, 1);
        return THREE.MathUtils.lerp(bridgeH, 0.34, edgeSmooth);
      }
      return bridgeH;
    }

    // 2. 主殿朝南垂带石阶（自直廊 0.56m 丝滑攀升至主殿月台 1.45m）
    if (Math.abs(x) <= 4.8 && z >= -2.74 && z <= -0.10) {
      var stepRatio = THREE.MathUtils.clamp((-0.10 - z) / 2.64, 0, 1);
      return 0.56 + THREE.MathUtils.smoothstep(stepRatio, 0, 1) * 0.89;
    }

    // 3. 主殿远香堂月台与正厅大门口室内地坪 (1.45m，前沿 z = -2.74，直通大门 z = -4.22 及殿内)
    if (Math.abs(x) < 14.5 && z >= -16.5 && z < -2.74) {
      return 1.45;
    }

    // 4. 南大门门楼台座与门内门外石阶
    if (Math.abs(x) < 7.5 && z >= 17.6 && z <= 22.5) {
      if (z > 20.6) {
        return 0.08 + THREE.MathUtils.smoothstep(THREE.MathUtils.clamp((22.5 - z) / 1.9, 0, 1), 0, 1) * 0.37;
      }
      return 0.45;
    }

    // 5. 中央水上直廊（中轴 x=0，自南端 z=17.8 至北端台阶接榫处 z=-0.15，标高 0.56m）
    if (Math.abs(x) <= 1.5 && z >= -0.20 && z <= 17.8) {
      return 0.56;
    }

    // 6. 走廊至水亭横跨平桥（x: 0.8 ~ 5.2, z=8.5, 标高 0.65m 至 1.14m 丝滑微调衔接）
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

    // 8. 月洞门延伸石阶与九曲青石板平桥（由主殿东台座通向水亭北入口，丝滑斜降）
    if (x >= 7.6 && x <= 11.8 && z >= -2.4 && z <= 5.0) {
      if (z <= 0.6) {
        var tZig = THREE.MathUtils.clamp((z - (-2.4)) / 3.0, 0, 1);
        return THREE.MathUtils.lerp(1.45, 0.65, THREE.MathUtils.smoothstep(tZig, 0, 1));
      }
      return 0.65;
    }

    // 9. 临水石码头（中心 (-12.0, 14.5)）
    if (x >= -14.8 && x <= -9.2 && z >= 12.0 && z <= 18.0) {
      return 0.35;
    }

    // 10. 东书斋卷棚与前台
    if (x >= 21.0 && x <= 34.0 && z >= -13.0 && z <= 1.5) {
      return 0.56;
    }

    // 11. 沿水石汀步
    if (Math.hypot(x - 0.2, z - 4.2) <= 1.2 || Math.hypot(x - (-1.8), z - 4.2) <= 1.2) {
      return 0.35;
    }

    // 12. 整个水池湖面（可在水上自由漫步闲庭踏水，水面标高 0.34m）
    if (x > -18.0 && x < 18.0 && z > -0.5 && z < 18.0) {
      return 0.34;
    }

    // 默认平地地面
    return 0.08;
  }

  // 取消所有空气墙：这片地方的任何地方用户都可以自由走到！
  function canWalk(x, z) {
    // 仅限制在园林外围超宽外框内，防止走出场景虚空
    if (Math.abs(x) > 38.5 || Math.abs(z) > 31.0) {
      return false;
    }
    return true;
  }

  // 取消所有声音：全局静音，零外部音频与声音合成
  var audioCtx = null;
  var waterGainNode = null;
  var waterSourceNode = null;
  var audioInitialized = false;

  function initAudio() {}
  function resumeAudioOnGesture() {}
  function playFootstep() {}
  function updateWaterAudio(posX, posZ) {}

  
  // ---------------- 荷风四面水亭 · 坐垫对弈交互系统 ----------------
  var isSitting = false;
  var sitEyeY = 1.14 + 0.38 + 0.46; // 1.98m 舒适坐姿人眼标高
  var sitSouthPos = new THREE.Vector3(8.5, sitEyeY, 9.22); // 南坐席（面北朝向棋盘）
  var sitNorthPos = new THREE.Vector3(8.5, sitEyeY, 7.78); // 北坐席（面南朝向棋盘）
  var activeSitPos = sitSouthPos;

  function sitDown(seat) {
    if (viewMode !== 'walk') {
      switchViewMode('walk');
    }
    isSitting = true;
    activeSitPos = (seat === 'north') ? sitNorthPos : sitSouthPos;
    // 南坐席面向 -Z（北方棋盘，yaw = 0），北坐席面向 +Z（南方棋盘，yaw = Math.PI）
    playerYaw = (seat === 'north') ? Math.PI : 0;
    playerPitch = -0.46; // 舒适俯角注视棋盘与对弈黑白子
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

    var fwd = (walkKeys.forward ? 1 : 0) - (walkKeys.backward ? 1 : 0);
    var str = (walkKeys.right ? 1 : 0) - (walkKeys.left ? 1 : 0);

    var isMoving = (fwd !== 0 || str !== 0);
    if (isMoving) {
      var len = Math.hypot(fwd, str);
      fwd /= len;
      str /= len;

      var speed = (walkKeys.sprint ? 5.2 : 3.2) * dt;

      var sinY = Math.sin(playerYaw);
      var cosY = Math.cos(playerYaw);

      // 视角朝向：Forward 为 (sinY, -cosY)，Right 为 (cosY, sinY)
      var dx = (sinY * fwd + cosY * str) * speed;
      var dz = (-cosY * fwd + sinY * str) * speed;

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
    // 基于帧时间的高阶平滑指数滤波，上下桥梁、台阶、坡道极致丝滑、毫无顿挫感
    var verticalDamp = 1.0 - Math.exp(-14.0 * Math.min(dt, 0.05));
    playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetEyeY, verticalDamp);

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


  function switchViewMode(newMode) {
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
  }
  function bindRoamingControls() {
    var btnDiorama = document.getElementById('btn-mode-diorama');
    var btnDiorama = document.getElementById('btn-mode-diorama');
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
    }

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
    }

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
    }

    window.addEventListener('keydown', function (e) {
      resumeAudioOnGesture();
      var key = e.key ? e.key.toLowerCase() : '';
      var code = e.code || '';

      var isW = (code === 'KeyW' || key === 'w' || code === 'ArrowUp' || key === 'arrowup');
      var isS = (code === 'KeyS' || key === 's' || code === 'ArrowDown' || key === 'arrowdown');
      var isA = (code === 'KeyA' || key === 'a' || code === 'ArrowLeft' || key === 'arrowleft');
      var isD = (code === 'KeyD' || key === 'd' || code === 'ArrowRight' || key === 'arrowright');

      if (viewMode === 'god') {
        if (isW || isS || isA || isD) {
          switchViewMode('walk');
          if (isW) walkKeys.forward = true;
          if (isS) walkKeys.backward = true;
          if (isA) walkKeys.left = true;
          if (isD) walkKeys.right = true;
          e.preventDefault();
          return;
        }
      }

      if (viewMode === 'walk') {
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

      }
    });

    // 狸奴 / 仙鹤拾取：区分「点选」与「拖拽环视」——按下与抬起位移小于 9px 且间隔小于 800ms 才视为点选
    var critterTapX = 0, critterTapY = 0, critterTapT = 0;
    canvas.addEventListener('pointerdown', function (e) {
      critterTapX = e.clientX;
      critterTapY = e.clientY;
      critterTapT = performance.now();
    }, { passive: true });
    canvas.addEventListener('pointerup', function (e) {
      if (Math.abs(e.clientX - critterTapX) > 9 || Math.abs(e.clientY - critterTapY) > 9) return;
      if (performance.now() - critterTapT > 800) return;
      pickCritterAt(e.clientX, e.clientY);
    }, { passive: true });

    window.addEventListener('mousemove', function (e) {
      if (viewMode === 'walk') {
        if (document.pointerLockElement === canvas) {
          playerYaw += e.movementX * 0.0022;
          playerPitch = clamp(playerPitch - e.movementY * 0.0022, -1.25, 1.25);
        } else if (isDraggingWalk) {
          var dx = e.clientX - lastDragX;
          var dy = e.clientY - lastDragY;
          lastDragX = e.clientX;
          lastDragY = e.clientY;
          playerYaw += dx * 0.0035;
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
        playerYaw += dx * 0.005;
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

  window.setTime = setTime;
  window.setWeather = setWeather;
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
    updateWaterReflection();
    updateScaleAnimation(now);
    if (!isAnimatingScale && viewMode !== "walk") syncDioramaScaleFromCamera();
    applyParams();
    updateWater(elapsedTotal);
    updateVegetation(dt, elapsedTotal);
    updateFish(dt, elapsedTotal);
    updateParticles(dt, elapsedTotal);
    updateCelestial();
    if (viewMode === 'god' || viewMode === 'diorama') {
      controls.update();
      clampView();
    } else if (viewMode === 'walk') {
      updateWalkMode(dt);
    }
    updateCritterProximity();
    if (ssaoEnabled && ssaoRenderTarget && !isMobile) {
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

  
  /* ---------------- 16.8 环境光遮蔽（SSAO 屏幕空间环境光遮蔽系统） ---------------- */
  // 环境光遮蔽默认关闭：该 pass 会在编译期触发 "gradient instruction used in a loop" 警告，
  // 且实测是夜景整体压暗约四成的主因；保留代码与 window.setSSAO(true) 开关，默认不参与合成
  var ssaoEnabled = false;
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
      ].join('\n');

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
        '    ao = clamp(pow((occ / float(SAMPLES)) * aoIntensity, aoPower), 0.0, 0.38);',
        '  }',
        '  vec3 aoTint = vec3(0.06, 0.08, 0.10);',
        '  vec3 result = mix(col.rgb * (1.0 - ao), aoTint, ao * 0.06);',
        // 关键修正：场景先渲染进离屏 RT（线性、已做 ACES 色调映射），此合成 pass 必须再做 sRGB 编码，
        // 否则整幅画面被按线性值直接输出，亮度被人为压掉一档（夜景因此接近全黑）
        '  vec3 srgb = mix(result * 12.92, 1.055 * pow(max(result, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), result));',
        '  gl_FragColor = vec4(srgb, col.a);',
        '}'
      ].join('\n');

      ssaoMaterial = new THREE.ShaderMaterial({
        vertexShader: vertShader,
        fragmentShader: fragShader,
        uniforms: {
          tDiffuse: { value: null },
          tDepth: { value: null },
          projInverse: { value: new THREE.Matrix4() },
          resolution: { value: new THREE.Vector2(w, h) },
          aoRadius: { value: 0.90 },
          aoIntensity: { value: 0.52 },
          aoPower: { value: 1.20 }
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

  
  /* ---------------- 16.9 水面动态倒影与水波着色器系统 ---------------- */
  var waterMirrorCam = null;
  var waterReflectTarget = null;
  var waterNormalTex = null;
  var waterCustomShader = null;

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

    if (waterCustomShader && waterReflectTarget) {
      waterCustomShader.uniforms.uReflectTexture.value = waterReflectTarget.texture;
    }

    var waterPlaneY = WATER_Y;
    waterMirrorCam.position.copy(camera.position);
    waterMirrorCam.position.y = 2.0 * waterPlaneY - camera.position.y;

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

  function createRenderer() {
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
    { label: '严格隔离植万竿修竹、垂柳春桃与荷花水生…', run: function () { buildVegetation(); buildPath(); buildEnvironmentalDetails(); buildDioramaPedestal(); } },
    { label: '于假山石后、竹丛草间藏入狸奴与仙鹤…', run: function () { buildCritters(); } },
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
        window.__stepError = error.stack || String(error); console.error('STEP_ERR:', error); showFallback('水乡场景生成过程中出现异常，页面已停止渲染，但不会白屏。');
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
    scene.fog = new THREE.FogExp2(0xcfe4f5, 0.0034);
    var stageEl = document.getElementById('stage');
    initWaterReflector();
    initSSAO(stageEl ? stageEl.clientWidth : 1280, stageEl ? stageEl.clientHeight : 720);
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
