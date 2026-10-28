const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('desktop', { getIdleSeconds: () => ipcRenderer.invoke('idle:read') });
