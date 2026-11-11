// 只读取证：点击拾取与漫步靠近两种触发路径、诗词归属与随机性、卡片自动淡出；不改动交付产物。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);
const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const hook = `
  window.__dbgCam = function (px, py, pz, tx, ty, tz) {
    camera.position.set(px, py, pz); camera.lookAt(tx, ty, tz);
    controls.target.set(tx, ty, tz); controls.update(); renderer.render(scene, camera);
  };
  window.__critList = function () {
    return critters.map(function (c) {
      var v = new THREE.Vector3(c.x, 0.4, c.z).project(camera);
      var r = renderer.domElement.getBoundingClientRect();
      return { name: c.name, kind: c.kind, x: c.x, z: c.z,
        px: (v.x * 0.5 + 0.5) * r.width + r.x, py: (-v.y * 0.5 + 0.5) * r.height + r.y };
    });
  };
  window.__projPoint = function (x, y, z) {
    var v = new THREE.Vector3(x, y, z).project(camera);
    var r = renderer.domElement.getBoundingClientRect();
    return { px: (v.x * 0.5 + 0.5) * r.width + r.x, py: (-v.y * 0.5 + 0.5) * r.height + r.y };
  };
  window.__poemState = function () {
    var el = document.getElementById('poem-card');
    return { hidden: el.hidden, visible: el.classList.contains('is-visible'),
      kind: el.getAttribute('data-kind'), seal: document.getElementById('poem-seal').textContent,
      body: document.getElementById('poem-body').textContent,
      source: document.getElementById('poem-source').textContent };
  };
  window.__catPoems = POEMS.cat.map(function (p) { return p.source; });
  window.__cranePoems = POEMS.crane.map(function (p) { return p.source; });
  window.__setMode = function (mode) { switchViewMode(mode); };
`;
const tag = '<script data-static-export-source="app.js">';
const a0 = html.indexOf(tag), a1 = html.indexOf('</script>', a0);
const blk = html.slice(a0, a1);
const ti = blk.lastIndexOf('})();');
const verify = html.slice(0, a0) + blk.slice(0, ti) + hook + blk.slice(ti) + html.slice(a1);
await writeFile(path.join(OUT, 'verify-poem.html'), verify, 'utf8');

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(OUT, 'verify-poem.html'))); }
  catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(8812, '127.0.0.1', r));
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-poem-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8812/verify-poem.html' });
for (let i = 0; i < 240; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false)) break; await delay(150); }
await delay(900);

const initial = await evaluate('window.__poemState()');
console.log('初始卡片:', JSON.stringify(initial));

async function tapAt(x, y) {
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y, button: 'none' });
  await delay(60);
  await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await delay(90);
  await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  await delay(320);
}

const catPoems = await evaluate('window.__catPoems');
const cranePoems = await evaluate('window.__cranePoems');

// ① 漫步模式靠近一只猫 → 应弹出猫题材诗词
await evaluate('window.__setMode("walk")');
await delay(300);
await evaluate('window.appSetPlayer(2, -27.6, 0, 0)');
await delay(1500);
const s5 = await evaluate('window.__poemState()');
console.log('漫步靠近:', JSON.stringify(s5));

// ② 点击一只鹤（开阔处的青皋）
await evaluate('window.__setMode("god")');
await delay(200);
await evaluate('window.__dbgCam(30.6, 1.15, 17.6, 30.6, 1.02, 12)');
await delay(2600);
const cb = await evaluate('window.__projPoint(30.6, 0.74, 12)');
console.log('  元素命中:', await evaluate(`(()=>{const el=document.elementFromPoint(${Math.round(cb.px)},${Math.round(cb.py)});return el?el.tagName+'#'+el.id:null;})()`));
console.log('青皋躯干投影:', Math.round(cb.px), Math.round(cb.py));
await tapAt(cb.px, cb.py);
const s4 = await evaluate('window.__poemState()');
console.log('鹤点击:', JSON.stringify(s4));

