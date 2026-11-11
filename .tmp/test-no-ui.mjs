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
await new Promise(r => server.listen(9193, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-match2-'));
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

await client.send('Page.navigate', { url: 'http://127.0.0.1:9193/' });
for (let i = 0; i < 200; i++) {
  const done = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done") === "true"', returnByValue: true });
  if (done?.result?.value) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));

// Completely hide all DOM elements except canvas
await client.send('Runtime.evaluate', {
  expression: `
    const stage = document.getElementById('stage');
    Array.from(document.body.children).forEach(el => {
      if (el !== stage) el.style.display = 'none';
    });
    Array.from(stage.children).forEach(el => {
      if (el.tagName !== 'CANVAS') el.style.display = 'none';
    });
    window.switchViewMode('diorama');
    window.setDioramaScale(0.28, true);
    // User camera angle:
    // Let's set it to exact user view:
    window.appCamera.position.set(0, 68, 76);
    window.appControls.target.set(0, 0, -6);
    window.appControls.update();
  `
});
await new Promise(r => setTimeout(r, 600));

const shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/test_no_ui.png', Buffer.from(shot.data, 'base64'));
console.log('Saved test_no_ui.png');

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
