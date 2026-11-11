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
await new Promise(r => server.listen(9188, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-dump-south-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

await client.send('Page.navigate', { url: 'http://127.0.0.1:9188/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));

const res = await client.send('Runtime.evaluate', {
  expression: `
  (function() {
    const list = [];
    const v = new THREE.Vector3();
    window.appScene.traverse(obj => {
      if (obj.isMesh && obj.visible) {
        obj.getWorldPosition(v);
        // check any mesh with z > 25
        if (v.z > 25 && v.y > -2 && v.y < 3) {
          list.push({
            name: obj.name,
            geo: obj.geometry?.type,
            pos: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) },
            color: obj.material?.color ? '#' + obj.material.color.getHexString() : null,
            count: obj.isInstancedMesh ? obj.count : 1
          });
        }
      }
    });
    return list;
  })()
  `,
  returnByValue: true
});

console.log('Meshes with z > 25:', JSON.stringify(res?.result?.value, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
