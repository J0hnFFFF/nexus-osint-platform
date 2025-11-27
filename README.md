
# 河图情报分析系统 v5.7.0

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-5.7-blue)
![Tech](https://img.shields.io/badge/Tech-React19%20%7C%20Gemini%20AI%20%7C%20Tailwind-0ea5e9)
![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20macOS-lightgrey)

**河图** 是一个专业级的开源情报 (OSINT) 分析平台。它结合了无限画布的可视化调查能力、基于图谱的数据关联分析以及 AI 驱动的自动化推理引擎。旨在帮助情报分析师、安全研究员和调查人员高效地进行信息的搜集、整理、分析与决策。

---

## 📚 文档目录

1. [项目简介](#1-项目简介)
2. [快速开始](#2-快速开始)
3. [客户端打包](#3-客户端打包)
4. [用户使用手册](#4-用户使用手册)
5. [系统架构文档](#5-系统架构文档)
6. [技术开发文档](#6-技术开发文档)

---

## 1. 项目简介

河图 将传统的"白板墙"调查数字化，并赋予了 AI 智能。

![alt text](imgs/c5c1b323-4dff-4b66-a64f-8c27af6b3760.jpeg)

### 核心特性

**可视化情报图谱**
- 无限画布支持拖拽、缩放、自由连线
- 一键自动布局复杂关系网络
- 全局搜索与实体高亮
- 实时系统日志跟踪所有操作
- **地图视图**: 地理位置节点自动显示交互式地图 (Leaflet/OpenStreetMap)
- **媒体预览**: 图片/视频/音频点击放大查看，支持缩放、旋转、下载
- **时空轨迹分析**: 可视化目标实体的活动轨迹，地图+时间线联动
- **社区发现**: Louvain 模块度优化算法自动识别关系网络中的群组/派系
- **核心人物/事件识别**: 介数中心性 + PageRank + 度中心性综合算法识别网络中的关键节点和中间人
- **实体详情面板**: 右键查看实体完整信息，支持地图、图片、视频、音频完整展示

**多维实体支持 (110+ 类型)**
- **主体实体**: 人员、组织、威胁行为者、军事单位、政府机构
- **网络基础设施**: IP、域名、服务器、C2、SSL证书、进程、注册表
- **通信账号**: 邮箱、手机、社交账号、即时通讯、论坛、博客、播客
- **金融**: 加密钱包、银行账户、交易记录、保单、财产、专利、税务
- **物理世界**: 地理位置、设施、车辆、设备、武器、生物识别、无人机、卫星图像
- **旅行物流**: 航班、酒店、货运、护照、签证
- **内容媒体**: 图片、视频、文档、恶意软件、截图、元数据、二维码、条形码
- **情报搜集**: HUMINT、SIGINT、IMINT、GEOINT、OSINT、MASINT 信源
- **威胁情报 (STIX 2.1)**: 攻击模式、入侵集合、恶意软件分析、IOC 指标、应对措施
- **分析研判**: 报告、事件、活动、漏洞、假设、法律案件、法庭记录、就业/教育/医疗记录

**AI 增强分析**
- 集成 Google Gemini 2.5 Flash / 3.0 Pro 模型
- 支持深度思考模式 (Extended Thinking)
- 可调节温度和推理预算
- 自动化实体关系发现


**情报搜集工具箱 (59 工具)**

*AGENT 类* - 纯 AI 推理分析
- 心理侧写分析、代码安全审计、多语言翻译
- OSINT 框架分析、威胁建模、行为模式识别
- 资金流向追踪、社交网络分析、EXIF 元数据提取

*MCP 类* - 实时数据搜集 (Google Search Grounding)
- **威胁情报**: IP 信誉检测 (AbuseIPDB)、URL 威胁扫描 (URLScan)、威胁脉冲 (AlienVault OTX)
- **区块链**: 多链追踪 (Blockchain Explorer)、NFT 持有分析 (OpenSea)
- **社交媒体**: X/Twitter 深度情报、Discord 社区情报、LinkedIn 履历
- **新媒体**: 博客深度调查、播客情报分析、直播间调查、论坛帖子溯源
- **网络资产**: GitHub 代码仓库、Whois 查询、子域名枚举、DNS 解析、企业邮箱挖掘
- **企业情报**: 企业关系网 (Corporate Tree)、工商信息查询
- **物理世界**: 船舶追踪 (AIS)、航班跟踪、地理位置 OSINT
- **专业情报**: 漏洞数据库 (CVE)、暗网监控、泄露数据库搜索

*API 类* - 外部接口集成
- 模拟数据源（可扩展为真实 API）

**决策辅助**
- 自动生成事件时间线
- **智能情报简报**: AI 驱动的简报生成，支持选中节点分析或全画布分析
- **图谱分析集成**: 简报自动整合社区发现和核心节点识别结果
- **Markdown 导出**: 情报简报一键导出为 Markdown 文档
- NATO 海军部编码系统评级 (可靠性 A-F / 可信度 1-6)
- 完整的操作日志系统

**本地数据持久化**
- 图谱数据手动保存/加载（IndexedDB）
- AI 配置自动保存
- 自定义工具自动保存
- 应用启动时自动恢复上次工作状态

**自定义扩展**
- 内置无代码插件编辑器
- 支持自定义 Prompt 模板
- 可配置 API 接口模拟器
- 灵活的实体属性 KV 存储

---

## 2. 快速开始

### 环境要求
- Node.js 18+
- Google Gemini API Key (建议开通 Paid Tier 以使用搜索 Grounding 功能)

### 安装与运行

**1. 克隆项目**
```bash
git clone https://github.com/J0hnFFFF/Hetu.git
cd Hetu
```

**2. 安装依赖**
```bash
npm install
```

**3. 配置 API Key**

创建 `.env.local` 文件：
```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

或通过环境变量设置：
```bash
# Linux/Mac
export API_KEY="your_google_api_key_here"

# Windows (PowerShell)
$env:API_KEY="your_google_api_key_here"
```

**4. 启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:5173` 开始使用。

---

## 3. 客户端打包

Nexus 支持打包为独立的桌面应用程序（Windows .exe / macOS .dmg / Linux .AppImage）。

使用 Electron 进行封装，详细步骤请参考：

👉 **[BUILD_GUIDE.md - 客户端打包指南](./BUILD_GUIDE.md)**

快速命令：
```bash
# 安装 Electron 依赖
npm install electron electron-builder concurrently wait-on cross-env --save-dev

# 开发模式
npm run electron:dev

# 构建生产安装包
npm run electron:build
```

---

## 4. 用户使用手册

### 4.1 界面概览

**顶部左侧控制区**
- **河图 品牌标识**: 显示系统状态
- **全局搜索栏**: 输入关键词高亮实体
- **自动布局按钮**: 一键整理图谱布局
- **保存/加载按钮**: 持久化图谱数据到本地

**中央画布 (Canvas)**
- 无限画布工作区
- 鼠标左键拖动画布，滚轮缩放
- 拖拽节点调整位置
- 拖拽连接点建立关系

**右侧控制面板**
- **🛡️ 资产库 (Plugins)**: 添加新实体、查看所有工具插件
- **📅 时间线 (Timeline)**: 自动提取时间信息，按顺序排列事件
- **⚙️ 属性面板 (Inspector)**: 编辑选中节点的详细字段
- **🕒 系统日志 (Logs)**: 查看操作记录和工具执行状态
- **🎛️ 设置 (Settings)**: 调节 AI 模型、温度、思考模式

### 4.2 基本操作

**创建实体**
1. 点击右侧"资产库"标签
2. 选择实体类别（如"网络基础设施"）
3. 点击图标（如"IP地址"）创建节点

**建立关系**
1. 鼠标悬停在节点上
2. 拖拽右侧的连接点图标
3. 连接到目标节点

**编辑属性**
1. 选中节点
2. 切换到"属性面板"标签
3. 编辑字段值（支持多行文本）

**删除节点**
- 选中节点按 `Delete` 或 `Backspace` 键
- 或右键菜单选择"删除"
- 支持 Shift 多选批量删除

### 4.3 使用 AI 工具

**运行工具的三种方式**

1. **右键菜单**（推荐）
   - 右键点击节点
   - 选择适用的工具
   - 例：右键"域名" → "Whois 查询"

2. **属性面板**
   - 选中节点
   - 在"绑定插件"列表中点击工具

3. **批量运行**
   - 多选节点（Shift + 点击）
   - 右键选择工具对所有节点执行

**查看执行结果**
- 节点状态变为 `PROCESSING` (黄色脉冲)
- 完成后自动生成关联节点（图谱扩展）
- 或更新节点属性字段
- 查看"系统日志"了解详细执行信息

### 4.4 地图视图

支持地理位置的可视化展示，任何包含「经纬度」字段的节点会自动显示交互式地图。

**使用方式**
1. 创建「地理位置」节点（资产库 → 物理监控 → 地理位置）
2. 在「经纬度」字段填入坐标，格式：`纬度,经度`（例：`39.9042,116.4074`）
3. 节点卡片自动显示小地图预览
4. 点击小地图打开大地图弹窗

**大地图功能**
- 拖拽平移、滚轮缩放
- 街道/卫星底图切换
- 复制坐标到剪贴板
- 打开 Google Maps 导航

**支持的节点类型**
- 地理位置 (GEO_LOCATION)
- 设施场所 (FACILITY)
- 酒店住宿 (HOTEL)
- 以及任何包含「经纬度」「坐标」字段的节点

### 4.5 媒体预览

图片、视频、音频文件支持点击放大查看。

**图片查看器**
- 点击缩略图打开全屏查看
- 缩放功能 (25% - 300%)
- 旋转功能 (90° 步进)
- 下载原文件

**视频播放器**
- 点击预览打开全屏播放
- 自动播放、播放控制
- 下载视频文件

**音频播放器**
- 点击打开播放面板
- 自动播放
- 下载音频文件

### 4.6 网络分析

**社区发现与核心人物/事件识别**

点击顶部工具栏的「分析网络」按钮，系统自动执行：
1. **社区发现** - 使用 Louvain 模块度优化算法识别图谱中的群组/派系（确定性结果，质量更高）
2. **核心人物/事件识别** - 通过介数中心性 (35%) + PageRank (40%) + 度中心性 (25%) 综合算法找出关键节点和中间人

**可视化效果**
- 不同社区的节点显示不同颜色边框（10种预设颜色）
- 核心节点显示金色星星徽章和发光效果
- 节点头部显示社区编号（C1, C2, C3...）
- 节点底部显示中心性得分百分比

**应用场景**
- 识别犯罪网络中的核心成员
- 发现组织架构中的派系关系
- 找出信息传播的关键节点
- 分析社交网络的影响力中心
- **识别关键中间人** - 介数中心性可发现连接不同群体的"桥梁"人物

### 4.7 实体详情面板

右键点击任意实体节点，选择「查看详情」，打开完整信息面板。

**功能特性**
- 完整显示所有字段数据（不截断）
- 每个字段支持一键复制
- 坐标字段自动显示嵌入地图
- 地址字段提供 Google Maps 搜索链接
- 图片支持大图预览和放大查看
- 视频/音频直接嵌入播放器

**使用场景**
- 查看被截断的长文本内容
- 复制字段值用于进一步搜索
- 查看高清图片证据
- 播放音视频材料

### 4.8 时空轨迹分析

右键点击任意实体节点，选择「分析时空轨迹」，可视化该实体的活动轨迹。

**前置条件**
- 目标节点需关联包含「经纬度」字段的位置节点
- 位置节点可包含「时间」字段用于时间排序

**分析界面**
- 左侧：地图显示所有轨迹点，按时间顺序用虚线连接
- 右侧：时间轴列表，显示每个位置点的详细信息
- 支持街道/卫星底图切换

**应用场景**
- 追踪目标人物的活动路线
- 分析物流货运的运输轨迹
- 重建事件发生的时空线索

### 4.9 高级功能

**自定义工具**
1. 资产库 → 点击 `+ 新建插件`
2. 填写工具名称、描述
3. 选择工具类型（AGENT/MCP/API）
4. 编写 Prompt 模板（支持变量 `{{title}}`, `{{data.fieldName}}`）
5. 保存后即可使用

**生成情报简报**
1. 切换到"时间线"标签
2. 点击底部"生成情报简报"
3. AI 汇总画布所有信息生成报告
4. 支持导出 TXT 或 PDF 文件

**PDF 导出格式**
- 专业情报简报格式
- 包含页眉（系统标识、机密标识）
- 自动分页和页码
- 日期时间戳
- 支持长文档自动换行

**数据导入导出**
- 导入：资产库 → 点击上传图标 → 选择 JSON/TXT 文件
- 导出：时间线 → 生成情报简报 → 下载 TXT/PDF

### 4.10 数据保存与加载

**保存图谱**
1. 点击顶部工具栏的「保存」按钮
2. 图谱数据（节点和连接）保存到浏览器本地 IndexedDB
3. 有未保存更改时，按钮右上角显示橙色圆点提示

**加载图谱**
1. 点击顶部工具栏的「加载」按钮
2. 从本地 IndexedDB 恢复上次保存的图谱

**自动保存项目**
以下数据会自动保存，无需手动操作：
- AI 配置（模型选择、温度、思考模式）
- 自定义创建的工具/插件

**自动恢复**
- 应用启动时自动加载上次保存的图谱数据
- 自动恢复 AI 配置和自定义工具

---

## 5. 系统架构文档

### 5.1 架构设计理念

**Client-Side Heavy (重客户端)**
- 所有图谱渲染、状态管理在浏览器完成
- AI 推理直接调用 Google Gemini API (Serverless)
- 无需后端服务器，完全前端化

### 5.2 核心模块

```
┌─────────────────────────────────────────────┐
│           App.tsx (状态容器)                  │
│  - nodes[] / connections[] 管理               │
│  - 工具执行调度                                │
│  - 日志系统                                    │
└─────────┬───────────────────────┬─────────────┘
          │                       │
          ▼                       ▼
┌──────────────────┐    ┌──────────────────────┐
│  Canvas.tsx      │    │  ControlPanel.tsx    │
│  - 无限画布渲染   │    │  - 工具/插件管理      │
│  - SVG 连线      │    │  - 时间线引擎        │
│  - 交互事件处理   │    │  - 属性编辑器        │
└──────────────────┘    └──────────────────────┘
          │                       │
          ▼                       ▼
┌────────────────────────────────────────────┐
│      services/geminiService.ts             │
│  - Tool 执行策略 (AGENT/API/MCP)           │
│  - Google Gemini API 集成                  │
│  - Search Grounding 配置                   │
│  - 结构化 JSON 输出强制                     │
└────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────┐
│      Google Gemini API                     │
│  - gemini-2.5-flash (快速)                 │
│  - gemini-3.0-pro (深度推理)               │
│  - Search Grounding (实时 Web 数据)        │
└────────────────────────────────────────────┘

┌────────────────────────────────────────────┐
│      services/storageService.ts            │
│  - IndexedDB 封装 (idb)                    │
│  - 图谱数据持久化 (nodes/connections)       │
│  - AI 配置自动保存                          │
│  - 自定义工具存储                           │
└────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────┐
│      Browser IndexedDB                     │
│  - nexus-osint-db                          │
│  - config / nodes / connections / tools    │
└────────────────────────────────────────────┘
```

### 5.3 数据流

```
用户操作 (点击运行工具)
  ↓
状态更新 (node.status = 'PROCESSING')
  ↓
executeTool() 构建 Prompt
  ↓
发送到 Gemini API (带 Search Grounding)
  ↓
返回结构化 JSON
  {
    summary: "分析摘要",
    updated_properties: [{key, value}],
    new_entities: [{title, type, data, relationship}]
  }
  ↓
图谱扩展 (创建新节点、连线)
  ↓
Canvas 重新渲染
```

---

## 6. 技术开发文档

### 6.1 技术栈

- **Framework**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI SDK**: `@google/genai`
- **Storage**: `idb` (IndexedDB 封装)
- **Maps**: `leaflet` + `react-leaflet` (OpenStreetMap)
- **PDF**: `jspdf` (PDF 导出)
- **Icons**: `lucide-react`
- **Build Tool**: Vite
- **Desktop**: Electron + electron-builder

### 6.2 核心数据结构

**IntelNode (情报节点)**
```typescript
interface IntelNode {
  id: string;
  type: NodeType;                 // 枚举：110+ 实体类型
  title: string;
  content: string;                // 简短摘要
  position: { x: number; y: number };
  data: Record<string, any>;      // 灵活 KV 存储
  status: 'NEW' | 'PROCESSING' | 'PROCESSED' | 'ERROR';
  rating?: IntelligenceRating;    // NATO 编码
  depth: number;                  // 图谱层级
}
```

**Tool (工具/插件)**
```typescript
interface Tool {
  id: string;
  category: 'AGENT' | 'API' | 'MCP';
  name: string;
  targetTypes: NodeType[];        // 适用实体类型
  promptTemplate: string;         // AI Prompt 模板
  mcpConfig?: {
    functionName: 'googleSearch'; // 启用搜索 Grounding
  };
  autoExpand: boolean;            // 是否自动生成关联节点
}
```

### 6.3 AI 服务层 (geminiService.ts)

**策略模式处理工具类型**

```typescript
// AGENT: 纯 LLM 推理
if (tool.category === ToolCategory.AGENT) {
  // 仅发送 Prompt，使用 responseSchema 强制 JSON 输出
}

// MCP: 函数调用 (Google Search Grounding)
if (tool.mcpConfig?.functionName === 'googleSearch') {
  config.tools = [{ googleSearch: {} }];
  // 不能使用 responseMimeType，改用 systemInstruction 要求 JSON
}

// API: 外部接口调用
if (tool.category === ToolCategory.API) {
  // 调用 tool.apiConfig.endpoint
}
```

**Prompt 变量注入**
```typescript
// 支持模板变量
promptTemplate: "分析 {{title}} 的威胁情报，数据：{{data.ip}}"
// 自动替换为节点实际值
```

**图谱扩展协议**
```json
{
  "summary": "分析摘要",
  "updated_properties": [
    {"key": "威胁评分", "value": "85"}
  ],
  "new_entities": [
    {
      "title": "攻击者IP",
      "type": "IP_ADDRESS",
      "description": "来源地址",
      "data": [{"key": "IP", "value": "192.168.1.1"}],
      "relationship_label": "攻击来源"
    }
  ]
}
```

### 6.4 扩展开发指南

**添加新实体类型**

1. `types.ts` - 添加 NodeType 枚举
```typescript
export enum NodeType {
  MY_NEW_ENTITY = 'MY_NEW_ENTITY',
}
```

2. `constants.ts` - 定义默认字段
```typescript
[NodeType.MY_NEW_ENTITY]: {
  "字段1": "",
  "字段2": ""
}
```

3. `NodeCard.tsx` - 添加图标
```typescript
case NodeType.MY_NEW_ENTITY:
  return <Icon className="w-4 h-4 text-color" />;
```

4. `ControlPanel.tsx` - 添加创建按钮
```typescript
<EntityCategory title="类别名" items={[
  {t: NodeType.MY_NEW_ENTITY, l: '显示名', Icon: IconComponent}
]} />
```

**添加新工具**

编辑 `tools.ts`，在 `DEFAULT_TOOLS` 数组中添加：

```typescript
{
  id: 'my_tool',
  category: ToolCategory.MCP,          // 或 AGENT/API
  name: '工具显示名称',
  version: '1.0',
  author: '作者',
  description: '简短描述',
  targetTypes: [NodeType.IP_ADDRESS],  // 适用实体（空数组=全局工具）
  autoExpand: true,                    // 是否自动生成关联节点
  mcpConfig: {
    functionName: 'googleSearch'       // 启用实时搜索
  },
  promptTemplate: `
    你是 OSINT 分析专家。分析 {{title}} 实体。

    搜索并提取：
    1. 威胁情报
    2. 关联实体
    3. 时间线事件

    输出 JSON 格式的分析结果。
  `,
  isSimulated: false
}
```

**Prompt 编写最佳实践**

1. **明确角色定位**: "你是网络安全专家 / OSINT 分析师 / 威胁情报研究员"
2. **结构化输出**: 使用编号列表指定提取字段
3. **强制 JSON**: 明确说明输出格式要求
4. **使用变量**: `{{title}}`, `{{content}}`, `{{data.fieldName}}`
5. **提供示例**: 在 Prompt 中给出期望输出格式的示例

### 6.5 文件结构

```
nexus-osint-platform/
├── src/
│   ├── App.tsx                    # 主容器 & 状态管理
│   ├── types.ts                   # TypeScript 类型定义
│   ├── constants.ts               # 实体字段模板 & AI 配置
│   ├── tools.ts                   # 内置工具定义 (44 tools)
│   ├── components/
│   │   ├── Canvas.tsx             # 无限画布引擎
│   │   ├── NodeCard.tsx           # 节点卡片组件
│   │   ├── ControlPanel.tsx       # 右侧控制面板
│   │   ├── ContextMenu.tsx        # 右键菜单
│   │   ├── MiniMap.tsx            # 小地图预览组件
│   │   ├── MapModal.tsx           # 大地图弹窗组件
│   │   ├── MediaModal.tsx         # 媒体预览弹窗组件
│   │   ├── TrajectoryModal.tsx    # 时空轨迹分析弹窗
│   │   └── NodeDetailPanel.tsx    # 实体详情面板
│   └── services/
│       ├── geminiService.ts       # AI 服务层
│       ├── storageService.ts      # 本地持久化服务 (IndexedDB)
│       └── graphAnalysis.ts       # 图谱分析服务 (社区发现/核心节点)
├── public/                        # 静态资源
├── BUILD_GUIDE.md                 # Electron 打包指南
├── vite.config.ts                 # Vite 构建配置
├── package.json
└── README.md                      # 本文件
```

---

## 常见问题

**Q: 为什么有些工具执行失败？**
A: 检查：
1. API Key 是否正确配置
2. 是否开通 Paid Tier (免费版无法使用 Search Grounding)
3. 查看"系统日志"获取详细错误信息

**Q: 如何导出分析结果？**
A:
1. 时间线 → 生成情报简报 → 导出 TXT 或 PDF（AI 生成的报告）
2. 图谱数据通过「保存」按钮持久化到本地 IndexedDB

**Q: 节点太多时如何整理？**
A: 点击顶部左侧的"自动布局"按钮，系统会按深度自动排列所有节点。

**Q: 可以离线使用吗？**
A:
- 基础功能（画布、节点管理）可离线使用
- AI 工具需要网络连接 Gemini API
- 可打包为桌面应用获得更好的离线体验

---

## 开发路线图

- [x] 核心图谱引擎
- [x] 110+ 实体类型
- [x] 59+ OSINT 工具
- [x] Google Gemini 集成
- [x] Search Grounding 支持
- [x] 桌面应用打包
- [x] 本地数据持久化（IndexedDB）
- [x] 地图视图 (Leaflet/OpenStreetMap)
- [x] 媒体预览 (图片/视频/音频放大查看)
- [x] 时空轨迹分析
- [x] 社区发现 & 核心人物/事件识别
- [x] MD 简报导出
- [x] Louvain 社区发现算法 & 介数中心性
- [x] 实体详情面板
- [ ] 多画布工作区
- [ ] 团队协作功能
- [ ] 插件市场

---

## 许可证

MIT License

---

## 贡献

欢迎提交 Issue 和 Pull Request！

---

**He Tu** - *Empowering Intelligence with AI.*
