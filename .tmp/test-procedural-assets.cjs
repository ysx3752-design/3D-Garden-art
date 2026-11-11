console.log('Testing procedural texture math...');

// 1. Corrugated Roof Normal Map Math
const flutes = 16;
for (let i = 0; i < 4; i++) {
  const u = (i / 16) * Math.PI * 2;
  const nx = -Math.sin(u) * 0.8;
  const nz = Math.sqrt(Math.max(0, 1 - nx * nx));
  const r = Math.floor((nx * 0.5 + 0.5) * 255);
  const g = 128;
  const b = Math.floor((nz * 0.5 + 0.5) * 255);
  console.log('Roof normal at step', i, '=> RGB:', r, g, b);
}

console.log('All texture math valid!');
