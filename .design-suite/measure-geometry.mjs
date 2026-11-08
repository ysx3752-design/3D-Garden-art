// 交付前取证脚本（只读）：对最终单文件产物做六档 viewport 几何测量、控制台计数、
// 天气/时间过渡采样与状态截图。使用与套件证据脚本相同的 Chrome 启动参数与 CDP 助手。
import { createServer } from 'node:http';
import { readFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VIEWPORTS = [
  { id: 'vp-320', width: 320, height: 568 },
  { id: 'vp-390', width: 390, height: 844 },
  { id: 'vp-768', width: 768, height: 1024 },
  { id: 'vp-1440', width: 1440, height: 1000 },
  { id: 'vp-1920', width: 1920, height: 1080 },
  { id: 'vp-2560', width: 2560, height: 1080 }
];

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(ROOT, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((resolve) => server.listen(8767, '127.0.0.1', resolve));
const URL = 'http://127.0.0.1:8767/index.html';
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-measure-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `(() => {
    window.__probe = { errors: [], warnings: [] };
    const err = console.error, warn = console.warn;
    console.error = (...v) => { window.__probe.errors.push(v.map(String).join(' ')); err.apply(console, v); };
    console.warn = (...v) => { window.__probe.warnings.push(v.map(String).join(' ')); warn.apply(console, v); };
    window.addEventListener('error', (e) => window.__probe.errors.push(e.message || e.type || 'error'), true);
    window.addEventListener('unhandledrejection', (e) => window.__probe.errors.push(String(e.reason || 'rejection')));
    window.__brightness = (dataUrl) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 200;
        c.height = Math.max(1, Math.round(200 * img.height / img.width));
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, c.width, c.height);
        const data = ctx.getImageData(0, 0, c.width, c.height).data;
        let sum = 0;
        for (let i = 0; i < data.length; i += 4) sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
        resolve(Math.round(sum / (data.length / 4) * 100) / 100);
      };
      img.onerror = () => resolve(-1);
      img.src = dataUrl;
    });
  })();`
});

async function evaluate(expression, awaitPromise = false) {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'evaluate failed');
  return result?.result?.value;
}

async function navigate(width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  await client.send('Page.navigate', { url: 'about:blank' });
  await client.send('Page.navigate', { url: URL });
  for (let i = 0; i < 120; i += 1) {
    await delay(100);
    const ready = await evaluate('document.readyState === "complete" && location.href === ' + JSON.stringify(URL)).catch(() => false);
    if (ready) break;
  }
  for (let i = 0; i < 60; i += 1) {
    const done = await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"');
    if (done) break;
    await delay(100);
  }
  await delay(300);
}

const MEASURE = `(() => {
  const rect = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const round = (v) => Math.round(v * 100) / 100;
    return { left: round(r.left), right: round(r.right), top: round(r.top), bottom: round(r.bottom),
      width: round(r.width), height: round(r.height) };
  };
  const probe = window.__probe || { errors: [], warnings: [] };
  return JSON.stringify({
    canvas: rect('#scene'),
    hud: rect('#hud'),
    title: rect('.titleblock'),
    frame: rect('.frame'),
    images: Array.from(document.images).map((i) => i.currentSrc || i.src),
    loadedImages: Array.from(document.images).filter((i) => i.complete && i.naturalWidth > 0).length,
    consoleErrors: probe.errors.length,
    consoleWarnings: probe.warnings.length,
    errorMessages: probe.errors.slice(0, 3),
    warningMessages: probe.warnings.slice(0, 3),
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    loaderHidden: getComputedStyle(document.getElementById('loader')).display === 'none',
    hudCollapsed: document.getElementById('hud').getAttribute('data-collapsed'),
    clock: document.getElementById('clock').textContent,
    weatherName: document.getElementById('weather-name').textContent,
    temp: document.getElementById('temp').textContent
  });
})()`;

