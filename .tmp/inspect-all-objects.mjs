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
await new Promise(r => server.listen(9139, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-insp2-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

await client.send('Page.navigate', { url: 'http://127.0.0.1:9139/' });
for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1200));

// Find all objects in scene
const report = await ev(`
  (function() {
    var scene = window.appScene;
    if (!scene) return 'window.appScene is null';
    
    var list = [];
    var box = new THREE.Box3();
    var v = new THREE.Vector3();
    
    scene.traverse(function(obj) {
      if ((obj.isMesh || obj.isInstancedMesh) && obj.visible) {
        box.setFromObject(obj);
        // Pedestal bounds: X in [-42.2, 42.2], Y in [-7.5, 20], Z in [-48.2, 36.2]
        var outside = false;
        var reasons = [];
        if (box.min.x < -42.2 || box.max.x > 42.2) {
          outside = true;
          reasons.push('X outside: [' + box.min.x.toFixed(1) + ', ' + box.max.x.toFixed(1) + ']');
        }
        if (box.max.z > 36.2 || box.min.z < -48.2) {
          outside = true;
          reasons.push('Z outside: [' + box.min.z.toFixed(1) + ', ' + box.max.z.toFixed(1) + ']');
        }
        
        if (outside) {
          list.push({
            geom: obj.geometry ? obj.geometry.type : 'unknown',
            name: obj.name || (obj.parent ? obj.parent.name : ''),
            materialColor: obj.material && obj.material.color ? obj.material.color.getHexString() : '',
            reasons: reasons,
            pos: { x: +obj.position.x.toFixed(1), y: +obj.position.y.toFixed(1), z: +obj.position.z.toFixed(1) },
            box: {
              min: { x: +box.min.x.toFixed(1), y: +box.min.y.toFixed(1), z: +box.min.z.toFixed(1) },
              max: { x: +box.max.x.toFixed(1), y: +box.max.y.toFixed(1), z: +box.max.z.toFixed(1) }
            }
          });
        }
      }
    });
    return list;
  })()
`);

console.log('Outside report:', JSON.stringify(report, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
