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
await new Promise(r => server.listen(9019, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-notour-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:9019/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await new Promise(r => setTimeout(r, 150));
}
await new Promise(r => setTimeout(r, 800));

// Verification checks:
const hasBtnTour = await ev('!!document.getElementById("btn-mode-tour")');
const hasTourBanner = await ev('!!document.getElementById("tour-banner")');
const hasBtnGod = await ev('!!document.getElementById("btn-mode-god")');
const hasBtnWalk = await ev('!!document.getElementById("btn-mode-walk")');
const viewButtonsCount = await ev('document.querySelectorAll(".view-switch-bar .view-btn").length');

console.log('Verification results:');
console.log('hasBtnTour (should be false):', hasBtnTour);
console.log('hasTourBanner (should be false):', hasTourBanner);
console.log('hasBtnGod (should be true):', hasBtnGod);
console.log('hasBtnWalk (should be true):', hasBtnWalk);
console.log('viewButtonsCount (should be 2):', viewButtonsCount);

// Test Walk mode transition
await ev('document.getElementById("btn-mode-walk").click()');
await new Promise(r => setTimeout(r, 400));
const viewAfterWalk = await ev('document.body.getAttribute("data-view")');
console.log('viewAfterWalk (should be walk):', viewAfterWalk);

// Test God mode transition back
await ev('document.getElementById("btn-mode-god").click()');
await new Promise(r => setTimeout(r, 400));
const viewAfterGod = await ev('document.body.getAttribute("data-view")');
console.log('viewAfterGod (should be god):', viewAfterGod);

const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
const shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(artifactDir, 'ui_no_tour_verified.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved ui_no_tour_verified.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();

if (!hasBtnTour && !hasTourBanner && hasBtnGod && hasBtnWalk && viewButtonsCount === 2) {
  console.log('ALL TOUR REMOVAL CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
} else {
  console.error('CHECKS FAILED!');
  process.exit(1);
}
