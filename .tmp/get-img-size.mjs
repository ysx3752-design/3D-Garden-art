import fs from 'fs';

// Check JPEG size from header
const buf = fs.readFileSync('C:/Users/ZhongKe/.gemini/antigravity/brain/c93bf970-28e7-49fd-a3f1-685b07c7306c/.user_uploaded/media_1794226507811_0d361799.jpg');
let i = 0;
while (i < buf.length) {
  if (buf[i] === 0xFF && buf[i+1] === 0xC0) {
    const h = buf.readUInt16BE(i + 5);
    const w = buf.readUInt16BE(i + 7);
    console.log(`JPEG dimensions: ${w} x ${h}`);
    break;
  }
  i++;
}
