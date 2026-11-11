import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

// Let's find all function names
const matches = code.match(/function\s+([a-zA-Z0-9_]+)\s*\(/g);
console.log('Functions:', matches ? matches.map(m => m.replace(/function\s+/, '').replace('(', '')).join(', ') : 'none');
