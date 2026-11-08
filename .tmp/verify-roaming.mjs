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
await new Promise(r => server.listen(8995, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-roam-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8995/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

console.log('1. Testing Walk View...');
await ev('document.getElementById("btn-mode-walk").click()');
await delay(1000);
const view1 = await ev('document.body.getAttribute("data-view")');
console.log('Current view:', view1);

const walkShot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/walk_view.png', Buffer.from(walkShot.data, 'base64'));
console.log('Captured .tmp/walk_view.png');

console.log('Simulating walking forward (W key)...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
await delay(1200);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await delay(500);

const walkAfterShot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/walk_forward.png', Buffer.from(walkAfterShot.data, 'base64'));
console.log('Captured .tmp/walk_forward.png');

console.log('2. Testing Auto Tour View...');
await ev('document.getElementById("btn-mode-tour").click()');
await delay(2500);
const view2 = await ev('document.body.getAttribute("data-view")');
console.log('Current view after tour click:', view2);

const tourShot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/tour_view.png', Buffer.from(tourShot.data, 'base64'));
console.log('Captured .tmp/tour_view.png');

console.log('3. Testing God View switch back...');
await ev('document.getElementById("btn-mode-god").click()');
await delay(1000);
const view3 = await ev('document.body.getAttribute("data-view")');
console.log('Current view after god click:', view3);

const godShot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/god_view.png', Buffer.from(godShot.data, 'base64'));
console.log('Captured .tmp/god_view.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
