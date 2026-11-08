// 临时静态服务（仅取证期使用）：把项目根目录的 index.html 以 http 提供给套件取证脚本。
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = 'C:/Users/ZhongKe/Desktop/Design';
const PORT = Number(process.argv[2] || 8768);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer(async (req, res) => {
  const name = (req.url || '/').split('?')[0] === '/' ? '/index.html' : (req.url || '/').split('?')[0];
  try {
    const body = await readFile(path.join(ROOT, decodeURIComponent(name)));
    res.writeHead(200, { 'content-type': MIME[path.extname(name).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404).end('not found'); }
});
server.listen(PORT, '127.0.0.1', () => console.log('serving', PORT));
process.on('SIGTERM', () => { server.close(); process.exit(0); });