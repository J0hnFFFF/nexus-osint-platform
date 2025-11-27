/**
 * Graph Analysis Service
 * 图谱分析服务 - 社区发现与核心人物识别
 *
 * 算法说明：
 * - 社区发现：Louvain 算法（模块度优化，确定性结果）
 * - 中心性分析：度中心性 + 介数中心性 + PageRank 综合评分
 */

import { IntelNode, Connection } from '../types';

// 分析结果接口
export interface GraphAnalysisResult {
  communities: Map<string, number>;  // nodeId -> communityId
  centrality: Map<string, number>;   // nodeId -> centrality score (0-1)
  keyNodes: string[];                // 核心节点 ID 列表
  communityCount: number;            // 社区数量
}

// 社区颜色映射
export const COMMUNITY_COLORS = [
  'border-cyan-500',
  'border-orange-500',
  'border-green-500',
  'border-purple-500',
  'border-pink-500',
  'border-yellow-500',
  'border-red-500',
  'border-blue-500',
  'border-indigo-500',
  'border-teal-500',
];

/**
 * 执行图谱分析
 * - 社区发现：Louvain 算法（模块度优化）
 * - 中心性分析：度中心性 + 介数中心性 + PageRank
 */
export function analyzeGraph(nodes: IntelNode[], connections: Connection[]): GraphAnalysisResult {
  if (nodes.length === 0) {
    return {
      communities: new Map(),
      centrality: new Map(),
      keyNodes: [],
      communityCount: 0
    };
  }

  // 构建邻接表
  const adjacency = new Map<string, Set<string>>();
  nodes.forEach(node => adjacency.set(node.id, new Set()));

  connections.forEach(conn => {
    adjacency.get(conn.sourceId)?.add(conn.targetId);
    adjacency.get(conn.targetId)?.add(conn.sourceId);
  });

  // 1. 社区发现 - Louvain 算法
  const communities = louvainCommunityDetection(nodes, adjacency, connections.length);

  // 2. 中心性计算 - 度中心性 + 介数中心性 + PageRank
  const centrality = calculateCentrality(nodes, adjacency, connections.length);

  // 3. 识别核心节点 (中心性 > 0.5 的节点)
  const keyNodes: string[] = [];
  const sortedByCentrality = [...centrality.entries()].sort((a, b) => b[1] - a[1]);

  // 取前 20% 或中心性 > 0.5 的节点
  const threshold = Math.max(0.5, sortedByCentrality[Math.floor(sortedByCentrality.length * 0.2)]?.[1] || 0);
  sortedByCentrality.forEach(([nodeId, score]) => {
    if (score >= threshold) {
      keyNodes.push(nodeId);
    }
  });

  // 统计社区数量
  const uniqueCommunities = new Set(communities.values());

  return {
    communities,
    centrality,
    keyNodes,
    communityCount: uniqueCommunities.size
  };
}

/**
 * Louvain 社区发现算法
 * 基于模块度优化，确定性结果，质量优于标签传播算法
 *
 * 算法流程：
 * 1. 初始化：每个节点自成一个社区
 * 2. 第一阶段：遍历节点，将其移动到能最大化模块度增益的邻居社区
 * 3. 第二阶段：将社区聚合为超级节点，重复第一阶段
 * 4. 直到模块度不再增加为止
 */
