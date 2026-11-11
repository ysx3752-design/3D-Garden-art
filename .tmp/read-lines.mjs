import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const lines = code.split('\n');
console.log(lines.slice(2760, 2860).join('\n'));
