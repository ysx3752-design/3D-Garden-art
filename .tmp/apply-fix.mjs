import fs from 'fs';

let content = fs.readFileSync('src/app.js', 'utf8');

// 1. Replace from 'var tourPoints = [' to '  // Web Audio'
const idxTour = content.indexOf('  var tourPoints = [');
const idxAudio = content.indexOf('  // Web Audio');

if (idxTour === -1 || idxAudio === -1 || idxTour >= idxAudio) {
  console.error("Index matching failed:", idxTour, idxAudio);
  process.exit(1);
}

const tourAndNavNew = `  var tourPoints = [
    new THREE.Vector3(0, 2.2, 18.2),     // 1. 南大门正门石阶，仰望三开间重檐门楼
    new THREE.Vector3(0, 2.25, 12.5),    // 2. 漫步中央水上长廊，望两岸池水荷花
    new THREE.Vector3(3.2, 2.35, 8.5),   // 3. 步入走廊横跨平桥，迎微风走向荷风四面水亭
    new THREE.Vector3(8.5, 2.35, 8.5),   // 4. 驻足湖心水榭亭内，环顾碧波池水与八角宫灯
    new THREE.Vector3(8.8, 2.35, 3.2),   // 5. 穿出水亭，漫步水上九曲青石板平桥
    new THREE.Vector3(10.5, 2.9, -1.8),  // 6. 拾级而上主殿东侧月洞门石阶
    new THREE.Vector3(6.0, 3.1, -4.2),   // 7. 漫步主殿远香堂月台东侧，观莲花石雕栏杆
    new THREE.Vector3(-6.0, 3.1, -4.2),  // 8. 走过主殿正门月台，俯瞰全池盛景
    new THREE.Vector3(-14.5, 2.4, 0.5),  // 9. 经主殿西侧绿渚，迎向小飞虹石拱桥
    new THREE.Vector3(-20.5, 3.9, 4.0),  // 10. 登上小飞虹拱桥顶峰，俯览西池清流与回廊
    new THREE.Vector3(-12.0, 2.1, 14.5), // 11. 经水码头与临水石矶，回眺荷塘
    new THREE.Vector3(0, 2.2, 18.2)      // 12. 平滑闭合回到南大门
  ];

  // 地面高程判定（包含台阶、踏步、桥梁、走廊、亭榭、石台）
  function getGroundHeight(x, z) {
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

    // 2. 主殿远香堂台座与室内地坪 (1.45m)
    if (Math.abs(x) < 14.5 && z >= -16.5 && z <= -0.1) {
      return 1.45;
    }
    // 主殿朝南垂带台阶（自廊面 0.56m 升至台座 1.35m）
    if (Math.abs(x) < 5.0 && z >= -0.2 && z <= 0.8) {
      var stepRatio = (0.8 - z) / 1.0;
      return 0.56 + Math.max(0, Math.min(1.0, stepRatio)) * 0.89;
    }

    // 3. 南大门门楼台座与门内门外石阶
    if (Math.abs(x) < 7.5 && z >= 17.6 && z <= 22.5) {
      if (z > 20.6) {
        return 0.08 + Math.max(0, Math.min(1.0, (22.5 - z) / 1.9)) * 0.37;
      }
      return 0.45;
    }

    // 4. 水上中央直廊（中轴 x=0，自南端 z=17.6 至北端 z=-0.10，标高 0.56m）
    if (Math.abs(x) <= 1.4 && z >= -0.2 && z <= 17.8) {
      return 0.56;
    }

    // 5. 走廊至水亭横跨平桥（x: 1.0 ~ 5.2, z=8.5, 标高 0.65m）
    if (x >= 1.0 && x <= 5.2 && Math.abs(z - 8.5) <= 1.2) {
      return 0.65;
    }

    // 6. 荷风四面水亭（中心 (8.5, 8.5)，半径 4.2m，标高 0.65m）
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) {
      return 0.65;
    }

    // 7. 月洞门延伸石阶与九曲青石板平桥（由主殿东台座通向水亭北入口）
    if (x >= 7.8 && x <= 11.5 && z >= -2.2 && z <= 4.8) {
      if (z <= 0.4) {
        var tStep = (z - (-2.2)) / 2.6;
        return 1.35 - tStep * 0.70;
      }
      return 0.65;
    }

    // 8. 临水石码头（中心 (-12.0, 14.5)）
    if (x >= -14.8 && x <= -9.2 && z >= 12.0 && z <= 18.0) {
      return 0.35;
    }

    // 9. 东书斋卷棚与前台
    if (x >= 21.0 && x <= 34.0 && z >= -13.0 && z <= 1.5) {
      return 0.56;
    }

    // 10. 沿水石汀步
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

    // 2. 中央水上直廊
    if (Math.abs(x) <= 1.4 && z >= -0.2 && z <= 17.8) return true;

    // 3. 走廊至水亭横跨平桥
    if (x >= 1.0 && x <= 5.2 && Math.abs(z - 8.5) <= 1.2) return true;

    // 4. 荷风四面水亭
    if (Math.hypot(x - 8.5, z - 8.5) <= 4.2) return true;

    // 5. 月洞门石阶与九曲平桥
    if (x >= 7.8 && x <= 11.5 && z >= -2.2 && z <= 4.8) return true;

    // 6. 临水石码头
    if (x >= -14.8 && x <= -9.2 && z >= 12.0 && z <= 18.0) return true;

    // 7. 沿水石汀步
    if (Math.hypot(x - 0.2, z - 4.2) <= 1.2 || Math.hypot(x - (-1.8), z - 4.2) <= 1.2) return true;

    // 湖面开阔深水区阻挡（排除上述水上走廊、桥梁、水亭、码头后的池水）
    var inLake = (x > -17.5 && x < 17.5 && z > -1.2 && z < 18.2);
    if (inLake) {
      return false;
    }
    return true;
  }\r\n\r\n`;

