// 只读取证：核验最终产物的构图分布（上部天空 / 中部主体 / 底部近景）
// 用于确认近景不再是入口门楼屋面形成的暗带，而是池水与岸线。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const OUT = path.join(ROOT, '.design-suite');
const SHOTS = path.join(OUT, 'shots');
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(ROOT, 'index.html'));
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8768, '127.0.0.1', r));
await mkdir(SHOTS, { recursive: true });

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-bands-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Page.addScriptToEvaluateOnNewDocument', {
  source: `window.__brightness = (dataUrl) => new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 200; c.height = Math.max(1, Math.round(200 * img.height / img.width));
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3;
      resolve(Math.round(sum / (d.length / 4) * 100) / 100);
    };
    img.onerror = () => resolve(-1);
    img.src = dataUrl;
  });`
});
const evaluate = async (expression, awaitPromise = false) => {
  const result = await client.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'evaluate failed');
  return result?.result?.value;
};

await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:8768/index.html' });
for (let i = 0; i < 100; i += 1) {
  await delay(150);
  const ready = await evaluate('document.readyState === "complete"').catch(() => false);
  if (ready) break;
}
for (let i = 0; i < 60; i += 1) {
  if (await evaluate('document.getElementById("loader").getAttribute("data-done") === "true"')) break;
  await delay(150);
}
await delay(600);

async function bandBrightness(y, height) {
  const shot = await client.send('Page.captureScreenshot', {
    format: 'jpeg', quality: 60,
    clip: { x: 0, y, width: 1440, height, scale: 0.25 }
  });
  return evaluate(`window.__brightness(${JSON.stringify('data:image/jpeg;base64,' + shot.data)})`, true);
}

const bands = {
  top_sky_0_250: await bandBrightness(0, 250),
  middle_subject_250_700: await bandBrightness(250, 450),
  bottom_foreground_700_1000: await bandBrightness(700, 300)
};
await writeFile(path.join(OUT, 'composition-bands.json'), JSON.stringify(bands, null, 2) + '\n', 'utf8');
const full = await client.send('Page.captureScreenshot', { format: 'png' });
await writeFile(path.join(SHOTS, '10-foreground-check.png'), Buffer.from(full.data, 'base64'));
console.log('bands', JSON.stringify(bands));

try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);