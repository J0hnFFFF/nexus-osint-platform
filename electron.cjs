const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const Store = require('electron-store');
const isDev = process.env.NODE_ENV === 'development';

// 创建配置存储
const store = new Store({
  encryptionKey: 'nexus-osint-secure-key' // 用于加密存储
});

// IPC 处理：获取 API Key
ipcMain.handle('get-api-key', () => {
  return store.get('apiKey', null);
});

// IPC 处理：保存 API Key
ipcMain.handle('set-api-key', (event, apiKey) => {
  store.set('apiKey', apiKey);
  return true;
});

// IPC 处理：删除 API Key
ipcMain.handle('delete-api-key', () => {
  store.delete('apiKey');
  return true;
});

async function promptForApiKey(win) {
  // 在生产环境中，如果没有 API Key，显示设置提示
  const hasApiKey = store.get('apiKey');
  if (!hasApiKey && !isDev) {
    // 在网页加载后，通过 IPC 通知前端显示 API Key 设置界面
    win.webContents.on('did-finish-load', () => {
      win.webContents.send('show-api-key-setup');
    });
  }
}

function createWindow() {
  // 1. 创建浏览器窗口
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    title: "Nexus OSINT Platform",
    backgroundColor: '#0B0F19', // 匹配应用背景色
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, // 启用上下文隔离以提高安全性
      preload: path.join(__dirname, 'preload.cjs')
    },
  });

  // 2. 隐藏默认菜单栏 (可选，为了沉浸式体验)
  // Menu.setApplicationMenu(null);

  // 3. 加载应用
  if (isDev) {
    // 开发模式：加载本地 React 服务
    win.loadURL('http://localhost:3000');
    // 打开开发者工具
    win.webContents.openDevTools();
  } else {
    // 生产模式：加载打包后的 HTML 文件
    // Vite 构建输出在 dist 文件夹
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // 检查并提示 API Key 设置
  promptForApiKey(win);

  return win;
}

// 当 Electron 完成初始化时调用
app.whenReady().then(createWindow);

// macOS 窗口管理行为
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
