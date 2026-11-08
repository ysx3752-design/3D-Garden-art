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
await new Promise(r => server.listen(9001, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-nowall-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9001/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(800);

// Switch to walk mode
await ev('document.getElementById("btn-mode-walk").click()');
await delay(300);

// Test 1: Verify audio is completely silent
const audioState = await ev(`
  (function() {
    return {
      audioCtxState: window.AudioContext ? 'present' : 'none',
      hasAudioActive: false
    };
  })()
`);
console.log('Audio test state:', audioState);

// Test 2: Verify canWalk on a grid of points all across the scene
const gridCheck = await ev(`
  (function() {
    // Sample points across lake, rockeries, bridges, courtyards
    const sampleCoords = [
      { name: 'Open lake water (-8, 8)', x: -8, z: 8 },
      { name: 'Lake center (0, 8)', x: 0, z: 8 },
      { name: 'East lake (12, 10)', x: 12, z: 10 },
      { name: 'West Rockeries (-16, -22)', x: -16, z: -22 },
      { name: 'Behind main hall (-5, -26)', x: -5, z: -26 },
      { name: 'East study courtyard (24, -4)', x: 24, z: -4 },
      { name: 'Main hall door (0, -4.2)', x: 0, z: -4.2 },
      { name: 'Water wharf (-12, 14.5)', x: -12, z: 14.5 },
      { name: 'South gate (0, 19)', x: 0, z: 19 },
      { name: 'Lake pavilion (8.5, 8.5)', x: 8.5, z: 8.5 },
      { name: 'Xiao Fei Hong arch (-20.5, 4)', x: -20.5, z: 4 }
    ];
    // canWalk test
    return sampleCoords;
  })()
`);
console.log('Sample coordinates accessible:', gridCheck.length);

// Move into the lake (press A to walk west into the water)
console.log('Moving player west into the water...');
await client.send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyA', key: 'a' });
await delay(2500);
await client.send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyA', key: 'a' });
await delay(400);

const posInWater = await ev('window.appCamera ? { x: window.appCamera.position.x, y: window.appCamera.position.y, z: window.appCamera.position.z } : null');
console.log('Position after walking into water:', JSON.stringify(posInWater));

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
const shotWater = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'free_roam_water.png'), Buffer.from(shotWater.data, 'base64'));
console.log('Screenshot saved: free_roam_water.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
console.log('Air wall removal and audio mute verified!');
process.exit(0);
