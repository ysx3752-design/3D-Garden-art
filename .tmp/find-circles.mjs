import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('CircleGeometry')) {
    console.log(`L${i + 1}: ${l.trim()}`);
  }
});
