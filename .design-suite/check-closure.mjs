// 只读取证：自园外向内对四面院墙分别打水平射线，复核墙体闭合（是否存在与墙平面重合的命中）。
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
await new Promise((r) => server.listen(8779, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-closure-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8779/verify-gate.html' });
for (let i = 0; i < 150; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(500);

async function ray(ox, oy, oz, dx, dy, dz) { return evaluate(`window.__dbgRay(${ox},${oy},${oz},${dx},${dy},${dz})`); }

const checks = [];
// 南墙（z=20），自南向北；门洞 x∈[-2.5,2.5] 为设计开口，门楼体 x∈[2.5,6.1] 覆盖墙线
for (let x = -36; x <= 36; x += 2) {
  const hits = await ray(x, 3.0, 34, 0, 0, -1);
  const onWall = hits.some((h) => Math.abs(h.z - 20) <= 0.45);
  const inGate = hits.some((h) => h.z <= 24.0 && h.z >= 18.6);
  checks.push({ dir: 'S-wall(z=20)', p: x, firstZ: hits[0] ? hits[0].z : null, onWall, inGate, door: Math.abs(x) <= 2.5 });
}
// 北墙（z=-32），自北向南
for (let x = -36; x <= 36; x += 2) {
  const hits = await ray(x, 3.0, -44, 0, 0, 1);
  checks.push({ dir: 'N-wall(z=-32)', p: x, firstZ: hits[0] ? hits[0].z : null, onWall: hits.some((h) => Math.abs(h.z + 32) <= 0.45) });
}
// 西墙（x=-38），自西向东
for (let z = -30; z <= 18; z += 2) {
  const hits = await ray(-46, 3.0, z, 1, 0, 0);
  checks.push({ dir: 'W-wall(x=-38)', p: z, firstX: hits[0] ? hits[0].x : null, onWall: hits.some((h) => Math.abs(h.x + 38) <= 0.45) });
}
// 东墙（x=38），自东向西
for (let z = -30; z <= 18; z += 2) {
  const hits = await ray(46, 3.0, z, -1, 0, 0);
  checks.push({ dir: 'E-wall(x=38)', p: z, firstX: hits[0] ? hits[0].x : null, onWall: hits.some((h) => Math.abs(h.x - 38) <= 0.45) });
}

const summary = {};
for (const dir of ['S-wall(z=20)', 'N-wall(z=-32)', 'W-wall(x=-38)', 'E-wall(x=38)']) {
  const list = checks.filter((c) => c.dir === dir);
  const need = list.filter((c) => !c.door);
  const ok = need.filter((c) => c.onWall || c.inGate);
  summary[dir] = { total: need.length, covered: ok.length, missed: need.filter((c) => !(c.onWall || c.inGate)).map((c) => c.p) };
}
await writeFile(OUT + '/wall-closure.json', JSON.stringify({ summary, checks }, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(summary, null, 2));

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);