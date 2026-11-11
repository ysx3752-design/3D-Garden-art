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
await new Promise(r => server.listen(9066, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-diorama-verify-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9066/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 1000));
console.log('Scene loaded successfully!');

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';

async function shoot(filename, setupCode) {
  if (setupCode) {
    await ev(setupCode);
    await new Promise(r => setTimeout(r, 1200));
  }
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  await writeFile(path.join(artifactDir, filename), buf);
  console.log('Saved:', filename);
}

// 1. Current size (当前大小 / 1:1 比例)
await shoot('diorama_full_scale_view.png', `
  document.getElementById('btn-mode-god').click();
`);

// 2. Click Miniature Diorama Button (微缩方格沙盘模式)
await shoot('diorama_mini_box_view.png', `
  document.getElementById('btn-mode-diorama').click();
`);

// 3. Different corner angle of the floating diorama box (Turntable view)
await shoot('diorama_mini_box_turntable.png', `
  window.appCamera.position.set(-68, 52, 60);
  window.appControls.target.set(0, 1.5, -6.0);
  window.appControls.update();
`);

// 4. Zoomed midway via the scale slider (0.65x)
await shoot('diorama_scale_slider_midway.png', `
  const slider = document.getElementById('diorama-scale-slider');
  slider.value = '0.65';
  slider.dispatchEvent(new Event('input'));
`);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
console.log('All diorama verification captures complete!');
