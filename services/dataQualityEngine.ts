/**
 * Data Quality Engine - 数据质量引擎
 * 基于信息熵压力场的缺陷检测算法
 *
 * 核心思想：
 * - 每个节点有一个「信息压」，由自身数据的信息熵决定
 * - 压力在图中传播，高压区向低压区施压
 * - 持续处于低压的节点 = 数据缺陷
 *
 * 算法特点：
 * - 不依赖数据源可信度，纯粹基于数据本身
 * - 自动发现问题集群（低压区）
 * - 区分自身缺陷和结构缺陷
 *
 * @author Nexus OSINT Platform
 * @version 1.0.0
 */

import { IntelNode, Connection, NodeType } from '../types';

// ============================================================================
// 类型定义
// ============================================================================

/** 缺陷类型 */
export type DefectType =
  | 'empty_title'           // 标题为空
  | 'empty_content'         // 内容为空
  | 'empty_data'            // 数据字段全空
  | 'placeholder_detected'  // 检测到占位符
  | 'format_invalid'        // 格式无效
  | 'low_information'       // 信息量过低
  | 'structural_isolation'  // 结构孤立
  | 'cluster_defect';       // 处于缺陷集群中

/** 缺陷严重程度 */
export type DefectSeverity = 'critical' | 'warning' | 'info';

/** 单个缺陷 */
export interface Defect {
  type: DefectType;
  severity: DefectSeverity;
  field?: string;           // 相关字段
  message: string;          // 描述信息
}

/** 节点质量评估结果 */
export interface NodeQualityResult {
  nodeId: string;
  nodeTitle: string;
  nodeType: NodeType;

  // 压力值
  initialPressure: number;  // P₀ - 自身信息量
  finalPressure: number;    // P - 传播后的压力

  // 熵分解
  entropyBreakdown: {
    title: number;
    content: number;
    data: number;
    format: number;
  };

  // 缺陷列表
  defects: Defect[];

  // 质量等级
  qualityLevel: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  // 是否需要关注
  needsAttention: boolean;
}

/** 整体质量报告 */
export interface DataQualityReport {
  // 统计摘要
  summary: {
    totalNodes: number;
    excellentCount: number;
    goodCount: number;
    fairCount: number;
    poorCount: number;
    criticalCount: number;
    averagePressure: number;
    defectRate: number;      // 有缺陷节点的比例
  };

  // 节点详情
  nodeResults: NodeQualityResult[];

  // 按严重程度排序的缺陷节点
  defectiveNodes: NodeQualityResult[];

  // 低压区集群（连通的低质量节点组）
  lowPressureClusters: string[][];

  // 算法参数（供调试）
  algorithmParams: {
    alpha: number;
    threshold: number;
    iterations: number;
    converged: boolean;
  };
}

// ============================================================================
// 常量配置
// ============================================================================

/** 占位符模式 */
const PLACEHOLDER_PATTERNS = [
  /^新实体$/,
  /^未命名$/,
  /^未知$/,
  /^unknown$/i,
  /^n\/?a$/i,
  /^null$/i,
  /^undefined$/i,
  /^test/i,
  /^xxx+$/i,
  /^aaa+$/i,
  /^123+$/,
  /^none$/i,
  /^empty$/i,
  /^待填写$/,
  /^待补充$/,
  /^\?+$/,
  /^-+$/,
];

