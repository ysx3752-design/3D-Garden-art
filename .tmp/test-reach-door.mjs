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
await new Promise(r => server.listen(8999, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-door-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8999/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

// Switch to walk mode
await ev('document.getElementById("btn-mode-walk").click()');
await delay(300);

// Hold W keydown until player reaches z <= -3.8 (right in front of main hall door)
console.log('Driving W key until reaching main hall door...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });

for (let step = 0; step < 80; step++) {
  await delay(200);
  const z = await ev('window.appCamera ? window.appCamera.position.z : 99');
  const y = await ev('window.appCamera ? window.appCamera.position.y : 0');
  console.log(`Step ${step}: z=${z?.toFixed(2)}, y=${y?.toFixed(2)}`);
  if (z !== null && z <= -3.8) {
    console.log('Reached main hall door!');
    break;
  }
}

await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
await delay(400);

const finalPos = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Final position at main hall entrance:', JSON.stringify(finalPos));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
const shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'main_hall_doorstep.png'), Buffer.from(shot.data, 'base64'));
console.log('Screenshot saved: main_hall_doorstep.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
