import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const server = createServer(async (req, res) => {
  try {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile('index.html'));
  } catch (e) {
    res.writeHead(404).end('nf');
  }
});
await new Promise(r => server.listen(9088, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-render-upgrade-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

await client.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:9088/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));
console.log('Scene loaded successfully!');

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

async function shoot(filename, setupCode) {
  if (setupCode) {
    await ev(setupCode);
    await new Promise(r => setTimeout(r, 1200));
  }
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  await writeFile(path.join(artifactDir, filename), buf);
  console.log('Saved:', filename);
}

// 1. Water Upgrade Focus: Luminous cyan-green, sky & pavilion reflection, elongated shadows
await shoot('upgraded_water_reflection_and_light.png', `
  window.appControls.target.set(-9.0, 2.0, 16.5);
  window.appCamera.position.set(2.0, 2.8, 3.5);
  window.appControls.update();
`);

// 2. Full scale courtyard overview: Morning light, soft blue shadows, fog, textured ground
await shoot('upgraded_courtyard_overview.png', `
  window.appControls.target.set(0, 2.0, 5.0);
  window.appCamera.position.set(-16.0, 11.5, 26.0);
  window.appControls.update();
`);

// 3. Floating Miniature Diorama Box View: Clean square island, soft fog, clustered pines, turquoise water
await shoot('upgraded_diorama_miniature_view.png', `
  document.getElementById('btn-mode-diorama').click();
`);

// 4. Clustered Pines & Ground texture close-up
await shoot('upgraded_ground_and_vegetation.png', `
  window.appControls.target.set(-28.0, 2.5, -34.0);
  window.appCamera.position.set(-15.0, 8.5, -15.0);
  window.appControls.update();
`);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
console.log('All upgraded rendering captures complete!');