/** 格式验证规则 */
const FORMAT_VALIDATORS: Partial<Record<NodeType, { field: string; pattern: RegExp }[]>> = {
  [NodeType.EMAIL]: [
    { field: '邮箱地址', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  ],
  [NodeType.IP_ADDRESS]: [
    { field: 'IP地址', pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/ },
  ],
  [NodeType.PHONE_NUMBER]: [
    { field: '电话号码', pattern: /^[\d\s\-\+\(\)]{6,20}$/ },
  ],
  [NodeType.DOMAIN]: [
    { field: '域名', pattern: /^[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+$/ },
  ],
  [NodeType.CRYPTO_WALLET]: [
    { field: '钱包地址', pattern: /^(0x)?[0-9a-fA-F]{40,64}$|^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/ },
  ],
  [NodeType.FILE_HASH]: [
    { field: 'MD5', pattern: /^[a-fA-F0-9]{32}$/ },
    { field: 'SHA1', pattern: /^[a-fA-F0-9]{40}$/ },
    { field: 'SHA256', pattern: /^[a-fA-F0-9]{64}$/ },
  ],
};

/** 权重配置 */
const WEIGHTS = {
  title: 0.30,      // 标题权重
  content: 0.20,    // 内容权重
  data: 0.35,       // 数据字段权重
  format: 0.15,     // 格式有效性权重
};

/** 算法参数 */
const ALGORITHM_PARAMS = {
  alpha: 0.65,              // 自持系数（自身信息量的保持比例）
  convergenceThreshold: 0.001,  // 收敛阈值
  maxIterations: 50,        // 最大迭代次数
  defectThreshold: 0.35,    // 缺陷阈值（压力低于此值视为缺陷）
  warningThreshold: 0.50,   // 警告阈值
};

// ============================================================================
// 核心算法实现
// ============================================================================

/**
 * 执行数据质量分析
 * 主入口函数
 */
export function analyzeDataQuality(
  nodes: IntelNode[],
  connections: Connection[]
): DataQualityReport {
  if (nodes.length === 0) {
    return createEmptyReport();
  }

  // 构建邻接表
  const adjacency = buildAdjacencyMap(nodes, connections);

  // Step 1: 计算初始压力 P₀
  const initialPressures = new Map<string, number>();
  const entropyBreakdowns = new Map<string, NodeQualityResult['entropyBreakdown']>();
  const nodeDefects = new Map<string, Defect[]>();

  nodes.forEach(node => {
    const { pressure, breakdown, defects } = calculateInitialPressure(node);
    initialPressures.set(node.id, pressure);
    entropyBreakdowns.set(node.id, breakdown);
    nodeDefects.set(node.id, defects);
  });

  // Step 2: 压力传播迭代
  const { finalPressures, iterations, converged } = propagatePressure(
    nodes,
    adjacency,
    initialPressures
  );

  // Step 3: 识别缺陷和生成报告
  const nodeResults = nodes.map(node => {
    const p0 = initialPressures.get(node.id) || 0;
    const p = finalPressures.get(node.id) || 0;
    const breakdown = entropyBreakdowns.get(node.id)!;
    const defects = [...(nodeDefects.get(node.id) || [])];

    // 添加结构性缺陷
    const neighbors = adjacency.get(node.id) || new Set();
    if (neighbors.size === 0 && p0 < ALGORITHM_PARAMS.warningThreshold) {
      defects.push({
        type: 'structural_isolation',
        severity: 'warning',
        message: '节点孤立且信息量不足',
      });
    }

    // 根据压力差判断是否处于缺陷集群
    if (p0 > ALGORITHM_PARAMS.warningThreshold && p < ALGORITHM_PARAMS.defectThreshold) {
      defects.push({
        type: 'cluster_defect',
        severity: 'info',
        message: '节点自身尚可，但周围存在低质量数据',
      });
    }

    const qualityLevel = getQualityLevel(p);
    const needsAttention = p < ALGORITHM_PARAMS.warningThreshold || defects.length > 0;

    return {
      nodeId: node.id,
      nodeTitle: node.title,
      nodeType: node.type,
      initialPressure: p0,
      finalPressure: p,
      entropyBreakdown: breakdown,
      defects,
      qualityLevel,
      needsAttention,
    };
  });

  // Step 4: 识别低压区集群
  const lowPressureClusters = findLowPressureClusters(
    nodes,
    adjacency,
    finalPressures,
    ALGORITHM_PARAMS.defectThreshold
  );

  // 统计
  const summary = calculateSummary(nodeResults);

  // 按严重程度排序
  const defectiveNodes = nodeResults
    .filter(r => r.needsAttention)
    .sort((a, b) => a.finalPressure - b.finalPressure);

  return {
    summary,
    nodeResults,
    defectiveNodes,
    lowPressureClusters,
    algorithmParams: {
      alpha: ALGORITHM_PARAMS.alpha,
      threshold: ALGORITHM_PARAMS.defectThreshold,
      iterations,
      converged,
    },
  };
}

// ============================================================================
// 熵计算函数
// ============================================================================

/**
 * 检测是否为占位符
 */
function isPlaceholder(s: string): boolean {
  if (!s) return false;
  const trimmed = s.trim();
  return PLACEHOLDER_PATTERNS.some(pattern => pattern.test(trimmed));
}

/**
 * 计算字符串熵
 * 基于长度、字符多样性、是否为占位符
 */
function calculateStringEntropy(s: string | undefined | null): number {
  if (!s || typeof s !== 'string') return 0;

  const trimmed = s.trim();
  if (trimmed.length === 0) return 0;

  // 占位符给极低分
  if (isPlaceholder(trimmed)) return 0.05;

  const len = trimmed.length;

  // 过短的字符串
  if (len < 2) return 0.1;

  // 计算字符多样性
  const charFreq = new Map<string, number>();
  for (const char of trimmed) {
    charFreq.set(char, (charFreq.get(char) || 0) + 1);
  }

  // Shannon 熵
  let entropy = 0;
  for (const freq of charFreq.values()) {
    const p = freq / len;
    entropy -= p * Math.log2(p);
  }

  // 归一化（考虑长度和熵）
  const maxEntropy = Math.log2(Math.min(len, 26)); // 假设最多26个不同字符
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // 长度因子（适度奖励较长但不过长的内容）
  const lengthFactor = Math.min(1, Math.log2(len + 1) / 7);

  // 综合得分
  return Math.min(1, normalizedEntropy * 0.6 + lengthFactor * 0.4);
}

/**
 * 计算字段值的熵
 */
function calculateFieldEntropy(value: any): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'string') {
    return calculateStringEntropy(value);
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : 0.7;
  }

  if (typeof value === 'boolean') {
    return 0.5;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return 0;
    const itemEntropies = value.map(v => calculateFieldEntropy(v));
    return Math.min(1, itemEntropies.reduce((a, b) => a + b, 0) / value.length);
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return 0;
    const entropies = entries.map(([, v]) => calculateFieldEntropy(v));
    return Math.min(1, entropies.reduce((a, b) => a + b, 0) / entries.length);
  }

  return 0.3;
}

