const fs = require('fs');
const path = require('path');

const certPath = path.join(__dirname, 'build', 'billflow-codesign.pfx');
const hasLocalCert = fs.existsSync(certPath);
const certFile = process.env.CSC_LINK || (hasLocalCert ? 'build/billflow-codesign.pfx' : undefined);
const certPass = certFile ? (process.env.CSC_KEY_PASSWORD || 'BillFlow2026!') : undefined;

const winConfig = {
  icon: 'build/icon.png',
  publisherName: 'Satya Technologies',
  executableName: 'billflow',
  artifactName: 'BillFlow_Setup_v2.4_64bit.exe',
  target: [
    {
      target: 'nsis',
      arch: ['x64']
    }
  ]
};

if (certFile) {
  winConfig.certificateFile = certFile;
  winConfig.certificatePassword = certPass;
}

module.exports = {
  appId: 'com.billflow.app',
  productName: 'Satya BillFlow',
  artifactName: 'BillFlow_Setup_v2.4_64bit.${ext}',
  publish: [
    {
      provider: 'github',
      owner: 'GopeshKachhadiya',
      repo: 'Billflow'
    }
  ],
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  files: [
    'src/**/*',
    'supabase/**/*',
    'package.json'
  ],
  asar: true,
  asarUnpack: [
    '**/*.node'
  ],
  win: winConfig,
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Satya BillFlow',
    artifactName: 'BillFlow_Setup_v2.4_64bit.exe'
  }
};
