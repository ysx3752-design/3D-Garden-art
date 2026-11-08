// 只读取证（多角度）：把视角拉近并绕转，检查直廊北端与主屋台阶的衔接及水位关系。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const SHOTS = path.join(ROOT, '.design-suite', 'shots-walk2');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(ROOT, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8771, '127.0.0.1', r));
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-walk2-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8771/index.html' });
for (let i = 0; i < 120; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 80; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(700);

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}
async function wheel(times, delta) {
  for (let i = 0; i < times; i += 1) {
    await client.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 720, y: 520, deltaX: 0, deltaY: delta, button: 'none', buttons: 0 });
    await delay(35);
  }
  await delay(800);
}
async function drag(from, to, steps = 10) {
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from[0], y: from[1], button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= steps; i += 1) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
    await delay(40);
  }
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to[0], y: to[1], button: 'left', buttons: 0, clickCount: 1 });
  await delay(800);
}

// A：拉近到台阶与廊端（正视偏上）
await wheel(26, -280);
await shot('A-close-front.png');

// B：向右绕 50°，斜看廊端与台阶接缝
await drag([760, 520], [1010, 520]);
await shot('B-right-oblique.png');

// C：再绕 60°，从东侧看廊与台阶的侧剖关系
await drag([1010, 520], [720, 520]);
await drag([720, 520], [420, 520]);
await shot('C-left-oblique.png');

// D：压低视线平视水面与台阶
await drag([720, 470], [720, 620]);
await shot('D-low-angle.png');

// E：稍拉远看整体关系
await wheel(8, 280);
await shot('E-pull-back.png');

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);