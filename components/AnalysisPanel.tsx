/**
 * Analysis Panel (分析面板)
 *
 * 整合网络分析 + 调查建议的综合报告面板
 * 点击"分析网络"按钮后打开此面板
 */

import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X, Network, Target, AlertTriangle, CheckCircle,
  ChevronRight, Users, TrendingUp, Info, Star,
  Link2, FileQuestion, Layers, ShieldAlert, Activity
} from 'lucide-react';
import { IntelNode } from '../types';
import { GraphAnalysisResult } from '../services/graphAnalysis';
import {
  InvestigationAnalysis,
  NodeCompleteness,
  getPriorityColorClass,
  getPriorityLabel,
  getCompletenessLabel
} from '../services/investigationEngine';
import {
  DataQualityReport,
  NodeQualityResult,
  getQualityLevelLabel,
  getQualityLevelColor,
  getDefectSeverityColor,
  getDefectTypeLabel
} from '../services/dataQualityEngine';

interface AnalysisPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: IntelNode[];
  graphAnalysis: GraphAnalysisResult | null;
  investigationAnalysis: InvestigationAnalysis | null;
  dataQualityReport: DataQualityReport | null;
  onNodeSelect?: (nodeId: string) => void;
}

type TabType = 'overview' | 'structure' | 'suggestions';

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  isOpen,
  onClose,
  nodes,
  graphAnalysis,
  investigationAnalysis,
  dataQualityReport,
  onNodeSelect
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);

  // 节点映射便于查找 - 所有 hooks 必须在条件返回之前
  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  // 计算社区信息
  const communities = useMemo(() => {
    if (!graphAnalysis) return [];

    const communityMap = new Map<number, string[]>();
    graphAnalysis.communities.forEach((communityId, nodeId) => {
      if (!communityMap.has(communityId)) {
        communityMap.set(communityId, []);
      }
      communityMap.get(communityId)!.push(nodeId);
    });

    return Array.from(communityMap.entries())
      .map(([id, nodeIds]) => ({
        id,
        nodeIds,
        nodes: nodeIds.map(nid => nodeMap.get(nid)).filter(Boolean) as IntelNode[]
      }))
      .sort((a, b) => b.nodeIds.length - a.nodeIds.length);
  }, [graphAnalysis, nodeMap]);

  // 核心节点信息
  const keyNodes = useMemo(() => {
    if (!graphAnalysis) return [];
    return graphAnalysis.keyNodes
      .map(id => ({
        node: nodeMap.get(id),
        centrality: graphAnalysis.centrality.get(id) || 0
      }))
      .filter(item => item.node)
      .sort((a, b) => b.centrality - a.centrality);
  }, [graphAnalysis, nodeMap]);

  // 早期返回必须在所有 hooks 之后
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleNodeClick = (nodeId: string) => {
    if (onNodeSelect) {
      onNodeSelect(nodeId);
      onClose();
    }
  };

  // 渲染概览标签页
  const renderOverview = () => (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {/* 社区数量 */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-purple-400 mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">社区</span>
          </div>
          <div className="text-xl font-bold text-white">
            {graphAnalysis?.communityCount || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">个群组</div>
        </div>

        {/* 完整性 */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-cyan-400 mb-2">
            <Target className="w-4 h-4" />
            <span className="text-xs font-medium">完整性</span>
          </div>
          <div className="text-xl font-bold text-white">
            {investigationAnalysis
              ? `${(investigationAnalysis.averageCompleteness * 100).toFixed(0)}%`
              : '-'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">平均得分</div>
        </div>

        {/* 数据质量 */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-green-400 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-medium">数据质量</span>
          </div>
          <div className="text-xl font-bold text-white">
            {dataQualityReport
              ? `${(dataQualityReport.summary.averagePressure * 100).toFixed(0)}%`
              : '-'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">信息压力</div>
        </div>

        {/* 核心节点 */}
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <Star className="w-4 h-4" />
            <span className="text-xs font-medium">核心节点</span>
          </div>
          <div className="text-xl font-bold text-white">
            {graphAnalysis?.keyNodes.length || 0}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">个关键实体</div>
        </div>
      </div>

      {/* 图谱健康度 */}
      {investigationAnalysis && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            图谱健康度
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">连通性</span>
                <span className="text-slate-300">{(investigationAnalysis.graphHealth.connectivity * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${investigationAnalysis.graphHealth.connectivity * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">信息密度</span>
                <span className="text-slate-300">{(investigationAnalysis.graphHealth.informationDensity * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{ width: `${investigationAnalysis.graphHealth.informationDensity * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">结构均衡</span>
                <span className="text-slate-300">{(investigationAnalysis.graphHealth.structuralBalance * 100).toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${investigationAnalysis.graphHealth.structuralBalance * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 完整性分布 */}
      {investigationAnalysis && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            完整性分布
          </h3>
          <div className="flex gap-2">
            {[
              { key: 'critical', label: '严重不足', color: 'bg-red-500', count: investigationAnalysis.completenessDistribution.critical },
              { key: 'low', label: '较差', color: 'bg-orange-500', count: investigationAnalysis.completenessDistribution.low },
              { key: 'medium', label: '一般', color: 'bg-yellow-500', count: investigationAnalysis.completenessDistribution.medium },
              { key: 'high', label: '良好', color: 'bg-green-500', count: investigationAnalysis.completenessDistribution.high },
            ].map(item => (
              <div key={item.key} className="flex-1 text-center">
                <div className={`h-16 ${item.color} rounded-t opacity-80 flex items-end justify-center`}
                  style={{
                    height: `${Math.max(20, (item.count / nodes.length) * 100)}px`,
                    minHeight: '20px'
                  }}
                >
                  <span className="text-white text-xs font-bold mb-1">{item.count}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 数据质量分布 */}
      {dataQualityReport && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-green-400" />
            数据质量分布
            {dataQualityReport.summary.defectRate > 0 && (
              <span className="ml-auto text-xs text-orange-400">
                {(dataQualityReport.summary.defectRate * 100).toFixed(0)}% 需关注
              </span>
            )}
          </h3>
          <div className="flex gap-2">
            {[
              { key: 'critical', label: '严重', color: 'bg-red-500', count: dataQualityReport.summary.criticalCount },
              { key: 'poor', label: '较差', color: 'bg-orange-500', count: dataQualityReport.summary.poorCount },
              { key: 'fair', label: '一般', color: 'bg-yellow-500', count: dataQualityReport.summary.fairCount },
              { key: 'good', label: '良好', color: 'bg-cyan-500', count: dataQualityReport.summary.goodCount },
              { key: 'excellent', label: '优秀', color: 'bg-green-500', count: dataQualityReport.summary.excellentCount },
            ].map(item => (
              <div key={item.key} className="flex-1 text-center">
                <div className={`${item.color} rounded-t opacity-80 flex items-end justify-center`}
                  style={{
                    height: `${Math.max(20, (item.count / Math.max(nodes.length, 1)) * 100)}px`,
                    minHeight: '20px'
                  }}
                >
                  <span className="text-white text-xs font-bold mb-1">{item.count}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // 渲染网络结构标签页
  const renderStructure = () => (
    <div className="space-y-4">
      {/* 社区列表 */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            社区分组 ({communities.length})
          </h3>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {communities.map((community, idx) => (
            <div key={community.id} className="px-4 py-2 border-b border-slate-800/50 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">
                  社区 {idx + 1}
                </span>
                <span className="text-xs text-slate-500">{community.nodeIds.length} 个节点</span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {community.nodes.slice(0, 5).map(node => (
                  <button
                    key={node.id}
                    onClick={() => handleNodeClick(node.id)}
                    className="text-[10px] px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300 truncate max-w-[100px]"
                    title={node.title}
                  >
                    {node.title}
                  </button>
                ))}
                {community.nodes.length > 5 && (
                  <span className="text-[10px] text-slate-500">+{community.nodes.length - 5}</span>
                )}
              </div>
            </div>
          ))}
          {communities.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              暂无社区数据
            </div>
          )}
        </div>
      </div>

      {/* 核心节点 */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
        <div className="px-4 py-3 border-b border-slate-700/50">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" />
            核心节点 ({keyNodes.length})
          </h3>
        </div>
        <div className="max-h-48 overflow-y-auto">
          {keyNodes.map(({ node, centrality }) => (
            <button
              key={node!.id}
              onClick={() => handleNodeClick(node!.id)}
              className="w-full px-4 py-2 border-b border-slate-800/50 last:border-0 hover:bg-slate-700/30 transition-colors text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 truncate max-w-[200px]">
                  {node!.title}
                </span>
                <span className="text-xs font-mono text-amber-400">
                  {(centrality * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">{node!.type}</div>
            </button>
          ))}
          {keyNodes.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-slate-500">
              暂无核心节点
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // 渲染质量与建议标签页
  const renderSuggestions = () => {
    const hasQualityIssues = dataQualityReport && dataQualityReport.defectiveNodes.length > 0;
    const hasCompletionIssues = investigationAnalysis && investigationAnalysis.prioritizedSuggestions.length > 0;
    const hasAnyIssues = hasQualityIssues || hasCompletionIssues;

    return (
    <div className="space-y-4">
      {/* 数据缺陷 */}
      {hasQualityIssues && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              数据缺陷
              <span className="ml-auto text-xs text-slate-500">
                {dataQualityReport!.defectiveNodes.length} 个节点
              </span>
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {dataQualityReport!.defectiveNodes.slice(0, 20).map((result) => (
              <QualityDefectCard
                key={result.nodeId}
                result={result}
                isExpanded={expandedNodeId === `q-${result.nodeId}`}
                onToggle={() => setExpandedNodeId(
                  expandedNodeId === `q-${result.nodeId}` ? null : `q-${result.nodeId}`
                )}
                onNodeClick={() => handleNodeClick(result.nodeId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 完整性建议 */}
      {hasCompletionIssues && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="px-4 py-3 border-b border-slate-700/50">
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-cyan-400" />
              完整性建议
              <span className="ml-auto text-xs text-slate-500">
                {investigationAnalysis!.prioritizedSuggestions.length} 个节点
              </span>
            </h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {investigationAnalysis!.prioritizedSuggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.nodeId}
                suggestion={suggestion}
                node={nodeMap.get(suggestion.nodeId)}
                isExpanded={expandedNodeId === suggestion.nodeId}
                onToggle={() => setExpandedNodeId(
                  expandedNodeId === suggestion.nodeId ? null : suggestion.nodeId
                )}
                onNodeClick={() => handleNodeClick(suggestion.nodeId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 无问题 */}
      {!hasAnyIssues && (
        <div className="py-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
          <div className="text-sm text-slate-400">数据质量良好</div>
          <div className="text-xs text-slate-500 mt-1">没有发现数据缺陷或完整性问题</div>
        </div>
      )}
    </div>
  );
  };

  // 计算问题总数用于标签页徽章
  const totalIssueCount = (dataQualityReport?.defectiveNodes.length || 0) +
    (investigationAnalysis?.prioritizedSuggestions.length || 0);

  const panelContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-900/30 rounded-lg border border-purple-800/50">
              <Network className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">网络分析报告</h2>
              <p className="text-xs text-slate-500">{nodes.length} 个节点的综合分析</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 标签栏 */}
        <div className="flex border-b border-slate-800 bg-slate-950/30">
          {[
            { key: 'overview', label: '概览', icon: Info },
            { key: 'structure', label: '网络结构', icon: Network },
            { key: 'suggestions', label: '质量与建议', icon: ShieldAlert },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors ${
                activeTab === tab.key
                  ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-900/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.key === 'suggestions' && totalIssueCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/20 text-orange-400 rounded-full">
                  {totalIssueCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'structure' && renderStructure()}
          {activeTab === 'suggestions' && renderSuggestions()}
        </div>
      </div>
    </div>
  );

  return createPortal(panelContent, document.body);
};

// 建议卡片组件
interface SuggestionCardProps {
  suggestion: NodeCompleteness;
  node?: IntelNode;
  isExpanded: boolean;
  onToggle: () => void;
  onNodeClick: () => void;
}

const SuggestionCard: React.FC<SuggestionCardProps> = ({
  suggestion,
  node,
  isExpanded,
  onToggle,
  onNodeClick
}) => {
  if (!node) return null;

  return (
    <div className={`bg-slate-800/50 rounded-lg border ${getPriorityColorClass(suggestion.priority).replace('text-', 'border-').split(' ')[0]} overflow-hidden`}>
      {/* 头部 */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-700/30 transition-colors"
      >
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate max-w-[200px]">{node.title}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded ${getPriorityColorClass(suggestion.priority)}`}>
              {getPriorityLabel(suggestion.priority)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{node.type}</div>
        </div>

        {/* 完整性分数 */}
        <div className="text-right">
          <div className="text-lg font-bold text-white">{(suggestion.overallScore * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">{getCompletenessLabel(suggestion.overallScore)}</div>
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          {/* 三维评分 */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-xs text-slate-500 mb-1">关系</div>
              <div className="text-sm font-mono text-cyan-400">{(suggestion.relationScore * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-xs text-slate-500 mb-1">属性</div>
              <div className="text-sm font-mono text-green-400">{(suggestion.attributeScore * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-xs text-slate-500 mb-1">结构</div>
              <div className="text-sm font-mono text-purple-400">{(suggestion.structureScore * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* 缺失关系 */}
          {suggestion.missingRelations.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Link2 className="w-3 h-3" />
                缺失关系
              </div>
              <div className="space-y-1">
                {suggestion.missingRelations.map((rel, idx) => (
                  <div key={idx} className="text-[11px] text-slate-300 bg-slate-900/50 rounded px-2 py-1.5">
                    {rel.description}
                    <span className="text-slate-500 ml-1">({(rel.expectedProbability * 100).toFixed(0)}% 期望)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 稀疏属性 */}
          {suggestion.sparseAttributes.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <FileQuestion className="w-3 h-3" />
                信息不足的字段
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestion.sparseAttributes.map((attr, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-1 bg-slate-900/50 rounded text-slate-300">
                    {attr.field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 结构问题 */}
          {suggestion.structuralIssues.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                结构问题
              </div>
              <div className="space-y-1">
                {suggestion.structuralIssues.map((issue, idx) => (
                  <div key={idx} className="text-[11px] text-orange-300 bg-orange-900/20 rounded px-2 py-1.5">
                    {issue.description}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 查看节点按钮 */}
          <button
            onClick={onNodeClick}
            className="w-full py-2 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
          >
            定位到此节点 →
          </button>
        </div>
      )}
    </div>
  );
};

// 数据质量缺陷卡片组件
interface QualityDefectCardProps {
  result: NodeQualityResult;
  isExpanded: boolean;
  onToggle: () => void;
  onNodeClick: () => void;
}

const QualityDefectCard: React.FC<QualityDefectCardProps> = ({
  result,
  isExpanded,
  onToggle,
  onNodeClick
}) => {
  return (
    <div className="border-b border-slate-800/50 last:border-0">
      {/* 头部 */}
      <button
        onClick={onToggle}
        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-slate-700/30 transition-colors"
      >
        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white truncate max-w-[180px]">{result.nodeTitle}</span>
            <span className={`px-1.5 py-0.5 text-[10px] rounded ${getQualityLevelColor(result.qualityLevel)}`}>
              {getQualityLevelLabel(result.qualityLevel)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">{result.nodeType}</div>
        </div>

        {/* 压力分数 */}
        <div className="text-right">
          <div className="text-sm font-bold text-white">{(result.finalPressure * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-slate-500">信息压力</div>
        </div>
      </button>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="px-4 pb-3 space-y-3 border-t border-slate-800/50 pt-3 ml-7">
          {/* 熵分解 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/50 rounded p-1.5">
              <div className="text-[10px] text-slate-500">标题</div>
              <div className="text-xs font-mono text-cyan-400">{(result.entropyBreakdown.title * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-1.5">
              <div className="text-[10px] text-slate-500">内容</div>
              <div className="text-xs font-mono text-green-400">{(result.entropyBreakdown.content * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-1.5">
              <div className="text-[10px] text-slate-500">数据</div>
              <div className="text-xs font-mono text-purple-400">{(result.entropyBreakdown.data * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-1.5">
              <div className="text-[10px] text-slate-500">格式</div>
              <div className="text-xs font-mono text-amber-400">{(result.entropyBreakdown.format * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* 缺陷列表 */}
          {result.defects.length > 0 && (
            <div>
              <div className="text-[10px] text-slate-400 mb-1.5">检测到的缺陷</div>
              <div className="space-y-1">
                {result.defects.map((defect, idx) => (
                  <div key={idx} className={`text-[11px] ${getDefectSeverityColor(defect.severity)} bg-slate-900/50 rounded px-2 py-1.5 flex items-center gap-2`}>
                    <span className="opacity-70">{getDefectTypeLabel(defect.type)}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-300">{defect.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 查看节点按钮 */}
          <button
            onClick={onNodeClick}
            className="w-full py-1.5 text-xs text-cyan-400 hover:text-cyan-300 hover:bg-cyan-900/20 rounded transition-colors"
          >
            定位到此节点 →
          </button>
        </div>
      )}
    </div>
  );
};
