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
await new Promise(r => server.listen(9022, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-lotus-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9022/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. Top-down view matching the user's uploaded picture
// Looking down at the West pool basin (stepping stones, boat, bridge, and corridor)
await ev(`
  controls.enabled = false;
  camera.position.set(-11.5, 13.5, 12.0);
  camera.lookAt(-12.5, 0.34, 6.5);
  controls.target.set(-12.5, 0.34, 6.5);
`);
await new Promise(r => setTimeout(r, 450));
let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lotus_west_overhead.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lotus_west_overhead.png');

// 2. View showing BOTH sides of the platform/bridge (looking from west bank)
await ev(`
  camera.position.set(-24.5, 8.5, 5.0);
  camera.lookAt(-10.0, 1.2, 5.0);
  controls.target.set(-10.0, 1.2, 5.0);
`);
await new Promise(r => setTimeout(r, 450));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lotus_platform_both_sides.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lotus_platform_both_sides.png');

// 3. Walk mode on stepping stones looking at the newly balanced lotus pond
await ev('document.getElementById("btn-mode-walk").click()');
await new Promise(r => setTimeout(r, 400));
await ev('window.appSetPlayer(-17.5, 11.8, 1.1, -0.15)'); // standing on middle stepping stone looking east
await new Promise(r => setTimeout(r, 400));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lotus_stepping_stone_view.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lotus_stepping_stone_view.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('All lotus screenshots captured successfully!');
process.exit(0);