const viewports = [];
for (const vp of VIEWPORTS) {
  await navigate(vp.width, vp.height);
  const raw = JSON.parse(await evaluate(MEASURE));
  viewports.push({
    id: vp.id,
    width: vp.width,
    height: vp.height,
    client_width: raw.clientWidth,
    scroll_width: raw.scrollWidth,
    console_errors: raw.consoleErrors,
    console_warnings: raw.consoleWarnings,
    image_count: raw.images.length,
    loaded_images: raw.loadedImages,
    probes: { canvas: raw.canvas, hud: raw.hud, title: raw.title, frame: raw.frame },
    note: 'measured from the final single-file artifact served over http; loader hidden: ' + raw.loaderHidden +
      '; hud collapsed: ' + raw.hudCollapsed + '; clock ' + raw.clock + ' ' + raw.weatherName + ' ' + raw.temp
  });
  console.log('measured', vp.id, 'errors', raw.consoleErrors, 'warnings', raw.consoleWarnings,
    'scroll', raw.scrollWidth, '/', raw.clientWidth, raw.errorMessages, raw.warningMessages);
}

const artifact = {
  schema: 'design-suite-layout-geometry/v1',
  artifact_path: 'index.html',
  captured_at: new Date().toISOString(),
  url: URL,
  required_viewports: VIEWPORTS.map((v) => ({ id: v.id, width: v.width, height: v.height })),
  probe_invariants: [
    { probe: 'canvas', viewports: VIEWPORTS.map((v) => v.id), max_shrink_px: 1, min_width: 300 },
    { probe: 'hud', viewports: VIEWPORTS.map((v) => v.id), max_shrink_px: 8, min_width: 200, max_width: 400 },
    { probe: 'title', viewports: VIEWPORTS.map((v) => v.id), max_shrink_px: 1, min_width: 150, max_width: 440 }
  ],
  viewports
};
await writeFile(path.join(OUT, 'layout-geometry.json'), JSON.stringify(artifact, null, 2) + '\n', 'utf8');
console.log('geometry artifact written');

// 过渡采样与状态截图（1440x1000）
await navigate(1440, 1000);
async function shot(name, clip) {
  const args = { format: 'png' };
  if (clip) args.clip = clip;
  const result = await client.send('Page.captureScreenshot', args);
  await writeFile(path.join(SHOTS, name), Buffer.from(result.data, 'base64'));
  return result.data;
}
async function brightness() {
  const small = await client.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 60,
    clip: { x: 0, y: 0, width: 1440, height: 1000, scale: 0.25 }
  });
  return evaluate(`window.__brightness(${JSON.stringify('data:image/jpeg;base64,' + small.data)})`, true);
}
function click(selector) {
  return evaluate(`document.querySelector('${selector}').click() || true`);
}

const timeline = [];
timeline.push({ step: 'initial(晴/清晨)', brightness: await brightness() });
await shot('01-initial-dawn-sunny.png');

await click('[data-time="night"]');
timeline.push({ step: 'night t=0ms', brightness: await brightness() });
await delay(300);
timeline.push({ step: 'night t=300ms', brightness: await brightness() });
await delay(300);
timeline.push({ step: 'night t=600ms', brightness: await brightness() });
await delay(300);
timeline.push({ step: 'night t=900ms', brightness: await brightness() });
await delay(500);
timeline.push({ step: 'night t=1400ms(settled)', brightness: await brightness() });
await shot('02-night-sunny.png');

await click('[data-weather="rain"]');
await delay(1300);
timeline.push({ step: 'rain/night', brightness: await brightness() });
await shot('03-night-rain.png');

await click('[data-time="noon"]');
await delay(1300);
timeline.push({ step: 'rain/noon', brightness: await brightness() });
await shot('04-rain-noon.png');

await click('[data-weather="snow"]');
await click('[data-time="morning"]');
await delay(1300);
timeline.push({ step: 'snow/morning', brightness: await brightness() });
await shot('05-snow-morning.png');

await click('[data-weather="fog"]');
await click('[data-time="dusk"]');
await delay(1300);
timeline.push({ step: 'fog/dusk', brightness: await brightness() });
await shot('06-fog-dusk.png');

await click('[data-weather="sunny"]');
await click('[data-time="noon"]');
await delay(1300);
timeline.push({ step: 'sunny/noon', brightness: await brightness() });
await shot('07-noon-sunny.png');

await navigate(390, 844);
await shot('08-mobile-390-collapsed.png');
await click('#fold');
await delay(300);
await shot('09-mobile-390-expanded.png');

await writeFile(path.join(OUT, 'transition-timeline.json'), JSON.stringify(timeline, null, 2) + '\n', 'utf8');
console.log('timeline', JSON.stringify(timeline));

try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('DONE');
process.exit(0);