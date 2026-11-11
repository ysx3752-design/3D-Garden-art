import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const PLUGIN = 'file:///C:/Users/ZhongKe/AppData/Roaming/qianfan-desktop-app/qianfan_desk_xdg/0d6ea5e730a945b69f1924c71a13fc04/data/plugins/official/design-suite-router/scripts/verify_static_export.mjs';
const { startBrowser, stopBrowser, createPage, CdpClient } = await import(PLUGIN);

const imgPath = 'C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/.user_uploaded/media_1794226507811_0d361799.jpg';
const imgBuf = await readFile(imgPath);
const base64Img = imgBuf.toString('base64');

const html = `<!DOCTYPE html>
<html>
<body style="margin:0; background:#000;">
<canvas id="c" width="1024" height="712"></canvas>
<script>
const img = new Image();
img.onload = () => {
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const idata = ctx.getImageData(0, 0, 1024, 712);
  const data = idata.data;
  
  // Find red pixels: r > 200, g < 100, b < 100
  const redPixels = [];
  for (let y = 0; y < 712; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (y * 1024 + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Red line check: r is dominant
      if (r > 150 && (r - Math.max(g, b)) > 60) {
        redPixels.push({ x, y });
      }
    }
  }

  // Cluster red pixels into bounding boxes
  // Simple connected component or clustering
  const boxes = [];
  redPixels.forEach(p => {
    let matched = false;
    for (const b of boxes) {
      if (p.x >= b.minX - 10 && p.x <= b.maxX + 10 && p.y >= b.minY - 10 && p.y <= b.maxY + 10) {
        b.minX = Math.min(b.minX, p.x);
        b.maxX = Math.max(b.maxX, p.x);
        b.minY = Math.min(b.minY, p.y);
        b.maxY = Math.max(b.maxY, p.y);
        b.count++;
        matched = true;
        break;
      }
    }
    if (!matched) {
      boxes.push({ minX: p.x, maxX: p.x, minY: p.y, maxY: p.y, count: 1 });
    }
  });

  // Merge overlapping boxes
  let merged = true;
  while (merged) {
    merged = false;
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const b1 = boxes[i], b2 = boxes[j];
        if (b1.minX - 15 <= b2.maxX && b1.maxX + 15 >= b2.minX &&
            b1.minY - 15 <= b2.maxY && b1.maxY + 15 >= b2.minY) {
          b1.minX = Math.min(b1.minX, b2.minX);
          b1.maxX = Math.max(b1.maxX, b2.maxX);
          b1.minY = Math.min(b1.minY, b2.minY);
          b1.maxY = Math.max(b1.maxY, b2.maxY);
          b1.count += b2.count;
          boxes.splice(j, 1);
          merged = true;
          break;
        }
      }
      if (merged) break;
    }
  }

  window.detectedBoxes = boxes.filter(b => b.count > 50);
  window.ready = true;
};
img.src = 'data:image/jpeg;base64,${base64Img}';
</script>
</body>
</html>`;

const server = createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(html);
});
await new Promise(r => server.listen(9155, '127.0.0.1', r));

const profile = await mkdtemp(path.join(os.tmpdir(), 'ds-crop-'));
const browser = await startBrowser('C:/Program Files/Google/Chrome/Application/chrome.exe', profile);
const target = await createPage(browser.port);
const client = new CdpClient(target.webSocketDebuggerUrl);
await client.send('Page.enable');
await client.send('Runtime.enable');
await client.send('Emulation.setDeviceMetricsOverride', {
  width: 1024,
  height: 712,
  deviceScaleFactor: 1,
  mobile: false
});
await client.send('Page.navigate', { url: 'http://127.0.0.1:9155/' });

for (let i = 0; i < 50; i++) {
  const ready = await client.send('Runtime.evaluate', { expression: 'window.ready === true', returnByValue: true });
  if (ready?.result?.value) break;
  await new Promise(r => setTimeout(r, 100));
}

const boxesRes = await client.send('Runtime.evaluate', { expression: 'JSON.stringify(window.detectedBoxes)', returnByValue: true });
const boxes = JSON.parse(boxesRes?.result?.value || '[]');
console.log('Detected boxes:', boxes);

// For each box, let us crop it and save
let idx = 0;
for (const b of boxes) {
  idx++;
  // Take screenshot of this clip
  const clip = {
    x: Math.max(0, b.minX - 5),
    y: Math.max(0, b.minY - 5),
    width: Math.min(1024 - b.minX + 5, (b.maxX - b.minX) + 10),
    height: Math.min(712 - b.minY + 5, (b.maxY - b.minY) + 10),
    scale: 1
  };
  const shot = await client.send('Page.captureScreenshot', { format: 'png', clip });
  await writeFile(`C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/box_${idx}.png`, Buffer.from(shot.data, 'base64'));
  console.log(`Saved box_${idx}.png:`, clip);
}

try { client.close(); } catch {}
try { await stopBrowser(browser.child); } catch {}
try { await server.close(); } catch {}
await rm(profile, { recursive: true, force: true });
