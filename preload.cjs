const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  setApiKey: (apiKey) => ipcRenderer.invoke('set-api-key', apiKey),
  deleteApiKey: () => ipcRenderer.invoke('delete-api-key'),
  onShowApiKeySetup: (callback) => ipcRenderer.on('show-api-key-setup', callback)
});
