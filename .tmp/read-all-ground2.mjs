import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const idx = code.indexOf('// 3. 平地绿茵');
console.log(code.substring(idx, idx + 2000));
