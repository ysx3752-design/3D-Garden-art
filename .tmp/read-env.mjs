import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const idx = code.indexOf('function buildEnvironmentalDetails');
console.log(code.substring(idx, idx + 4000));
