import fs from 'fs';
import { execSync } from 'child_process';

const diff = execSync('git log -p -n 1 75c6fbd -- src/app.js', { maxBuffer: 10 * 1024 * 1024 }).toString();
// search for path or route
const matches = diff.match(/routes\s*=\s*\[[^\]]+\]/g);
console.log('Matches:', matches);
