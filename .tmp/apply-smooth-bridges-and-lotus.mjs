import fs from 'fs';

let content = fs.readFileSync('src/app.js', 'utf8');

// 1. Replace getGroundHeight with silky smooth bridge slopes
const idxGetGroundStart = content.indexOf('  function getGroundHeight(x, z) {');
const idxGetGroundEnd = content.indexOf('  // 取消所有空气墙');

if (idxGetGroundStart === -1 || idxGetGroundEnd === -1) {
  console.error("Failed to find getGroundHeight indices!", idxGetGroundStart, idxGetGroundEnd);
  process.exit(1);
}

const newGetGround = `  function getGroundHeight(x, z) {
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

    // 6. 走廊至水亭横跨平桥（x: 0.8 ~ 5.2, z=8.5, 标高 0.65m，与长廊及水亭丝滑微调衔接）
    if (x >= 0.8 && x <= 5.2 && Math.abs(z - 8.5) <= 1.4) {
      var bHeight = 0.65;
      if (x < 1.8) {
        var tCorr = (x - 0.8) / 1.0;
        bHeight = THREE.MathUtils.lerp(0.56, 0.65, THREE.MathUtils.smoothstep(tCorr, 0, 1));
      }
      if (Math.abs(z - 8.5) > 1.0) {
        var tBEdge = (Math.abs(z - 8.5) - 1.0) / 0.4;
        return THREE.MathUtils.lerp(bHeight, 0.34, THREE.MathUtils.smoothstep(tBEdge, 0, 1));
      }
      return bHeight;
    }

    // 7. 荷风四面水亭（中心 (8.5, 8.5)，半径 4.2m，标高 0.65m）
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) {
      return 0.65;
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

`;

content = content.slice(0, idxGetGroundStart) + newGetGround + content.slice(idxGetGroundEnd);
console.log("1. getGroundHeight updated with smooth bridges.");

// 2. Update updateWalkMode vertical lerp for silky smooth elevation
const oldLerp = `var targetEyeY = getGroundHeight(playerPos.x, playerPos.z) + 1.65;\r\n    playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetEyeY, 0.22);`;
const oldLerpUnix = `var targetEyeY = getGroundHeight(playerPos.x, playerPos.z) + 1.65;\n    playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetEyeY, 0.22);`;

const newLerp = `var targetEyeY = getGroundHeight(playerPos.x, playerPos.z) + 1.65;
    // 基于帧时间的高阶平滑指数滤波，上下桥梁、台阶、坡道极致丝滑、毫无顿挫感
    var verticalDamp = 1.0 - Math.exp(-14.0 * Math.min(dt, 0.05));
    playerPos.y = THREE.MathUtils.lerp(playerPos.y, targetEyeY, verticalDamp);`;

if (content.includes(oldLerp)) {
  content = content.replace(oldLerp, newLerp);
  console.log("2. updateWalkMode vertical lerp updated (crlf).");
} else if (content.includes(oldLerpUnix)) {
  content = content.replace(oldLerpUnix, newLerp);
  console.log("2. updateWalkMode vertical lerp updated (unix).");
} else {
  console.warn("Could not find oldLerp pattern!");
}

// 3. Update buildLotus(): fix boat-side distribution, spread across entire lake, and add abundant lotus flowers
const idxLotusStart = content.indexOf('  function buildLotus() {');
const idxLotusEnd = content.indexOf('  /* ---------------- 12.5');

if (idxLotusStart === -1 || idxLotusEnd === -1) {
  console.error("Failed to find buildLotus indices!", idxLotusStart, idxLotusEnd);
  process.exit(1);
}

