// 只读取证（不修改交付产物）：用带相机/射线钩子的校验副本，核对
// ① 四面院墙合围与正门门楼形态、② 正门—甬道—直廊贯通可行走、
// ③ 原石舫处水面无残留构件、④ 环视四向皆见墙。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots-gate');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// 1) 由最终单文件产物生成带只读钩子的校验副本（不改动 index.html 本身）
const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const hook = `
  window.__dbgInfo = function () {
    return { x: camera.position.x, y: camera.position.y, z: camera.position.z,
             tx: controls.target.x, ty: controls.target.y, tz: controls.target.z,
             fov: camera.fov, dist: camera.position.distanceTo(controls.target) };
  };
  window.__dbgProj = function (x, y, z) {
    var v = new THREE.Vector3(x, y, z).project(camera);
    var r = renderer.domElement.getBoundingClientRect();
    return { px: (v.x * 0.5 + 0.5) * r.width + r.x, py: (-v.y * 0.5 + 0.5) * r.height + r.y, behind: v.z > 1 };
  };
  window.__dbgPick = function (nx, ny) {
    var rc = new THREE.Raycaster();
    rc.setFromCamera(new THREE.Vector2(nx, ny), camera);
    var hits = rc.intersectObjects(scene.children, true).filter(function (h) { return h.object.type !== 'Points'; });
    return hits.slice(0, 3).map(function (h) { return { x: +h.point.x.toFixed(2), y: +h.point.y.toFixed(2), z: +h.point.z.toFixed(2), t: h.object.type }; });
  };

  window.__dbgCam = function (px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    controls.target.set(tx, ty, tz);
    controls.update();
    renderer.render(scene, camera);
  };
  window.__dbgRay = function (ox, oy, oz, dx, dy, dz) {
    var dir = new THREE.Vector3(dx, dy, dz).normalize();
    var ray = new THREE.Raycaster(new THREE.Vector3(ox, oy, oz), dir, 0, 400);
    var hits = ray.intersectObjects(scene.children, true);
    return hits.slice(0, 14).map(function (h) {
      return { x: +h.point.x.toFixed(2), y: +h.point.y.toFixed(2), z: +h.point.z.toFixed(2),
               d: +h.distance.toFixed(2), t: h.object.type };
    }).filter(function (h) { return h.t !== 'Points'; });
  };
`;
const appTag = '<script data-static-export-source="app.js">';
const appStart = html.indexOf(appTag);
const appEnd = html.indexOf('</script>', appStart);
if (appStart === -1 || appEnd === -1) throw new Error('未找到内联 app.js 脚本块');
const appBlock = html.slice(appStart, appEnd);
const tail = appBlock.lastIndexOf('})();');
if (tail === -1) throw new Error('未找到应用 IIFE 收尾标记');
const verifyHtml = html.slice(0, appStart) + appBlock.slice(0, tail) + hook + appBlock.slice(tail) + html.slice(appEnd);
await mkdir(SHOTS, { recursive: true });
await writeFile(path.join(OUT, 'verify-gate.html'), verifyHtml, 'utf8');

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(OUT, 'verify-gate.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8778, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-gate-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8778/verify-gate.html' });
for (let i = 0; i < 120; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 120; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(800);
console.log('hooks:', await evaluate('typeof window.__dbgCam + "/" + typeof window.__dbgRay'));

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
}
async function view(px, py, pz, tx, ty, tz) {
  await evaluate(`window.__dbgCam(${px},${py},${pz},${tx},${ty},${tz})`);
  await delay(420);
}

// 2) 多视角截图
await view(0, 5.2, 16.2, 0, 3.6, -6.0); // 默认视角（正门中轴内侧南岸临水）
await shot('01-default.png');
await view(0, 4.0, 12.0, 0, 3.4, 22.0); // 园内向北望正门背面
await shot('02-gate-from-inside.png');
await view(0, 3.6, 36.0, 0, 3.0, 21.3); // 园外南望正门正面
await shot('03-gate-from-outside.png');
await view(0, 112, 14, 0, 0, -2);          // 高空俯瞰：四面墙合围全景
await shot('04-aerial-enclosure.png');
await view(0, 5.0, 8.0, -34, 3.0, 0);     // 园内西望西院墙
await shot('05-west-wall.png');
await view(0, 5.0, 8.0, 34, 3.0, 0);      // 园内东望东院墙
await shot('06-east-wall.png');
await view(4, 3.4, 25.0, -6, 0.6, 16.0);  // 原石舫所在水域（应为空旷水面）
await shot('07-boat-site-cleared.png');

// 3) 射线探针：正门中轴线自园外到园内的可站立面标高
const walk = [];
for (let z = 26.0; z >= 15.5; z -= 0.5) {
  const hits = await evaluate(`window.__dbgRay(0, 60, ${z}, 0, -1, 0)`);
  const low = hits.filter((h) => h.y < 1.2).map((h) => h.y);
  walk.push({ z: +z.toFixed(2), surface: low.length ? Math.max(...low) : null, hits: hits.slice(0, 4).map((h) => h.y) });
}

// 4) 四面墙闭合扫描：自园外以水平射线向北、向南、向东、向西打墙
const ring = [];
async function scan(dir, label) {
  const out = [];
  for (let t = -36; t <= 36; t += 3) {
    let expr;
    if (dir === 'N') expr = `window.__dbgRay(${t}, 3.0, 34, 0, 0, -1)`;
    else if (dir === 'S') expr = `window.__dbgRay(${t}, 3.0, -34, 0, 0, 1)`;
    else if (dir === 'E') expr = `window.__dbgRay(34, 3.0, ${t}, -1, 0, 0)`;
    else expr = `window.__dbgRay(-34, 3.0, ${t}, 1, 0, 0)`;
    const hits = await evaluate(expr);
    const first = hits[0] || null;
    out.push({ p: t, hitZ: first ? first.z : null, hitX: first ? first.x : null, hitY: first ? first.y : null, type: first ? first.t : null });
  }
  return { dir: label, out };
}
ring.push(await scan('N', 'radial-north-to-south'));
ring.push(await scan('S', 'radial-south-to-north'));
ring.push(await scan('E', 'radial-east-to-west'));
ring.push(await scan('W', 'radial-west-to-east'));

// 5) 原石舫处水面/岸线探针（判定无残留船体）
const boat = [];
for (const p of [[-4, 17.5], [-6, 14], [-2, 20], [-8, 12], [0, 18]]) {
  const hits = await evaluate(`window.__dbgRay(${p[0]}, 30, ${p[1]}, 0, -1, 0)`);
  boat.push({ x: p[0], z: p[1], hits: hits.slice(0, 6).map((h) => h.y) });
}

const report = { walk, ringResult: ring, boatSite: boat };
await writeFile(path.join(OUT, 'wrapgate-probe.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);