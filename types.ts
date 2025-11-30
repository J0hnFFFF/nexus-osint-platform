

export enum NodeType {
  // --- 1. SUBJECTS (主体) ---
  ENTITY = 'ENTITY', // Person / Target
  ORGANIZATION = 'ORGANIZATION', // Company, NGO
  THREAT_ACTOR = 'THREAT_ACTOR', // Hacker Group, APT
  IDENTITY = 'IDENTITY', // Fake ID, Alias
  MILITARY_UNIT = 'MILITARY_UNIT', // New: Military specific
  GOV_AGENCY = 'GOV_AGENCY', // New: Government specific

  // --- 2. NETWORK INFRA (网络基础) ---
  IP_ADDRESS = 'IP_ADDRESS',
  MAC_ADDRESS = 'MAC_ADDRESS',
  DOMAIN = 'DOMAIN',
  URL = 'URL',
  SERVER = 'SERVER',
  C2_SERVER = 'C2_SERVER', // Command & Control
  CLOUD_SERVICE = 'CLOUD_SERVICE',
  WIFI = 'WIFI',
  ASN = 'ASN',
  SSL_CERT = 'SSL_CERT',
  BOTNET = 'BOTNET',
  INFRASTRUCTURE = 'INFRASTRUCTURE', // General Infrastructure
  NETWORK_TRAFFIC = 'NETWORK_TRAFFIC', // Network Flow
  PROCESS = 'PROCESS', // System Process
  MUTEX = 'MUTEX', // Mutex Object
  REGISTRY_KEY = 'REGISTRY_KEY', // Windows Registry
  DIRECTORY = 'DIRECTORY', // File Directory
  USER_ACCOUNT = 'USER_ACCOUNT', // System User Account
  X509_CERTIFICATE = 'X509_CERTIFICATE', // Digital Certificate
  
  // --- 3. COMMUNICATION & ACCOUNTS (通讯与账号) ---
  EMAIL = 'EMAIL',
  PHONE_NUMBER = 'PHONE_NUMBER',
  SOCIAL_PROFILE = 'SOCIAL_PROFILE',
  MESSAGING_ID = 'MESSAGING_ID',
  FORUM_ACCOUNT = 'FORUM_ACCOUNT',
  APP = 'APP',
  BLOG = 'BLOG', // Blog Site
  PODCAST = 'PODCAST', // Podcast Channel
  LIVESTREAM = 'LIVESTREAM', // Live Streaming
  FORUM_POST = 'FORUM_POST', // Forum Post/Thread 

  // --- 4. FINANCIAL (金融) ---
  CRYPTO_WALLET = 'CRYPTO_WALLET',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  CREDIT_CARD = 'CREDIT_CARD',
  TRANSACTION = 'TRANSACTION',
  INSURANCE_POLICY = 'INSURANCE_POLICY', // Insurance Policy
  PROPERTY = 'PROPERTY', // Real Estate/Property
  COMPANY_REGISTRATION = 'COMPANY_REGISTRATION', // Business Registration
  PATENT = 'PATENT', // Patent/Trademark
  TAX_RECORD = 'TAX_RECORD', // Tax Information

  // --- 5. PHYSICAL WORLD (物理世界) ---
  GEO_LOCATION = 'GEO_LOCATION',
  FACILITY = 'FACILITY',
  VEHICLE = 'VEHICLE',
  DEVICE = 'DEVICE',
  WEAPON = 'WEAPON',
  SIM_CARD = 'SIM_CARD',
  LICENSE_PLATE = 'LICENSE_PLATE', // Vehicle License Plate
  BIOMETRIC = 'BIOMETRIC', // Biometric Data (Fingerprint, Face, etc.)
  DRONE = 'DRONE', // Drone/UAV
  SATELLITE_IMAGE = 'SATELLITE_IMAGE', // Satellite Imagery
  CCTV_FOOTAGE = 'CCTV_FOOTAGE', // CCTV Recording

  // --- 6. TRAVEL & LOGISTICS (差旅与物流 - NEW) ---
  FLIGHT = 'FLIGHT',
  HOTEL = 'HOTEL',
  SHIPPING = 'SHIPPING', // Container / Cargo
  PASSPORT = 'PASSPORT',
  VISA = 'VISA',

  // --- 7. CONTENT & MEDIA (内容与媒体) ---
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  SOCIAL_POST = 'SOCIAL_POST',
  NEWS_ARTICLE = 'NEWS_ARTICLE',
  DARKWEB_SITE = 'DARKWEB_SITE',
  FILE_HASH = 'FILE_HASH',
  CODE_SNIPPET = 'CODE_SNIPPET',
  EXPLOIT = 'EXPLOIT',
  PHISHING_KIT = 'PHISHING_KIT',
  SCREENSHOT = 'SCREENSHOT', // Screenshot
  METADATA = 'METADATA', // File/Image Metadata
  QR_CODE = 'QR_CODE', // QR Code
  BARCODE = 'BARCODE', // Barcode
  ARTIFACT = 'ARTIFACT', // Digital Artifact
  PDF_DOCUMENT = 'PDF_DOCUMENT', // PDF File
  SPREADSHEET = 'SPREADSHEET', // Excel/CSV File