content = content.slice(0, idxTour) + tourAndNavNew + content.slice(idxAudio);
console.log("1. Replaced tour and navigation collision logic successfully.");

// 2. Replace updateWalkMode movement calculation
const idxWalkStart = content.indexOf('  function updateWalkMode(dt) {');
const idxWalkNext = content.indexOf('      var nextX = playerPos.x + dx;');

if (idxWalkStart === -1 || idxWalkNext === -1) {
  console.error("updateWalkMode matching failed:", idxWalkStart, idxWalkNext);
  process.exit(1);
}

const walkNew = `  function updateWalkMode(dt) {
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
      var dz = (-cosY * fwd + sinY * str) * speed;\r\n\r\n`;

content = content.slice(0, idxWalkStart) + walkNew + content.slice(idxWalkNext);
console.log("2. Replaced updateWalkMode movement calculation successfully.");

// 3. Fix mouse yaw signs in mousemove and touchmove
const mouseOld = `playerYaw -= e.movementX * 0.0022;`;
const mouseNew = `playerYaw += e.movementX * 0.0022;`;
if (!content.includes(mouseOld)) {
  console.error("mouseOld not found!");
  process.exit(1);
}
content = content.replace(mouseOld, mouseNew);

const dragOld = `playerYaw -= dx * 0.0035;`;
const dragNew = `playerYaw += dx * 0.0035;`;
if (!content.includes(dragOld)) {
  console.error("dragOld not found!");
  process.exit(1);
}
content = content.replace(dragOld, dragNew);

const touchOld = `playerYaw -= dx * 0.005;`;
const touchNew = `playerYaw += dx * 0.005;`;
if (!content.includes(touchOld)) {
  console.error("touchOld not found!");
  process.exit(1);
}
content = content.replace(touchOld, touchNew);
console.log("3. Replaced mouse and touch yaw sign successfully.");

fs.writeFileSync('src/app.js', content, 'utf8');
console.log("src/app.js updated successfully.");
