// scripts/build-legacy.js
// Build script for legacy NW.js environment (Windows XP/Vista compatibility)

var fs = require('fs');
var path = require('path');

var srcDir = path.join(__dirname, '../src');
var distDir = path.join(__dirname, '../dist');
var legacyDir = path.join(distDir, 'legacy');

console.log('Starting legacy NW.js build packaging...');

// Helper to recursively copy directories
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  var entries = fs.readdirSync(src, { withFileTypes: true });

  for (var i = 0; i < entries.length; i++) {
    var entry = entries[i];
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
        copyDirSync(srcPath, destPath);
      }
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // Create legacy directory
  if (!fs.existsSync(legacyDir)) {
    fs.mkdirSync(legacyDir, { recursive: true });
  }

  // Copy src folder
  console.log('Copying source files...');
  copyDirSync(srcDir, path.join(legacyDir, 'src'));

  // Copy package.json and customize it for NW.js
  console.log('Customizing package.json for NW.js...');
  var pkgPath = path.join(__dirname, '../package.json');
  var pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  // NW.js uses "main" to point directly to the HTML entry point (unlike Electron)
  pkg.main = 'src/renderer/index.html';
  pkg.window = {
    title: 'BillFlow',
    width: 1280,
    height: 800,
    min_width: 800,
    min_height: 600,
    toolbar: true,
    icon: 'src/renderer/assets/icons/icon.png'
  };

  fs.writeFileSync(
    path.join(legacyDir, 'package.json'),
    JSON.stringify(pkg, null, 2),
    'utf8'
  );

  console.log('[SUCCESS] Legacy NW.js project package prepared at: ' + legacyDir);
  console.log('To run on Windows XP:');
  console.log('1. Download NW.js v0.14.7 (SDK or Normal) for Windows 32-bit/64-bit.');
  console.log('2. Extract the NW.js zip.');
  console.log('3. Copy all files from ' + legacyDir + ' into the extracted NW.js directory.');
  console.log('4. Run nw.exe.');

} catch (e) {
  console.error('[FAIL] Legacy build preparation failed:', e.message);
  process.exit(1);
}
