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
await new Promise(r => server.listen(9009, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-walls3-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9009/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

await ev('document.getElementById("btn-mode-walk").click()');
await new Promise(r => setTimeout(r, 400));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

async function captureShot(x, z, yaw, pitch, filename) {
  await ev(`window.appSetPlayer(${x}, ${z}, ${yaw}, ${pitch || 0})`);
  await new Promise(r => setTimeout(r, 350));
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  await writeFile(path.join(artifactDir, filename), Buffer.from(shot.data, 'base64'));
  console.log('Saved:', filename);
}

// West wall cracked-ice: position right in front of window at z = 9.5
await captureShot(-34.5, 9.5, -Math.PI / 2, 0.02, 'wall_west_cracked_ice_clear.png');

// North wall octagon: position right in front of north window at x = 13.5
await captureShot(13.5, -28.0, 0, 0.02, 'wall_north_octagon_clear.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
