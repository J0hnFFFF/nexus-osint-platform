/**
 * 全局 API 配置
 * 管理河图网关 vs 直连 Gemini 模式
 */

// 河图网关地址 (内置固定)
export const HETU_GATEWAY_URL = 'http://api.hetu.click/';

// ============ 机器码 ============

/**
 * 生成机器码
 * - Electron 环境: 使用硬件信息生成
 * - Web 环境: 生成 UUID 并持久化
 */
const generateMachineId = (): string => {
  // 生成简短的机器码格式: XXXX-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments: string[] = [];
  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  return segments.join('-');
};

/**
 * 获取机器码
 * 首次调用时生成，之后从存储中读取
 */
export const getMachineId = async (): Promise<string> => {
  // Electron 环境: 优先使用 Electron 提供的机器码
  if (typeof window !== 'undefined' && (window as any).electronAPI?.getMachineId) {
    try {
      const electronMachineId = await (window as any).electronAPI.getMachineId();
      if (electronMachineId) return electronMachineId;
    } catch (e) {
      console.warn('Failed to get machine ID from Electron:', e);
    }
  }

  // Web 环境: 从 localStorage 获取或生成新的
  if (typeof window !== 'undefined') {
    let machineId = localStorage.getItem('hetu_machine_id');
    if (!machineId) {
      machineId = generateMachineId();
      localStorage.setItem('hetu_machine_id', machineId);
    }
    return machineId;
  }

  // 非浏览器环境
  return 'UNKNOWN';
};

/**
 * 同步获取机器码 (用于初始渲染)
 */
export const getMachineIdSync = (): string => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hetu_machine_id') || '加载中...';
  }
  return 'UNKNOWN';
};

// API 模式类型
export type ApiMode = 'hetu' | 'gemini';

// 获取当前 API 模式
export const getApiMode = (): ApiMode => {
  if (typeof window === 'undefined') {
    return 'gemini';
  }
  return (localStorage.getItem('api_mode') as ApiMode) || 'gemini';
};

// 设置 API 模式
export const setApiMode = (mode: ApiMode): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('api_mode', mode);
  }
};

// 判断是否使用河图网关
export const isHetuMode = (): boolean => {
  return getApiMode() === 'hetu';
};

// 河图 API Key 管理
export const getHetuApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hetu_api_key');
};

export const setHetuApiKey = (key: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('hetu_api_key', key);
  }
};

export const removeHetuApiKey = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hetu_api_key');
  }
};

// 功能可用性检查
export const FeatureFlags = {
  // 河图网关专属功能 (高级功能)
  networkAnalysis: () => isHetuMode(),   // 分析网络
  snapshot: () => isHetuMode(),          // 快照功能
  usageQuota: () => isHetuMode(),        // 用量额度查询
  usageStats: () => isHetuMode(),        // 使用统计
  cloudSync: () => isHetuMode(),         // 云端同步 (未来)
  teamCollaboration: () => isHetuMode(), // 团队协作 (未来)

  // 直连模式专属功能
  customModel: () => !isHetuMode(),      // 自定义模型选择
  unlimitedUsage: () => !isHetuMode(),   // 无限制使用 (取决于自己的 API Key)
};