const newLotus = `  function buildLotus() {
    var leafMat = new THREE.MeshStandardMaterial({
      color: COL.lotusLeaf, roughness: 0.74, side: THREE.DoubleSide
    });
    var leafGeo = new THREE.CircleGeometry(0.78, 14, 0, Math.PI * 1.76);
    leafGeo.rotateX(-Math.PI / 2);

    // 荷叶与荷花群落中心规划：
    // 重点分散小船那一侧（西池）的水面荷叶，避开主屋扎堆，自然散布于小船周围水湾、西岸垂柳下以及全园各个水域
    var clusterCenters = [
      // 西池（小船一侧）：自然疏密分布，从小船旁延伸至西岸垂柳水湾，绝不全挤在主屋前
      { cx: -8.0, cz: 11.5, r: 3.8, count: 18 },  // 小船北侧开阔水面
      { cx: -12.5, cz: 8.5, r: 3.5, count: 16 },  // 小船西侧近岸石矶与水湾
      { cx: -13.0, cz: 14.5, r: 2.8, count: 10 }, // 码头与小船南侧近岸
      { cx: -9.5, cz: 3.5, r: 3.2, count: 12 },   // 西池通往小飞虹拱桥南侧水域
      // 东池（水亭一侧）：环水榭与东绿渚
      { cx: 8.5, cz: 12.5, r: 4.2, count: 18 },   // 水亭南侧碧波水面
      { cx: 13.5, cz: 7.5, r: 3.8, count: 16 },   // 东岸芦苇与石矶旁
      { cx: 5.5, cz: 5.2, r: 3.2, count: 14 },    // 直廊与水亭之间水面
      // 南北开阔水域自然点缀
      { cx: -4.5, cz: 7.5, r: 2.8, count: 10 },   // 直廊西侧中段水面
      { cx: 0.0, cz: 3.5, r: 2.5, count: 8 }      // 主屋前方适量散布（少量点缀，不再密集扎堆）
    ];

    var totalLeaves = 0;
    clusterCenters.forEach(function (c) { totalLeaves += c.count; });
    var lotusLeaves = new THREE.InstancedMesh(leafGeo, leafMat, totalLeaves);
    var m = new THREE.Matrix4();
    var q = new THREE.Quaternion();
    var p = new THREE.Vector3();
    var s = new THREE.Vector3();
    var rnd = makeRandom(68);

    var leafIdx = 0;
    clusterCenters.forEach(function (c) {
      for (var k = 0; k < c.count; k++) {
        var ang = rnd() * Math.PI * 2;
        var dist = Math.sqrt(rnd()) * c.r;
        var lx = c.cx + Math.cos(ang) * dist + (rnd() - 0.5) * 0.8;
        var lz = c.cz + Math.sin(ang) * dist + (rnd() - 0.5) * 0.8;

        // 精准避让直廊地面
        if (Math.abs(lx) < 1.4 && lz >= -0.15 && lz <= 17.8) continue;
        // 避让小船船舱主体（小船位于 x=-8.2, z=14.8）
        if (Math.hypot(lx - (-8.2), lz - 14.8) < 1.8) continue;
        // 避让水亭台座
        if (Math.hypot(lx - 8.5, lz - 8.5) < 3.8) continue;
        // 避让小飞虹石拱桥桥面
        var archDx = lx - (-20.5); var archDz = lz - 4.0;
        var alx = archDx * 0.9004 - archDz * -0.4350;
        var alz = archDx * -0.4350 + archDz * 0.9004;
        if (Math.abs(alz) < 2.0 && alx > -5.5 && alx < 7.5) continue;
        // 避让直廊通往水亭的平桥
        if (lx > 1.0 && lx < 4.8 && Math.abs(lz - 8.5) < 1.0) continue;

        p.set(lx, WATER_Y + 0.14 + rnd() * 0.035, lz);
        q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.12, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.12));
        var sc = 0.65 + rnd() * 0.75;
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

    // 全池增加丰富荷花（荷花总数增加至 42 朵，均匀分布于小船侧、水亭侧及全池各群落）
    var flowerRnd = makeRandom(92);
    var flowersPerCluster = [5, 5, 4, 4, 6, 6, 5, 4, 3];

    clusterCenters.forEach(function (c, cIdx) {
      var numF = flowersPerCluster[cIdx] || 4;
      for (var f = 0; f < numF; f++) {
        var fang = flowerRnd() * Math.PI * 2;
        var fdist = Math.sqrt(flowerRnd()) * (c.r * 0.95);
        var fx = c.cx + Math.cos(fang) * fdist + (flowerRnd() - 0.5) * 0.6;
        var fz = c.cz + Math.sin(fang) * fdist + (flowerRnd() - 0.5) * 0.6;

        // 避让建筑物结构
        if (Math.abs(fx) < 1.4 && fz >= -0.15 && fz <= 17.8) continue;
        if (Math.hypot(fx - (-8.2), fz - 14.8) < 1.8) continue;
        if (Math.hypot(fx - 8.5, fz - 8.5) < 3.8) continue;
        var f_archDx = fx - (-20.5); var f_archDz = fz - 4.0;
        var f_alx = f_archDx * 0.9004 - f_archDz * -0.4350;
        var f_alz = f_archDx * -0.4350 + f_archDz * 0.9004;
        if (Math.abs(f_alz) < 2.0 && f_alx > -5.5 && f_alx < 7.5) continue;
        if (fx > 1.0 && fx < 4.8 && Math.abs(fz - 8.5) < 1.0) continue;

        var fg = new THREE.Group();
        var stemH = 0.35 + flowerRnd() * 0.32; // 高出水面婷婷玉立
        var curPetalMat = flowerMats[Math.floor(flowerRnd() * flowerMats.length)];

        // 荷梗
        addMesh(new THREE.CylinderGeometry(0.025, 0.025, stemH, 4), stemMat, 0, stemH / 2, 0, { parent: fg });

        // 金黄莲蓬莲心
        addMesh(new THREE.CylinderGeometry(0.12, 0.08, 0.14, 6), centerMat, 0, stemH + 0.05, 0, { parent: fg });

        // 双层花瓣（外层盛开，内层挺立，或者含苞待放）
        var isOpen = flowerRnd() > 0.22;
        var petCount = isOpen ? 8 : 5;
        for (var pet = 0; pet < petCount; pet++) {
          var pa = (pet / petCount) * Math.PI * 2 + (flowerRnd() - 0.5) * 0.3;
          var coneH = isOpen ? (0.42 + flowerRnd() * 0.15) : (0.36 + flowerRnd() * 0.1);
          var rotTilt = isOpen ? (0.40 + flowerRnd() * 0.18) : (0.15 + flowerRnd() * 0.1);
          addMesh(new THREE.ConeGeometry(0.14, coneH, 4), curPetalMat,
            Math.cos(pa) * 0.13, stemH + 0.06, Math.sin(pa) * 0.13,
            { parent: fg, rotZ: Math.cos(pa) * rotTilt, rotX: Math.sin(pa) * rotTilt });
        }

        // 适度微调随机朝向
        fg.rotation.y = flowerRnd() * Math.PI * 2;
        fg.rotation.z = (flowerRnd() - 0.5) * 0.10;
        fg.position.set(fx, WATER_Y + 0.14, fz);
        scene.add(fg);
      }
    });
  }

`;

content = content.slice(0, idxLotusStart) + newLotus + content.slice(idxLotusEnd);
console.log("3. buildLotus updated with realistic cluster distribution and abundant flowers.");

fs.writeFileSync('src/app.js', content, 'utf8');
console.log("src/app.js updated successfully.");
