import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // check for z positions > 35
  const match = line.match(/(?:addMesh|Mesh|Position|\bpos\b).*?(?:,\s*[-+]?[0-9.]+\s*,\s*[-+]?[0-9.]+\s*,\s*([-+]?[0-9.]+))/);
  // or look for numbers > 35
  if (line.includes('addMesh') || line.includes('new THREE.')) {
    const numbers = line.match(/[-+]?\d*\.?\d+/g);
    if (numbers) {
      for (const n of numbers) {
        const val = parseFloat(n);
        if (val > 35.5 && val < 120 && !line.includes('Color') && !line.includes('Math.PI') && !line.includes('fov')) {
          console.log(`L${i + 1}: ${line.trim()}`);
          break;
        }
      }
    }
  }
}
