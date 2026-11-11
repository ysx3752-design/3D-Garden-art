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
await new Promise(r => server.listen(9136, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-outside-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

await client.send('Page.navigate', { url: 'http://127.0.0.1:9136/' });
for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));

const outsideMeshes = await ev(`
  (function() {
    const out = [];
    const v = new THREE.Vector3();
    const sc = window.appScene || scene;
    if (!sc) return "NO_SCENE";
    sc.traverse(obj => {
      if (obj.isMesh && obj.visible) {
        obj.getWorldPosition(v);
        // dioroma box: X in [-42, 42], Z in [-48, 36]
        if (v.z > 36.5 || v.z < -48.5 || v.x < -42.5 || v.x > 42.5) {
          out.push({
            type: obj.geometry?.type,
            pos: { x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) },
            scale: obj.scale ? { x: +obj.scale.x.toFixed(2), y: +obj.scale.y.toFixed(2), z: +obj.scale.z.toFixed(2) } : null,
            name: obj.name
          });
        }
      }
    });
    return out;
  })()
`);

console.log('Outside meshes:', JSON.stringify(outsideMeshes, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
