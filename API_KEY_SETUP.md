# API Key 设置指南（生产环境）

## 已完成的后端配置

已为生产环境配置好安全的 API Key 存储机制：

1. ✅ **electron-store** - 加密存储 API Key
2. ✅ **IPC 通信** - 安全的前后端通信
3. ✅ **preload.js** - 安全暴露 API 给前端
4. ✅ **geminiService.ts** - 自动从 Electron 存储读取 API Key

## 前端集成方法

### 方法 1：在 ControlPanel 设置面板添加 API Key 配置

在 `components/ControlPanel.tsx` 的设置标签页添加：

```tsx
// 在 ControlPanel 组件中添加状态
const [apiKey, setApiKey] = useState<string>('');
const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');

// 组件加载时检查 API Key
useEffect(() => {
  if (window.electronAPI) {
    window.electronAPI.getApiKey().then(key => {
      if (key) {
        setApiKey('••••••••••••••••'); // 显示掩码
        setApiKeyStatus('valid');
      } else {
        setApiKeyStatus('invalid');
      }
    });
  }
}, []);

// 保存 API Key 函数
const handleSaveApiKey = async (newKey: string) => {
  if (window.electronAPI) {
    await window.electronAPI.setApiKey(newKey);
    setApiKey('••••••••••••••••');
    setApiKeyStatus('valid');
    alert('API Key 已安全保存');
  }
};

// 在设置面板 UI 中添加
<div className="space-y-2">
  <label className="text-xs text-slate-400">Gemini API Key</label>
  {apiKeyStatus === 'invalid' && (
    <div className="text-xs text-amber-400 mb-2">
      ⚠️ 未配置 API Key，请输入您的 Gemini API Key
    </div>
  )}
  <input
    type="password"
    placeholder="输入您的 Gemini API Key"
    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-sm"
    onChange={(e) => setApiKey(e.target.value)}
  />
  <button
    onClick={() => handleSaveApiKey(apiKey)}
    className="w-full px-3 py-2 bg-cyan-600 hover:bg-cyan-700 rounded text-sm"
  >
    保存 API Key
  </button>
  <a
    href="https://aistudio.google.com/apikey"
    target="_blank"
    className="text-xs text-cyan-400 hover:underline"
  >
    获取 Gemini API Key
  </a>
</div>
```

### 方法 2：首次启动时显示欢迎对话框

在 `App.tsx` 中添加首次启动检测：

```tsx
useEffect(() => {
  // 监听 Electron 发送的"显示 API Key 设置"事件
  if (window.electronAPI) {
    window.electronAPI.onShowApiKeySetup(() => {
      // 显示模态对话框或引导用户设置 API Key
      setShowApiKeyModal(true);
    });
  }
}, []);
```

## API Key 存储位置

API Key 使用 `electron-store` 加密存储在用户本地：

- **Windows**: `%APPDATA%/nexus-osint-platform/config.json`
- **macOS**: `~/Library/Application Support/nexus-osint-platform/config.json`
- **Linux**: `~/.config/nexus-osint-platform/config.json`

## 安全性说明

1. **加密存储** - API Key 使用 AES 加密存储
2. **用户独立** - 每个用户使用自己的 API Key
3. **无硬编码** - 应用不包含任何 API Key
4. **Context Isolation** - 已启用 Electron 的上下文隔离

## 开发环境 vs 生产环境

### 开发环境
```bash
# 仍然使用环境变量
$env:API_KEY="your_key"
npm run electron:dev
```

### 生产环境
```bash
# 无需环境变量，用户首次启动时输入
npm run electron:build
```

## 用户使用流程

1. 用户下载并安装 Nexus OSINT.exe
2. 首次启动时，应用提示"未配置 API Key"
3. 用户点击"设置"→ 输入自己的 Gemini API Key
4. API Key 加密保存到本地
5. 后续启动自动从本地加载

## 获取 API Key 链接

向用户说明：访问 https://aistudio.google.com/apikey 创建免费的 Gemini API Key

## 技术细节

### IPC 通信流程
```
前端 (React)
  ↓ window.electronAPI.getApiKey()
preload.js
  ↓ ipcRenderer.invoke('get-api-key')
electron.js (Main Process)
  ↓ store.get('apiKey')
electron-store (加密文件)
```

### geminiService.ts 读取优先级
1. 尝试从 `window.electronAPI.getApiKey()` 获取（Electron 环境）
2. 回退到 `process.env.API_KEY`（开发环境）
3. 都不存在则抛出错误提示
