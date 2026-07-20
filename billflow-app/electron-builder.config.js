// electron-builder.config.js
// Configuration for electron-builder to package the BillFlow app

module.exports = {
  appId: 'com.billflow.app',
  productName: 'BillFlow',
  directories: {
    output: 'dist',
    buildResources: 'build'
  },
  files: [
    'src/**/*',
    'package.json'
  ],
  asar: true,
  asarUnpack: [
    '**/*.node'
  ],
  win: {
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
    shortcutName: 'BillFlow'
  }
};
