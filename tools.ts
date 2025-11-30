
import { Tool, NodeType, ToolCategory } from './types';

export const DEFAULT_TOOLS: Tool[] = [
  // ============================================
  // SECTION 1: REAL AI AGENTS (Pure Reasoning)
  // ============================================
  {
    id: 'agent_profiler',
    category: ToolCategory.AGENT,
    name: '心理侧写 (Profiler)',
    version: '2.1',
    author: 'Nexus Mind',
    description: '基于文本分析目标的心理状态、情绪及潜在动机。',
    targetTypes: [NodeType.NOTE, NodeType.SOCIAL_POST, NodeType.EMAIL, NodeType.REPORT],
    promptTemplate: "分析目标的心理状态。\n1. 评估情绪极性（正面/负面/中性）。\n2. 识别具体情绪（愤怒、恐惧、焦虑、自信）。\n3. 检测是否存在欺骗性语言特征（如过度强调、回避细节）。\n4. 推测作者的教育程度和可能的职业背景。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_visual_forensics',
    category: ToolCategory.AGENT,
    name: '视觉取证 (Image Ops)',
    version: '3.0',
    author: 'Nexus Vision',
    description: '【图片】OCR文字提取、地标识别、EXIF分析及隐写术检测。',
    targetTypes: [NodeType.IMAGE],
    promptTemplate: "作为图像情报专家，分析这张图片。\n1. OCR: 提取图中所有可见文字、路牌、车牌。\n2. Geolocation: 描述场景环境、地标，推断可能的地理位置（国家/城市）。\n3. Tech: 识别拍摄设备特征或后期编辑痕迹。\n4. Objects: 罗列关键物体（武器、电子设备、车辆）。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'agent_video_analyst',
    category: ToolCategory.AGENT,
    name: '视频情报 (Video Ops)',
    version: '1.0',
    author: 'Nexus Vision',
    description: '【视频】分析视频关键帧、转录音频内容、识别事件序列。',
    targetTypes: [NodeType.VIDEO],
    promptTemplate: "分析该视频内容（基于提供的元数据或帧数据）：\n1. 场景描述：视频发生了什么事件？\n2. 关键实体：出现了哪些人、车、物？\n3. 音频线索：如果有语音，概括对话内容或背景噪音特征。\n4. 拍摄环境：推断时间和地点。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'agent_translator',
    category: ToolCategory.AGENT,
    name: '文化解码 (Decoder)',
    version: '2.0',
    author: 'Nexus Polyglot',
    description: '翻译并解释俚语、隐喻及文化背景。',
    targetTypes: [NodeType.SOCIAL_POST, NodeType.DOCUMENT, NodeType.NOTE, NodeType.VIDEO, NodeType.AUDIO],
    promptTemplate: "将内容翻译为中文。重点解释：\n1. 黑话或俚语。\n2. 政治或宗教隐喻。\n3. 可能暗示地理位置的方言特征。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_entity_extract',
    category: ToolCategory.AGENT,
    name: '实体提取 (Extractor)',
    version: '3.0',
    author: 'Nexus Core',
    description: '从非结构化文本中提取人名、地名、组织。',
    targetTypes: [NodeType.DOCUMENT, NodeType.NOTE, NodeType.REPORT, NodeType.SOCIAL_POST],
    promptTemplate: "深度阅读文本，提取所有提及的实体。\n重点关注：\n- 个人姓名\n- 组织机构\n- 具体地点\n- 提及的时间点\n- 涉及的违禁品或技术名词\n请创建这些实体节点。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'agent_timeline_gen',
    category: ToolCategory.AGENT,
    name: '时间线生成 (Timeline)',
    version: '1.0',
    author: 'Nexus Time',
    description: '从复杂的报告或文本中梳理事件发生的时间顺序。',
    targetTypes: [NodeType.REPORT, NodeType.DOCUMENT, NodeType.NOTE],
    promptTemplate: "阅读输入内容，构建一个按时间顺序排列的事件列表。\n格式要求：[时间] - [事件描述] (相关实体)。\n如果时间不明确，请推断可能的日期范围。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_summarizer',
    category: ToolCategory.AGENT,
    name: '智能摘要 (Briefing)',
    version: '1.5',
    author: 'Nexus Core',
    description: '将长篇文档或大量数据浓缩为关键情报简报。',
    targetTypes: [NodeType.DOCUMENT, NodeType.REPORT, NodeType.LEAK_DUMP],
    promptTemplate: "你是情报分析主管。将输入内容总结为 200 字以内的“执行摘要”。\n包含：\n1. 核心事实 (Who, What, Where)。\n2. 数据的潜在价值。\n3. 下一步行动建议。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_code_audit',
    category: ToolCategory.AGENT,
    name: '代码审计 (Audit)',
    version: '1.0',
    author: 'SecDev',
    description: '分析代码片段中的安全漏洞或恶意逻辑。',
    targetTypes: [NodeType.DOCUMENT], 
    promptTemplate: "分析这段代码片段：\n1. 识别编程语言。\n2. 寻找硬编码的凭证 (API Key, Password)。\n3. 发现潜在的安全漏洞 (SQLi, XSS, RCE)。\n4. 解释代码的恶意意图（如果有）。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_deepfake',
    category: ToolCategory.AGENT,
    name: 'Deepfake 检测',
    version: 'Beta',
    author: 'TruthLens',
    description: '辅助分析视频/图片是否为 AI 生成。',
    targetTypes: [NodeType.IMAGE, NodeType.VIDEO],
    promptTemplate: "寻找 AI 生成内容的常见伪影：\n1. 手指数量或形状异常。\n2. 背景纹理的不连贯。\n3. 瞳孔反射不一致。\n4. 边缘模糊或过度平滑。\n给出真实性概率评估。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_data_cleaner',
    category: ToolCategory.AGENT,
    name: '数据清洗 (Cleaner)',
    version: '1.0',
    author: 'Nexus Utils',
    description: '将杂乱的文本日志或 CSV 格式化为 JSON 对象。',
    targetTypes: [NodeType.NOTE, NodeType.DOCUMENT],
    promptTemplate: "将输入的非结构化文本数据整理为干净的 JSON 格式。\n去除无用的乱码、空白符。\n提取键值对。",
    autoExpand: false,
    isSimulated: false
  },

  // ============================================
  // SECTION 2: REAL ONLINE TOOLS (Google Grounding)
  // No API Keys needed, uses Google Search
  // ============================================
  
  // --- SOCMINT (Social Media) ---
  {
    id: 'mcp_github_recon',
    category: ToolCategory.MCP,
    name: 'GitHub 侦察 (Live)',
    version: 'Live',
    author: 'GitHub',
    description: '【真实】搜索 GitHub 上的代码库、Issue 和用户信息。',
    targetTypes: [NodeType.ENTITY, NodeType.EMAIL, NodeType.SEARCH_QUERY],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "使用 site:github.com 搜索该目标。查找：\n1. 相关的用户 Profile。\n2. 包含该名称/邮箱的代码提交记录。\n3. 泄露的配置文件或密钥。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_reddit_intel',
    category: ToolCategory.MCP,
    name: 'Reddit 讨论 (Live)',
    version: 'Live',
    author: 'Reddit',
    description: '【真实】检索 Reddit 上的相关讨论串和用户踪迹。',
    targetTypes: [NodeType.SEARCH_QUERY, NodeType.ENTITY, NodeType.TOPIC],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "使用 site:reddit.com 搜索相关话题。总结：\n1. 社区对该目标的普遍看法。\n2. 相关的爆料或传闻。\n3. 关键的评论者 ID。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_linkedin_lookup',
    category: ToolCategory.MCP,
    name: 'LinkedIn 职场 (Live)',
    version: 'Live',
    author: 'LinkedIn',
    description: '【真实】查找职业背景、任职公司和同事关系。',
    targetTypes: [NodeType.ENTITY, NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "使用 site:linkedin.com 搜索目标。提取：\n1. 当前职位和公司。\n2. 过往的工作经历时间线。\n3. 教育背景。\n4. 可能的同事或合作伙伴。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_telegram_search',
    category: ToolCategory.MCP,
    name: 'Telegram 频道 (Live)',
    version: 'Live',
    author: 'Telegram',
    description: '【真实】检索公开的 Telegram 频道和群组预览。',
    targetTypes: [NodeType.SEARCH_QUERY, NodeType.TOPIC, NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "使用 site:t.me 搜索相关的公开频道或群组。提取：\n1. 频道名称和链接。\n2. 频道的主要讨论话题（如黑客、政治、金融）。\n3. 订阅人数（如果可见）。",
    autoExpand: true,
    isSimulated: false
  },

  // --- TECH INT (Technical Intelligence) ---
  {
    id: 'mcp_tech_stack',
    category: ToolCategory.MCP,
    name: '技术栈识别 (Live)',
    version: 'Live',
    author: 'BuiltWith',
    description: '【真实】搜索网站使用的框架、服务器和技术组件。',
    targetTypes: [NodeType.DOMAIN, NodeType.URL],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该域名的技术栈信息（参考 BuiltWith, Wappalyzer 等来源）。提取：\n1. Web 服务器类型 (Nginx, Apache)。\n2. CMS 系统 (WordPress, Drupal)。\n3. 使用的 JavaScript 框架 (React, Vue)。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'mcp_ssl_subdomains',
    category: ToolCategory.MCP,
    name: 'SSL 子域名发现 (Live)',
    version: 'Live',
    author: 'Crt.sh',
    description: '【真实】通过 SSL 证书透明度记录查找子域名。',
    targetTypes: [NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索 crt.sh 或其他证书透明度日志，查找该域名的子域名 (Subdomains)。\n列出所有发现的唯一子域名。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_mac_lookup',
    category: ToolCategory.MCP,
    name: 'MAC 地址厂商 (Live)',
    version: 'Live',
    author: 'IEEE',
    description: '【真实】查询 MAC 地址 OUI 以识别设备制造商。',
    targetTypes: [NodeType.MAC_ADDRESS],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该 MAC 地址的前缀 (OUI) 对应的设备制造商。例如 Apple, Cisco, Huawei。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'mcp_vuln_search',
    category: ToolCategory.MCP,
    name: 'CVE 漏洞情报 (Live)',
    version: 'Live',
    author: 'NIST',
    description: '【真实】检索特定漏洞的 PoC 和利用详情。',
    targetTypes: [NodeType.VULNERABILITY],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该 CVE 编号的最新技术分析。1. 查找是否存在公开的 PoC (Proof of Concept)。2. 确认受影响的具体版本。3. 修复补丁是否可用。",
    autoExpand: false,
    isSimulated: false
  },
  
  // --- THREAT INT (Threat Intelligence) ---
  {
    id: 'mcp_ransomware_check',
    category: ToolCategory.MCP,
    name: '勒索软件关联 (Live)',
    version: 'Live',
    author: 'RansomWatch',
    description: '【真实】检查实体是否出现在勒索软件勒索名单中。',
    targetTypes: [NodeType.ORGANIZATION, NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该组织名称是否出现在 Ransomware Leak Sites（勒索软件泄露站点）的新闻报道中。\n确认：\n1. 攻击者团伙名称 (如 LockBit, Clop)。\n2. 宣称的攻击时间。\n3. 泄露数据的规模。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_breach_check',
    category: ToolCategory.MCP,
    name: '泄露数据检索 (Live)',
    version: 'Live',
    author: 'LeakCheck',
    description: '【真实】搜索该邮箱/用户是否出现在公开泄露事件中。',
    targetTypes: [NodeType.EMAIL, NodeType.ENTITY],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该邮箱/用户名是否出现在公开的数据泄露列表、Pastebin 或安全论坛中。\n注意：仅查找提及记录，确认涉及哪些网站的泄露（如 LinkedIn Breach, Adobe Breach）。",
    autoExpand: false,
    isSimulated: false
  },

  // --- GENERAL OSINT ---
  {
    id: 'mcp_google_search_entity',
    category: ToolCategory.MCP,
    name: '全网搜索 (Google)',
    version: 'Live',
    author: 'Google',
    description: '【真实】实时检索关于该实体的最新互联网情报。',
    targetTypes: [],  // 全局工具 - 适用于所有实体类型
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "使用 Google 搜索查询关于「{{title}}」的最新信息。提取：\n1. 相关的近期新闻。\n2. 关联的社交媒体账号或网站。\n3. 已知的公开声明或事件。\n4. 其他有价值的情报线索。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_fact_checker',
    category: ToolCategory.MCP,
    name: '事实核查 (FactCheck)',
    version: 'Live',
    author: 'FactCheck',
    description: '【真实】交叉验证新闻、谣言或声明的真实性。',
    targetTypes: [NodeType.SOCIAL_POST, NodeType.NOTE, NodeType.REPORT],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "对输入内容中的关键主张进行事实核查。\n搜索主流媒体和辟谣网站（如 Snopes）。\n结论：真实 / 虚假 / 有争议，并附上来源链接。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'mcp_wayback_machine',
    category: ToolCategory.MCP,
    name: '历史档案 (Wayback)',
    version: 'Live',
    author: 'Archive.org',
    description: '【真实】搜索网页的历史快照和变迁。',
    targetTypes: [NodeType.URL, NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该 URL 在 Internet Archive (Wayback Machine) 上的记录。\n寻找：\n1. 网站早期的主要内容。\n2. 网站发生重大改版的时间点。\n3. 已被删除的页面痕迹。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_whois_live',
    category: ToolCategory.MCP,
    name: 'WHOIS 查询 (Live)',
    version: 'Live',
    author: 'ICANN',
    description: '【真实】通过搜索引擎检索域名的注册信息。',
    targetTypes: [NodeType.DOMAIN, NodeType.URL],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该域名的 WHOIS 记录信息。尝试找到：\n1. 注册商 (Registrar)。\n2. 注册日期和到期日期。\n3. 任何公开的 Registrant Organization 信息。\n注意：不要编造，只提取搜索结果中确定的信息。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_dns_resolve',
    category: ToolCategory.MCP,
    name: '域名DNS解析 (Live)',
    version: 'Live',
    author: 'OSINT',
    description: '【真实】解析域名的DNS记录，获取关联IP地址。',
    targetTypes: [NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `搜索该域名的DNS解析记录信息。

查询内容：
1. **A记录** - 域名指向的IPv4地址
2. **AAAA记录** - 域名指向的IPv6地址
3. **MX记录** - 邮件服务器地址
4. **NS记录** - 域名服务器
5. **TXT记录** - SPF、DKIM等验证信息
6. **CNAME记录** - 别名指向

搜索方法：
- site:dnschecker.org "域名"
- site:mxtoolbox.com "域名"
- "域名" DNS records A AAAA MX
- site:securitytrails.com "域名"

为发现的每个IP地址创建 IP_ADDRESS 类型节点，包含：
- IP地址
- 记录类型（A/AAAA/MX等）
- 地理位置（如果能确定）
- 所属ISP/托管商

同时更新原域名节点的 NameServer 属性。`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_google_maps_lookup',
    category: ToolCategory.MCP,
    name: '地理侦察 (Maps)',
    version: 'Live',
    author: 'Google',
    description: '【真实】查询地理位置周边的设施和环境。',
    targetTypes: [NodeType.GEO_LOCATION, NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该地点的详细信息。查找周边的关键设施（政府机构、关键基础设施）。寻找用户评论中提及的安全相关信息。",
    autoExpand: true,
    isSimulated: false
  },

  // --- FININT & LEGAL ---
  {
    id: 'mcp_company_check',
    category: ToolCategory.MCP,
    name: '企业背景调查 (Live)',
    version: 'Live',
    author: 'OpenData',
    description: '【真实】搜索工商注册信息、负面新闻。',
    targetTypes: [NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该公司的工商注册信息、LinkedIn 页面和相关新闻。\n1. 确认总部所在地。\n2. 寻找主要高管姓名。\n3. 检查是否有涉诉或诈骗指控。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_company_email',
    category: ToolCategory.MCP,
    name: '企业邮箱挖掘 (Live)',
    version: 'Live',
    author: 'OSINT',
    description: '【真实】搜索企业关联的邮箱地址、邮箱格式。',
    targetTypes: [NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `搜索该企业相关的邮箱地址信息。

查询维度：
1. **官方联系邮箱** - 官网公开的客服、商务、招聘等邮箱
2. **邮箱命名格式** - 该公司的邮箱命名规则（如 firstname.lastname@company.com）
3. **高管邮箱** - CEO、CFO、CTO等高管的公开邮箱
4. **部门邮箱** - 销售、技术支持、法务等部门邮箱
5. **历史泄露** - 是否在数据泄露事件中出现过该公司邮箱

搜索方法：
- site:linkedin.com "@公司域名"
- site:hunter.io "公司名称"
- "公司名称" email contact
- "@公司域名" filetype:pdf

为每个发现的邮箱地址创建 EMAIL 类型节点，包含：
- 邮箱地址
- 关联人员/部门
- 来源渠道`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_swift_lookup',
    category: ToolCategory.MCP,
    name: 'SWIFT/BIC 查询',
    version: 'Live',
    author: 'SwiftRef',
    description: '【真实】查找银行 SWIFT 代码对应的分行信息。',
    targetTypes: [NodeType.ORGANIZATION, NodeType.NOTE],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该 SWIFT/BIC 代码对应的具体银行名称、分行地址和国家。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'mcp_patent_search',
    category: ToolCategory.MCP,
    name: '专利/商标检索',
    version: 'Live',
    author: 'WIPO',
    description: '【真实】查询个人或公司持有的知识产权。',
    targetTypes: [NodeType.ORGANIZATION, NodeType.ENTITY],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该目标申请的专利或注册商标（Google Patents, Justia）。\n提取：\n1. 主要技术领域。\n2. 最近的专利申请标题。\n3. 合作的发明人。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_etherscan_live',
    category: ToolCategory.MCP,
    name: 'Etherscan 追踪 (Live)',
    version: 'Live',
    author: 'Etherscan',
    description: '【真实】通过搜索公开账本浏览器查询钱包动态。',
    targetTypes: [NodeType.CRYPTO_WALLET],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索 Etherscan 或其他区块链浏览器关于该钱包地址的记录。提取：\n1. 当前余额。\n2. 最近的一笔主要交易时间。\n3. 是否被打上 'Phish' 或 'Hack' 的标签。",
    autoExpand: true,
    isSimulated: false
  },

  // ============================================
  // SECTION 3: SIMULATED TOOLS (APIs needing Keys)
  // Kept for demonstration of specific JSON structures
  // ============================================
  {
    id: 'api_virustotal',
    category: ToolCategory.API,
    name: 'VirusTotal (Sim)',
    version: 'v3',
    author: 'Google',
    description: '【模拟】查询威胁情报 (需 API Key)。',
    targetTypes: [NodeType.IP_ADDRESS, NodeType.FILE_HASH],
    apiConfig: {
        endpoint: 'https://www.virustotal.com/api/v3/ip_addresses/',
        method: 'GET',
        mockResponse: {
            "data": {
                "attributes": {
                    "last_analysis_stats": { "harmless": 50, "malicious": 12, "suspicious": 3 },
                    "reputation": -25,
                    "network": "185.100.0.0/24",
                    "tags": ["botnet", "phishing", "cobalt-strike"]
                }
            }
        }
    },
    promptTemplate: "基于模拟的 VT 数据：1. 判断威胁等级。2. 提取 ASN。3. 关联攻击组织标签。",
    autoExpand: true,
    isSimulated: true
  },
  {
    id: 'api_shodan',
    name: 'Shodan Host (Sim)',
    category: ToolCategory.API,
    version: '2.0',
    author: 'Shodan',
    description: '【模拟】查询端口暴露情况 (需 API Key)。',
    targetTypes: [NodeType.IP_ADDRESS],
    apiConfig: {
        endpoint: 'https://api.shodan.io/shodan/host/',
        method: 'GET',
        mockResponse: {
            "ports": [22, 80, 443, 3389],
            "os": "Linux 4.x",
            "vulns": ["CVE-2021-44228"],
            "data": [{ "port": 22, "product": "OpenSSH" }]
        }
    },
    promptTemplate: "分析开放端口和 CVE 漏洞。",
    autoExpand: true,
    isSimulated: true
  },
  {
    id: 'api_flightaware',
    name: 'FlightAware (Sim)',
    category: ToolCategory.API,
    version: '4.0',
    author: 'FlightAware',
    description: '【模拟】航班实时追踪。',
    targetTypes: [NodeType.VEHICLE],
    apiConfig: {
        endpoint: 'https://aeroapi.flightaware.com/',
        method: 'GET',
        mockResponse: {
            "flights": [{ "ident": "N12345", "origin": "KJFK", "destination": "EGLL", "status": "En Route" }]
        }
    },
    promptTemplate: "追踪飞机航程。",
    autoExpand: true,
    isSimulated: true
  },

  // ============================================
  // SECTION 4: UTILITY TOOLS (Local Logic)
  // ============================================
  {
    id: 'mcp_dork_gen',
    category: ToolCategory.MCP,
    name: 'Dork 生成器 (Util)',
    version: '2.0',
    author: 'GHDB',
    description: '构建 Google Hacking 搜索语法。',
    targetTypes: [NodeType.SEARCH_QUERY, NodeType.ENTITY, NodeType.DOMAIN],
    mcpConfig: { functionName: 'generateDorks' },
    promptTemplate: "生成 5 个 Google Dork 语法用于搜索该目标。例如：filetype:pdf, inurl:admin, site:target.com。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_calc_subnet',
    category: ToolCategory.MCP,
    name: 'Subnet 计算 (Util)',
    version: '1.0',
    author: 'NetUtils',
    description: '计算 IP CIDR 范围。',
    targetTypes: [NodeType.IP_ADDRESS],
    mcpConfig: { functionName: 'calculateSubnet' },
    promptTemplate: "计算该 IP 所在 C 段 (CIDR /24) 的网络范围。",
    autoExpand: true,
    isSimulated: false
  },

  // ============================================
  // SECTION 5: INTELLIGENCE COLLECTION OPS (NEW)
  // ============================================
  
  // HUMINT
  {
    id: 'col_humint_reliability',
    category: ToolCategory.AGENT,
    name: '信源可靠性评级 (HUMINT)',
    version: '1.0',
    author: 'Intel Ops',
    description: '根据海军部代码 (Admiralty Code) 评估人力情报来源的可靠性和内容可信度。',
    targetTypes: [NodeType.SOURCE_HUMINT, NodeType.REPORT],
    promptTemplate: "评估该信源的可靠性。\n输入数据包括过往记录、动机和访问权限。\n1. 判定来源可靠性 (A-F)。\n2. 判定信息可信度 (1-6)。\n3. 输出具体的评级理由。\n4. 标记潜在的偏见或欺骗风险。",
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'col_humint_debrief',
    category: ToolCategory.AGENT,
    name: '审讯/访谈提纲生成',
    version: '1.0',
    author: 'Intel Ops',
    description: '基于现有情报生成针对该信源的访谈或审讯问题清单。',
    targetTypes: [NodeType.SOURCE_HUMINT, NodeType.ENTITY],
    promptTemplate: "你是审讯专家。针对该目标生成一份访谈提纲。\n目标是填补当前情报图谱中的空白。\n1. 设计 5-10 个关键问题。\n2. 包含用于验证真伪的控制性问题 (Control Questions)。\n3. 建议采用的审讯策略（如：建立共情、证据施压）。",
    autoExpand: false,
    isSimulated: false
  },

  // SIGINT
  {
    id: 'col_sigint_alloc',
    category: ToolCategory.MCP,
    name: '无线电频谱查询 (SIGINT)',
    version: 'Live',
    author: 'ITU/FCC',
    description: '【真实】查询特定频率的分配情况和常见用途。',
    targetTypes: [NodeType.SOURCE_SIGINT, NodeType.SENSOR],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该频率 (Frequency) 的无线电频谱分配情况。\n1. 确定该频段的法定用途（如：航空、海事、军用、业余无线电）。\n2. 查找该频率是否与已知的数字通信协议（如 TETRA, DMR, LoRa）相关。\n3. 搜索该频率在目标区域的已知用户。",
    autoExpand: true,
    isSimulated: false
  },

  // IMINT
  {
    id: 'col_imint_analysis',
    category: ToolCategory.AGENT,
    name: '地理空间图像分析 (IMINT)',
    version: '2.5',
    author: 'Vision AI',
    description: '分析卫星图或航拍图中的军事/设施特征。',
    targetTypes: [NodeType.SOURCE_IMINT, NodeType.IMAGE],
    promptTemplate: "作为 IMINT 图像情报分析师，分析图像内容。\n1. 识别关键基础设施（跑道、储油罐、雷达罩、防御工事）。\n2. 估算设施的大致尺寸或容量。\n3. 判断设施的活跃状态（如：车辆活动、烟雾、新施工痕迹）。\n4. 标记感兴趣区域 (ROI)。",
    autoExpand: true,
    isSimulated: false
  },

  // GEOINT
  {
    id: 'col_geoint_context',
    category: ToolCategory.MCP,
    name: '坐标环境侦察 (GEOINT)',
    version: 'Live',
    author: 'Google Maps',
    description: '【真实】对坐标周边环境进行详细的情报侦察。',
    targetTypes: [NodeType.SOURCE_GEOINT, NodeType.GEO_LOCATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "搜索该地理坐标周边的详细环境信息。\n1. 识别最近的军事基地、政府设施或关键基础设施。\n2. 查找该地点的历史卫星图像变化记录（新闻报道）。\n3. 搜索与该地点相关的地缘政治事件。",
    autoExpand: true,
    isSimulated: false
  },

  // OSINT (Source specific)
  {
    id: 'col_osint_crossref',
    category: ToolCategory.MCP,
    name: '跨平台身份关联 (OSINT)',
    version: 'Live',
    author: 'Sherlock',
    description: '【真实】基于用户名或特征在全网搜索关联账号。',
    targetTypes: [NodeType.SOURCE_OSINT, NodeType.IDENTITY, NodeType.SOCIAL_PROFILE],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "对该用户名/ID 进行跨平台搜索。\n查找：GitHub, Twitter, Instagram, Reddit, Telegram, LinkedIn 等平台的同名账号。\n分析这些账号是否属于同一自然人的可能性（基于头像、简介、活动时间的重合度）。",
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'col_osint_docs',
    category: ToolCategory.MCP,
    name: '敏感文档挖掘 (OSINT)',
    version: 'Live',
    author: 'Google Dorks',
    description: '【真实】搜索与目标相关的公开 PDF, Excel, Doc 文档。',
    targetTypes: [NodeType.ORGANIZATION, NodeType.SOURCE_OSINT, NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: "构造 Google Dork (filetype:pdf OR filetype:xlsx OR filetype:docx) 搜索与该目标相关的文件。\n重点寻找：\n1. 内部通讯录。\n2. 财务报表。\n3. 招标文件。\n4. 包含 'Confidential' 或 'Internal Use Only' 的文件。",
    autoExpand: true,
    isSimulated: false
  },

  // ============================================
  // SECTION: ENHANCED OSINT TOOLS (2025)
  // ============================================

  // --- Threat Intelligence ---
  {
    id: 'mcp_abuseipdb',
    category: ToolCategory.MCP,
    name: 'IP信誉检测 (AbuseIPDB)',
    version: 'Live',
    author: 'AbuseIPDB',
    description: '【真实】查询IP地址的恶意活动记录、威胁评分和攻击类型',
    targetTypes: [NodeType.IP_ADDRESS, NodeType.C2_SERVER, NodeType.SERVER],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `搜索该IP地址在AbuseIPDB的威胁情报记录。
重点查询：
1. 该IP的滥用置信度评分（0-100）
2. 报告的攻击类型（DDoS, 暴力破解, 扫描, 垃圾邮件等）
3. 最近的恶意活动时间和频率
4. IP归属的ISP和地理位置
5. 是否被列入黑名单

如果发现威胁记录，请创建以下实体：
- 威胁评分作为节点属性
- 相关的攻击类型创建为ATTACK_PATTERN节点
- ISP信息创建为ORGANIZATION节点
- 地理位置创建为GEO_LOCATION节点`,
    autoExpand: true,
    isSimulated: false
  },

  {
    id: 'mcp_urlscan',
    category: ToolCategory.MCP,
    name: 'URL威胁扫描 (URLScan)',
    version: 'Live',
    author: 'URLScan.io',
    description: '【真实】扫描URL并分析钓鱼、恶意脚本、重定向链',
    targetTypes: [NodeType.URL, NodeType.DOMAIN, NodeType.PHISHING_KIT, NodeType.DARKWEB_SITE],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对该URL进行威胁扫描分析（通过URLScan.io公开数据）。
检测内容：
1. 钓鱼网站指标（伪装品牌、疑似登录表单）
2. 恶意JavaScript代码或加密矿工脚本
3. 重定向链和最终目标页面
4. 页面中加载的第三方资源和追踪器
5. SSL证书信息和域名注册时间
6. 威胁分类（钓鱼/恶意软件/诈骗/安全）

创建实体：
- 如发现钓鱼，创建PHISHING_KIT节点并关联伪装的品牌
- 恶意脚本创建CODE_SNIPPET节点
- 最终重定向目标创建新URL节点
- SSL证书创建SSL_CERT节点`,
    autoExpand: true,
    isSimulated: false
  },

  {
    id: 'mcp_web_content_extract',
    category: ToolCategory.MCP,
    name: '网页内容提取 (Web Extract)',
    version: 'Live',
    author: 'OSINT',
    description: '【真实】抓取网页内容，提取关键实体和情报信息',
    targetTypes: [NodeType.URL, NodeType.DOMAIN],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `访问并分析该URL「{{title}}」的网页内容。

提取以下信息：
1. **页面摘要** - 网页的主要内容和目的（100字以内）
2. **关键实体**
   - 人名（ENTITY）
   - 组织/公司名（ORGANIZATION）
   - 地理位置（GEO_LOCATION）
   - 联系方式：邮箱（EMAIL）、电话（PHONE_NUMBER）
   - 社交账号链接（SOCIAL_PROFILE）
3. **关联链接** - 页面中的重要外链（URL）
4. **时间信息** - 发布日期、更新时间等（EVENT）
5. **关键数据** - 金额、统计数字等重要数据点

创建实体规则：
- 每个识别到的人名创建 ENTITY 节点
- 每个组织创建 ORGANIZATION 节点
- 每个邮箱创建 EMAIL 节点
- 每个电话创建 PHONE_NUMBER 节点
- 重要外链创建 URL 节点
- 地址创建 GEO_LOCATION 节点

注意：
- 优先提取与情报调查相关的实体
- 忽略通用的页脚链接和广告内容
- 如页面无法访问，说明原因`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Blockchain Analysis ---
  {
    id: 'mcp_blockchain_explorer',
    category: ToolCategory.MCP,
    name: '多链追踪 (Blockchain)',
    version: 'Live',
    author: 'Multi-Chain',
    description: '【真实】追踪BTC/ETH/USDT等加密货币地址的交易和余额',
    targetTypes: [NodeType.CRYPTO_WALLET, NodeType.TRANSACTION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `分析该加密货币地址的链上活动（通过Blockchain.com, Etherscan等公开数据）。
查询内容：
1. 当前余额和历史余额变化
2. 交易历史（发送/接收的金额、时间、对手方地址）
3. 地址标签和已知归属（交易所、混币器、DeFi协议）
4. 首次/最近活跃时间
5. 关联地址和资金流向
6. 参与的智能合约交互

提取实体：
- 对手方地址创建新的CRYPTO_WALLET节点
- 交易记录创建TRANSACTION节点
- 交易所/服务创建ORGANIZATION节点
- 智能合约创建TOOL_SOFTWARE节点
- 如发现异常模式，创建INDICATOR节点

注意识别地址类型：个人钱包/交易所地址/智能合约/混币器`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Social Media Intelligence ---
  {
    id: 'mcp_twitter_intel',
    category: ToolCategory.MCP,
    name: 'X/Twitter 深度情报 (Live)',
    version: 'Live',
    author: 'Twitter OSINT',
    description: '【真实】分析Twitter/X账号的推文历史、关注关系、互动网络',
    targetTypes: [NodeType.SOCIAL_PROFILE, NodeType.ENTITY, NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对该Twitter/X账号进行深度情报收集。
分析维度：
1. 账号基本信息（注册时间、关注数、粉丝数、认证状态）
2. 推文内容分析（关键词、话题标签、情感倾向）
3. 活跃时间规律（判断时区和作息习惯）
4. 互动网络（频繁@的账号、转发来源）
5. 关联线索（简介中的链接、提及的组织/地点）
6. 历史推文中的敏感信息（位置泄露、个人信息）

提取实体：
- 频繁互动的账号创建SOCIAL_PROFILE节点
- 提及的组织创建ORGANIZATION节点
- 地理位置信息创建GEO_LOCATION节点
- 个人信息创建ENTITY节点
- 重要推文创建SOCIAL_POST节点

注意：
- 判断账号是真人还是机器人
- 识别可能的多账号操作模式
- 分析情感变化和异常行为`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Digital Forensics ---
  {
    id: 'agent_exif_extractor',
    category: ToolCategory.AGENT,
    name: 'EXIF深度分析 (Metadata)',
    version: '2.0',
    author: 'Forensics Lab',
    description: '【真实】从图片中提取GPS坐标、拍摄设备、编辑软件等元数据',
    targetTypes: [NodeType.IMAGE, NodeType.METADATA, NodeType.SCREENSHOT],
    promptTemplate: `作为数字取证专家，深度分析该图片的EXIF元数据和隐藏信息。

分析项目：
1. **GPS定位**
   - 精确GPS坐标（纬度/经度）
   - 海拔高度
   - 如有坐标，反向地理编码得出具体地址

2. **拍摄设备指纹**
   - 相机/手机品牌和型号
   - 镜头信息
   - 设备序列号（如果存在）

3. **拍摄参数**
   - 拍摄日期和时间（注意时区）
   - 曝光参数（光圈、快门、ISO）
   - 白平衡、闪光灯使用

4. **软件痕迹**
   - 图片编辑软件（Photoshop, GIMP等）
   - 编辑时间和版本
   - 缩略图中的原始信息

5. **隐藏信息**
   - Copyright和作者信息
   - 评论字段中的备注
   - 用户自定义标签

6. **异常检测**
   - 元数据是否被篡改或删除
   - 拍摄时间与文件时间的差异
   - GPS坐标与场景内容的一致性

创建实体：
- GPS坐标创建GEO_LOCATION节点
- 拍摄设备创建DEVICE节点
- 如发现作者信息创建ENTITY节点
- 元数据本身创建METADATA节点
- 如检测到篡改创建INDICATOR节点

输出格式：
以结构化方式列出所有元数据字段，标注重要发现和潜在线索。`,
    autoExpand: true,
    isSimulated: false
  },

  // ============================================
  // SECTION: MEDIUM PRIORITY TOOLS
  // ============================================

  // --- Enhanced Threat Intelligence ---
  {
    id: 'mcp_otx_threat',
    category: ToolCategory.MCP,
    name: '威胁脉冲 (AlienVault OTX)',
    version: 'Live',
    author: 'AlienVault',
    description: '【真实】查询AlienVault开放威胁交换平台的IOC和攻击活动',
    targetTypes: [NodeType.IP_ADDRESS, NodeType.DOMAIN, NodeType.FILE_HASH, NodeType.URL, NodeType.MALWARE],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `查询该IOC在AlienVault OTX威胁情报平台的关联信息。

搜索重点：
1. **威胁脉冲 (Pulses)**
   - 该IOC出现在哪些威胁脉冲中
   - 脉冲的标题、描述和标签
   - 脉冲的创建者和发布时间
   - 置信度和严重性评级

2. **攻击活动关联**
   - 关联的APT组织或威胁行为者
   - 攻击战役名称和时间线
   - 攻击目标行业和地理区域
   - 使用的TTPs (战术、技术、过程)

3. **相关IOCs**
   - 同一脉冲中的其他指标
   - IP地址、域名、哈希值的关联
   - C2服务器和恶意软件样本
   - 钓鱼域名和URL

4. **历史活动**
   - 首次/最近观测时间
   - 活跃时间段和频率
   - 行为模式变化

5. **MITRE ATT&CK映射**
   - 对应的ATT&CK技术ID
   - 战术阶段（初始访问、执行、持久化等）

创建实体：
- 威胁行为者创建THREAT_ACTOR节点
- 攻击战役创建CAMPAIGN节点
- 相关IOC创建对应类型节点（IP/域名/哈希）
- ATT&CK技术创建ATTACK_PATTERN节点
- 恶意软件创建MALWARE节点
- 脉冲本身创建REPORT节点

输出结构：
按时间顺序列出相关脉冲，标注高危威胁和需要重点关注的关联。`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Corporate Intelligence ---
  {
    id: 'mcp_company_graph',
    category: ToolCategory.MCP,
    name: '企业关系网 (Corporate Tree)',
    version: 'Live',
    author: 'OpenCorporates',
    description: '【真实】分析企业股权结构、高管关系、子公司和关联企业',
    targetTypes: [NodeType.ORGANIZATION, NodeType.COMPANY_REGISTRATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `深度挖掘该企业的股权结构和关系网络（通过企查查、天眼查、OpenCorporates等公开数据）。

调查维度：

1. **基本工商信息**
   - 统一社会信用代码/注册号
   - 法定代表人和实际控制人
   - 注册资本和实缴资本
   - 成立日期和营业期限
   - 注册地址和经营范围

2. **股权结构穿透**
   - 股东列表和持股比例
   - 股权穿透至自然人和最终受益人
   - 股权质押和冻结情况
   - 历史股权变更记录

3. **对外投资**
   - 控股子公司列表
   - 参股公司和投资比例
   - 投资行业分布
   - 投资时间线

4. **高管团队**
   - 董事、监事、高管名单
   - 高管在其他公司的任职
   - 高管变更历史
   - 关键人物背景

5. **企业关联**
   - 同一实控人的其他企业
   - 关联交易对手
   - 供应商和客户关系
   - 竞争对手识别

6. **风险预警**
   - 法律诉讼和仲裁
   - 行政处罚
   - 经营异常
   - 税务违规
   - 失信被执行

7. **资质与荣誉**
   - 行业资质和许可证
   - 知识产权（专利、商标）
   - 认证证书
   - 获奖记录

创建实体：
- 股东创建ENTITY或ORGANIZATION节点
- 高管创建ENTITY节点
- 子公司创建ORGANIZATION节点
- 实控人创建ENTITY节点
- 关联企业创建ORGANIZATION节点
- 法律诉讼创建LEGAL_CASE节点
- 专利商标创建PATENT节点

关系标注：
- 使用"持股X%"、"法定代表人"、"实际控制"等标签
- 标注关系建立时间和当前状态

输出格式：
生成企业关系图谱，突出核心控制链和风险点。`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Community Intelligence ---
  {
    id: 'mcp_discord_recon',
    category: ToolCategory.MCP,
    name: 'Discord 社区情报 (Live)',
    version: 'Live',
    author: 'Discord OSINT',
    description: '【真实】搜索Discord公开服务器和讨论内容',
    targetTypes: [NodeType.ORGANIZATION, NodeType.THREAT_ACTOR, NodeType.SOCIAL_PROFILE, NodeType.APP],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对该目标在Discord平台的社区活动进行情报收集。

调查内容：

1. **服务器发现**
   - 与目标相关的Discord服务器
   - 服务器名称、描述和邀请链接
   - 服务器成员数估算（如有公开数据）
   - 创建时间和验证级别

2. **社区分析**
   - 服务器的主要讨论话题
   - 活跃频道和热门内容
   - 公告和置顶消息
   - 社区规则和管理方式

3. **成员构成**
   - 关键管理员和版主
   - 活跃用户和意见领袖
   - 机器人使用情况
   - 用户角色和权限结构

4. **内容监控**
   - 敏感讨论和情报线索
   - 技术交流（工具、方法）
   - 交易信息（如涉及）
   - 计划中的活动或事件

5. **关联分析**
   - 其他相关Discord服务器
   - 跨平台账号关联（Twitter, GitHub等）
   - 外部链接和资源
   - 合作伙伴和友链

6. **威胁评估**（如适用）
   - 可疑活动指标
   - 违规内容类型
   - 潜在的协同攻击计划
   - 社会工程或钓鱼企图

7. **时间戳分析**
   - 社区活跃时间段
   - 重大事件时间线
   - 成员增长趋势

创建实体：
- 服务器创建APP节点（Discord Server）
- 管理员创建ENTITY或SOCIAL_PROFILE节点
- 关联组织创建ORGANIZATION节点
- 如发现威胁创建THREAT_ACTOR节点
- 重要讨论创建NOTE或REPORT节点
- 外部链接创建URL节点

输出重点：
识别社区的真实目的、风险等级和关键人物。

注意：
仅收集公开可访问的信息，遵守Discord服务条款。`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Maritime Intelligence ---
  {
    id: 'mcp_vessel_tracker',
    category: ToolCategory.MCP,
    name: '船舶追踪 (AIS)',
    version: 'Live',
    author: 'MarineTraffic',
    description: '【真实】追踪商船实时位置、航线历史和港口停靠',
    targetTypes: [NodeType.SHIPPING, NodeType.VEHICLE, NodeType.ORGANIZATION],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `追踪该船舶的AIS信号和航运情报（通过VesselFinder, MarineTraffic公开数据）。

查询内容：

1. **船舶身份**
   - 船名 (Vessel Name)
   - IMO编号（国际海事组织识别号）
   - MMSI号码（海上移动通信识别码）
   - 呼号 (Call Sign)
   - 船旗国 (Flag)

2. **船舶规格**
   - 船舶类型（货船、油轮、集装箱船、客船等）
   - 船龄和建造年份
   - 总吨位 (Gross Tonnage)
   - 载重吨位 (Deadweight)
   - 船长、船宽、吃水
   - 发动机功率

3. **所有权信息**
   - 船东公司
   - 运营商
   - 管理公司
   - 租赁状态

4. **实时位置**
   - 当前经纬度坐标
   - 航速和航向
   - 目的港
   - 预计到达时间 (ETA)
   - 航行状态（航行中、停泊、锚泊）

5. **航线历史**
   - 过去30天的航迹
   - 停靠过的港口列表
   - 在港停留时间
   - 航线模式分析

6. **港口活动**
   - 当前停靠港口
   - 靠泊位置和码头
   - 装卸货物类型（如有公开信息）
   - 进出港时间

7. **安全与合规**
   - 船级社和认证
   - 检查记录（PSC - 港口国监督）
   - 缺陷和滞留记录
   - 事故历史

8. **制裁检查**
   - 是否在制裁名单
   - 疑似违规活动
   - 转运或"暗舱"行为

创建实体：
- 船舶创建VEHICLE节点
- 船东/运营商创建ORGANIZATION节点
- 停靠港口创建GEO_LOCATION节点
- 当前位置创建GEO_LOCATION节点
- 航线历史创建EVENT节点
- 如发现异常创建INDICATOR节点

关系标注：
- "拥有"、"运营"、"停靠"、"航向"等关系

输出格式：
生成航运时间线和地理路径图。

应用场景：
- 货物追踪
- 供应链分析
- 制裁监控
- 地缘政治情报`,
    autoExpand: true,
    isSimulated: false
  },

  // --- Web3 Intelligence ---
  {
    id: 'mcp_nft_tracker',
    category: ToolCategory.MCP,
    name: 'NFT持有分析 (OpenSea)',
    version: 'Live',
    author: 'NFT Analytics',
    description: '【真实】查询钱包持有的NFT资产和交易记录',
    targetTypes: [NodeType.CRYPTO_WALLET, NodeType.ENTITY],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `分析该以太坊地址的NFT持仓和交易活动（通过OpenSea, LooksRare等公开数据）。

分析维度：

1. **NFT持仓概览**
   - 持有的NFT总数量
   - 总价值估算（以ETH计）
   - 持有的项目/系列数量
   - 蓝筹NFT占比

2. **项目明细**
   - 每个NFT项目的名称
   - 持有数量
   - 地板价和估值
   - 稀有度排名（如有）
   - Token ID列表

3. **重点项目识别**
   - BAYC (无聊猿)
   - CryptoPunks
   - Azuki
   - Doodles
   - 其他知名蓝筹项目

4. **交易历史**
   - 最近的NFT购买记录
   - Mint（铸造）活动
   - 出售和转让记录
   - 交易频率和模式

5. **交易行为分析**
   - 是收藏家还是交易者
   - 持仓时长（长期持有 vs 快速翻转）
   - 盈亏估算
   - 交易对手方识别

6. **市场参与**
   - 参与的NFT Mint活动
   - 白名单资格
   - 社区参与度
   - DAO投票活动

7. **跨链NFT**
   - Polygon上的NFT
   - Solana生态（需要地址转换）
   - 其他链的资产

8. **关联分析**
   - ENS域名（如有）
   - POAP徽章（活动证明）
   - 社交图谱（Lens Protocol等）
   - 关注的项目和创作者

9. **风险指标**
   - 是否持有已被标记为scam的项目
   - 可疑的洗盘交易
   - 高风险项目占比

创建实体：
- 每个重要NFT项目创建ORGANIZATION节点
- NFT创作者创建ENTITY节点
- 交易记录创建TRANSACTION节点
- 如发现知名收藏家创建ENTITY节点
- ENS域名创建IDENTITY节点
- POAP创建ARTIFACT节点

关系标注：
- "持有X个"、"在Y价格购买"、"来自Z项目"

输出格式：
生成NFT资产表和交易时间线。

应用场景：
- 高净值个人识别
- NFT项目调查
- 洗钱追踪
- 社区影响力评估
- Web3身份画像`,
    autoExpand: true,
    isSimulated: false
  },

  // ============================================
  // SECTION: NEW MEDIA TOOLS (新媒体工具)
  // ============================================
  {
    id: 'mcp_blog_analysis',
    category: ToolCategory.MCP,
    name: '博客深度调查 (Live)',
    version: '1.0',
    author: 'Nexus Media',
    description: '【博客】分析博客作者身份、内容主题、关联社交账号及影响力评估。',
    targetTypes: [NodeType.BLOG],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对博客进行深度调查：

目标博客：{{title}}
已知信息：
- URL: {{data.URL}}
- 平台: {{data.平台}}
- 作者: {{data.作者}}

调查方向：
1. 博主身份验证
   - 搜索作者名字关联的其他账号
   - 查找作者真实身份线索
   - 分析写作风格和专业领域

2. 内容分析
   - 主要话题和立场
   - 发布频率和活跃时间
   - 是否有商业合作或赞助

3. 影响力评估
   - 被引用或转载情况
   - 评论互动质量
   - 在相关领域的权威性

4. 关联账号发现
   - 搜索作者在其他平台的账号
   - 关联的社交媒体
   - 邮箱或联系方式

创建实体：
- 发现真实身份创建 ENTITY 节点
- 关联社交账号创建 SOCIAL_PROFILE 节点
- 发现邮箱创建 EMAIL 节点
- 关联组织创建 ORGANIZATION 节点

输出格式：
提供博客画像摘要，包括作者背景、内容定位、影响力评级。`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_podcast_analysis',
    category: ToolCategory.MCP,
    name: '播客情报分析 (Live)',
    version: '1.0',
    author: 'Nexus Media',
    description: '【播客】分析播客主播身份、嘉宾网络、话题倾向及传播影响力。',
    targetTypes: [NodeType.PODCAST],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对播客进行情报分析：

目标播客：{{title}}
已知信息：
- 主播: {{data.主播}}
- 平台: {{data.平台}}
- RSS: {{data.RSS订阅}}

调查任务：
1. 主播背景调查
   - 主播真实身份和职业背景
   - 历史从业经历
   - 社交媒体账号

2. 嘉宾网络分析
   - 搜索该播客的重要嘉宾
   - 嘉宾的背景和影响力
   - 嘉宾之间的关联

3. 内容倾向分析
   - 主要讨论话题
   - 政治或商业立场
   - 是否有赞助商

4. 传播影响力
   - 各平台收听数据
   - 社交媒体讨论度
   - 被主流媒体引用情况

创建实体：
- 主播创建 ENTITY 节点
- 重要嘉宾创建 ENTITY 节点
- 赞助商创建 ORGANIZATION 节点
- 关联社交账号创建 SOCIAL_PROFILE 节点

关系标注：
- "主持"、"嘉宾出席"、"赞助"、"所属"`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_livestream_analysis',
    category: ToolCategory.MCP,
    name: '直播间调查 (Live)',
    version: '1.0',
    author: 'Nexus Media',
    description: '【直播】调查主播身份、打赏金主、直播内容及潜在违规行为。',
    targetTypes: [NodeType.LIVESTREAM],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对直播间进行深度调查：

目标直播：{{title}}
已知信息：
- 平台: {{data.平台}}
- 主播ID: {{data.主播ID}}
- 直播URL: {{data.直播URL}}

调查方向：
1. 主播身份调查
   - 搜索主播ID关联的真实身份
   - 历史直播记录和争议事件
   - 其他平台账号

2. 直播内容分析
   - 直播类型和主要内容
   - 是否涉及敏感话题
   - 商业推广和带货情况

3. 粉丝和金主分析
   - 大额打赏者信息
   - 粉丝群体特征
   - 是否有组织化打赏行为

4. 风险识别
   - 历史违规或封禁记录
   - 涉及的争议事件
   - 关联的灰色产业

创建实体：
- 主播真实身份创建 ENTITY 节点
- 关联公司创建 ORGANIZATION 节点
- 重要金主创建 ENTITY 节点
- 其他平台账号创建 SOCIAL_PROFILE 节点

输出格式：
提供直播间风险评估报告，包括主播画像、内容合规性、资金流向分析。`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'mcp_forum_analysis',
    category: ToolCategory.MCP,
    name: '论坛帖子溯源 (Live)',
    version: '1.0',
    author: 'Nexus Media',
    description: '【论坛】分析发帖人身份、帖子传播路径、讨论参与者及舆情影响。',
    targetTypes: [NodeType.FORUM_POST],
    mcpConfig: { functionName: 'googleSearch' },
    promptTemplate: `对论坛帖子进行溯源分析：

目标帖子：{{title}}
已知信息：
- 论坛: {{data.论坛}}
- 发帖人: {{data.发帖人}}
- URL: {{data.URL}}
- 发布时间: {{data.发布时间}}

调查任务：
1. 发帖人身份调查
   - 搜索该用户名在其他平台的账号
   - 历史发帖记录和风格
   - 是否为水军或营销号特征

2. 帖子传播分析
   - 帖子是否被转载到其他平台
   - 主流媒体是否有报道
   - 社交媒体讨论情况

3. 讨论参与者分析
   - 主要回复者身份
   - 是否有组织化评论
   - 舆论引导痕迹

4. 内容真实性核查
   - 帖子中的事实核查
   - 是否为谣言或虚假信息
   - 原始信息来源追溯

创建实体：
- 发帖人创建 ENTITY 或 SOCIAL_PROFILE 节点
- 重要回复者创建 ENTITY 节点
- 被提及的组织创建 ORGANIZATION 节点
- 相关事件创建 EVENT 节点

关系标注：
- "发布"、"转载自"、"回复"、"提及"`,
    autoExpand: true,
    isSimulated: false
  },
  {
    id: 'agent_blog_content',
    category: ToolCategory.AGENT,
    name: '博客内容分析',
    version: '1.0',
    author: 'Nexus Media',
    description: '【博客】分析博客文章的主题、情感倾向、写作风格及潜在意图。',
    targetTypes: [NodeType.BLOG],
    promptTemplate: `分析博客内容：

博客：{{title}}
内容：{{content}}

分析要点：
1. 主题提取：文章的核心主题和关键词
2. 情感分析：整体情感倾向（正面/负面/中性）
3. 写作风格：专业性、受众定位、语言特点
4. 立场分析：作者的观点和潜在立场
5. 信息价值：是否包含独家信息或情报价值

更新属性：
- 主题标签
- 情感倾向
- 可信度评估`,
    autoExpand: false,
    isSimulated: false
  },
  {
    id: 'agent_forum_sentiment',
    category: ToolCategory.AGENT,
    name: '论坛舆情分析',
    version: '1.0',
    author: 'Nexus Media',
    description: '【论坛】分析帖子的舆情热度、讨论焦点及群体情绪。',
    targetTypes: [NodeType.FORUM_POST],
    promptTemplate: `分析论坛帖子舆情：

帖子：{{title}}
内容：{{content}}
回复数：{{data.回复数}}

分析维度：
1. 热度评估：根据回复数和内容判断热度等级
2. 讨论焦点：核心争议点或关注点
3. 群体情绪：整体讨论氛围
4. 风险识别：是否涉及敏感话题
5. 传播潜力：是否可能进一步发酵

更新属性：
- 舆情热度（低/中/高/爆）
- 情绪基调
- 风险等级`,
    autoExpand: false,
    isSimulated: false
  }
];
