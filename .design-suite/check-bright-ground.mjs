// 只读取证：① 沙盘顶面地面覆盖射线网格（是否存在无地面承托的空洞）；② 四个时辰下的画面亮度分布
// （均值 / 5% / 50% / 90% 分位 / 近黑像素占比），用于判定「整体提亮、夜景可看清」。不改动交付产物。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots-light');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const hook = `
  window.__dbgRay = function (ox, oy, oz, dx, dy, dz) {
    var rc3 = new THREE.Raycaster(new THREE.Vector3(ox, oy, oz), new THREE.Vector3(dx, dy, dz).normalize(), 0, 400);
    return rc3.intersectObjects(scene.children, true).slice(0, 40)
      .filter(function (h) { return h.object.type !== 'Points'; })
      .map(function (h) { return { x: +h.point.x.toFixed(2), y: +h.point.y.toFixed(2), z: +h.point.z.toFixed(2) }; });
  };

  window.__dbgLights = function () {
    return { sun: sunLight ? +sunLight.intensity.toFixed(2) : null, moon: moonLight ? +moonLight.intensity.toFixed(2) : null,
             hemi: hemiLight ? +hemiLight.intensity.toFixed(2) : null, ambient: ambientLight ? +ambientLight.intensity.toFixed(2) : null,
             exposure: +renderer.toneMappingExposure.toFixed(2), fogD: +scene.fog.density.toFixed(4) };
  };
  window.__dbgProj = function (x, y, z) {
    var v = new THREE.Vector3(x, y, z).project(camera);
    var r = renderer.domElement.getBoundingClientRect();
    return { px: (v.x * 0.5 + 0.5) * r.width + r.x, py: (-v.y * 0.5 + 0.5) * r.height + r.y };
  };
  window.__lumaAt = function (dataUrl, px, py) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
        var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
        var sx = Math.max(0, Math.round(px) - 3), sy = Math.max(0, Math.round(py) - 3);
        var d = g.getImageData(sx, sy, 7, 7).data, acc = 0;
        for (var i = 0; i < d.length; i += 4) acc += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
        resolve(Math.round(acc / (d.length / 4)));
      };
      im.src = dataUrl;
    });
  };
  window.__dbgCam = function (px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz);
    controls.target.set(tx, ty, tz); controls.update(); renderer.render(scene, camera);
  };
  window.__stats = function (dataUrl) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () {
        var c = document.createElement('canvas');
        c.width = im.width; c.height = im.height;
        var g = c.getContext('2d', { willReadFrequently: true });
        g.drawImage(im, 0, 0);
        // 采样左 60% 画面，避开右上角 HUD 卡片
        var w = Math.floor(c.width * 0.6), h = c.height;
        var d = g.getImageData(0, 0, w, h).data;
        var vals = [];
        for (var i = 0; i < d.length; i += 4 * 7) {
          vals.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
        }
        vals.sort(function (a, b) { return a - b; });
        var pick = function (p) { return vals[Math.min(vals.length - 1, Math.floor(vals.length * p))]; };
        var sum = 0, dark = 0;
        for (var k = 0; k < vals.length; k++) { sum += vals[k]; if (vals[k] < 15) dark += 1; }
        var gw = Math.floor(w / 6), gh = Math.floor(h / 4), grid = [];
        for (var gy = 0; gy < 4; gy++) { var row = []; for (var gx = 0; gx < 6; gx++) { var acc = 0, n = 0;
          for (var yy = gy * gh; yy < (gy + 1) * gh; yy += 12) { for (var xx = gx * gw; xx < (gx + 1) * gw; xx += 12) { var o = (yy * w + xx) * 4; acc += 0.2126 * d[o] + 0.7152 * d[o + 1] + 0.0722 * d[o + 2]; n += 1; } }
          row.push(Math.round(acc / Math.max(1, n))); } grid.push(row); }
        resolve({ grid: grid,
          mean: +(sum / vals.length).toFixed(1), p05: +pick(0.05).toFixed(1), p25: +pick(0.25).toFixed(1),
          p50: +pick(0.5).toFixed(1), p90: +pick(0.9).toFixed(1),
          darkShare: +(dark / vals.length).toFixed(3), samples: vals.length
        });
      };
      im.src = dataUrl;
    });
  };
`;
const appTag = '<script data-static-export-source="app.js">';
const aStart = html.indexOf(appTag);
const aEnd = html.indexOf('</script>', aStart);
const block = html.slice(aStart, aEnd);
const tailIdx = block.lastIndexOf('})();');
const verify = html.slice(0, aStart) + block.slice(0, tailIdx) + hook + block.slice(tailIdx) + html.slice(aEnd);
await writeFile(path.join(OUT, 'verify-light.html'), verify, 'utf8');
await mkdir(SHOTS, { recursive: true });

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(OUT, 'verify-light.html'))); }
  catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(8795, '127.0.0.1', r));
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-light-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
const evaluate = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text || 'eval failed');
  return r?.result?.value;
};
await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8795/verify-light.html' });
for (let i = 0; i < 220; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(900);

// ① 地面覆盖网格
const holes = [];
let tested = 0;
for (let x = -41; x <= 41; x += 5) {
  for (let z = -47; z <= 35; z += 5) {
    tested += 1;
    const hits = await evaluate(`window.__dbgRay(${x}, 40, ${z}, 0, -1, 0)`);
    const lowSupport = hits.filter((h) => h.y <= 0.06);
    if (lowSupport.length === 0) holes.push({ x, z, top: hits[0] ? hits[0].y : null });
  }
}
console.log('地面覆盖采样点', tested, '｜无地面承托(空洞)点', holes.length, holes.length ? JSON.stringify(holes.slice(0, 10)) : '');

// ② 四时辰亮度分布
async function setTime(label) {
  const key = { 清晨: 'morning', 正午: 'noon', 黄昏: 'dusk', 夜晚: 'night' }[label];
  const ok = await evaluate(`(() => { const b = document.querySelector('button[data-time="${key}"]'); if (!b) return 'not-found'; b.click(); return 'clicked'; })()`);
  await delay(1500);
  console.log('  set time', label, ok);
}
async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
  return 'data:image/png;base64,' + r.data;
}
const report = {};
for (const label of ['清晨', '正午', '黄昏', '夜晚']) {
  await setTime(label);
  const url = await shot(`time-${label}.png`);
  report[label] = await evaluate(`window.__stats(${JSON.stringify(url)})`);
  var marks = { '主殿墙面': [0, 5.0, -2.6], '主殿屋面': [0, 8.4, -8], '直廊廊面': [0, 0.6, 3], '湖面': [5, 0.42, 2], '远树': [12, 4, -20], '北院墙': [0, 2.5, -31.7], '天空': [0, 30, -70] };
  report[label].marks = {};
  for (var mk in marks) {
    var pt = marks[mk];
    var pp = await evaluate(`window.__dbgProj(${pt[0]}, ${pt[1]}, ${pt[2]})`);
    var lv = await evaluate(`window.__lumaAt(${JSON.stringify(url)}, ${pp.px.toFixed(1)}, ${pp.py.toFixed(1)})`);
    report[label].marks[mk] = lv;
  }
  console.log(label, 'lights', JSON.stringify(await evaluate('window.__dbgLights()')), 'mean', report[label].mean, 'p50', report[label].p50, 'dark', report[label].darkShare, JSON.stringify(report[label].marks));
}
await writeFile(path.join(OUT, 'light-ground-evidence.json'), JSON.stringify({ tested, holes, report }, null, 2) + '\n', 'utf8');

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);