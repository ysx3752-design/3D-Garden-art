import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

// Find all occurrences of for loops or forEach that add meshes
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('addMesh') || line.includes('new THREE.Mesh')) {
    // Check if within lines around it there are coordinates with z >= 25
    for (let j = Math.max(0, i - 10); j <= Math.min(lines.length - 1, i + 5); j++) {
      const match = lines[j].match(/[-+]?\d*\.?\d+/g);
      if (match) {
        for (const num of match) {
          const v = parseFloat(num);
          if (v >= 30 && v <= 80 && !lines[j].includes('Math.PI') && !lines[j].includes('Color')) {
            console.log(`Around L${i + 1} (match at L${j + 1}: ${v}):`);
            console.log(lines.slice(Math.max(0, i - 2), Math.min(lines.length, i + 3)).join('\n'));
            console.log('---');
            break;
          }
        }
      }
    }
  }
}
