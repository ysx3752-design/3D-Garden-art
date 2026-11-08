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
await new Promise(r => server.listen(9044, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-dusk-verify2-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9044/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. Switch to dusk with window.setTime('dusk')
await ev(`
  window.setTime('dusk');
  window.appControls.target.set(0, 1.8, 4.0);
  window.appCamera.position.set(-18.0, 10.0, 24.0);
  window.appControls.update();
`);
// Wait for tween transition (900ms)
await new Promise(r => setTimeout(r, 1400));

let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_cinematic_dusk_golden_hour.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_cinematic_dusk_golden_hour.png');

// 2. Also capture Ghibli daytime noon
await ev(`
  window.setTime('noon');
  window.appControls.target.set(0, 1.8, 4.0);
  window.appCamera.position.set(-18.0, 10.0, 24.0);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 1400));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lighting_ghibli_noon.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lighting_ghibli_noon.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('Dusk and Noon verifications completed!');
process.exit(0);
