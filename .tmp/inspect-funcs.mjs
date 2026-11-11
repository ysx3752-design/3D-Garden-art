import fs from 'fs';

const code = fs.readFileSync('src/app.js', 'utf8');

function showFunc(name) {
  const idx = code.indexOf('function ' + name);
  if (idx === -1) return;
  console.log(`=== ${name} ===`);
  console.log(code.substring(idx, idx + 1500));
}

showFunc('buildEnvironmentalDetails');
showFunc('buildPath');
