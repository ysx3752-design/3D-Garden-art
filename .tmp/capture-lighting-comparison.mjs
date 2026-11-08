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
await new Promise(r => server.listen(9042, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-light-verify-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9042/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. Shinkai / Ghibli Daytime Overview (Overview showing sunlight, shadows on water and walls, anime sky)
await ev(`
  window.appControls.target.set(0, 2.0, 5.0);
  window.appCamera.position.set(-16.0, 11.5, 26.0);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 700));
let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_ghibli_daytime_overview.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_ghibli_daytime_overview.png');

// 2. Clear elongated shadows on water and pavilion
await ev(`
  window.appControls.target.set(6.0, 1.2, 8.5);
  window.appCamera.position.set(-3.0, 5.5, 16.5);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 700));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_elongated_shadows_pavilion.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_elongated_shadows_pavilion.png');

// 3. Clear shadows on white walls (plaster walls receiving tree & eave shadows)
await ev(`
  window.appControls.target.set(0, 3.5, -12.0);
  window.appCamera.position.set(0, 5.5, 8.0);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 700));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_shadows_on_white_walls.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_shadows_on_white_walls.png');

// 4. Cinematic Dusk / Golden Hour (高级黄昏电影感)
await ev(`
  // Trigger dusk on sundial
  const duskBtn = Array.from(document.querySelectorAll('.quadrant')).find(q => q.textContent.includes('黄昏'));
  if (duskBtn) duskBtn.click();
`);
await new Promise(r => setTimeout(r, 1200));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_cinematic_dusk_golden_hour.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_cinematic_dusk_golden_hour.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('All lighting captures finished!');
process.exit(0);
