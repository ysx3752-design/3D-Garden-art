// 诊断：定位 served 证据脚本为何挂起——分步打印（startBrowser/createPage/CdpClient/navigate/evaluate）。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const P = 'C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(`file:///${P}/scripts/verify_static_export.mjs`);
const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const t0 = Date.now();
const log = (m) => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(ROOT, 'index.html'))); }
  catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(8766, '127.0.0.1', r));
log('server up 8766');

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-step-'));
log('launching chrome');
const browser = await startBrowser(EXE, profile);
log('browser up port ' + browser.port);
const target = await createPage(browser.port);
log('page created');
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
log('cdp ready');
await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
log('navigating');
await client.send('Page.navigate', { url: 'http://127.0.0.1:8766/index.html' });
for (let i = 0; i < 200; i += 1) {
  await delay(500);
  const r = await client.send('Runtime.evaluate', { expression: 'document.readyState', returnByValue: true }).catch((e) => ({ err: String(e) }));
  log('poll ' + JSON.stringify(r?.result?.value ?? r));
  if ((r?.result?.value) === 'complete') break;
}
log('evaluating probe');
const probe = await client.send('Runtime.evaluate', { expression: 'document.getElementById("loader").getAttribute("data-done")', returnByValue: true });
log('loader done = ' + String(probe?.result?.value));
try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
log('DONE');
process.exit(0);