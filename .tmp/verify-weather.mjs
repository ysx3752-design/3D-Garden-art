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
await new Promise(r => server.listen(8993, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-snow-'));
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
await client.send('Page.navigate', { url: 'http://127.0.0.1:8993/' });

for (let i = 0; i < 200; i++) {
  const done = await ev('document.getElementById("loader").getAttribute("data-done") === "true"').catch(() => false);
  if (done) break;
  await delay(150);
}
await delay(1000);

console.log('Switching to snow weather...');
await ev(`
  const btn = document.querySelector('[data-weather="snow"]') || Array.from(document.querySelectorAll('button, .hud-btn, .compass-item')).find(b => b.textContent && b.textContent.includes('雪'));
  if (btn) btn.click();
`);
await delay(2500);

const shot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/snow_verified.png', Buffer.from(shot.data, 'base64'));
console.log('Snow screenshot captured at .tmp/snow_verified.png');

console.log('Switching to rain weather...');
await ev(`
  const btn = document.querySelector('[data-weather="rain"]') || Array.from(document.querySelectorAll('button, .hud-btn, .compass-item')).find(b => b.textContent && b.textContent.includes('雨'));
  if (btn) btn.click();
`);
await delay(2500);

const rainShot = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile('.tmp/rain_verified.png', Buffer.from(rainShot.data, 'base64'));
console.log('Rain screenshot captured at .tmp/rain_verified.png');

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