function louvainCommunityDetection(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>,
  totalEdges: number
): Map<string, number> {
  const m = totalEdges; // 总边数
  if (m === 0) {
    // 无边的情况：每个节点独立社区
    const result = new Map<string, number>();
    nodes.forEach((node, idx) => result.set(node.id, idx));
    return result;
  }

  const m2 = 2 * m; // 2m，用于模块度计算

  // 节点ID列表
  const nodeIds = nodes.map(n => n.id);

  // 初始化：每个节点自成一个社区
  const node2community = new Map<string, number>();
  nodeIds.forEach((id, idx) => node2community.set(id, idx));

  // 计算每个节点的度数
  const degrees = new Map<string, number>();
  nodeIds.forEach(id => {
    degrees.set(id, adjacency.get(id)?.size || 0);
  });

  // 社区内部边权重和（Σin）与社区总度数（Σtot）
  const communityInternalWeight = new Map<number, number>();
  const communityTotalDegree = new Map<number, number>();

  // 初始化社区统计
  nodeIds.forEach((id, idx) => {
    communityInternalWeight.set(idx, 0);
    communityTotalDegree.set(idx, degrees.get(id) || 0);
  });

  // 计算初始社区内部权重（自环边）
  nodeIds.forEach((id, idx) => {
    const neighbors = adjacency.get(id) || new Set();
    let selfLoops = 0;
    neighbors.forEach(neighborId => {
      if (node2community.get(neighborId) === idx) {
        selfLoops++;
      }
    });
    communityInternalWeight.set(idx, selfLoops);
  });

  /**
   * 计算将节点移动到目标社区的模块度增益
   */
  function modularityGain(
    nodeId: string,
    targetCommunity: number,
    neighborWeights: Map<number, number>
  ): number {
    const ki = degrees.get(nodeId) || 0;
    const ki_in = neighborWeights.get(targetCommunity) || 0;
    const sumTot = communityTotalDegree.get(targetCommunity) || 0;

    // ΔQ = ki_in/m - (sumTot * ki) / (2m²)
    return ki_in / m - (sumTot * ki) / (m2 * m);
  }

  // 第一阶段：局部移动优化
  let improved = true;
  let iterations = 0;
  const maxIterations = 20;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    for (const nodeId of nodeIds) {
      const currentCommunity = node2community.get(nodeId)!;
      const neighbors = adjacency.get(nodeId) || new Set();
      const ki = degrees.get(nodeId) || 0;

      // 统计与各邻居社区的连接权重
      const neighborCommunityWeights = new Map<number, number>();
      neighbors.forEach(neighborId => {
        const neighborCommunity = node2community.get(neighborId)!;
        neighborCommunityWeights.set(
          neighborCommunity,
          (neighborCommunityWeights.get(neighborCommunity) || 0) + 1
        );
      });

      // 计算移出当前社区的损失
      const ki_in_current = neighborCommunityWeights.get(currentCommunity) || 0;
      const sumTot_current = communityTotalDegree.get(currentCommunity) || 0;
      const removeLoss = ki_in_current / m - ((sumTot_current - ki) * ki) / (m2 * m);

      // 寻找最佳目标社区
      let bestCommunity = currentCommunity;
      let bestGain = 0;

      neighborCommunityWeights.forEach((weight, community) => {
        if (community !== currentCommunity) {
          const gain = modularityGain(nodeId, community, neighborCommunityWeights) - removeLoss;
          if (gain > bestGain) {
            bestGain = gain;
            bestCommunity = community;
          }
        }
      });

      // 移动节点到最佳社区
      if (bestCommunity !== currentCommunity && bestGain > 1e-10) {
        // 更新社区统计
        communityTotalDegree.set(
          currentCommunity,
          (communityTotalDegree.get(currentCommunity) || 0) - ki
        );
        communityTotalDegree.set(
          bestCommunity,
          (communityTotalDegree.get(bestCommunity) || 0) + ki
        );

        // 更新内部权重
        communityInternalWeight.set(
          currentCommunity,
          (communityInternalWeight.get(currentCommunity) || 0) - 2 * ki_in_current
        );
        const ki_in_new = neighborCommunityWeights.get(bestCommunity) || 0;
        communityInternalWeight.set(
          bestCommunity,
          (communityInternalWeight.get(bestCommunity) || 0) + 2 * ki_in_new
        );

        node2community.set(nodeId, bestCommunity);
        improved = true;
      }
    }
  }

  // 重新编号社区（从 0 开始连续编号）
  const uniqueCommunities = [...new Set(node2community.values())].sort((a, b) => a - b);
  const communityMapping = new Map<number, number>();
  uniqueCommunities.forEach((oldId, newId) => communityMapping.set(oldId, newId));

  const result = new Map<string, number>();
  node2community.forEach((community, nodeId) => {
    result.set(nodeId, communityMapping.get(community)!);
  });

  return result;
}

/**
 * 计算中心性
 * 综合度中心性、介数中心性和 PageRank
 *
 * 权重分配：
 * - 度中心性 (Degree): 25% - 衡量直接连接数量
 * - 介数中心性 (Betweenness): 35% - 衡量桥梁/中间人作用
 * - PageRank: 40% - 衡量影响力传递
 */
function calculateCentrality(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>,
  totalEdges: number
): Map<string, number> {
  const centrality = new Map<string, number>();

  if (nodes.length === 0) return centrality;

  const n = nodes.length;

  // 1. 度中心性 (Degree Centrality)
  const maxDegree = Math.max(...[...adjacency.values()].map(s => s.size), 1);
  const degreeCentrality = new Map<string, number>();
  adjacency.forEach((neighbors, nodeId) => {
    degreeCentrality.set(nodeId, neighbors.size / maxDegree);
  });

  // 2. 介数中心性 (Betweenness Centrality) - Brandes 算法
  const betweennessCentrality = calculateBetweenness(nodes, adjacency);

  // 3. PageRank
  const pageRank = calculatePageRank(nodes, adjacency);

  // 4. 综合得分 (度中心性 * 0.25 + 介数中心性 * 0.35 + PageRank * 0.40)
  nodes.forEach(node => {
    const dc = degreeCentrality.get(node.id) || 0;
    const bc = betweennessCentrality.get(node.id) || 0;
    const pr = pageRank.get(node.id) || 0;
    centrality.set(node.id, dc * 0.25 + bc * 0.35 + pr * 0.40);
  });

  return centrality;
}

