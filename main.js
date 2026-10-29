const { app, BrowserWindow } = require('electron');
const path = require('path');
const { createServer } = require('http');
const next = require('next');

const dev = false;
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const nextApp = next({ dev, hostname, port, dir: __dirname });
const handle = nextApp.getRequestHandler();

let mainWindow;

app.whenReady().then(() => {
  nextApp.prepare().then(() => {
    const server = createServer((req, res) => {
      handle(req, res);
    });
    
    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
      mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        },
        autoHideMenuBar: true
      });
      
      mainWindow.loadURL(`http://localhost:${port}`);
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
