import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

const idx = code.indexOf('// 6. 围墙外围四大区域的高品位地坪与庭院景观衔接');
console.log(code.substring(idx, idx + 2000));