// ③ 从假山后方近距离点击一只猫（有清晰视线），连点三次验证不重复
await evaluate('window.__dbgCam(2, 0.95, -31.5, 2, 0.88, -29)');
await delay(1500);
const cp = await evaluate('window.__projPoint(2, 0.4, -29)');
console.log('狸奴躯干投影:', Math.round(cp.px), Math.round(cp.py));
await tapAt(cp.px, cp.py);
const s1 = await evaluate('window.__poemState()');
console.log('点击后:', JSON.stringify(s1));
await delay(1400);
await tapAt(cp.px, cp.py);
const s2 = await evaluate('window.__poemState()');
console.log('第二次:', JSON.stringify(s2));
await delay(1400);
await tapAt(cp.px, cp.py);
const s3 = await evaluate('window.__poemState()');
console.log('第三次:', JSON.stringify(s3));

// ④ 视线被叠石挡住时点击不应触发（相机退回假山南侧）
await evaluate("document.getElementById('poem-close').click()");
await delay(700);
await evaluate('window.__dbgCam(2, 1.5, -24.4, 2, 0.35, -29)');
await delay(320);
const blockedBefore = await evaluate('window.__poemState()');
await delay(1300);
await tapAt(cp.px, cp.py);
const blockedAfter = await evaluate('window.__poemState()');
console.log('被石遮挡点击:', blockedBefore.hidden, '→', blockedAfter.hidden);

// ⑤ 自动淡出：离开动物触发范围后静候
await evaluate('window.appSetPlayer(0, 14, 0, 0)');
await evaluate('window.__setMode("god")');
await delay(9000);
const s6 = await evaluate('window.__poemState()');
console.log('9 秒后:', JSON.stringify(s6));

// ⑥ 拖拽不应误触发
await evaluate('window.__dbgCam(30.6, 1.15, 17.6, 30.6, 1.02, 12)');
await delay(320);
const before = await evaluate('window.__poemState()');
const cb2 = await evaluate('window.__projPoint(30.6, 0.74, 12)');
await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cb2.px, y: cb2.py, button: 'left', clickCount: 1 });
for (let i = 1; i <= 6; i += 1) {
  await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cb2.px + i * 10, y: cb2.py, button: 'left' });
  await delay(40);
}
await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cb2.px + 60, y: cb2.py, button: 'left', clickCount: 1 });
await delay(500);
const after = await evaluate('window.__poemState()');
console.log('拖拽前后:', before.hidden, '→', after.hidden);
const crane2 = await evaluate('window.__projPoint(30.6, 0.74, 12)');
await tapAt(crane2.px, crane2.py);
const s7 = await evaluate('window.__poemState()');
console.log('拖拽后单击:', JSON.stringify(s7));

const verdict = {
  cardExists: Boolean(initial) && initial.hidden === true,
  walkProximityTriggers: s5.visible === true && s5.kind === 'cat' && catPoems.some((p) => s5.source.indexOf(p) === 0),
  craneClickTriggers: s4.visible === true && s4.kind === 'crane' && cranePoems.some((p) => s4.source.indexOf(p) === 0),
  catClickTriggers: s1.visible === true && s1.kind === 'cat' && catPoems.some((p) => s1.source.indexOf(p) === 0),
  noConsecutiveRepeat: s1.body !== s2.body && s2.body !== s3.body,
  occludedClickIgnored: blockedAfter.hidden === true,
  autoHide: s6.hidden === true,
  dragDoesNotTrigger: before.hidden === true && after.hidden === true,
  clickStillWorksAfterDrag: s7.visible === true && s7.kind === 'crane'
};
console.log('结论:', JSON.stringify(verdict, null, 1));
await writeFile(path.join(OUT, 'poem-evidence.json'), JSON.stringify({ initial, s1, s2, s3, s4, s5, s6, s7, blockedBefore, blockedAfter, verdict }, null, 2) + '\n', 'utf8');
const errs = await evaluate('window.__DESIGN_SUITE_STATIC_ERRORS__ ? window.__DESIGN_SUITE_STATIC_ERRORS__.length : -1');
console.log('页面错误计数:', errs);
console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);