/**
 * 验证格式有效性
 */
function validateFormat(node: IntelNode): { score: number; defects: Defect[] } {
  const validators = FORMAT_VALIDATORS[node.type];
  const defects: Defect[] = [];

  if (!validators || validators.length === 0) {
    // 没有特定格式要求的类型，给中等分
    return { score: 0.7, defects };
  }

  let validCount = 0;
  let totalChecked = 0;

  for (const { field, pattern } of validators) {
    const value = node.data?.[field];
    if (value && typeof value === 'string' && value.trim()) {
      totalChecked++;
      if (pattern.test(value.trim())) {
        validCount++;
      } else {
        defects.push({
          type: 'format_invalid',
          severity: 'warning',
          field,
          message: `${field} 格式无效`,
        });
      }
    }
  }

  if (totalChecked === 0) {
    // 没有可检查的字段，返回中等分
    return { score: 0.5, defects };
  }

  return {
    score: validCount / totalChecked,
    defects,
  };
}

// ============================================================================
// 初始压力计算
// ============================================================================

interface InitialPressureResult {
  pressure: number;
  breakdown: NodeQualityResult['entropyBreakdown'];
  defects: Defect[];
}

/**
 * 计算节点的初始压力 P₀
 */
function calculateInitialPressure(node: IntelNode): InitialPressureResult {
  const defects: Defect[] = [];

  // 1. 标题熵
  const titleEntropy = calculateStringEntropy(node.title);
  if (!node.title || !node.title.trim()) {
    defects.push({
      type: 'empty_title',
      severity: 'critical',
      field: 'title',
      message: '标题为空',
    });
  } else if (isPlaceholder(node.title)) {
    defects.push({
      type: 'placeholder_detected',
      severity: 'warning',
      field: 'title',
      message: '标题可能是占位符',
    });
  }

  // 2. 内容熵
  const contentEntropy = calculateStringEntropy(node.content);
  if (!node.content || !node.content.trim()) {
    // 内容为空不一定是严重问题，降级为 info
    defects.push({
      type: 'empty_content',
      severity: 'info',
      field: 'content',
      message: '内容/描述为空',
    });
  }

  // 3. 数据字段熵
  let dataEntropy = 0;
  const dataFields = Object.entries(node.data || {});
  if (dataFields.length === 0) {
    defects.push({
      type: 'empty_data',
      severity: 'warning',
      message: '没有任何数据字段',
    });
  } else {
    const fieldEntropies: number[] = [];
    for (const [key, value] of dataFields) {
      const fe = calculateFieldEntropy(value);
      fieldEntropies.push(fe);

      // 检测占位符
      if (typeof value === 'string' && isPlaceholder(value)) {
        defects.push({
          type: 'placeholder_detected',
          severity: 'info',
          field: key,
          message: `字段「${key}」可能是占位符`,
        });
      }
    }
    dataEntropy = fieldEntropies.reduce((a, b) => a + b, 0) / fieldEntropies.length;
  }

  // 4. 格式有效性
  const { score: formatScore, defects: formatDefects } = validateFormat(node);
  defects.push(...formatDefects);

  // 综合压力
  const pressure =
    WEIGHTS.title * titleEntropy +
    WEIGHTS.content * contentEntropy +
    WEIGHTS.data * dataEntropy +
    WEIGHTS.format * formatScore;

  // 如果压力过低，添加总体缺陷
  if (pressure < ALGORITHM_PARAMS.defectThreshold) {
    defects.push({
      type: 'low_information',
      severity: 'critical',
      message: '整体信息量严重不足',
    });
  }

  return {
    pressure,
    breakdown: {
      title: titleEntropy,
      content: contentEntropy,
      data: dataEntropy,
      format: formatScore,
    },
    defects,
  };
}

