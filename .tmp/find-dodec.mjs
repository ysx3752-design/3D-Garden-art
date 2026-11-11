import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('DodecahedronGeometry') || (l.includes('ConeGeometry') && !l.includes('Hilltop')) || l.includes('4.2, 0.11') || l.includes('8.4')) {
    console.log(`L${i + 1}: ${l.trim()}`);
  }
});
