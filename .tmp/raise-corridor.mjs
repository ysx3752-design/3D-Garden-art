import fs from 'fs';

let content = fs.readFileSync('src/app.js', 'utf8');

// 1. Update buildCoveredCorridor: colH from 2.0 to 3.35, width 2.6, roofY etc.
const idxCorridorStart = content.indexOf('  function buildCoveredCorridor() {');
const idxCorridorEnd = content.indexOf('  // 8. 桥梁系统');

if (idxCorridorStart === -1 || idxCorridorEnd === -1) {
  console.error("Failed to find buildCoveredCorridor indices!");
  process.exit(1);
}

const corridorNew = `  function buildCoveredCorridor() {
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

`;

content = content.slice(0, idxCorridorStart) + corridorNew + content.slice(idxCorridorEnd);
console.log("1. buildCoveredCorridor updated.");

// 2. Update getGroundHeight and canWalk
const idxGetGround = content.indexOf('  function getGroundHeight(x, z) {');
const idxEndCanWalk = content.indexOf('  // Web Audio 原生实时声学合成');

if (idxGetGround === -1 || idxEndCanWalk === -1) {
  console.error("Failed to find getGroundHeight / canWalk indices!");
  process.exit(1);
}

const navNew = `  function getGroundHeight(x, z) {
    // 1. 小飞虹石拱桥（群中心 (-20.5, 4.0)，旋转 0.45 弧度）
    var archDx = x - (-20.5);
    var archDz = z - 4.0;
    var cosArch = 0.9004; // Math.cos(-0.45)
    var sinArch = -0.4350; // Math.sin(-0.45)
    var lx = archDx * cosArch - archDz * sinArch;
    var lz = archDx * sinArch + archDz * cosArch;
    if (Math.abs(lz) <= 2.0 && lx >= -5.7 && lx <= 7.8) {
      if (lx < -4.8) return 0.74;
      if (lx > 5.0) return 0.70 - ((lx - 5.0) / 2.8) * 0.45;
      var archT = (lx + 5.5) / 11.0;
      return 0.78 + Math.sin(archT * Math.PI) * 1.58;
    }

    // 2. 主殿朝南垂带石阶（自直廊 0.56m 平缓攀升至主殿月台 1.45m，踏步宽 9m）
    if (Math.abs(x) <= 4.8 && z >= -2.74 && z <= -0.10) {
      var stepRatio = (-0.10 - z) / 2.64;
      return 0.56 + Math.max(0, Math.min(1.0, stepRatio)) * 0.89;
    }

    // 3. 主殿远香堂月台与正厅大门口室内地坪 (1.45m，前沿 z = -2.74，直通大门 z = -4.22 及殿内)
    if (Math.abs(x) < 14.5 && z >= -16.5 && z < -2.74) {
      return 1.45;
    }

    // 4. 南大门门楼台座与门内门外石阶
    if (Math.abs(x) < 7.5 && z >= 17.6 && z <= 22.5) {
      if (z > 20.6) {
        return 0.08 + Math.max(0, Math.min(1.0, (22.5 - z) / 1.9)) * 0.37;
      }
      return 0.45;
    }

    // 5. 中央水上直廊（中轴 x=0，自南端 z=17.8 至北端台阶接榫处 z=-0.15，标高 0.56m）
    if (Math.abs(x) <= 1.5 && z >= -0.20 && z <= 17.8) {
      return 0.56;
    }

    // 6. 走廊至水亭横跨平桥（x: 1.0 ~ 5.2, z=8.5, 标高 0.65m）
    if (x >= 1.0 && x <= 5.2 && Math.abs(z - 8.5) <= 1.2) {
      return 0.65;
    }

    // 7. 荷风四面水亭（中心 (8.5, 8.5)，半径 4.2m，标高 0.65m）
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) {
      return 0.65;
    }

    // 8. 月洞门延伸石阶与九曲青石板平桥（由主殿东台座通向水亭北入口）
    if (x >= 7.8 && x <= 11.5 && z >= -2.2 && z <= 4.8) {
      if (z <= 0.4) {
        var tStep = (z - (-2.2)) / 2.6;
        return 1.35 - tStep * 0.70;
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

    // 默认平地地坪
    return 0.08;
  }

  // 判定是否允许通行（围墙阻隔、开阔深水区阻隔；桥梁、走廊、水榭、石径畅通无阻）
  function canWalk(x, z) {
    if (x < -36.5 || x > 36.5 || z < -30.5 || z > 21.5) return false;

    // 1. 小飞虹石拱桥（西侧跨水拱桥）
    var archDx = x - (-20.5);
    var archDz = z - 4.0;
    var cosArch = 0.9004;
    var sinArch = -0.4350;
    var lx = archDx * cosArch - archDz * sinArch;
    var lz = archDx * sinArch + archDz * cosArch;
    if (Math.abs(lz) <= 2.0 && lx >= -5.7 && lx <= 7.8) return true;

    // 2. 主殿朝南垂带石阶与主殿月台（直通主殿大门口）
    if (Math.abs(x) <= 4.8 && z >= -2.74 && z <= -0.10) return true;
    if (Math.abs(x) <= 14.2 && z >= -16.5 && z < -2.74) return true;

    // 3. 中央水上直廊（贯穿南北池面，北接主殿台阶，南接南大门）
    if (Math.abs(x) <= 1.5 && z >= -0.20 && z <= 17.8) return true;

    // 4. 走廊至水亭横跨平桥
    if (x >= 1.0 && x <= 5.2 && Math.abs(z - 8.5) <= 1.2) return true;

    // 5. 荷风四面水亭
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) return true;

    // 6. 月洞门石阶与九曲平桥
    if (x >= 7.8 && x <= 11.5 && z >= -2.2 && z <= 4.8) return true;

    // 7. 临水石码头
    if (x >= -14.8 && x <= -9.2 && z >= 12.0 && z <= 18.0) return true;

    // 8. 沿水石汀步
    if (Math.hypot(x - 0.2, z - 4.2) <= 1.2 || Math.hypot(x - (-1.8), z - 4.2) <= 1.2) return true;

    // 湖面开阔深水区阻挡（排除上述走廊、台阶、月台、桥梁、水亭、码头后的池水）
    var inLake = (x > -17.5 && x < 17.5 && z > -0.10 && z < 17.6);
    if (inLake) {
      return false;
    }
    return true;
  }

`;

content = content.slice(0, idxGetGround) + navNew + content.slice(idxEndCanWalk);
console.log("2. getGroundHeight and canWalk updated.");

fs.writeFileSync('src/app.js', content, 'utf8');
console.log("src/app.js updated successfully.");
