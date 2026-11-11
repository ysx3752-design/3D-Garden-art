import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('[-1, 1]') || line.includes('[-1,1]')) {
    console.log(`L${i + 1}: ${line.trim().slice(0, 80)}`);
  }
}
