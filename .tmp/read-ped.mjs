import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const lines = code.split('\n');
console.log(lines.slice(4130, 4210).join('\n'));
