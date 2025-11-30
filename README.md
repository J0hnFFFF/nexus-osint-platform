# 河图情报分析系统

<p align="center">
  <img src="https://img.shields.io/badge/Version-6.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-AGPL--3.0-blue" alt="License">
  <img src="https://img.shields.io/badge/React-19-61DAFB" alt="React">
  <img src="https://img.shields.io/badge/AI-Gemini%202.5-4285F4" alt="Gemini">
  <img src="https://img.shields.io/badge/Platform-Web%20|%20Windows%20|%20macOS%20|%20Linux-lightgrey" alt="Platform">
</p>

<p align="center">
  <b>河图</b> 是一个专业级的开源情报 (OSINT) 分析平台。<br>
  结合无限画布可视化、图谱关联分析与 AI 驱动的自动化推理引擎。
</p>

<p align="center">
  <a href="#快速开始">快速开始</a> •
  <a href="#核心能力">核心能力</a> •
  <a href="#使用手册">使用手册</a> •
  <a href="./TECHNICAL.md">技术文档</a> •
  <a href="./BUILD_GUIDE.md">桌面打包</a>
</p>

---

![河图界面预览](imgs/c5c1b323-4dff-4b66-a64f-8c27af6b3760.jpeg)

---

## 核心能力

### 可视化情报图谱

- **无限画布** - 自由拖拽、缩放、连线，像白板墙一样直观
- **自动布局** - 一键整理复杂关系网络
- **全局搜索** - 快速定位和高亮目标实体
- **地图集成** - 地理位置节点自动显示交互式地图
- **媒体预览** - 图片/视频/音频支持放大、播放、下载
- **实体详情** - 右键查看完整信息，支持复制和地图定位

### 多画布工作区 (6.0 新功能)

- **项目管理** - 按项目组织多个独立调查案例
- **多画布支持** - 同一项目下创建多个画布，分类管理不同线索
- **快照版本** - 一键保存画布状态，支持随时回滚到历史版本
- **自动清理** - 智能保留最近 20 个快照，节省存储空间
- **无缝切换** - 顶部工具栏快速切换项目和画布

### 智能分析引擎

| 功能 | 算法 | 说明 |
|------|------|------|
| **社区发现** | Louvain 模块度优化 | 自动识别关系网络中的群组/派系 |
| **核心节点识别** | PageRank + 介数中心性 + 度中心性 | 找出网络中的关键人物和中间人 |
| **调查建议引擎** | 概率矩阵 + 信息熵 + 图论指标 | 评估情报完整性，自动推荐下一步调查方向 |
| **时空轨迹分析** | 地图 + 时间线联动 | 可视化目标实体的活动轨迹 |

### AI 增强分析

- **Google Gemini 2.5 / 3.0** - 集成最新大语言模型
- **实时搜索 (Search Grounding)** - AI 可访问实时网络数据
- **深度思考模式** - 支持 Extended Thinking 深度推理
- **自动化实体发现** - AI 自动识别并创建关联实体

### 情报工具箱 (59+ 工具)

**威胁情报**
- IP 信誉检测、URL 威胁扫描、漏洞数据库查询

**区块链追踪**
- 多链地址追踪、NFT 持有分析、交易流向分析

**社交媒体**
- X/Twitter 深度情报、LinkedIn 履历、Discord 社区

**网络资产**
- Whois 查询、子域名枚举、DNS 解析、GitHub 代码仓库

**物理世界**
- 船舶追踪 (AIS)、航班跟踪、地理位置 OSINT

### 多维实体支持 (110+ 类型)

| 类别 | 实体类型 |
|------|----------|
| 主体 | 人员、组织、威胁行为者、军事单位、政府机构 |
| 网络 | IP、域名、服务器、C2、SSL证书、进程 |
| 通信 | 邮箱、手机、社交账号、即时通讯、论坛 |
| 金融 | 加密钱包、银行账户、交易记录、保单 |
| 物理 | 地理位置、设施、车辆、设备、武器 |
| 旅行 | 航班、酒店、货运、护照、签证 |
| 媒体 | 图片、视频、文档、恶意软件、元数据 |
| 情报 | HUMINT、SIGINT、IMINT、GEOINT、OSINT |
| 威胁 (STIX) | 攻击模式、入侵集合、IOC 指标 |
| 分析 | 报告、事件、漏洞、假设、法律案件 |

---

## 快速开始

### 环境要求

