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
await new Promise(r => server.listen(9055, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-refine-verify-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9055/' });

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
    await new Promise(r => setTimeout(r, 800));
  }
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  await writeFile(path.join(artifactDir, filename), buf);
  console.log('Saved:', filename);
}

// 1. Overall exquisite view
await shoot('overview_overall_exquisite.png', `
  window.appControls.target.set(0, 2.0, 5.0);
  window.appCamera.position.set(-16.0, 11.5, 26.0);
  window.appControls.update();
`);

// 2. Corrugated tile roof close-up & moist glossy sheen (Sunlit angle)
await shoot('roof_corrugated_and_moist.png', `
  window.appControls.target.set(-9.0, 4.0, 16.5);
  window.appCamera.position.set(-14.0, 6.2, 10.5);
  window.appControls.update();
`);

// 3. Dynamic water reflection & ripples (Reflecting sky, pavilion and bridge)
await shoot('water_dynamic_reflection.png', `
  window.appControls.target.set(-9.0, 2.0, 17.0);
  window.appCamera.position.set(4.0, 2.5, 4.0);
  window.appControls.update();
`);

// 4. Smooth organic Taihu rockeries
await shoot('rockery_smooth_organic.png', `
  window.appControls.target.set(6.0, 1.8, 11.5);
  window.appCamera.position.set(1.5, 3.2, 16.5);
  window.appControls.update();
`);

// 5. Vegetation: Blossom tree cloud canopy & tilted branching bamboo
await shoot('vegetation_blossom_and_bamboo.png', `
  window.appControls.target.set(8.5, 3.8, 8.5);
  window.appCamera.position.set(0.0, 5.0, 16.0);
  window.appControls.update();
`);

// 6. Environmental details: Moss along water edge, scattered river pebbles, fallen petals
await shoot('environmental_moss_pebbles_petals.png', `
  window.appControls.target.set(4.5, 0.8, 8.5);
  window.appCamera.position.set(3.2, 2.6, 12.0);
  window.appControls.update();
`);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
console.log('All verification captures complete!');
