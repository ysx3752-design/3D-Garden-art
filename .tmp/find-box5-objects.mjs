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
await new Promise(r => server.listen(9166, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-box5-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 1024,
  height: 712,
  deviceScaleFactor: 1,
  mobile: false
});

await client.send('Page.navigate', { url: 'http://127.0.0.1:9166/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

// Set camera to user view
const matched = await client.send('Runtime.evaluate', {
  expression: `
  (function() {
    // switch to diorama mode if needed or position camera
    camera.position.set(0, 65, 75);
    controls.target.set(0, 0, -6);
    controls.update();
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();

    const w = 1024, h = 712;
    const results = [];
    const v = new THREE.Vector3();

    window.appScene.traverse(obj => {
      if (obj.isMesh && obj.visible) {
        obj.getWorldPosition(v);
        const p = v.clone().project(camera);
        const sx = (p.x * 0.5 + 0.5) * w;
        const sy = (-(p.y * 0.5) + 0.5) * h;
        // Check if screen pos in [400..660, 650..712]
        if (sx >= 400 && sx <= 660 && sy >= 650 && sy <= 720) {
          results.push({
            name: obj.name,
            geo: obj.geometry?.type,
            worldPos: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) },
            screenPos: { x: +sx.toFixed(1), y: +sy.toFixed(1) },
            parentName: obj.parent?.name || obj.parent?.type
          });
        }
      }
    });
    return results;
  })()
  `,
  returnByValue: true
});

console.log('Box 5 candidates:', JSON.stringify(matched?.result?.value, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
