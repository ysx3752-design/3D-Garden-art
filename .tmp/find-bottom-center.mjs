import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const server = createServer(async (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(await readFile('index.html'));
});
await new Promise(r => server.listen(9140, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-insp3-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

await client.send('Page.navigate', { url: 'http://127.0.0.1:9140/' });
for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1200));

// Set camera to diorama scale 0.28
await ev(`window.setDioramaScale(0.28, false);`);
await new Promise(r => setTimeout(r, 500));

// Check what projects to bottom center of screen (normalized device coordinates: X near 0, Y near -0.85 to -1.0)
const bottomObjects = await ev(`
  (function() {
    var scene = window.appScene;
    var camera = window.appCamera;
    var list = [];
    var v = new THREE.Vector3();
    
    scene.traverse(function(obj) {
      if ((obj.isMesh || obj.isInstancedMesh) && obj.visible) {
        obj.getWorldPosition(v);
        var proj = v.clone().project(camera);
        // Screen NDC: proj.x in [-1, 1], proj.y in [-1, 1]
        // Bottom center: proj.x between -0.4 and 0.4, proj.y between -1.0 and -0.7
        if (proj.x >= -0.4 && proj.x <= 0.4 && proj.y >= -1.05 && proj.y <= -0.65) {
          list.push({
            type: obj.geometry ? obj.geometry.type : 'unknown',
            name: obj.name || (obj.parent ? obj.parent.name : ''),
            worldPos: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) },
            proj: { x: +proj.x.toFixed(2), y: +proj.y.toFixed(2), z: +proj.z.toFixed(2) }
          });
        }
      }
    });
    return list;
  })()
`);

console.log('Bottom center screen objects:', JSON.stringify(bottomObjects, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
