// 只读取证：猫与仙鹤的落地支撑与净距审计（不改动交付产物）。
// ① 每个个体正下方首层实体是否为地坪（而非水面/石体/屋体）；② 体周 12 向 × 3 高度的最小净距是否被石/丛穿插。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots-critter');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const hook = `
  window.__isDesc = function (obj, root) { var n = obj; while (n) { if (n === root) return true; n = n.parent; } return false; };
  window.__dbgCam = function (px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz);
    controls.target.set(tx, ty, tz); controls.update(); renderer.render(scene, camera);
  };
  window.__probeSpot = function (x, z, own) {
    var skip = function (o) { return o.type === 'Points' || (own && window.__isDesc(o, own)); };
    var down = new THREE.Raycaster(new THREE.Vector3(x, 20, z), new THREE.Vector3(0, -1, 0), 0, 60);
    var hs = down.intersectObjects(scene.children, true).filter(function (h) { return !skip(h.object); });
    var floor = null, water = false, obstructed = false;
    for (var i = 0; i < hs.length; i++) {
      var y = hs[i].point.y;
      if (y <= 0.25) { floor = y; break; }
      if (y > 0.2 && y < 0.55) water = true;
      if (y >= 0.25 && y <= 1.6) obstructed = true;
    }
    var minClear = 99;
    for (var a = 0; a < 12; a++) {
      for (var k = 0; k < 3; k++) {
        var ang = a * Math.PI / 6, y0 = [0.18, 0.45, 0.9][k];
        var rc = new THREE.Raycaster(new THREE.Vector3(x, y0, z),
          new THREE.Vector3(Math.sin(ang), 0, Math.cos(ang)), 0, 3.0);
        var hh = rc.intersectObjects(scene.children, true).filter(function (h) { return !skip(h.object); });
        if (hh.length && hh[0].distance < minClear) minClear = hh[0].distance;
      }
    }
    return { x: x, z: z, floor: floor === null ? null : +floor.toFixed(3), water: water,
             obstructed: obstructed, minClear: +minClear.toFixed(2) };
  };
  window.__critterAudit = function () {
    var out = [];
    for (var i = 0; i < critters.length; i++) {
      var c = critters[i], own = c.group;
      var r = window.__probeSpot(c.x, c.z, c.group);
      out.push({ name: c.name, kind: c.kind, x: c.x, z: c.z, floor: r.floor, water: r.water,
                 obstructed: r.obstructed, minClear: r.minClear });
    }
    return out;
  };
`;
const tag = '<script data-static-export-source="app.js">';
const a0 = html.indexOf(tag), a1 = html.indexOf('</script>', a0);
const blk = html.slice(a0, a1);
const ti = blk.lastIndexOf('})();');
const verify = html.slice(0, a0) + blk.slice(0, ti) + hook + blk.slice(ti) + html.slice(a1);
await writeFile(path.join(OUT, 'verify-critter.html'), verify, 'utf8');
await mkdir(SHOTS, { recursive: true });

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(OUT, 'verify-critter.html'))); }
  catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(8811, '127.0.0.1', r));
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-critter-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8811/verify-critter.html' });
for (let i = 0; i < 240; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(900);

const audit = await evaluate('window.__critterAudit()');
console.log(JSON.stringify(audit, null, 1));
const holes = [];
for (let x = -20; x <= 6; x += 2) { for (let z = -31.2; z <= -27; z += 1.2) { holes.push(await evaluate(`window.__probeSpot(${x}, ${z})`)); } }
for (let x = 22; x <= 36; x += 3) { for (let z = -20; z <= 18; z += 3) { holes.push(await evaluate(`window.__probeSpot(${x}, ${z})`)); } }
for (let x = -36; x <= -22; x += 3) { for (let z = -20; z <= 18; z += 3) { holes.push(await evaluate(`window.__probeSpot(${x}, ${z})`)); } }
const best = holes.filter((h) => h.floor !== null && h.floor <= 0.1 && !h.water && !h.obstructed && h.minClear >= 0.55);
console.log('候选空位（floor≤0.1 无遮挡 净距≥0.55）', best.length, JSON.stringify(best));
await writeFile(path.join(OUT, 'critter-audit.json'), JSON.stringify(audit, null, 2) + '\n', 'utf8');

// 特写取景：逐只对准，便于视觉核对是否被石/草半遮挡
async function view(px, py, pz, tx, ty, tz) {
  await evaluate(`window.__dbgCam(${px}, ${py}, ${pz}, ${tx}, ${ty}, ${tz})`);
  await delay(260);
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  return r.data;
}
for (const item of audit) {
  const dx = item.x > 0 ? -3.4 : 3.4;
  const data = await view(item.x + dx, 1.5, item.z + 3.6, item.x, 0.45, item.z);
  await writeFile(path.join(SHOTS, `${item.kind}-${item.name}.png`), Buffer.from(data, 'base64'));
}
console.log('shots saved:', audit.length);
console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);