- Node.js 18+
- Google Gemini API Key ([获取地址](https://ai.google.dev/))

### 安装运行

```bash
# 1. 克隆项目
git clone https://github.com/J0hnFFFF/Hetu.git
cd Hetu

# 2. 安装依赖
npm install

# 3. 配置 API Key (创建 .env.local 文件)
echo "GEMINI_API_KEY=your_api_key_here" > .env.local

# 4. 启动
npm run dev
```

访问 `http://localhost:3000` 开始使用。

### 桌面应用打包

```bash
# 开发模式
npm run electron:dev

# 构建安装包 (Windows/macOS/Linux)
npm run electron:build
```

详细打包指南请参考 [BUILD_GUIDE.md](./BUILD_GUIDE.md)。

---

## 使用手册

### 界面概览

| 区域 | 功能 |
|------|------|
| **顶部工具栏** | 项目/画布切换、搜索、自动布局、保存/加载、快照、分析网络、生成简报 |
| **中央画布** | 无限画布工作区，拖拽节点、建立连接 |
| **右侧面板** | 资产库、时间线、属性编辑、日志、设置 |

### 基本操作

| 操作 | 方法 |
|------|------|
| **创建实体** | 右侧资产库 → 选择类型 → 点击图标 |
| **建立关系** | 拖拽节点右侧连接点到目标节点 |
| **编辑属性** | 选中节点 → 属性面板 → 编辑字段 |
| **运行工具** | 右键节点 → 选择工具 |
| **删除节点** | 选中 → Delete 键 或 右键删除 |
| **批量操作** | Shift + 点击多选 |

### 智能分析

**网络分析**
1. 点击顶部「分析网络」按钮
2. 系统自动执行社区发现 + 中心性分析 + 完整性评估
3. 查看分析面板获取详细报告和调查建议

**生成简报**
1. 切换到「时间线」标签
2. 点击「生成情报简报」
3. AI 自动汇总所有信息生成专业报告
4. 支持导出 Markdown

### 地图功能

在「经纬度」字段输入坐标（如 `17.9042, 121.4074`），节点自动显示地图：
- 小地图预览（点击放大）
- 大地图支持切换底图、复制坐标、导航

### 数据持久化

- **手动保存**: 点击「保存」按钮存储图谱到本地
- **自动保存**: AI 配置和自定义工具自动保存
- **启动恢复**: 应用启动时自动加载上次工作状态

### 多画布与快照

**项目/画布管理**
1. 点击顶部工具栏的「项目/画布」指示器
2. 在下拉菜单中切换或创建项目
3. 在同一项目下创建多个画布，分类管理不同调查线索

**快照版本控制**
1. 点击顶部「快照」按钮
2. 输入快照名称（或使用默认时间戳）
3. 点击「创建」保存当前画布状态
4. 需要回滚时，在快照列表中点击「恢复」图标

**使用场景**
- 重要操作前创建快照，便于撤销
- 尝试不同分析方向时保存多个版本
- 按项目组织不同案例的调查数据

---

## 文档

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目介绍 (本文件) |
| [TECHNICAL.md](./TECHNICAL.md) | 技术架构、开发指南、API 文档 |
| [BUILD_GUIDE.md](./BUILD_GUIDE.md) | Electron 桌面应用打包指南 |

---

## 路线图

- [x] 核心图谱引擎
- [x] 110+ 实体类型 / 59+ OSINT 工具
- [x] Google Gemini 集成 + Search Grounding
- [x] 桌面应用打包 (Electron)
- [x] 地图视图 + 媒体预览 + 时空轨迹
- [x] 社区发现 (Louvain) + 核心节点识别
- [x] 调查建议引擎 (完整性分析)
- [x] 多画布工作区 / 快照版本 (6.0)
- [ ] 团队协作功能
- [ ] 插件市场

---

## 许可证

本项目采用 **双重授权** 模式：

### 开源协议 (AGPL-3.0)

社区版采用 [GNU Affero General Public License v3.0](./LICENSE) 开源协议。

```
Copyright 2024-2025 He Tu Contributors

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.
```

**AGPL-3.0 要求**：如果您修改本软件并通过网络提供服务，必须公开您的修改后的源代码。

### 商业授权

如果您希望：
- 在闭源产品中使用河图
- 不公开您的修改
- 获得商业技术支持

请联系我们获取商业授权：**j0hn.wahahaha@gmail.com**

---

## 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 发起 Pull Request

---

<p align="center">
  <b>河图</b> - Empowering Intelligence with AI.
</p>