  // --- 8. INTELLIGENCE COLLECTION (情报搜集 - NEW) ---
  SOURCE_HUMINT = 'SOURCE_HUMINT', // Human Intelligence Source
  SOURCE_SIGINT = 'SOURCE_SIGINT', // Signals Intelligence
  SOURCE_IMINT = 'SOURCE_IMINT',   // Imagery / Satellite
  SOURCE_GEOINT = 'SOURCE_GEOINT', // Geospatial
  SOURCE_OSINT = 'SOURCE_OSINT',   // Open Source generic
  SOURCE_MASINT = 'SOURCE_MASINT', // Measurement & Signature

  // --- 9. INTELLIGENCE & ANALYSIS (情报与分析) ---
  REPORT = 'REPORT',
  NOTE = 'NOTE',
  EVENT = 'EVENT',
  CAMPAIGN = 'CAMPAIGN',
  VULNERABILITY = 'VULNERABILITY',
  MALWARE = 'MALWARE',
  TOPIC = 'TOPIC',
  HYPOTHESIS = 'HYPOTHESIS',
  LEGAL_CASE = 'LEGAL_CASE',
  ATTACK_PATTERN = 'ATTACK_PATTERN', // STIX: Attack Pattern/TTP
  INTRUSION_SET = 'INTRUSION_SET', // STIX: Intrusion Campaign
  MALWARE_ANALYSIS = 'MALWARE_ANALYSIS', // STIX: Malware Analysis Result
  COURSE_OF_ACTION = 'COURSE_OF_ACTION', // STIX: Mitigation/Response
  INDICATOR = 'INDICATOR', // STIX: IOC Indicator
  TOOL_SOFTWARE = 'TOOL_SOFTWARE', // STIX: Tool/Software
  OPINION = 'OPINION', // STIX: Assessment/Opinion
  OBSERVED_DATA = 'OBSERVED_DATA', // STIX: Observation
  COURT_RECORD = 'COURT_RECORD', // Court Documents
  EMPLOYMENT_RECORD = 'EMPLOYMENT_RECORD', // Employment History
  EDUCATION_RECORD = 'EDUCATION_RECORD', // Education History
  MEDICAL_RECORD = 'MEDICAL_RECORD', // Medical Records 
  
  // --- 10. OPS (操作节点) ---
  SEARCH_QUERY = 'SEARCH_QUERY',
  DATA_SOURCE = 'DATA_SOURCE',
  LEAK_DUMP = 'LEAK_DUMP',
  SENSOR = 'SENSOR'
}

export enum ToolCategory {
  AGENT = 'AGENT', // Pure Prompt / Reasoning
  API = 'API',     // External Data Fetching
  MCP = 'MCP'      // Function Calling / Capability
}

// NATO / Admiralty Code System
export interface IntelligenceRating {
  reliability: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  credibility: '1' | '2' | '3' | '4' | '5' | '6';
}

export interface Position {
  x: number;
  y: number;
}

export interface IntelNode {
  id: string;
  type: NodeType;
  title: string;
  content: string; // Short summary
  position: Position;
  rating?: IntelligenceRating;
  // Flexible KV store for entity properties
  data: Record<string, string | number | boolean>; 
  meta?: {
    sourceName?: string;
    tags?: string[];
    imageUrl?: string;
  };
  w?: number;
  h?: number;
  status?: 'NEW' | 'PROCESSED' | 'ERROR' | 'PROCESSING';
  depth: number;
}

export interface Connection {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  type?: 'CONFIRMED' | 'SUSPECTED' | 'CONTRADICTS';
}

// Plugin / Tool Definition (MCP Style)
export interface Tool {
  id: string;
  name: string;
  category: ToolCategory;
  version: string;
  author: string;
  description: string;
  targetTypes: NodeType[]; // Empty = Global Tool
  autoExpand: boolean;
  isCustom?: boolean;
  isSimulated?: boolean; // To mark if the tool uses mock data or real AI/Search
  
  // 1. Agent Config
  promptTemplate?: string; 

  // 2. API Config
  apiConfig?: {
    endpoint: string;
    method: 'GET' | 'POST';
    mockResponse?: any; // For simulation purposes
  };

  // 3. MCP Config (Function Calling)
  mcpConfig?: {
    functionName: string;
    parameters?: any;
  };
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  action: string;
  status: 'info' | 'success' | 'error' | 'warning';
}

export interface AIModelConfig {
  modelId: string;
  temperature: number;
  enableThinking: boolean;
  thinkingBudget: number;
}

// ============ 6.0 多画布工作区 ============

/** 项目 - 顶层容器，对应一个调查案件 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;    // ISO 时间戳
  updatedAt: string;
  // 7.0 协作预留
  ownerId?: string;
  teamId?: string;
}

/** 画布 - 项目内的分析视图 */
export interface CanvasData {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;  // 项目默认画布
  // 7.0 协作预留
  createdBy?: string;
}

/** 快照触发类型 */
export type SnapshotTrigger = 'manual' | 'auto' | 'before_tool' | 'import';

/** 快照 - 画布的历史版本 */
export interface Snapshot {
  id: string;
  canvasId: string;
  name: string;
  description?: string;
  createdAt: string;
  trigger: SnapshotTrigger;
  nodeCount: number;
  connectionCount: number;
  // 7.0 协作预留
  createdBy?: string;
}

/** 快照数据 - 独立存储，避免列表加载慢 */
export interface SnapshotData {
  snapshotId: string;
  nodes: IntelNode[];
  connections: Connection[];
}