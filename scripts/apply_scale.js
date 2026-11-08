const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

const sIdx = code.indexOf('    // =========================================================================\n    // 花窗雕刻 1：南墙');
const eIdx = code.indexOf('scene.add(eastGroup);', sIdx);

if (sIdx === -1 || eIdx === -1) {
  console.error('Cannot locate markers: sIdx=' + sIdx + ', eIdx=' + eIdx);
  process.exit(1);
}

const eFullIdx = eIdx + 'scene.add(eastGroup);'.length;

const newBlock = `    // =========================================================================
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
    scene.add(eastGroup);`;

code = code.substring(0, sIdx) + newBlock + code.substring(eFullIdx);
fs.writeFileSync('src/app.js', code, 'utf8');
console.log('Successfully updated src/app.js to 1.5x windows!');