/**
 * 计算介数中心性 (Betweenness Centrality)
 * 使用 Brandes 算法，复杂度 O(VE)
 *
 * 介数中心性衡量节点在网络中作为"桥梁"的重要性
 * 经过该节点的最短路径越多，介数中心性越高
 */
function calculateBetweenness(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>
): Map<string, number> {
  const betweenness = new Map<string, number>();
  const nodeIds = nodes.map(n => n.id);

  // 初始化
  nodeIds.forEach(id => betweenness.set(id, 0));

  // Brandes 算法：从每个节点出发计算贡献
  for (const source of nodeIds) {
    // BFS 数据结构
    const stack: string[] = [];
    const predecessors = new Map<string, string[]>();
    const sigma = new Map<string, number>(); // 最短路径数量
    const distance = new Map<string, number>();

    nodeIds.forEach(id => {
      predecessors.set(id, []);
      sigma.set(id, 0);
      distance.set(id, -1);
    });

    sigma.set(source, 1);
    distance.set(source, 0);

    // BFS
    const queue: string[] = [source];
    while (queue.length > 0) {
      const v = queue.shift()!;
      stack.push(v);

      const neighbors = adjacency.get(v) || new Set();
      for (const w of neighbors) {
        // 首次发现 w
        if (distance.get(w)! < 0) {
          queue.push(w);
          distance.set(w, distance.get(v)! + 1);
        }
        // 如果是最短路径
        if (distance.get(w) === distance.get(v)! + 1) {
          sigma.set(w, sigma.get(w)! + sigma.get(v)!);
          predecessors.get(w)!.push(v);
        }
      }
    }

    // 累积依赖值
    const delta = new Map<string, number>();
    nodeIds.forEach(id => delta.set(id, 0));

    while (stack.length > 0) {
      const w = stack.pop()!;
      for (const v of predecessors.get(w)!) {
        const contribution = (sigma.get(v)! / sigma.get(w)!) * (1 + delta.get(w)!);
        delta.set(v, delta.get(v)! + contribution);
      }
      if (w !== source) {
        betweenness.set(w, betweenness.get(w)! + delta.get(w)!);
      }
    }
  }

  // 归一化（无向图除以 2）
  const n = nodes.length;
  const normFactor = n > 2 ? 2 / ((n - 1) * (n - 2)) : 1;

  let maxBetweenness = 0;
  betweenness.forEach((value, nodeId) => {
    const normalized = value * normFactor;
    betweenness.set(nodeId, normalized);
    if (normalized > maxBetweenness) {
      maxBetweenness = normalized;
    }
  });

  // 缩放到 0-1 范围
  if (maxBetweenness > 0) {
    betweenness.forEach((value, nodeId) => {
      betweenness.set(nodeId, value / maxBetweenness);
    });
  }

  return betweenness;
}

/**
 * 计算 PageRank
 */
function calculatePageRank(
  nodes: IntelNode[],
  adjacency: Map<string, Set<string>>
): Map<string, number> {
  const dampingFactor = 0.85;
  const iterations = 20;
  const n = nodes.length;

  let pageRank = new Map<string, number>();
  nodes.forEach(node => pageRank.set(node.id, 1 / n));

  for (let i = 0; i < iterations; i++) {
    const newPageRank = new Map<string, number>();

    nodes.forEach(node => {
      let sum = 0;
      adjacency.forEach((neighbors, otherId) => {
        if (neighbors.has(node.id) && neighbors.size > 0) {
          sum += pageRank.get(otherId)! / neighbors.size;
        }
      });
      newPageRank.set(node.id, (1 - dampingFactor) / n + dampingFactor * sum);
    });

    pageRank = newPageRank;
  }

  // 归一化到 0-1 范围
  const maxPR = Math.max(...pageRank.values(), 0.001);
  pageRank.forEach((pr, nodeId) => {
    pageRank.set(nodeId, pr / maxPR);
  });

  return pageRank;
}

/**
 * 获取节点的社区颜色类名
 */
export function getCommunityColorClass(communityId: number): string {
  return COMMUNITY_COLORS[communityId % COMMUNITY_COLORS.length];
}
