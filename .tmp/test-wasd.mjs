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
await new Promise(r => server.listen(8996, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-wasd-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8996/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

// Switch to walk mode
await ev('document.getElementById("btn-mode-walk").click()');
await delay(500);

const pos0 = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Initial pos:', JSON.stringify(pos0));

// Press W
console.log('Pressing W for 1 second...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
await delay(1000);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await delay(200);

const posW = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Pos after W:', JSON.stringify(posW));

// Press A
console.log('Pressing A for 0.5s...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyA', key: 'a' });
await delay(500);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyA', key: 'a' });
await delay(200);

const posA = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Pos after A:', JSON.stringify(posA));

const shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/wasd_success.png', Buffer.from(shot.data, 'base64'));
console.log('Screenshot saved to .tmp/wasd_success.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
