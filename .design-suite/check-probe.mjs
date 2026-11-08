// 只读取证：用射线探针读取主屋中轴上各点的真实表面标高与水面振幅，核算廊—台阶是否连续。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const FILE = path.join(ROOT, '.design-suite', 'verify.html');
const OUT = path.join(ROOT, '.design-suite');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(FILE);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8773, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-probe2-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
const evaluate = async (expression) => {
  const r = await client.send('Runtime.evaluate', { expression, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval failed');
  return r?.result?.value;
};

await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8773/verify.html' });
for (let i = 0; i < 120; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 80; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(600);

const probes = await evaluate(`JSON.stringify({
  water: window.__dbgWater(),
  axis: [-2.9, -2.6, -2.3, -2.0, -1.6, -1.2, -0.8, -0.4, -0.15, 0.0, 0.4, 1.2, 4, 8, 14, 17.4, 18.1].map(function (z) {
    return { z: z, hits: window.__dbgProbe(0, z) };
  }),
  offAxis: [
    { label: '廊侧水面', x: 8, z: 8, hits: window.__dbgProbe(8, 8) },
    { label: '池心水面', x: 0, z: 12, hits: window.__dbgProbe(0, 12) },
    { label: '池底旁', x: 18, z: 4, hits: window.__dbgProbe(18, 4) },
    { label: '码头', x: -12, z: 14.5, hits: window.__dbgProbe(-12, 14.5) },
    { label: '汀步', x: -14.5, z: 3.6, hits: window.__dbgProbe(-14.5, 3.6) },
    { label: '九曲桥', x: 8, z: 11, hits: window.__dbgProbe(8, 11) }
  ]
})`);
const data = JSON.parse(probes);

console.log('=== 水面振幅 ===');
console.log(data.water);

console.log('=== 主屋中轴（x=0）自上而下的表面标高 ===');
data.axis.forEach(function (row) {
  console.log('z=' + row.z, JSON.stringify(row.hits));
});

console.log('=== 旁位取样 ===');
data.offAxis.forEach(function (row) {
  console.log(row.label, '(', row.x, row.z, ')', JSON.stringify(row.hits));
});

await writeFile(path.join(OUT, 'junction-probe.json'), JSON.stringify(data, null, 2) + '\n', 'utf8');

// 同时留一张正南低视截图作视觉对照
await evaluate('window.__dbgCam(0, 1.9, 16, 0, 0.7, -2.0)');
await delay(500);
const r = await client.send('Page.captureScreenshot', { format: 'png' });
await mkdir(path.join(OUT, 'shots-junction'), { recursive: true });
await writeFile(path.join(OUT, 'shots-junction', '07-axis-eye-level.png'), Buffer.from(r.data, 'base64'));
console.log('DONE');

try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);