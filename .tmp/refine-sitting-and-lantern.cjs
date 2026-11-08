const fs = require('fs');

let code = fs.readFileSync('src/app.js', 'utf8');

// 1. Update lantern position
code = code.replace(/\[6\.1,\s*1\.14,\s*11\.0,\s*0\.92\]/, '[5.6, 1.14, 7.2, 0.95]');

// 2. Update sitSouthPos, sitNorthPos, sitEyeY, playerYaw, playerPitch
const oldSitVars = `var isSitting = false;
  var sitEyeY = 1.14 + 0.38 + 0.60; // 2.12m 坐姿人眼标高
  var sitSouthPos = new THREE.Vector3(8.5, sitEyeY, 9.35); // 南坐席（面北朝向棋盘）
  var sitNorthPos = new THREE.Vector3(8.5, sitEyeY, 7.65); // 北坐席（面南朝向棋盘）
  var activeSitPos = sitSouthPos;

  function sitDown(seat) {
    if (viewMode !== 'walk') {
      switchViewMode('walk');
    }
    isSitting = true;
    activeSitPos = (seat === 'north') ? sitNorthPos : sitSouthPos;
    playerYaw = (seat === 'north') ? 0 : Math.PI; // 正对棋盘
    playerPitch = -0.36; // 俯角注视棋盘`;

const newSitVars = `var isSitting = false;
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
    playerPitch = -0.46; // 舒适俯角注视棋盘与对弈黑白子`;

if (code.includes(oldSitVars)) {
  code = code.replace(oldSitVars, newSitVars);
  console.log('Sitting variables updated successfully');
} else {
  // Try regex replace
  const regex = /var isSitting = false;[\s\S]*?playerPitch = -0\.36;[^\n]*/;
  if (regex.test(code)) {
    code = code.replace(regex, newSitVars);
    console.log('Sitting variables replaced via regex');
  } else {
    console.error('Failed to find sitting variables');
    process.exit(1);
  }
}

fs.writeFileSync('src/app.js', code, 'utf8');
console.log('src/app.js refined');
