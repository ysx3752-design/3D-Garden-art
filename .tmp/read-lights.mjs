import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const idx = code.indexOf('function buildLights');
console.log(code.substring(idx, idx + 2000));
