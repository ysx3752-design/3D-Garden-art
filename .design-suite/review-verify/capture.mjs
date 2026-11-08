// 只读取证：不修改 index.html，仅生成带相机钩子的校验副本并截图
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite', 'review-verify');
const SHOTS = path.join(OUT, 'shots');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const hook = `
  window.__dbgCam = function (px, py, pz, tx, ty, tz, fov) {
    if (fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.position.set(px, py, pz);
    camera.lookAt(tx, ty, tz);
    controls.target.set(tx, ty, tz);
    controls.update();
    renderer.render(scene, camera);
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
await writeFile(path.join(OUT, 'verify.html'), verifyHtml, 'utf8');

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(OUT, 'verify.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8791, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-rv-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8791/verify.html' });
for (let i = 0; i < 150; i += 1) { await delay(120); if (await evaluate('document.readyState === "complete"').catch(() => false)) break; }
for (let i = 0; i < 150; i += 1) { if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break; await delay(120); }
await delay(1200);
console.log('hook:', await evaluate('typeof window.__dbgCam'));

async function shot(name) {
  const r = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(SHOTS, name), Buffer.from(r.data, 'base64'));
}
async function view(name, px, py, pz, tx, ty, tz, fov) {
  await evaluate(`window.__dbgCam(${px},${py},${pz},${tx},${ty},${tz}${fov ? ',' + fov : ''})`);
  await delay(450);
  await shot(name);
  console.log('shot', name);
}

await shot('00-initial-default.png');
await view('01-gate-front.png', 0, 4.0, 42, 0, 4.8, 21.3);
await view('02-gate-front-detail.png', 0, 2.8, 32.5, 0, 3.6, 21.3);
await view('03-gate-oblique.png', 18, 6.0, 33, 0, 4.2, 21.3);
await view('04-gate-back-inside.png', 0, 2.8, 9.5, 0, 3.6, 21.3);
await view('05-ring-N.png', 0, 3.2, 4, 0, 3.2, -60);
await view('06-ring-NE.png', 0, 3.2, 4, 44, 3.2, -44);
await view('07-ring-E.png', 0, 3.2, 4, 60, 3.2, 4);
await view('08-ring-SE.png', 0, 3.2, 4, 44, 3.2, 52);
await view('09-ring-S-gate.png', 0, 3.2, 4, 0, 3.2, 68);
await view('10-ring-SW.png', 0, 3.2, 4, -44, 3.2, 52);
await view('11-ring-W.png', 0, 3.2, 4, -60, 3.2, 4);
await view('12-ring-NW.png', 0, 3.2, 4, -44, 3.2, -44);
await view('13-corner-NW.png', -18, 3.4, -12, -38, 2.6, -32);
await view('14-corner-NE.png', 18, 3.4, -12, 38, 2.6, -32);
await view('15-southwall-outside-west.png', -18, 4.5, 31, -26, 2.8, 20);
await view('16-gate-wall-junction-west.png', -13, 4.2, 29, -7, 3.2, 20.3);
await view('17-leakwin-south.png', -20, 2.9, 27, -20, 2.3, 20);
await view('18-leakwin-east.png', 30, 2.9, -14, 38, 2.3, -14);
await view('19-pond-overview.png', 0, 15, 24, 0, 0, 2);
await view('20-corridor-lotus.png', -7, 3.6, 12, 0, 0.4, 5);
await view('21-boat-site.png', -3, 3.4, 24, -8, 0.6, 14, 55);
await view('22-eastwall-outside.png', 46, 4.5, 0, 38, 3.0, 0);
await view('23-northwall-outside.png', 0, 4.5, -46, 0, 3.0, -32);
await view('24-westwall-outside.png', -48, 4.5, 0, -38, 3.0, 0);

console.log('DONE');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
