// 诊断脚本：用与套件证据脚本相同的 Chrome 启动参数，逐阶段计时，
// 并自建静态服务（避免后台进程残留），用于确认无头软件渲染下的耗时与可测性。
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient, delay } = await import(PLUGIN);

const DIST = 'C:/Users/ZhongKe/Desktop/Design/dist';
const EXE = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const server = createServer(async (req, res) => {
  const name = (req.url || '/').split('?')[0] === '/' ? '/index.html' : (req.url || '/').split('?')[0];
  try {
    const body = await readFile(path.join(DIST, decodeURIComponent(name)));
    res.writeHead(200, { 'content-type': MIME[path.extname(name).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((resolve) => server.listen(8766, '127.0.0.1', resolve));
console.log('server up on 8766');

const t0 = Date.now();
const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-probe-'));
let browser = null;
let target = null;
let client = null;
try {
  browser = await startBrowser(EXE, profile);
  console.log('startBrowser ms', Date.now() - t0, 'port', browser.port);
  target = await createPage(browser.port);
  console.log('createPage ms', Date.now() - t0);
  client = new CdpClient(target.webSocketDebuggerUrl);
  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  const t1 = Date.now();
  await client.send('Page.navigate', { url: 'http://127.0.0.1:8766/index.html' });
  console.log('navigate ms', Date.now() - t1);
  for (let i = 0; i < 40; i += 1) {
    const r = await client.send('Runtime.evaluate', {
      expression: 'document.readyState + "|" + (window.THREE ? "three-ok" : "no-three") + "|" + (document.querySelector("main") ? "main-ok" : "no-main")',
      returnByValue: true,
    });
    const value = r?.result?.value || '';
    console.log('poll', i, value, 'ms', Date.now() - t1);
    if (value.startsWith('complete')) break;
    await delay(500);
  }
  const probe = await client.send('Runtime.evaluate', {
    expression: `(() => {
      const main = document.querySelector('main');
      const rect = main.getBoundingClientRect();
      const canvas = document.getElementById('scene');
      let webgl = false;
      try { webgl = !!(canvas.getContext('webgl2') || canvas.getContext('webgl')); } catch (e) { webgl = false; }
      return JSON.stringify({
        mainW: Math.round(rect.width), mainH: Math.round(rect.height),
        clientW: document.documentElement.clientWidth,
        scrollW: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        textLen: document.body.innerText.trim().length,
        loaderDone: document.getElementById('loader').getAttribute('data-done'),
        webgl: webgl,
        hudClock: document.getElementById('clock').textContent,
        errors: (window.__probeErrors || []).length,
      });
    })()`,
    returnByValue: true,
  });
  console.log('probe', probe?.result?.value, 'ms', Date.now() - t1);
  const fps = await client.send('Runtime.evaluate', {
    expression: `new Promise((resolve) => {
      let frames = 0; const start = performance.now();
      function tick() {
        frames += 1;
        const spent = performance.now() - start;
        if (spent < 2000) requestAnimationFrame(tick);
        else resolve((frames / (spent / 1000)).toFixed(1));
      }
      requestAnimationFrame(tick);
    })`,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log('fps over 2s', fps?.result?.value, 'ms', Date.now() - t1);
} catch (error) {
  console.log('ERROR', error instanceof Error ? error.message : String(error), 'ms', Date.now() - t0);
} finally {
  try { client?.close(); } catch {}
  if (target?.id && browser?.port) {
    await fetch(`http://127.0.0.1:${browser.port}/json/close/${target.id}`, { method: 'PUT' }).catch(() => {});
  }
  if (browser?.child) await stopBrowser(browser.child);
  await rm(profile, { recursive: true, force: true });
  server.close();
  console.log('total ms', Date.now() - t0);
}