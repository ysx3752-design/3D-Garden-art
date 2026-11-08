// 只读穿模审计：① 植被落脚校验（树根是否落在其标高对应的实地上、是否泡水或嵌入建筑）；
// ② 院墙穿越校验（墙外 0.6m 处是否被植被/构件穿出）；③ 直廊廊面净空校验（廊面无非廊体构件）。
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
await new Promise((r) => server.listen(8780, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-clip-'));
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
await client.send('Emulation.setDeviceMetricsOverride', { width: 800, height: 600, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8780/verify-gate.html' });
for (let i = 0; i < 150; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(500);
const down = async (x, z) => evaluate(`window.__dbgRay(${x}, 60, ${z}, 0, -1, 0)`);

// ① 植被落脚：base 为该株设定标高（0.08 平地 / 1.2 主殿台座 / WATER_Y 水面）
const VEG = [
  { n: '垂柳', x: -24, z: 12, base: 0.08 }, { n: '垂柳', x: 25, z: 12, base: 0.08 },
  { n: '垂柳', x: -24, z: -2, base: 0.08 }, { n: '垂柳', x: 34, z: 10, base: 0.08 },
  { n: '垂柳', x: 28, z: 26, base: 0.08 }, { n: '垂柳', x: -28, z: 26, base: 0.08 },
  { n: '垂柳', x: 0, z: 30, base: 0.08 },
  { n: '春桃', x: -16, z: -16, base: 1.2 }, { n: '春桃', x: 16, z: -16, base: 1.2 },
  { n: '春桃', x: 26, z: 4, base: 0.08 }, { n: '春桃', x: -26, z: 16, base: 0.08 },
  { n: '春桃', x: 26, z: 16, base: 0.08 }, { n: '春桃', x: 34, z: -8, base: 0.08 },
  { n: '白玉兰', x: -30, z: 6, base: 0.08 }, { n: '白玉兰', x: 30, z: 6, base: 0.08 },
  { n: '芭蕉', x: 22.5, z: 3.5, base: 0.08 }, { n: '芭蕉', x: 15.5, z: -8, base: 1.2 },
  { n: '芭蕉', x: -23.5, z: -6, base: 0.08 },
  { n: '罗汉松', x: -34, z: -38, base: 0.08 }, { n: '罗汉松', x: -26, z: -27, base: 0.08 },
  { n: '罗汉松', x: 6, z: -24, base: 0.08 }, { n: '罗汉松', x: 34, z: -27.5, base: 0.08 },
  { n: '罗汉松', x: -20, z: -27, base: 0.08 }, { n: '罗汉松', x: 18, z: -24, base: 0.08 },
  { n: '竹林心', x: -32, z: 0, base: 0.08 }, { n: '竹林心', x: 33, z: -16, base: 0.08 },
  { n: '竹林缘', x: -35.2, z: 0, base: 0.08 }, { n: '竹林缘', x: 36, z: -16, base: 0.08 }
];

const vegReport = [];
for (const v of VEG) {
  const hits = (await down(v.x, v.z)).map((h) => h.y);
  const below = hits.filter((y) => y <= v.base + 0.4);
  const support = below.length ? Math.max(...below) : null;
  const above = hits.filter((y) => y > v.base + 5.0 && y < v.base + 13);
  const floating = support === null || Math.abs(support - v.base) > 0.15;
  const buried = above.length > 0;
  vegReport.push({ ...v, support, above, floating, buried });
}
const vegBad = vegReport.filter((v) => v.floating || v.buried);

// ② 院墙穿越：沿墙外侧 0.6m 采样，命中高于 0.5m 者视为穿墙物
const wallProbe = [];
const wallLines = [
  { name: 'S(z=20)', pts: Array.from({ length: 39 }, (_, i) => [-38 + i * 2, 20.7]) },
  { name: 'N(z=-32)', pts: Array.from({ length: 39 }, (_, i) => [-38 + i * 2, -32.7]) },
  { name: 'W(x=-38)', pts: Array.from({ length: 26 }, (_, i) => [-38.7, -32 + i * 2]) },
  { name: 'E(x=38)', pts: Array.from({ length: 26 }, (_, i) => [38.7, -32 + i * 2]) }
];
for (const line of wallLines) {
  const hitsList = [];
  for (const p of line.pts) {
    if (line.name.startsWith("S") && Math.abs(p[0]) <= 9.6) continue;
    const hits = await down(p[0], p[1]);
    const top = hits.length ? hits[0].y : null;
    if (top !== null && top > 0.5) hitsList.push({ p, top });
  }
  wallProbe.push({ wall: line.name, crossed: hitsList });
}

// ③ 直廊廊面净空：廊面 0.56m 之上到廊顶之下不应有非廊体构件（荷叶/荷花/石作）
const corridor = [];
for (let z = 17.0; z >= 0.0; z -= 0.5) {
  for (const x of [0, -1.0, 1.0]) {
    const hits = (await evaluate(`window.__dbgRay(${x}, 60, ${z}, 0, -1, 0)`)).map((h) => h.y);
    const low = hits.filter((y) => y < 2.0);
    const deck = low.length ? Math.max(...low) : null;
    corridor.push({ x, z: +z.toFixed(2), deck });
  }
}
const deckAnomaly = corridor.filter((c) => c.deck === null || Math.abs(c.deck - 0.56) > 0.15);

const out = { vegBad, vegReport, wallProbe, deckAnomaly, corridorCount: corridor.length };
await writeFile(OUT + '/clip-audit.json', JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log('植被落脚异常数:', vegBad.length);
for (const v of vegBad) console.log('  ✗', JSON.stringify(v));
console.log('院墙穿越采样:', JSON.stringify(wallProbe.map((w) => ({ wall: w.wall, crossed: w.crossed.length }))));
for (const w of wallProbe) if (w.crossed.length) console.log('  !', w.wall, JSON.stringify(w.crossed.slice(0, 8)));
console.log('直廊廊面净空异常数:', deckAnomaly.length, '/', corridor.length);
if (deckAnomaly.length) console.log('  ', JSON.stringify(deckAnomaly.slice(0, 10)));

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);