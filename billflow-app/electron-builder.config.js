// electron-builder.config.js
// Configuration for electron-builder to package the BillFlow app

module.exports = {
  appId: 'com.billflow.app',
  productName: 'Satya BillFlow',
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
  win: {
    icon: 'build/icon.png',
    publisherName: 'Satya Technologies',
    executableName: 'billflow',
    artifactName: 'BillFlow_Setup_v2.4_64bit.exe',
    certificateFile: process.env.CSC_LINK || 'build/billflow-codesign.pfx',
    certificatePassword: process.env.CSC_KEY_PASSWORD || 'BillFlow2026!',
    target: [
      {
        target: 'nsis',
        arch: ['x64', 'ia32']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Satya BillFlow'
  }
};
