const fs = require('fs');
const path = require('path');

// 1. Sync to dist/
fs.copyFileSync(path.join(__dirname, '..', 'src', 'index.html'), path.join(__dirname, '..', 'dist', 'index.html'));
fs.copyFileSync(path.join(__dirname, '..', 'src', 'style.css'), path.join(__dirname, '..', 'dist', 'style.css'));
fs.copyFileSync(path.join(__dirname, '..', 'src', 'app.js'), path.join(__dirname, '..', 'dist', 'app.js'));
console.log('dist/ files synced.');

// 2. Build root index.html
const rootDir = path.join(__dirname, '..');
const oldIndex = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const srcHtml = fs.readFileSync(path.join(rootDir, 'src', 'index.html'), 'utf8');
const srcCss = fs.readFileSync(path.join(rootDir, 'src', 'style.css'), 'utf8');
const srcJs = fs.readFileSync(path.join(rootDir, 'src', 'app.js'), 'utf8');

// Extract Three.js script block
const threeStart = oldIndex.indexOf('<script data-design-suite-vendor="three@0.147.0"');
const orbitStart = oldIndex.indexOf('<script data-design-suite-vendor="three@0.147.0-examples"');
const appStart = oldIndex.indexOf('<script data-static-export-source="app.js">');
const settleStart = oldIndex.indexOf('<script>(function(){function settle()');

if (threeStart === -1 || orbitStart === -1 || appStart === -1 || settleStart === -1) {
  throw new Error('Could not find script markers in root index.html');
}

const vendorThreeBlock = oldIndex.substring(threeStart, orbitStart);
const vendorOrbitBlock = oldIndex.substring(orbitStart, appStart);
const settleBlock = oldIndex.substring(settleStart);

// Extract main HTML body from src/index.html
const bodyStart = srcHtml.indexOf('<main id="stage">');
const bodyEnd = srcHtml.indexOf('</main>') + '</main>'.length;
const mainContent = srcHtml.substring(bodyStart, bodyEnd);

// Extract head shims from oldIndex
const headStart = oldIndex.indexOf('<head>');
const crypto = require('crypto');
// 交付合同哈希随合同文件实时计算：合同若被重新生成，产物头部的 provenance 必须同步，避免结构校验报 hash mismatch
let contractHash = null;
try {
  contractHash = crypto.createHash('sha256')
    .update(fs.readFileSync(path.join(rootDir, '.design-suite', 'website-contract.json')))
    .digest('hex');
} catch { contractHash = null; }

let headShims = oldIndex.substring(headStart + '<head>'.length, oldIndex.indexOf('<meta charset="utf-8">'));
if (contractHash) {
  headShims = headShims.replace(
    /(name="design-suite-contract-sha256" content=")[0-9a-f]+(")/,
    `$1${contractHash}$2`
  );
}

const newIndex = '<!DOCTYPE html>\n<html lang="zh-CN">\n<head>' +
  headShims +
  '<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<meta name="color-scheme" content="light">\n' +
  '<title>江南水乡 · 园林生态漫境</title>\n' +
  '<!-- 开发期引用本地文件；交付时由套件 static-export 适配器把 CSS/JS 全部内联为单文件，\n' +
  '     因此最终产物不包含任何外部资源，断网也能直接双击打开。 -->\n' +
  '<link rel="icon" href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48cmVjdCB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHJ4PSI0IiBmaWxsPSIjZWZlN2Q4Ii8+PHJlY3QgeD0iNi41IiB5PSI3LjUiIHdpZHRoPSIxOSIgaGVpZ2h0PSI0IiByeD0iMSIgZmlsbD0iIzU0NWI2MCIvPjxyZWN0IHg9IjkiIHk9IjExLjUiIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMyIgZmlsbD0iI2Y3ZjJlOCIgc3Ryb2tlPSIjMjIyMDFkIiBzdHJva2Utd2lkdGg9IjEiLz48Y2lyY2xlIGN4PSIxNiIgY3k9IjE4IiByPSI0LjIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzllMmYyOCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+">\n' +
  '<style data-static-export-source="style.css">' + srcCss + '</style>\n' +
  '</head>\n<body>\n' +
  mainContent + '\n\n' +
  vendorThreeBlock +
  vendorOrbitBlock +
  '<script data-static-export-source="app.js">' + srcJs + '</script>\n' +
  settleBlock;

fs.writeFileSync(path.join(rootDir, 'index.html'), newIndex, 'utf8');
console.log('index.html built successfully, length:', newIndex.length);
