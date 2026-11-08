// 只读取证：对四面院墙做「墙外 0.7m / 墙内 0.7m」成对垂直采样，
// 双侧同时存在高于 0.5m 的实体即判定为穿越墙体（单侧命中属正常，如墙外灌木或墙内探枝）。
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
await new Promise((r) => server.listen(8781, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-wallgap-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8781/verify-gate.html' });
for (let i = 0; i < 150; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(400);

const top = async (x, z) => {
  const hits = await evaluate(`window.__dbgRay(${x}, 60, ${z}, 0, -1, 0)`);
  return hits.length ? hits[0].y : null;
};

const walls = [
  { name: 'S-wall z=20', axis: 'x', from: -38, to: 38, outside: [0, 20.7], inside: [0, 19.3], skip: (p) => Math.abs(p) <= 9.6 },
  { name: 'N-wall z=-32', axis: 'x', from: -38, to: 38, outside: [0, -32.7], inside: [0, -31.3], skip: () => false },
  { name: 'W-wall x=-38', axis: 'z', from: -30, to: 18, outside: [-38.7, 0], inside: [-37.3, 0], skip: () => false },
  { name: 'E-wall x=38', axis: 'z', from: -30, to: 18, outside: [38.7, 0], inside: [37.3, 0], skip: () => false }
];

const result = [];
for (const w of walls) {
  const crossing = [];
  const insideOnly = [];
  const outsideOnly = [];
  for (let p = w.from; p <= w.to; p += 2) {
    if (w.skip(p)) continue;
    const oPos = w.axis === 'x' ? [p, w.outside[1]] : [w.outside[0], p];
    const iPos = w.axis === 'x' ? [p, w.inside[1]] : [w.inside[0], p];
    const o = await top(oPos[0], oPos[1]);
    const i = await top(iPos[0], iPos[1]);
    const rec = { p, out: o, in: i };
    if (o !== null && o > 0.5 && i !== null && i > 0.5) crossing.push(rec);
    else if (i !== null && i > 0.5) insideOnly.push(rec);
    else if (o !== null && o > 0.5) outsideOnly.push(rec);
  }
  result.push({ wall: w.name, crossingCount: crossing.length, crossing: crossing.slice(0, 12), insideOnlyCount: insideOnly.length, outsideOnlyCount: outsideOnly.length, outsideOnly: outsideOnly.slice(0, 8) });
}
await writeFile(OUT + '/wall-gap.json', JSON.stringify(result, null, 2) + '\n', 'utf8');
for (const r of result) {
  console.log(r.wall, '| 双侧穿越:', r.crossingCount, '| 仅墙内探出:', r.insideOnlyCount, '| 仅墙外物体:', r.outsideOnlyCount);
  if (r.crossingCount) console.log('   穿越位置:', JSON.stringify(r.crossing));
}
console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);