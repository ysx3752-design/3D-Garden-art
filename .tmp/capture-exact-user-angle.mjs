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
await new Promise(r => server.listen(9037, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-user-angle-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9037/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. Exact closeup matching media_1794134959017_a7b220a0.jpg
// Looking directly at the bridgehead landing plinth, steps, railings and rocks
await ev(`
  window.appControls.target.set(-13.0, 0.4, 1.5);
  window.appCamera.position.set(-14.0, 11.0, 8.5);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 500));
let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lotus_bridgehead_fixed_exact.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lotus_bridgehead_fixed_exact.png');

// 2. Full top-down overview of West Lake (showing Red 1, Red 2, Red 3, and Bridgehead)
await ev(`
  window.appControls.target.set(-12.5, 0.4, 9.5);
  window.appCamera.position.set(-14.5, 17.0, 15.0);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 500));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'lotus_full_west_lake_resolved.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved lotus_full_west_lake_resolved.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('Verification finished!');
process.exit(0);
