import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');
const lines = code.split('\n');

// Let us find any mesh whose Z coordinate is around 25 to 45
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('addMesh(')) {
    // extract arguments
    // addMesh(geo, mat, x, y, z, opts)
    // usually: addMesh(..., ..., x, y, z, ...)
    // let's look for numbers
    const matches = line.match(/addMesh\s*\([^,]+,[^,]+,\s*([^,]+),\s*([^,]+),\s*([^,)]+)/);
    if (matches) {
      const x = matches[1].trim();
      const y = matches[2].trim();
      const z = matches[3].trim();
      const numZ = parseFloat(z);
      if (!isNaN(numZ) && numZ > 20) {
        console.log(`L${i + 1}: x=${x}, y=${y}, z=${z} | ${line.trim().slice(0, 80)}`);
      }
    }
  }
}
