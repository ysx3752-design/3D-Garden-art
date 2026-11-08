import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
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
await new Promise(r => server.listen(9004, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-err-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');

client.on('Runtime.exceptionThrown', (params) => {
  console.error('EXCEPTION:', params.exceptionDetails.exception.description);
});

client.on('Runtime.consoleAPICalled', (params) => {
  console.log('CONSOLE:', params.type, params.args.map(a => a.value || a.description).join(' '));
});

await client.send('Page.navigate', { url: 'http://127.0.0.1:9004/' });
await new Promise(r => setTimeout(r, 2000));

try { client.close(); } catch {}
await stopBrowser(browser.child);
await rm(profile, { recursive: true, force: true });
server.close();
process.exit(0);
