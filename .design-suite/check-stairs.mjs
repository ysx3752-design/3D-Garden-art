// 只读取证：用调试相机取景核对廊—台阶衔接与抬高后的水位。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const FILE = path.join(ROOT, '.design-suite', 'verify.html');
const SHOTS = path.join(ROOT, '.design-suite', 'shots-stairs');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(FILE);
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8774, '127.0.0.1', r));
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-stairs-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8774/verify.html' });
for (let i = 0; i < 120; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 80; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(700);

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}
async function view(px, py, pz, tx, ty, tz) {
  await evaluate(`window.__dbgCam(${px},${py},${pz},${tx},${ty},${tz})`);
  await delay(500);
}

await view(0, 2.4, 13, 0, 0.9, -1.5);
await shot('01-axis-eye-level.png');

await view(12, 3.6, 9, 0, 1.0, -1.2);
await shot('02-right-oblique.png');

await view(-11, 3.2, 10, 0, 1.0, -1.2);
await shot('03-left-oblique.png');

await view(0, 6.5, 12, 0, 0.5, 4);
await shot('04-pond-overhead.png');

await view(-12, 3.0, 21, -13, 0.5, 4);
await shot('05-wharf-stepping.png');

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);