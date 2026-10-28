const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron');
const path = require('node:path');
app.whenReady().then(() => {
  ipcMain.handle('idle:read', () => powerMonitor.getSystemIdleTime());
  const win = new BrowserWindow({ width: 1240, height: 900, minWidth: 780, minHeight: 680, backgroundColor: '#f6f3e9', title: 'Fart Alert', autoHideMenuBar: true, webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' } });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', e => e.preventDefault());
  if (process.argv.includes('--dev')) win.loadURL('http://localhost:5173');
  else win.loadFile(path.join(__dirname, '../dist/index.html'));
});
app.on('window-all-closed', () => app.quit());
