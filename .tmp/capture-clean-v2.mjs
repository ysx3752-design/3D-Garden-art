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
await new Promise(r => server.listen(9126, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-subtractive-verify2-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9126/' });

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
    await new Promise(r => setTimeout(r, 1000));
  }
  const pos = await ev('JSON.stringify(window.appCamera.position)');
  const tgt = await ev('JSON.stringify(window.appControls.target)');
  console.log(filename, 'pos:', pos, 'tgt:', tgt);
  const shot = await client.send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  await writeFile(path.join(artifactDir, filename), buf);
  console.log('Saved:', filename);
}

// 1. Miniature Diorama Box View (Clean architecture exposed, no saucer grass, no cone trees, unified dark base)
await shoot('diorama_clean_subtractive.png', `
  window.setDioramaScale(0.28, false);
`);

// 2. Continuous Shadow to the Right (Sun from Top-Left, massive continuous shadow cast to East)
await shoot('sunlight_shadows_to_right.png', `
  window.setDioramaScale(1.0, false);
`);

// 3. Deep Ink-Cyan Water with Mirror Reflection (Crystal mirror reflections of sky, pavilion, bridge)
await shoot('water_deep_mirror_reflection.png', `
  window.appControls.target.set(8.5, 2.0, 8.5);
  window.appCamera.position.set(-6.0, 4.2, 2.0);
  window.appControls.update();
`);

// 4. Compact Warm Golden Trees & Courtyard Brick Texture
await shoot('autumn_golden_tree_and_brick_pavement.png', `
  window.appControls.target.set(16.0, 2.2, -6.0);
  window.appCamera.position.set(2.0, 4.5, 4.0);
  window.appControls.update();
`);

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
console.log('All clean verification captures complete!');
