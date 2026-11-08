import * as THREE from 'three';

console.log("Testing Three.js shape extrusion with holes...");

// Test Fan hole
var fanHole = new THREE.Path();
var pivotY = 0.40;
var r1 = 1.15;
var r2 = 2.25;
var halfAngle = 0.36; // ~20.6 degrees each side
var segs = 10;

// Start from top-left (outer arc)
var x0 = -Math.sin(halfAngle) * r2;
var y0 = pivotY + Math.cos(halfAngle) * r2;
fanHole.moveTo(x0, y0);

// Top arc left to right
for (var i = 1; i <= segs; i++) {
  var a = -halfAngle + (2 * halfAngle * i) / segs;
  fanHole.lineTo(Math.sin(a) * r2, pivotY + Math.cos(a) * r2);
}
// Straight down to inner radius right
fanHole.lineTo(Math.sin(halfAngle) * r1, pivotY + Math.cos(halfAngle) * r1);
// Bottom arc right to left
for (var j = segs - 1; j >= 0; j--) {
  var a2 = -halfAngle + (2 * halfAngle * j) / segs;
  fanHole.lineTo(Math.sin(a2) * r1, pivotY + Math.cos(a2) * r1);
}
fanHole.closePath();

// Test Octagon hole
var octHole = new THREE.Path();
var octR = 0.78;
for (var k = 0; k < 8; k++) {
  var oa = (k / 8) * Math.PI * 2 + Math.PI / 8;
  var ox = Math.cos(oa) * octR;
  var oy = 2.15 + Math.sin(oa) * octR;
  if (k === 0) octHole.moveTo(ox, oy);
  else octHole.lineTo(ox, oy);
}
octHole.closePath();

// Test Hexagon hole
var hexHole = new THREE.Path();
var hexR = 0.78;
for (var h = 0; h < 6; h++) {
  var ha = (h / 6) * Math.PI * 2;
  var hx = Math.cos(ha) * hexR;
  var hy = 2.15 + Math.sin(ha) * hexR;
  if (h === 0) hexHole.moveTo(hx, hy);
  else hexHole.lineTo(hx, hy);
}
hexHole.closePath();

// Test Square hole
var sqHole = new THREE.Path();
var sqHalf = 0.72;
sqHole.moveTo(-sqHalf, 2.15 - sqHalf);
sqHole.lineTo(sqHalf, 2.15 - sqHalf);
sqHole.lineTo(sqHalf, 2.15 + sqHalf);
sqHole.lineTo(-sqHalf, 2.15 + sqHalf);
sqHole.closePath();

// Test Wall extrusion
var wallShape = new THREE.Shape();
wallShape.moveTo(0, 0);
wallShape.lineTo(30, 0);
wallShape.lineTo(30, 3.5);
wallShape.lineTo(0, 3.5);
wallShape.closePath();
wallShape.holes.push(octHole);

var geo = new THREE.ExtrudeGeometry(wallShape, { depth: 0.5, bevelEnabled: false });
console.log("Extrusion successful! Vertices count:", geo.attributes.position.count);
