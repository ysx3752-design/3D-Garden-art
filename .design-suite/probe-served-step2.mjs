// 诊断 2：复刻 served 证据脚本的「about:blank → url」六档导航循环（不含其 probe 表达式），逐步打点。
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
const VIEWPORTS = [[320, 568], [390, 844], [768, 1024], [1440, 1000], [1920, 1080], [2560, 1080]];
const URL_ = 'http://127.0.0.1:8767/index.html';

const server = createServer(async (req, res) => {
  try { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(await readFile(path.join(ROOT, 'index.html'))); }
  catch { res.writeHead(404).end('nf'); }
});
await new Promise((r) => server.listen(8767, '127.0.0.1', r));
log('server up');
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-step2-'));
const browser = await startBrowser(EXE, profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Page.addScriptToEvaluateOnNewDocument', { source: 'window.__t = Date.now();' });
log('cdp ready');
for (const [w, h] of VIEWPORTS) {
  log(`viewport ${w}x${h}: set metrics`);
  await client.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await client.send('Page.navigate', { url: 'about:blank' });
  log('  navigated about:blank');
  await client.send('Page.navigate', { url: URL_ });
  let ready = false;
  for (let i = 0; i < 120; i += 1) {
    await delay(50);
    const r = await client.send('Runtime.evaluate', { expression: `location.href === ${JSON.stringify(URL_)} && document.readyState === 'complete'`, returnByValue: true }).catch(() => ({ result: { value: false } }));
    if (r?.result?.value) { ready = true; break; }
  }
  log(`  waitForPage ready=${ready}`);
  const probe = await client.send('Runtime.evaluate', { expression: 'document.body.innerText.length', returnByValue: true });
  log(`  body text length = ${probe?.result?.value}`);
}
log('loop done');
try { client.close(); } catch {}
await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
log('DONE');
process.exit(0);