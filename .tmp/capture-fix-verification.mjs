import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const server = createServer(async (req, res) => {
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(await readFile('index.html'));
});
await new Promise(r => server.listen(9196, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-verify-fix-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 1024,
  height: 712,
  deviceScaleFactor: 1,
  mobile: false
});

await client.send('Page.navigate', { url: 'http://127.0.0.1:9196/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));

async function capture(filename, code) {
  await client.send('Runtime.evaluate', { expression: code });
  await new Promise(r => setTimeout(r, 600));
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const outPath = `C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/${filename}`;
  await writeFile(outPath, Buffer.from(shot.data, 'base64'));
  console.log(`Saved ${filename}`);
}

// 1. User exact view (South elevated overhead, matching user screenshot)
await capture('fixed_user_view.png', `
  window.switchViewMode('diorama');
  window.setDioramaScale(0.28, true);
  window.appCamera.position.set(0, 68, 76);
  window.appControls.target.set(0, 0, -6);
  window.appControls.update();
`);

// 2. Diorama classic bird's-eye view (with HUD)
await capture('fixed_diorama_overview.png', `
  window.switchViewMode('diorama');
  window.setDioramaScale(0.28, true);
  window.appCamera.position.set(68, 52, 60);
  window.appControls.target.set(0, 0, -6);
  window.appControls.update();
`);

// 3. West Wall & Pedestal inspection (proving zero clipping on left)
await capture('fixed_west_edge.png', `
  window.appCamera.position.set(-65, 30, -6);
  window.appControls.target.set(-20, 2, -6);
  window.appControls.update();
`);

// 4. East Wall & Pedestal inspection (proving zero clipping on right)
await capture('fixed_east_edge.png', `
  window.appCamera.position.set(65, 30, -6);
  window.appControls.target.set(20, 2, -6);
  window.appControls.update();
`);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