// ============================================================================
// 压力传播
// ============================================================================

interface PropagationResult {
  finalPressures: Map<string, number>;
  iterations: number;
  converged: boolean;
}

/**
 * 压力传播迭代
 * P_{t+1}(node) = α×P₀(node) + (1-α) × mean(P_t(neighbors))
 */
function propagatePressure(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>,
  initialPressures: Map<string, number>
): PropagationResult {
  const alpha = ALGORITHM_PARAMS.alpha;
  let currentPressures = new Map(initialPressures);

  let iterations = 0;
  let converged = false;

  while (iterations < ALGORITHM_PARAMS.maxIterations) {
    const newPressures = new Map<string, number>();
    let maxDiff = 0;

    for (const node of nodes) {
      const p0 = initialPressures.get(node.id) || 0;
      const neighbors = adjacency.get(node.id) || new Set();

      let neighborPressure = 0;
      if (neighbors.size > 0) {
        let sum = 0;
        neighbors.forEach(neighborId => {
          sum += currentPressures.get(neighborId) || 0;
        });
        neighborPressure = sum / neighbors.size;
      } else {
        // 孤立节点：只保留自身压力，略微衰减
        neighborPressure = p0 * 0.8;
      }

      const newP = alpha * p0 + (1 - alpha) * neighborPressure;
      newPressures.set(node.id, newP);

      const diff = Math.abs(newP - (currentPressures.get(node.id) || 0));
      maxDiff = Math.max(maxDiff, diff);
    }

    currentPressures = newPressures;
    iterations++;

    if (maxDiff < ALGORITHM_PARAMS.convergenceThreshold) {
      converged = true;
      break;
    }
  }

  return {
    finalPressures: currentPressures,
    iterations,
    converged,
  };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 构建邻接表
 */
function buildAdjacencyMap(
  nodes: IntelNode[],
  connections: Connection[]
): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  nodes.forEach(node => adjacency.set(node.id, new Set()));

  connections.forEach(conn => {
    adjacency.get(conn.sourceId)?.add(conn.targetId);
    adjacency.get(conn.targetId)?.add(conn.sourceId);
  });

  return adjacency;
}

/**
 * 获取质量等级
 */
function getQualityLevel(pressure: number): NodeQualityResult['qualityLevel'] {
  if (pressure >= 0.8) return 'excellent';
  if (pressure >= 0.6) return 'good';
  if (pressure >= 0.45) return 'fair';
  if (pressure >= 0.3) return 'poor';
  return 'critical';
}

/**
 * 计算统计摘要
 */
