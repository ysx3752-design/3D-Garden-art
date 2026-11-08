// 交付取证：本地静态服务 + 套件 served 浏览器证据脚本，重跑 browser-evidence.json（不沿用旧证据）。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const P = 'C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const server = createServer(async (req, res) => {
  const name = (req.url || '/').split('?')[0] === '/' ? '/index.html' : (req.url || '/').split('?')[0];
  try {
    const body = await readFile(path.join(ROOT, decodeURIComponent(name)));
    res.writeHead(200, { 'content-type': MIME[path.extname(name).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
await new Promise((r) => server.listen(8765, '127.0.0.1', r));

const args = [
  path.join(P, 'skills', 'build-website-page', 'scripts', 'capture-website-browser-evidence.mjs'),
  '--url', 'http://127.0.0.1:8765/index.html',
  '--contract', path.join(ROOT, '.design-suite', 'website-contract.json'),
  '--build', path.join(ROOT, 'dist'),
  '--output', path.join(ROOT, '.design-suite', 'browser-evidence.json'),
  '--browser-executable', 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '--json'
];
const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 600000 });
console.log(r.stdout?.slice(0, 2000) || '');
console.error(r.stderr?.slice(0, 2000) || '');
console.log('exit', r.status);
server.close();
process.exit(r.status === 0 ? 0 : 1);