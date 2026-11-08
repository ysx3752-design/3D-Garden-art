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
await new Promise(r => server.listen(8998, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-corridor-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8998/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

// Switch to walk mode
await ev('document.getElementById("btn-mode-walk").click()');
await delay(500);

// Capture initial view in the newly raised corridor
const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'corridor_raised_spacious.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved corridor_raised_spacious.png');

// Walk north towards the main hall
console.log('Walking north through corridor towards main hall door...');
// Initial pos is (0, 2.21, 13.5). We need to move from z=13.5 down to z=-4.0 (distance of 17.5m)
// Press W for ~4.5 seconds with sprint (speed ~5.2 m/s)
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'ShiftLeft', key: 'Shift' });
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
await delay(3800);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'ShiftLeft', key: 'Shift' });
await delay(500);

const posAfterSprint = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Camera pos after walking north:', JSON.stringify(posAfterSprint));

// Capture screenshot near the steps / main hall
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'main_hall_approach.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved main_hall_approach.png');

// Continue walking forward onto the terrace right in front of the door
console.log('Approaching right in front of the main hall door...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
await delay(1200);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await delay(500);

const posAtDoor = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Camera pos at main hall door:', JSON.stringify(posAtDoor));

shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'main_hall_door_reached.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved main_hall_door_reached.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('All corridor and entrance tests completed successfully!');
process.exit(0);
