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
await new Promise(r => server.listen(9195, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-audit-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

await client.send('Page.navigate', { url: 'http://127.0.0.1:9195/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));

const auditRes = await client.send('Runtime.evaluate', {
  expression: `
  (function() {
    const box = new THREE.Box3();
    const vMin = new THREE.Vector3();
    const vMax = new THREE.Vector3();
    const issues = [];

    // Diorama pedestal bounds:
    // X: [-42, 42]
    // Z: [-48, 36]
    // Top surface: Y = 0 (meshes sit on or above Y=0)
    // Pedestal base goes down to Y = -7.2
    
    // We check all objects in scene EXCEPT celestial, sky, stars, waterMirror
    window.appScene.traverse(obj => {
      if (obj.isMesh && obj.visible) {
        if (obj.geometry?.type === 'SphereGeometry' && obj.geometry?.parameters?.radius > 500) return;
        if (obj.name === 'stars' || obj.name === 'celestial') return;

        // Check if part of dioramaGroup
        let p = obj;
        let isDioramaStructure = false;
        while (p) {
          if (p.name === 'dioramaGroup' || p === window.dioramaGroup) {
            isDioramaStructure = true;
            break;
          }
          p = p.parent;
        }

        box.setFromObject(obj);
        vMin.copy(box.min);
        vMax.copy(box.max);

        // Check horizontal bounds:
        const xOut = vMin.x < -42.2 || vMax.x > 42.2;
        const zOut = vMin.z < -48.2 || vMax.z > 36.2;
        
        // Check if below pedestal ground (Y < -0.2) when not diorama structure
        const yBelow = !isDioramaStructure && vMin.y < -0.15;

        if (xOut || zOut || yBelow) {
          issues.push({
            name: obj.name,
            geo: obj.geometry?.type,
            min: { x: +vMin.x.toFixed(2), y: +vMin.y.toFixed(2), z: +vMin.z.toFixed(2) },
            max: { x: +vMax.x.toFixed(2), y: +vMax.y.toFixed(2), z: +vMax.z.toFixed(2) },
            parentName: obj.parent?.name || obj.parent?.type,
            isDioramaStructure
          });
        }
      }
    });

    return issues;
  })()
  `,
  returnByValue: true
});

console.log('Detected Bounds Violations:');
console.log(JSON.stringify(auditRes?.result?.value, null, 2));

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
