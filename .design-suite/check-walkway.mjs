// 只读取证：核对廊道北端与主屋台阶的衔接、抬高后的水位与水面物体露出情况。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots-walk');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(ROOT, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8770, '127.0.0.1', r));
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-walk-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const evaluate = async (expression) => {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'evaluate failed');
  return result?.result?.value;
};

await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8770/index.html' });
for (let i = 0; i < 120; i += 1) {
  await delay(120);
  if (await evaluate('document.readyState === "complete"').catch(() => false)) break;
}
for (let i = 0; i < 80; i += 1) {
  if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break;
  await delay(120);
}
await delay(700);

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
  console.log('shot', name);
}

async function wheel(times, delta) {
  for (let i = 0; i < times; i += 1) {
    await client.send('Input.dispatchMouseEvent', {
      type: 'mouseWheel', x: 720, y: 520, deltaX: 0, deltaY: delta, button: 'none', buttons: 0
    });
    await delay(60);
  }
  await delay(900);
}

async function drag(from, to, steps = 8) {
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: from[0], y: from[1], button: 'left', buttons: 1, clickCount: 1 });
  for (let i = 1; i <= steps; i += 1) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'left', buttons: 1 });
    await delay(45);
  }
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: to[0], y: to[1], button: 'left', buttons: 0, clickCount: 1 });
  await delay(900);
}

await shot('01-default.png');

// 拉近到主屋台阶与廊道北端
await wheel(14, -260);
await shot('02-zoom-stairs.png');

// 斜视观察廊端与台阶的接缝
await drag([720, 520], [980, 470]);
await shot('03-oblique.png');

// 再转一段，查看湖面、码头踏步、汀步与驳岸石是否露出水面
await drag([900, 500], [430, 540]);
await shot('04-water-objects.png');

// 贴近水面平视，检查是否露出地皮
await drag([700, 470], [700, 610]);
await wheel(4, 260);
await shot('05-low-angle.png');

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);