// 只读取证：用带相机钩子的校验副本，精确取景核对廊端与台阶衔接、水位与水面物体。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const FILE = path.join(ROOT, '.design-suite', 'verify.html');
const SHOTS = path.join(ROOT, '.design-suite', 'shots-junction');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(FILE);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8772, '127.0.0.1', r));
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-junction-'));
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

await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8772/verify.html' });
for (let i = 0; i < 120; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 80; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(700);
console.log('hook ready:', await evaluate('typeof window.__dbgCam'));

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}
async function view(px, py, pz, tx, ty, tz) {
  await evaluate(`window.__dbgCam(${px},${py},${pz},${tx},${ty},${tz})`);
  await delay(500);
}

// 1. 东南侧斜视：直廊北端与主屋台阶的接缝
await view(9, 3.2, 7.5, 0, 0.9, -1.2);
await shot('01-junction-right.png');

// 2. 西南侧斜视
await view(-9, 3.0, 7.0, 0, 0.9, -1.2);
await shot('02-junction-left.png');

// 3. 正南低视：平视水面、台阶与廊面
await view(0, 1.6, 14, 0, 0.8, -1.6);
await shot('03-level-front.png');

// 4. 西侧亲水码头与汀步
await view(-6, 2.6, 20, -15, 0.5, 6);
await shot('04-wharf-stepping.png');

// 5. 俯瞰池面：检查是否露出地皮
await view(0, 12, 22, 0, 0.3, 4);
await shot('05-overview-pond.png');

// 6. 东侧九曲桥与湖心亭
await view(24, 4.5, 16, 10, 0.6, 3);
await shot('06-zigzag-pavilion.png');

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);