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
await new Promise(r => server.listen(9141, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-insp4-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

await client.send('Page.navigate', { url: 'http://127.0.0.1:9141/' });
for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1200));

await ev(`window.setDioramaScale(0.28, false);`);
await new Promise(r => setTimeout(r, 500));

// Capture screenshot without UI or with UI to compare directly with user's image
const shot = await client.send('Page.captureScreenshot', { format: 'png' });
const buf = Buffer.from(shot.data, 'base64');
const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
await import('node:fs/promises').then(fs => fs.writeFile(path.join(artifactDir, 'debug_user_angle.png'), buf));

// Now inspect all meshes that have y < -3.0 or z > 35
const deepMeshes = await ev(`
  (function() {
    var scene = window.appScene;
    var list = [];
    var v = new THREE.Vector3();
    scene.traverse(function(obj) {
      if ((obj.isMesh || obj.isInstancedMesh) && obj.visible) {
        obj.getWorldPosition(v);
        // Exclude the diorama pedestal's own box/bevel meshes
        if (obj.parent !== window.dioramaGroup) {
          if (v.y < -0.5 || v.z > 35.0 || v.x > 41.0 || v.x < -41.0) {
            list.push({
              name: obj.name,
              geom: obj.geometry ? obj.geometry.type : '',
              pos: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) }
            });
          }
        }
      }
    });
    return list;
  })()
`);

console.log('Deep / outside non-diorama meshes:', JSON.stringify(deepMeshes, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
