import { execSync } from 'child_process';

const code = execSync('git show e3c6877:src/app.js', { maxBuffer: 10 * 1024 * 1024 }).toString();

// search for functions that generate objects outside walls
console.log('Total lines in e3c6877:', code.split('\n').length);

// search for path or route
const lines = code.split('\n');
lines.forEach((l, i) => {
  if (l.includes('function buildPath') || l.includes('function buildGround') || l.includes('function buildEnvironmentalDetails')) {
    console.log(`L${i + 1}: ${l}`);
  }
});
