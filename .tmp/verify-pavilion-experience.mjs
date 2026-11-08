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
await new Promise(r => server.listen(9040, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-pav-verify-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9040/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

// 1. Overhead view matching user's photo angle
await ev(`
  window.appControls.target.set(5.5, 0.5, 8.5);
  window.appCamera.position.set(5.5, 12.0, 3.2);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 600));
let shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'pavilion_overhead_lantern_fixed.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved pavilion_overhead_lantern_fixed.png');

// 2. Interior view showing stone table, chessboard, stones, bowls, and cushions
await ev(`
  window.appControls.target.set(8.5, 1.48, 8.5);
  window.appCamera.position.set(6.8, 2.3, 7.0);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 600));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'pavilion_chessboard_and_cushions.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved pavilion_chessboard_and_cushions.png');

// 3. Close-up on the chessboard, Yunzi stones, and bowls
await ev(`
  window.appControls.target.set(8.5, 1.48, 8.5);
  window.appCamera.position.set(8.1, 2.05, 7.6);
  window.appControls.update();
`);
await new Promise(r => setTimeout(r, 600));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'pavilion_chessboard_closeup.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved pavilion_chessboard_closeup.png');

// 4. Sitting down in first-person mode
await ev(`
  window.sitDown('south');
`);
await new Promise(r => setTimeout(r, 600));
shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'pavilion_sitting_player_view.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved pavilion_sitting_player_view.png');

const isSit = await ev('window.isSitting()');
console.log('Is player sitting:', isSit);

await ev('window.standUp()');
const isSitAfterStand = await ev('window.isSitting()');
console.log('Is player sitting after stand up:', isSitAfterStand);

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('All verifications finished!');
process.exit(0);
