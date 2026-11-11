import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const userImgPath = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/.user_uploaded/media_1794226507811_0d361799.jpg';
const imgBuf = await readFile(userImgPath);
const b64 = imgBuf.toString('base64');

const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;overflow:hidden;background:#000;">
<img id="img" src="data:image/jpeg;base64,${b64}" style="display:block;width:1024px;height:712px;" />
</body></html>`;

const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise(r => server.listen(9144, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-crop3-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Emulation.setDeviceMetricsOverride', { width: 1024, height: 712, deviceScaleFactor: 1, mobile: false });
await client.send('Page.navigate', { url: 'http://127.0.0.1:9144/' });
await new Promise(r => setTimeout(r, 1000));

// Crop the bottom area: x=400, y=660, w=250, h=52
const shot = await client.send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 410, y: 660, width: 240, height: 50, scale: 2 }
});
const artifactDir = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c';
await writeFile(path.join(artifactDir, 'crop_bottom_center.png'), Buffer.from(shot.data, 'base64'));
console.log('Saved crop_bottom_center.png');

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
