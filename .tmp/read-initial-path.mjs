import { execSync } from 'child_process';

const code = execSync('git show e3c6877:src/app.js', { maxBuffer: 10 * 1024 * 1024 }).toString();

const idx = code.indexOf('function buildPath');
console.log(code.substring(idx, idx + 1500));
