// 交互实测（只读）：对最终单文件产物验证拖拽环视、滚轮缩放、右键平移、触摸手势与 HUD 切换。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(ROOT, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8769, '127.0.0.1', r));
const URL = 'http://127.0.0.1:8769/index.html';

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-interact-'));
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

async function load(width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await client.send('Page.navigate', { url: 'about:blank' });
  await client.send('Page.navigate', { url: URL });
  for (let i = 0; i < 120; i += 1) {
    await delay(120);
    if (await evaluate('document.readyState === "complete"').catch(() => false)) break;
  }
  for (let i = 0; i < 60; i += 1) {
    if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break;
    await delay(120);
  }
  await delay(500);
}

async function frameHash() {
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  return createHash('sha256').update(Buffer.from(shot.data, 'base64')).digest('hex').slice(0, 16);
}

async function drag(button, from, to, steps = 6) {
  const buttons = button === 'right' ? 2 : (button === 'middle' ? 4 : 1);
  await client.send('Input.dispatchMouseEvent', {
    type: 'mousePressed', x: from[0], y: from[1], button, buttons, clickCount: 1
  });
  for (let i = 1; i <= steps; i += 1) {
    const x = from[0] + ((to[0] - from[0]) * i) / steps;
    const y = from[1] + ((to[1] - from[1]) * i) / steps;
    await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button, buttons });
    await delay(40);
  }
  await client.send('Input.dispatchMouseEvent', {
    type: 'mouseReleased', x: to[0], y: to[1], button, buttons: 0, clickCount: 1
  });
}

const results = [];

await load(1440, 1000);
const base = await frameHash();

// 1) 左键拖拽环视
await drag('left', [720, 520], [980, 500]);
await delay(900);
const afterRotate = await frameHash();
results.push({ check: '左键拖拽环视', changed: afterRotate !== base, before: base, after: afterRotate });

// 2) 滚轮缩放
await client.send('Input.dispatchMouseEvent', {
  type: 'mouseWheel', x: 720, y: 500, deltaX: 0, deltaY: -420, button: 'none', buttons: 0
});
await delay(900);
const afterZoom = await frameHash();
results.push({ check: '滚轮缩放', changed: afterZoom !== afterRotate, after: afterZoom });

// 3) 右键平移
await drag('right', [720, 500], [640, 430]);
await delay(900);
const afterPan = await frameHash();
results.push({ check: '右键平移', changed: afterPan !== afterZoom, after: afterPan });

// 4) HUD 切换天气与时辰 + 读数
await evaluate('document.querySelector(\'[data-weather="snow"]\').click()');
await evaluate('document.querySelector(\'[data-time="night"]\').click()');
await delay(1400);
const readout = JSON.parse(await evaluate(`JSON.stringify({
  weather: document.getElementById('weather-name').textContent,
  temp: document.getElementById('temp').textContent,
  clock: document.getElementById('clock').textContent,
  date: document.getElementById('date').textContent,
  snowPressed: document.querySelector('[data-weather="snow"]').getAttribute('aria-pressed'),
  nightPressed: document.querySelector('[data-time="night"]').getAttribute('aria-pressed'),
  sunnyPressed: document.querySelector('[data-weather="sunny"]').getAttribute('aria-pressed'),
  live: document.getElementById('live').textContent,
  glyphChildren: document.getElementById('weather-glyph').children.length
})`));
const afterWeather = await frameHash();
results.push({ check: 'HUD 天气/时辰切换与读数', changed: afterWeather !== afterPan, readout });

// 5) HUD 折叠
const fold = JSON.parse(await evaluate(`(() => {
  const before = document.getElementById('hud').getAttribute('data-collapsed');
  document.getElementById('fold').click();
  return JSON.stringify({
    before: before,
    after: document.getElementById('hud').getAttribute('data-collapsed'),
    label: document.getElementById('fold-text').textContent,
    expanded: document.getElementById('fold').getAttribute('aria-expanded')
  });
})()`));
await delay(300);
results.push({ check: 'HUD 折叠', fold });

// 6) 移动端触摸：单指旋转 + 双指缩放
await load(390, 844);
await client.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 });
const touchBase = await frameHash();
await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 195, y: 500, id: 1 }] });
for (let i = 1; i <= 6; i += 1) {
  await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 195 + i * 18, y: 500 - i * 3, id: 1 }] });
  await delay(40);
}
await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await delay(800);
const afterTouchRotate = await frameHash();
results.push({ check: '触摸单指旋转', changed: afterTouchRotate !== touchBase, before: touchBase, after: afterTouchRotate });

await client.send('Input.dispatchTouchEvent', {
  type: 'touchStart', touchPoints: [{ x: 150, y: 480, id: 1 }, { x: 250, y: 480, id: 2 }]
});
for (let i = 1; i <= 6; i += 1) {
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchMove',
    touchPoints: [{ x: 150 - i * 8, y: 480, id: 1 }, { x: 250 + i * 8, y: 480, id: 2 }]
  });
  await delay(40);
}
await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
await delay(800);
const afterPinch = await frameHash();
results.push({ check: '触摸双指缩放', changed: afterPinch !== afterTouchRotate, after: afterPinch });

const allChanged = results.filter((r) => 'changed' in r).every((r) => r.changed === true);
const readoutOk = readout.weather === '雪' && readout.clock === '21:10'
  && readout.snowPressed === 'true' && readout.nightPressed === 'true' && readout.sunnyPressed === 'false'
  && readout.glyphChildren === 1
  && readout.live.indexOf(readout.temp.replace('°', '')) >= 0;
const foldOk = fold.before !== fold.after
  && fold.label === (fold.after === 'true' ? '展开' : '收起')
  && fold.expanded === (fold.after === 'true' ? 'false' : 'true');
console.log(JSON.stringify({ allInteractionsChangedFrames: allChanged, readoutOk, foldOk, results }, null, 2));
await writeFile(path.join(OUT, 'interaction-evidence.json'),
  JSON.stringify({ captured_at: new Date().toISOString(), url: URL, allInteractionsChangedFrames: allChanged, readoutOk, foldOk, results }, null, 2) + '\n', 'utf8');

try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);