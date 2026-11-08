// 只读构图审计（不依赖人眼）：在最终产物上核对默认视角的「水面在前景 / 主建筑居中 / HUD 不遮挡主建筑」。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const OUT = 'C:/Users/ZhongKe/Desktop/Design/.design-suite';
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(OUT + '/verify-gate.html')); }
  catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8783, '127.0.0.1', r));
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-comp-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
const evaluate = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval failed');
  return r?.result?.value;
};
await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8783/verify-gate.html' });
for (let i = 0; i < 200; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(700);

const cam = await evaluate('window.__dbgInfo()');

const classify = (hits) => {
  if (!hits.length) return 'sky';
  const y = hits[0].y;
  if (y <= 0.05) return 'ground';
  if (y < 0.5) return 'water';
  if (y < 1.3) return 'paving';
  if (y < 3.2) return 'rail/low';
  if (y < 9.5) return 'building/tree';
  return 'tall';
};
const rows = [];
for (let ny = 0.95; ny >= -0.95; ny -= 0.15) {
  const row = [];
  for (let nx = -0.9; nx <= 0.91; nx += 0.15) {
    const hits = await evaluate(`window.__dbgPick(${nx.toFixed(2)}, ${ny.toFixed(2)})`);
    row.push({ nx: +nx.toFixed(2), kind: classify(hits), top: hits[0] ? hits[0].y : null, z: hits[0] ? hits[0].z : null });
  }
  rows.push({ ny: +ny.toFixed(2), row });
}
const lower = rows.filter((r) => r.ny <= -0.35);
let lowTotal = 0; let lowWater = 0; let lowSky = 0;
lower.forEach((r) => r.row.forEach((c) => { lowTotal += 1; if (c.kind === 'water') lowWater += 1; if (c.kind === 'sky') lowSky += 1; }));
const midRow = rows.reduce((a, r) => (Math.abs(r.ny) < Math.abs(a.ny) ? r : a), rows[0]);
const midRowKinds = midRow.row.map((c) => `${c.nx}:${c.kind}`).join(' ');

// 主屋投影包围盒 vs HUD 矩形
const pts = [];
for (const x of [-14, 14]) for (const y of [0, 9.2]) for (const z of [-17.5, -2.5]) pts.push(await evaluate(`window.__dbgProj(${x}, ${y}, ${z})`));
const hallCenter = await evaluate('window.__dbgProj(0, 4.5, -10)');
const box = { x0: Math.min(...pts.map((p) => p.px)), x1: Math.max(...pts.map((p) => p.px)), y0: Math.min(...pts.map((p) => p.py)), y1: Math.max(...pts.map((p) => p.py)) };
const hud = await evaluate(`(()=>{const r=document.getElementById('hud').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
const canvas = await evaluate(`(()=>{const r=document.getElementById('scene').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
const ox = Math.max(0, Math.min(box.x1, hud.x + hud.w) - Math.max(box.x0, hud.x));
const oy = Math.max(0, Math.min(box.y1, hud.y + hud.h) - Math.max(box.y0, hud.y));
const hallArea = (box.x1 - box.x0) * (box.y1 - box.y0);
const overlap = ox * oy;

const report = {
  camera: cam,
  canvas, hud,
  hallProjection: { box, centerScreen: { x: +hallCenter.px.toFixed(0), y: +hallCenter.py.toFixed(0) }, canvasCenterX: +(canvas.x + canvas.w / 2).toFixed(0) },
  hudHallOverlapPx2: +overlap.toFixed(0),
  hudHallOverlapRatioOfHall: +(overlap / hallArea).toFixed(3),
  lowerThird: { cells: lowTotal, water: lowWater, waterShare: +(lowWater / lowTotal).toFixed(3), skyShare: +(lowSky / lowTotal).toFixed(3) },
  midRowKinds,
  gridText: rows.map((r) => `${r.ny.toFixed(2)} | ${r.row.map((c) => ({ sky: '  ', ground: '地', water: '水', paving: '铺', 'rail/low': '低', 'building/tree': '屋', tall: '高' }[c.kind])).join('')}`).join('\n')
};
await writeFile(OUT + '/composition-audit.json', JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(report.gridText);
console.log('\ncamera', JSON.stringify(cam));
console.log('hall center screen x =', report.hallProjection.centerScreen.x, '(canvas center x =', report.hallProjection.canvasCenterX, ')');
console.log('hall bbox', JSON.stringify({ x0: +box.x0.toFixed(0), x1: +box.x1.toFixed(0), y0: +box.y0.toFixed(0), y1: +box.y1.toFixed(0) }));
console.log('HUD rect', JSON.stringify(hud), '| 与主屋投影重叠面积', report.hudHallOverlapPx2, '占主屋投影', report.hudHallOverlapRatioOfHall);
console.log('下 1/3 网格中水面占比', report.lowerThird.waterShare, '天空占比', report.lowerThird.skyShare, '(网格数', report.lowerThird.cells, ')');
console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);