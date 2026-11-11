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
await new Promise(r => server.listen(9191, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-who5-'));
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

await client.send('Page.navigate', { url: 'http://127.0.0.1:9191/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const hit = await client.send('Runtime.evaluate', {
  expression: `
  (function() {
    // Look at camera in scene
    // In index.html, camera is at DIORAMA_CAM_POS or user moved it
    // Let's check window.appScene or camera
    // We want to find the camera:
    let cam = null;
    window.appScene.traverse(obj => {
      if (obj.isCamera) cam = obj;
    });
    // If not found in traverse, let's find camera from WebGLRenderer or global
    // Notice camera was instantiated in app.js: camera = new THREE.PerspectiveCamera(...)
    // Let's find camera from controls or scene
    return {
      hasScene: !!window.appScene
    };
  })()
  `,
  returnByValue: true
});

console.log('Result:', hit?.result?.value);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
