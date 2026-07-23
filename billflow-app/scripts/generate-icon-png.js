var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var fs = require('fs');
var path = require('path');

app.whenReady().then(async function() {
  var win = new BrowserWindow({
    width: 512,
    height: 512,
    show: false,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  var svgPath = path.join(__dirname, '../src/renderer/assets/logo.svg');
  var svgContent = fs.readFileSync(svgPath, 'utf8');

  var html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
        canvas { width: 256px; height: 256px; }
      </style>
    </head>
    <body>
      <canvas id="c" width="256" height="256"></canvas>
      <script>
        const { ipcRenderer } = require('electron');
        const canvas = document.getElementById('c');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        const svgBlob = new Blob([\`${svgContent.replace(/`/g, '\\`')}\`], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = function() {
          ctx.drawImage(img, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/png');
          ipcRenderer.send('icon-rendered', dataUrl);
        };
        img.src = url;
      </script>
    </body>
    </html>
  `;

  win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));

  electron.ipcMain.once('icon-rendered', function(event, dataUrl) {
    var base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    var buffer = Buffer.from(base64Data, 'base64');
    
    var iconAssetsPath = path.join(__dirname, '../src/renderer/assets/icon.png');
    var iconBuildPath = path.join(__dirname, '../build/icon.png');

    fs.mkdirSync(path.join(__dirname, '../build'), { recursive: true });
    fs.writeFileSync(iconAssetsPath, buffer);
    fs.writeFileSync(iconBuildPath, buffer);

    console.log('Successfully generated icon.png at ' + iconAssetsPath + ' and ' + iconBuildPath);
    app.quit();
  });
});
