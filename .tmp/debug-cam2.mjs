import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const srv = createServer(async (req, res) => { res.end(await readFile('index.html')); });
await new Promise(r => srv.listen(9124, '127.0.0.1', r));
const prof = await mkdtemp(path.join(os.tmpdir(), 'ds-dbg2-'));
const b = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', prof);
const p = await createPage(b.port);
const client = new CdpClient(p.webSocketDebuggerUrl);
await client.send('Page.navigate', { url: 'http://127.0.0.1:9124/' });
await new Promise(r => setTimeout(r, 2000));

const ev = async (e) => {
  const r = await client.send('Runtime.evaluate', { expression: e, returnByValue: true });
  return r?.result?.value;
};

// Check if setDioramaScale exists
const hasFn = await ev('typeof window.setDioramaScale');
console.log('has setDioramaScale:', hasFn);

// Call setDioramaScale directly
const res = await ev(`
  try {
    window.switchViewMode('diorama');
    'success';
  } catch (err) {
    err.stack;
  }
`);
console.log('switchViewMode result:', res);

await new Promise(r => setTimeout(r, 1200));

console.log('Pos after switchViewMode:', await ev('JSON.stringify(window.appCamera.position)'));
console.log('Target after switchViewMode:', await ev('JSON.stringify(window.appControls.target)'));

try { client.close(); } catch {}
try { await stopBrowser(b.child); } catch {}
await rm(prof, { recursive: true, force: true });
srv.close();