function calculateSummary(nodeResults: NodeQualityResult[]): DataQualityReport['summary'] {
  const total = nodeResults.length;
  if (total === 0) {
    return {
      totalNodes: 0,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      poorCount: 0,
      criticalCount: 0,
      averagePressure: 0,
      defectRate: 0,
    };
  }

  let excellentCount = 0;
  let goodCount = 0;
  let fairCount = 0;
  let poorCount = 0;
  let criticalCount = 0;
  let totalPressure = 0;
  let defectiveCount = 0;

  for (const result of nodeResults) {
    totalPressure += result.finalPressure;
    if (result.needsAttention) defectiveCount++;

    switch (result.qualityLevel) {
      case 'excellent': excellentCount++; break;
      case 'good': goodCount++; break;
      case 'fair': fairCount++; break;
      case 'poor': poorCount++; break;
      case 'critical': criticalCount++; break;
    }
  }

  return {
    totalNodes: total,
    excellentCount,
    goodCount,
    fairCount,
    poorCount,
    criticalCount,
    averagePressure: totalPressure / total,
    defectRate: defectiveCount / total,
  };
}

/**
 * 查找低压区集群
 * 使用 BFS 找出连通的低质量节点组
 */
function findLowPressureClusters(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>,
  pressures: Map<string, number>,
  threshold: number
): string[][] {
  const lowPressureNodes = new Set<string>();
  nodes.forEach(node => {
    if ((pressures.get(node.id) || 0) < threshold) {
      lowPressureNodes.add(node.id);
    }
  });

  const visited = new Set<string>();
  const clusters: string[][] = [];

  for (const nodeId of lowPressureNodes) {
    if (visited.has(nodeId)) continue;

    // BFS 找连通分量
    const cluster: string[] = [];
    const queue = [nodeId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      cluster.push(current);

      // 只在低压节点之间传播
      const neighbors = adjacency.get(current) || new Set();
      neighbors.forEach(neighbor => {
        if (lowPressureNodes.has(neighbor) && !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      });
    }

    if (cluster.length > 0) {
      clusters.push(cluster);
    }
  }

  // 按大小降序排序
  clusters.sort((a, b) => b.length - a.length);

  return clusters;
}

/**
 * 创建空报告
 */
function createEmptyReport(): DataQualityReport {
  return {
    summary: {
      totalNodes: 0,
      excellentCount: 0,
      goodCount: 0,
      fairCount: 0,
      poorCount: 0,
      criticalCount: 0,
      averagePressure: 0,
      defectRate: 0,
    },
    nodeResults: [],
    defectiveNodes: [],
    lowPressureClusters: [],
    algorithmParams: {
      alpha: ALGORITHM_PARAMS.alpha,
      threshold: ALGORITHM_PARAMS.defectThreshold,
      iterations: 0,
      converged: true,
    },
  };
}

// ============================================================================
// 导出工具函数
// ============================================================================

/**
 * 获取质量等级的显示标签
 */
export function getQualityLevelLabel(level: NodeQualityResult['qualityLevel']): string {
  const labels = {
    excellent: '优秀',
    good: '良好',
    fair: '一般',
    poor: '较差',
    critical: '严重',
  };
  return labels[level];
}

/**
 * 获取质量等级的颜色类名
 */
export function getQualityLevelColor(level: NodeQualityResult['qualityLevel']): string {
  const colors = {
    excellent: 'text-green-500 bg-green-500/10',
    good: 'text-cyan-500 bg-cyan-500/10',
    fair: 'text-yellow-500 bg-yellow-500/10',
    poor: 'text-orange-500 bg-orange-500/10',
    critical: 'text-red-500 bg-red-500/10',
  };
  return colors[level];
}

/**
 * 获取缺陷严重程度的颜色类名
 */
export function getDefectSeverityColor(severity: DefectSeverity): string {
  const colors = {
    critical: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500',
  };
  return colors[severity];
}

/**
 * 获取缺陷类型的描述
 */
export function getDefectTypeLabel(type: DefectType): string {
  const labels: Record<DefectType, string> = {
    empty_title: '标题为空',
    empty_content: '内容为空',
    empty_data: '数据为空',
    placeholder_detected: '占位符',
    format_invalid: '格式错误',
    low_information: '信息不足',
    structural_isolation: '结构孤立',
    cluster_defect: '集群缺陷',
  };
  return labels[type];
}
