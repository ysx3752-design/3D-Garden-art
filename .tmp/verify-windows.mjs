import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const server = createServer(async (req, res) => {
  try {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(await readFile('index.html'));
  } catch (e) {
    res.writeHead(404).end('nf');
  }
});
await new Promise(r => server.listen(9003, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-win-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9003/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. South Wall Fan Windows (viewed from corridor looking south)
await ev('document.getElementById("btn-mode-walk").click()');
await delay(300);

// Rotate view 180 degrees to look South towards South Wall & Fan windows
await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 400, button: 'left', clickCount: 1 });
await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 180, y: 400 });
await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 180, y: 400, button: 'left' });
await delay(300);

let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'wall_south_fan_windows.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved wall_south_fan_windows.png');

// 2. West Wall Cracked-ice Windows (viewed looking west)
await client.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 640, y: 400, button: 'left', clickCount: 1 });
await client.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 880, y: 400 });
await client.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 880, y: 400, button: 'left' });
await delay(300);

shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'wall_west_cracked_ice.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved wall_west_cracked_ice.png');

// 3. Switch to God view to inspect the overall garden wall layout with carved windows
await ev('document.getElementById("btn-mode-god").click()');
await delay(400);

shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'wall_windows_overview.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved wall_windows_overview.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('Window tests finished successfully!');
process.exit(0);
