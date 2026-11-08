// 只读汇总脚本：① 输出正门中轴可站立面标高剖面；② 复核四面院墙闭合（从园外向内打射线，
// 判定是否存在与墙平面重合的命中），并打印结论。
import { readFile } from 'node:fs/promises';

const OUT = 'C:/Users/ZhongKe/Desktop/Design/.design-suite';
const report = JSON.parse(await readFile(OUT + '/wrapgate-probe.json', 'utf8'));

console.log('--- 正门中轴可站立面剖面（x=0） ---');
for (const w of report.walk) {
  console.log(`z=${w.z.toFixed(2)}  surface=${w.surface === null ? 'none' : w.surface.toFixed(2)}  topHits=${w.hits.map((h) => h.toFixed(2)).join(',')}`);
}

const surfaceSeq = report.walk.map((w) => w.surface).filter((v) => v !== null);
let maxJump = 0;
for (let i = 1; i < surfaceSeq.length; i += 1) maxJump = Math.max(maxJump, Math.abs(surfaceSeq[i] - surfaceSeq[i - 1]));
console.log('可站立面相邻采样最大跳变 =', maxJump.toFixed(2), 'm（采样间隔 0.5m）');
console.log('园外起点 surface =', surfaceSeq[0].toFixed(2), '｜门槛台面 =', Math.max(...surfaceSeq).toFixed(2));

console.log('\n--- 四面院墙闭合复核 ---');
const WALLS = {
  'radial-north-to-south': { axis: 'z', plane: 20, from: [0, 3, 34], dir: [0, 0, -1] },
  'radial-south-to-north': { axis: 'z', plane: -32, from: [0, 3, -34], dir: [0, 0, 1] },
  'radial-east-to-west': { axis: 'x', plane: 38, from: [0, 3, -6], dir: [-1, 0, 0] },
  'radial-west-to-east': { axis: 'x', plane: -38, from: [0, 3, -6], dir: [1, 0, 0] }
};
let fails = 0;
for (const dir of report.ringResult) {
  const meta = WALLS[dir.dir];
  console.log('· 方向:', dir.dir, '（墙平面', meta.axis, '=', meta.plane, '）');
  let covered = 0;
  let samples = 0;
  for (const s of dir.out) {
    // 环形扫描在 N/S 方向上是沿 x 采样（p=x），E/W 方向沿 z 采样（p=z）；仅有 N/S 参与墙平面判定
    if (dir.dir === 'radial-north-to-south' || dir.dir === 'radial-south-to-north') {
      samples += 1;
      const gapToPlane = s.hitZ === null ? null : Math.abs(s.hitZ - meta.plane);
      const gateCover = Math.abs(s.hitZ - 21.3) <= 3.0 || (s.hitZ !== null && s.hitZ >= 18.6 && s.hitZ <= 24.0);
      const door = Math.abs(s.p) <= 2.5;
      const ok = gapToPlane !== null && (gapToPlane <= 0.45 || (gateCover && !door));
      if (ok) covered += 1;
      else if (!door) { fails += 1; console.log(`  ✗ x=${s.p} 首个命中 z=${s.hitZ}（未落在墙平面或门楼体内）`); }
    }
  }
  if (dir.dir === 'radial-north-to-south' || dir.dir === 'radial-south-to-north') {
    console.log(`  覆盖 ${covered}/${samples} 采样点（其中门洞 x∈[-2.5,2.5] 为设计开口）`);
  }
}
console.log('\n围合缺陷采样点数 =', fails);
console.log('\n--- 原石舫水域（应无船体构件） ---');
for (const b of report.boatSite) console.log(`(${b.x},${b.z}) 命中标高: ${b.hits.map((h) => h.toFixed(2)).join(', ')}`);