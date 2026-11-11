import { execSync } from 'child_process';

const code = execSync('git show e3c6877:src/app.js', { maxBuffer: 10 * 1024 * 1024 }).toString();

const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('addMesh') || l.includes('new THREE.')) {
    const numbers = l.match(/[-+]?\d*\.?\d+/g);
    if (numbers) {
      for (const n of numbers) {
        const val = parseFloat(n);
        if (val >= 35 && val <= 100 && !l.includes('Color') && !l.includes('Math.PI')) {
          console.log(`L${i + 1}: ${l.trim().slice(0, 90)}`);
          break;
        }
      }
    }
  }
});
