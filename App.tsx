
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Canvas } from './components/Canvas';
import { ControlPanel } from './components/ControlPanel';
import { ContextMenu } from './components/ContextMenu';
import { TrajectoryModal, extractTrajectoryPoints } from './components/TrajectoryModal';
import { NodeDetailPanel } from './components/NodeDetailPanel';
import { IntelNode, Connection, NodeType, Position, LogEntry, Tool, AIModelConfig, Project, CanvasData, Snapshot } from './types';
import { executeTool, generateFinalReport, BriefingContext } from './services/geminiService';
import { analyzeGraph, GraphAnalysisResult } from './services/graphAnalysis';
import { analyzeInvestigation, InvestigationAnalysis } from './services/investigationEngine';
import { analyzeDataQuality, DataQualityReport } from './services/dataQualityEngine';
import { AnalysisPanel } from './components/AnalysisPanel';
import { ENTITY_DEFAULT_FIELDS } from './constants';
import { DEFAULT_TOOLS } from './tools';
import { Search, Layout, Save, FolderOpen, Network, Trash2, FileText, X, FileOutput, RefreshCw, Folder, ChevronDown, Plus, Camera, Layers, Edit3, GitBranch } from 'lucide-react';
import {
  saveAIConfig,
  loadAIConfig,
  saveCustomTool,
  loadCustomTools,
  saveGraphData,
  loadGraphData,
  hasGraphData,
  // 6.0 多画布
  initializeStorage,
  saveLastUsed,
  loadProjects,
  createProject,
  updateProject,
  deleteProject,
  loadCanvases,
  createCanvas,
  updateCanvas,
  deleteCanvas,
  duplicateCanvas,
  saveCanvasData,
  loadCanvasData,
  // 快照
  createSnapshot,
  loadSnapshots,
  loadSnapshotData,
  deleteSnapshot,
  cleanupSnapshots,
} from './services/storageService';

const uuid = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [nodes, setNodes] = useState<IntelNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([{
      id: 'init',
      timestamp: new Date(),
      action: '河图 系统核心已启动 / System initialized',
      status: 'success'
  }]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Tools (Plugins) State
  const [tools, setTools] = useState<Tool[]>(DEFAULT_TOOLS);

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AIModelConfig>({
      modelId: 'gemini-2.5-flash',
      temperature: 0.4,
      enableThinking: false,
      thinkingBudget: 0
  });

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // Trajectory Analysis State
  const [trajectoryModal, setTrajectoryModal] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });

  // Node Detail Panel State
  const [detailPanel, setDetailPanel] = useState<{ isOpen: boolean; nodeId: string | null }>({ isOpen: false, nodeId: null });

  // Graph Analysis State (Community Detection & Key Nodes)
  const [graphAnalysis, setGraphAnalysis] = useState<GraphAnalysisResult | null>(null);

  // Investigation Analysis State (Completeness Analysis)
  const [investigationAnalysis, setInvestigationAnalysis] = useState<InvestigationAnalysis | null>(null);
  const [dataQualityReport, setDataQualityReport] = useState<DataQualityReport | null>(null);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);

  // Briefing Report State
  const [reportText, setReportText] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Persistence State
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 6.0 多画布工作区状态
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [canvases, setCanvases] = useState<CanvasData[]>([]);
  const [currentCanvasId, setCurrentCanvasId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isSwitchingCanvas, setIsSwitchingCanvas] = useState(false);
  // 工作区UI状态
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [showSnapshotDropdown, setShowSnapshotDropdown] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');

  // Refs for async access in loops
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;

  // Logging
  const addLog = useCallback((action: string, status: LogEntry['status'] = 'info') => {
    const newLog = { id: uuid(), timestamp: new Date(), action, status };
    console.log('[LOG]', newLog); // Debug: 确认日志被调用
    setLogs(prev => [newLog, ...prev].slice(0, 200));
  }, []);

  // --- Persistence: 初始化加载数据 ---
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 加载 AI 配置
        const savedAiConfig = await loadAIConfig();
        if (savedAiConfig) {
          setAiConfig(savedAiConfig);
        }

        // 加载自定义工具
        const savedTools = await loadCustomTools();
        if (savedTools.length > 0) {
          setTools([...DEFAULT_TOOLS, ...savedTools]);
        }

        // 6.0: 初始化存储并获取上次使用的项目/画布
        const { currentProjectId: projId, currentCanvasId: canvId } = await initializeStorage();

        // 加载项目列表
        const projectList = await loadProjects();
        setProjects(projectList);
        setCurrentProjectId(projId);

        // 加载当前项目的画布列表
        const canvasList = await loadCanvases(projId);
        setCanvases(canvasList);
        setCurrentCanvasId(canvId);

        // 加载当前画布的数据
        const { nodes: savedNodes, connections: savedConnections } = await loadCanvasData(canvId);
        setNodes(savedNodes);
        setConnections(savedConnections);

        // 加载当前画布的快照
        const snapshotList = await loadSnapshots(canvId);
        setSnapshots(snapshotList);

        if (savedNodes.length > 0) {
          addLog(`已恢复画布数据: ${savedNodes.length} 个节点, ${savedConnections.length} 个连接`, 'success');
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load saved data:', error);
        addLog(`加载保存数据失败: ${error}`, 'error');
        setIsInitialized(true);
      }
    };

    initializeData();
  }, []);

  // --- Persistence: AI 配置自动保存 ---
  useEffect(() => {
    if (!isInitialized) return;

    saveAIConfig(aiConfig).catch(err => {
      console.error('Failed to save AI config:', err);
    });
  }, [aiConfig, isInitialized]);

  // --- Persistence: 图谱变更标记 ---
  useEffect(() => {
    if (!isInitialized) return;
    if (nodes.length > 0 || connections.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [nodes, connections, isInitialized]);

  // --- 6.0: 点击外部关闭下拉菜单 ---
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 如果点击的不是下拉菜单内部，关闭下拉菜单
      if (!target.closest('[data-dropdown]')) {
        setShowWorkspaceDropdown(false);
        setShowSnapshotDropdown(false);
      }
    };

    if (showWorkspaceDropdown || showSnapshotDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showWorkspaceDropdown, showSnapshotDropdown]);

  // --- Persistence: 手动保存图谱 ---
  const handleSaveGraph = useCallback(async () => {
    if (!currentCanvasId) return;
    try {
      await saveCanvasData(currentCanvasId, nodes, connections);
      await saveLastUsed(currentProjectId!, currentCanvasId);
      setHasUnsavedChanges(false);
      addLog(`图谱已保存: ${nodes.length} 个节点, ${connections.length} 个连接`, 'success');
    } catch (error) {
      addLog(`保存图谱失败: ${error}`, 'error');
    }
  }, [nodes, connections, currentCanvasId, currentProjectId, addLog]);

  // --- Persistence: 从本地加载图谱 ---
  const handleLoadGraph = useCallback(async () => {
    if (!currentCanvasId) return;
    try {
      const { nodes: savedNodes, connections: savedConnections } = await loadCanvasData(currentCanvasId);
      setNodes(savedNodes);
      setConnections(savedConnections);
      setHasUnsavedChanges(false);
      addLog(`已加载图谱: ${savedNodes.length} 个节点, ${savedConnections.length} 个连接`, 'success');
    } catch (error) {
      addLog(`加载图谱失败: ${error}`, 'error');
    }
  }, [currentCanvasId, addLog]);

  // --- 6.0: 画布切换 ---
  const handleSwitchCanvas = useCallback(async (canvasId: string) => {
    if (canvasId === currentCanvasId || isSwitchingCanvas) return;

    setIsSwitchingCanvas(true);
    try {
      // 保存当前画布
      if (currentCanvasId && hasUnsavedChanges) {
        await saveCanvasData(currentCanvasId, nodes, connections);
      }

      // 加载目标画布
      const { nodes: newNodes, connections: newConns } = await loadCanvasData(canvasId);
      setNodes(newNodes);
      setConnections(newConns);
      setCurrentCanvasId(canvasId);
      setSelectedNodeIds([]);
      setHasUnsavedChanges(false);

      // 加载目标画布的快照
      const snapshotList = await loadSnapshots(canvasId);
      setSnapshots(snapshotList);

      // 保存上次使用
      await saveLastUsed(currentProjectId!, canvasId);

      const canvas = canvases.find(c => c.id === canvasId);
      addLog(`切换到画布: ${canvas?.name || canvasId}`, 'info');
    } catch (error) {
      addLog(`切换画布失败: ${error}`, 'error');
    }
    setIsSwitchingCanvas(false);
  }, [currentCanvasId, currentProjectId, nodes, connections, hasUnsavedChanges, canvases, isSwitchingCanvas, addLog]);

  // --- 6.0: 项目切换 ---
  const handleSwitchProject = useCallback(async (projectId: string) => {
    if (projectId === currentProjectId) return;

    setIsSwitchingCanvas(true);
    try {
      // 保存当前画布
      if (currentCanvasId && hasUnsavedChanges) {
        await saveCanvasData(currentCanvasId, nodes, connections);
      }

      // 加载新项目的画布列表
      const canvasList = await loadCanvases(projectId);
      setCanvases(canvasList);
      setCurrentProjectId(projectId);

      // 切换到新项目的第一个画布
      if (canvasList.length > 0) {
        const firstCanvas = canvasList[0];
        const { nodes: newNodes, connections: newConns } = await loadCanvasData(firstCanvas.id);
        setNodes(newNodes);
        setConnections(newConns);
        setCurrentCanvasId(firstCanvas.id);

        const snapshotList = await loadSnapshots(firstCanvas.id);
        setSnapshots(snapshotList);

        await saveLastUsed(projectId, firstCanvas.id);
      } else {
        setNodes([]);
        setConnections([]);
        setCurrentCanvasId(null);
        setSnapshots([]);
      }

      setSelectedNodeIds([]);
      setHasUnsavedChanges(false);

      const project = projects.find(p => p.id === projectId);
      addLog(`切换到项目: ${project?.name || projectId}`, 'info');
    } catch (error) {
      addLog(`切换项目失败: ${error}`, 'error');
    }
    setIsSwitchingCanvas(false);
  }, [currentProjectId, currentCanvasId, nodes, connections, hasUnsavedChanges, projects, addLog]);

  // --- 6.0: 创建新画布 ---
  const handleCreateCanvas = useCallback(async (name: string) => {
    if (!currentProjectId) return;
    try {
      const newCanvas = await createCanvas(currentProjectId, name);
      setCanvases(prev => [...prev, newCanvas]);
      await handleSwitchCanvas(newCanvas.id);
      addLog(`创建新画布: ${name}`, 'success');
    } catch (error) {
      addLog(`创建画布失败: ${error}`, 'error');
    }
  }, [currentProjectId, handleSwitchCanvas, addLog]);

  // --- 6.0: 删除画布 ---
  const handleDeleteCanvas = useCallback(async (canvasId: string) => {
    if (canvases.length <= 1) {
      addLog('无法删除唯一的画布', 'warning');
      return;
    }
    try {
      await deleteCanvas(canvasId);
      const newCanvases = canvases.filter(c => c.id !== canvasId);
      setCanvases(newCanvases);

      // 如果删除的是当前画布，切换到第一个
      if (canvasId === currentCanvasId && newCanvases.length > 0) {
        await handleSwitchCanvas(newCanvases[0].id);
      }
      addLog(`已删除画布`, 'warning');
    } catch (error) {
      addLog(`删除画布失败: ${error}`, 'error');
    }
  }, [canvases, currentCanvasId, handleSwitchCanvas, addLog]);

  // --- 6.0: 复制画布 ---
  const handleDuplicateCanvas = useCallback(async (canvasId: string, newName: string) => {
    try {
      const newCanvas = await duplicateCanvas(canvasId, newName);
      setCanvases(prev => [...prev, newCanvas]);
      addLog(`已复制画布: ${newName}`, 'success');
    } catch (error) {
      addLog(`复制画布失败: ${error}`, 'error');
    }
  }, [addLog]);

  // --- 6.0: 创建快照 ---
  const handleCreateSnapshot = useCallback(async (name: string) => {
    if (!currentCanvasId) return;
    try {
      const snapshot = await createSnapshot(
        currentCanvasId,
        name,
        'manual',
        nodes,
        connections
      );
      setSnapshots(prev => [snapshot, ...prev]);

      // 自动清理旧快照
      const cleaned = await cleanupSnapshots(currentCanvasId, 20);
      if (cleaned > 0) {
        setSnapshots(prev => prev.slice(0, 20));
      }

      addLog(`已创建快照: ${name} (${nodes.length} 节点)`, 'success');
    } catch (error) {
      addLog(`创建快照失败: ${error}`, 'error');
    }
  }, [currentCanvasId, nodes, connections, addLog]);

  // --- 6.0: 恢复快照 ---
  const handleRestoreSnapshot = useCallback(async (snapshotId: string) => {
    try {
      const data = await loadSnapshotData(snapshotId);
      if (data) {
        setNodes(data.nodes);
        setConnections(data.connections);
        setHasUnsavedChanges(true);
        setSelectedNodeIds([]);

        const snapshot = snapshots.find(s => s.id === snapshotId);
        addLog(`已恢复快照: ${snapshot?.name || snapshotId}`, 'success');
      }
    } catch (error) {
      addLog(`恢复快照失败: ${error}`, 'error');
    }
  }, [snapshots, addLog]);

  // --- 6.0: 删除快照 ---
  const handleDeleteSnapshot = useCallback(async (snapshotId: string) => {
    try {
      await deleteSnapshot(snapshotId);
      setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
      addLog(`已删除快照`, 'info');
    } catch (error) {
      addLog(`删除快照失败: ${error}`, 'error');
    }
  }, [addLog]);

  // --- 6.0: 创建新项目 ---
  const handleCreateProject = useCallback(async (name: string) => {
    try {
      const newProject = await createProject(name);
      const projectList = await loadProjects();
      setProjects(projectList);
      await handleSwitchProject(newProject.id);
      addLog(`创建新项目: ${name}`, 'success');
    } catch (error) {
      addLog(`创建项目失败: ${error}`, 'error');
    }
  }, [handleSwitchProject, addLog]);

  // --- 6.0: 删除项目 ---
  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (projects.length <= 1) {
      addLog('无法删除唯一的项目', 'warning');
      return;
    }
    try {
      await deleteProject(projectId);
      const newProjects = projects.filter(p => p.id !== projectId);
      setProjects(newProjects);

      if (projectId === currentProjectId && newProjects.length > 0) {
        await handleSwitchProject(newProjects[0].id);
      }
      addLog(`已删除项目`, 'warning');
    } catch (error) {
      addLog(`删除项目失败: ${error}`, 'error');
    }
  }, [projects, currentProjectId, handleSwitchProject, addLog]);

  // --- 6.0: 重命名画布 ---
  const handleRenameCanvas = useCallback(async (canvasId: string, newName: string) => {
    try {
      await updateCanvas(canvasId, { name: newName });
      setCanvases(prev => prev.map(c => c.id === canvasId ? { ...c, name: newName } : c));
      addLog(`画布已重命名: ${newName}`, 'info');
    } catch (error) {
      addLog(`重命名失败: ${error}`, 'error');
    }
  }, [addLog]);

  // --- 6.0: 重命名项目 ---
  const handleRenameProject = useCallback(async (projectId: string, newName: string) => {
    try {
      await updateProject(projectId, { name: newName });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
      addLog(`项目已重命名: ${newName}`, 'info');
    } catch (error) {
      addLog(`重命名失败: ${error}`, 'error');
    }
  }, [addLog]);

  // --- Core Graph Operations ---
  
  const deleteNodes = useCallback((nodeIds: string[]) => {
    if (nodeIds.length === 0) return;

    const deletedNodes = nodesRef.current.filter(n => nodeIds.includes(n.id));
    const nodeNames = deletedNodes.map(n => n.title).join(', ');

    setNodes(prev => prev.filter(n => !nodeIds.includes(n.id)));
    setConnections(prev => prev.filter(c => !nodeIds.includes(c.sourceId) && !nodeIds.includes(c.targetId)));
    setSelectedNodeIds([]);

    if (deletedNodes.length === 1) {
      addLog(`🗑️ 删除节点: ${nodeNames} (${deletedNodes[0].type})`, 'warning');
    } else {
      addLog(`🗑️ 批量删除 ${deletedNodes.length} 个节点: ${nodeNames}`, 'warning');
    }
    setContextMenu(null);
  }, [addLog]);

  const clearAllNodes = useCallback(() => {
    const nodeCount = nodesRef.current.length;
    if (nodeCount === 0) {
      addLog('画布已为空，无需清空', 'info');
      return;
    }
    setNodes([]);
    setConnections([]);
    setSelectedNodeIds([]);
    setContextMenu(null);
    addLog(`🗑️ 已清空全部 ${nodeCount} 个节点`, 'warning');
  }, [addLog]);

  // Generate Briefing Report
  const handleGenerateBriefing = useCallback(async () => {
    // 智能选择：有选中节点则只分析选中的，否则分析全部
    const targetNodes = selectedNodeIds.length > 0
      ? nodesRef.current.filter(n => selectedNodeIds.includes(n.id))
      : nodesRef.current;

    if (targetNodes.length === 0) {
      addLog('画布中没有可分析的节点', 'warning');
      return;
    }

    setIsGeneratingReport(true);
    setShowReportModal(true);
    setReportText('');

    const scope = selectedNodeIds.length > 0
      ? `选中的 ${targetNodes.length} 个节点`
      : `全部 ${targetNodes.length} 个节点`;
    addLog(`📝 正在生成情报简报 (${scope})...`, 'info');

    try {
      // 获取目标节点的 ID 集合
      const targetNodeIds = new Set(targetNodes.map(n => n.id));

      // 筛选相关连接（只保留两端都在目标节点中的连接）
      const relevantConnections = connections.filter(
        c => targetNodeIds.has(c.sourceId) && targetNodeIds.has(c.targetId)
      );

      // 构建连接信息（带标题）
      const connectionInfo = relevantConnections.map(c => {
        const source = targetNodes.find(n => n.id === c.sourceId);
        const target = targetNodes.find(n => n.id === c.targetId);
        return {
          sourceTitle: source?.title || '未知',
          targetTitle: target?.title || '未知'
        };
      });

      // 执行图谱分析
      const analysis = analyzeGraph(targetNodes, relevantConnections);

      // 构建社区信息
      const communitiesMap = new Map<number, string[]>();
      analysis.communities.forEach((communityId, nodeId) => {
        const node = targetNodes.find(n => n.id === nodeId);
        if (node) {
          if (!communitiesMap.has(communityId)) {
            communitiesMap.set(communityId, []);
          }
          communitiesMap.get(communityId)!.push(node.title);
        }
      });
      const communities = Array.from(communitiesMap.entries()).map(([id, members]) => ({
        id,
        members
      }));

      // 获取核心节点标题
      const keyNodeTitles = analysis.keyNodes
        .map(id => targetNodes.find(n => n.id === id)?.title)
        .filter(Boolean) as string[];

      // 构建简报上下文
      const briefingContext: BriefingContext = {
        nodes: targetNodes,
        connections: connectionInfo,
        communities: communities.length > 1 ? communities : undefined,
        keyNodes: keyNodeTitles.length > 0 ? keyNodeTitles : undefined
      };

      const report = await generateFinalReport(briefingContext);
      setReportText(report);
      addLog('✅ 情报简报生成成功', 'success');
    } catch (e) {
      setReportText('生成报告失败，请重试。');
      addLog('❌ 情报简报生成失败', 'error');
    }
    setIsGeneratingReport(false);
  }, [selectedNodeIds, connections, addLog]);

  // Keyboard listener for deletion
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const target = e.target as HTMLElement;
          if (['INPUT', 'TEXTAREA'].includes(target.tagName)) return;

          if (e.key === 'Delete' || e.key === 'Backspace') {
              if (selectedNodeIds.length > 0) {
                  deleteNodes(selectedNodeIds);
              }
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, deleteNodes]);

  // --- Layout Engine ---
  const performAutoLayout = useCallback(() => {
      setNodes(currentNodes => {
          if (currentNodes.length === 0) return currentNodes;

          const COLUMN_WIDTH = 350;
          const ROW_HEIGHT = 180;
          const BASE_X = 100;
          const BASE_Y = 100;

          const depthMap: Record<number, IntelNode[]> = {};
          currentNodes.forEach(node => {
              const d = node.depth || 0;
              if (!depthMap[d]) depthMap[d] = [];
              depthMap[d].push(node);
          });

          const newNodes = [...currentNodes];
          
          Object.keys(depthMap).sort((a,b) => Number(a)-Number(b)).forEach(depthStr => {
              const depth = Number(depthStr);
              const nodesInLayer = depthMap[depth];
              
              nodesInLayer.forEach((node, idx) => {
                  const targetX = BASE_X + (depth * COLUMN_WIDTH);
                  const targetY = BASE_Y + (idx * ROW_HEIGHT);

                  const nIndex = newNodes.findIndex(n => n.id === node.id);
                  if (nIndex > -1) {
                      newNodes[nIndex] = {
                          ...newNodes[nIndex],
                          position: { x: targetX, y: targetY }
                      };
                  }
              });
          });

          addLog("自动布局已完成 / Auto-layout applied", 'info');
          return newNodes;
      });
  }, [addLog]);

  const addNode = useCallback((position: Position, type: NodeType, content: string = '待分析...', depth: number = 0) => {
    const defaultData = ENTITY_DEFAULT_FIELDS[type] ? { ...ENTITY_DEFAULT_FIELDS[type] } : {};

    const newNode: IntelNode = {
      id: uuid(),
      type,
      title: `新 ${type}`,
      content: content,
      position,
      data: defaultData,
      rating: { reliability: 'C', credibility: '3' },
      status: 'NEW',
      depth: depth
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeIds([newNode.id]);
    addLog(`➕ 创建新节点: ${newNode.title} (${type})`, 'info');
  }, [addLog]);

  const updateNode = useCallback((id: string, data: Partial<IntelNode>) => {
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n));
  }, []);

  const setNodeStatus = (ids: string[], status: IntelNode['status']) => {
    setNodes(prev => prev.map(n => ids.includes(n.id) ? { ...n, status } : n));
  };

  const handleConnect = useCallback((sourceId: string, targetId: string) => {
    const sourceNode = nodesRef.current.find(n => n.id === sourceId);
    const targetNode = nodesRef.current.find(n => n.id === targetId);
    setConnections(prev => [...prev, { id: uuid(), sourceId, targetId }]);
    if (sourceNode && targetNode) {
      addLog(`创建连接: [${sourceNode.title}] → [${targetNode.title}]`, 'info');
    } else {
      addLog('创建了新的手动连接', 'info');
    }
  }, [addLog]);

  const handleMoveNodes = useCallback((delta: Position) => {
    setNodes(prev => prev.map(node => {
      if (selectedNodeIds.includes(node.id)) {
        return { ...node, position: { x: node.position.x + delta.x, y: node.position.y + delta.y } };
      }
      return node;
    }));
  }, [selectedNodeIds]);

  const handleSelectionChange = useCallback((ids: string[]) => {
      setSelectedNodeIds(ids);
      if (ids.length === 1) {
          const node = nodesRef.current.find(n => n.id === ids[0]);
          if(node) addLog(`选中实体: ${node.title} (${node.type})`, 'info');
      }
  }, [addLog]);

  const handleUpdateAiConfig = useCallback((config: AIModelConfig) => {
      setAiConfig(config);
      if (config.modelId !== aiConfig.modelId) addLog(`切换 AI 模型至: ${config.modelId}`, 'warning');
      if (config.enableThinking !== aiConfig.enableThinking) addLog(`AI 思考模式: ${config.enableThinking ? 'ENABLED' : 'DISABLED'}`, 'warning');
      if (config.temperature !== aiConfig.temperature) addLog(`AI 温度调整: ${config.temperature}`, 'info');
  }, [aiConfig, addLog]);

  // --- Data Import Logic ---
  const handleImportData = async (fileContent: string, type: 'json' | 'text') => {
    try {
      if (type === 'json') {
         const importedData = JSON.parse(fileContent);
         if (Array.isArray(importedData.nodes)) {
            const enhancedNodes = importedData.nodes.map((n: any) => ({
                ...n,
                id: uuid(),
                data: { ...ENTITY_DEFAULT_FIELDS[n.type as NodeType], ...n.data } 
            }));
            setNodes(prev => [...prev, ...enhancedNodes]);
            addLog(`成功导入 ${enhancedNodes.length} 个节点`, 'success');
         } else {
             addLog('JSON 格式错误: 缺少 nodes 数组', 'error');
         }
      } else {
         addNode({ x: 200, y: 200 }, NodeType.DOCUMENT, fileContent, 0);
         addLog('文本已导入为 [DOCUMENT] 节点', 'success');
      }
    } catch (e) {
      addLog(`导入失败: ${e}`, 'error');
    }
  };

  // --- Analysis Engine ---

  const runToolOnNode = async (tool: Tool, node: IntelNode): Promise<IntelNode[]> => {
     setNodeStatus([node.id], 'PROCESSING');
     addLog(`🔄 执行工具 [${tool.name}] → 目标: ${node.title} (${node.type})`, 'info');

     try {
        // Pass aiConfig to the service execution
        const result = await executeTool(tool, node, nodesRef.current, aiConfig);

        // Log property updates
        if (result.updateData) {
            const updatedKeys = Object.keys(result.updateData);
            updateNode(node.id, {
                data: { ...node.data, ...result.updateData },
                status: 'PROCESSED'
            });
            addLog(`✓ [${node.title}] 属性已更新: ${updatedKeys.join(', ')}`, 'success');
        } else {
            setNodeStatus([node.id], 'PROCESSED');
        }

        if (result.newNodes.length > 0) {
            const enhancedNewNodes = result.newNodes.map((n, idx) => ({
                ...n,
                depth: node.depth + 1,
                position: {
                    x: node.position.x + 350,
                    y: node.position.y + (idx * 150)
                }
            }));

            setNodes(prev => [...prev, ...enhancedNewNodes]);
            setConnections(prev => [...prev, ...result.newConnections]);

            // Log each new discovered entity
            const entityNames = enhancedNewNodes.map(n => `${n.title} (${n.type})`).join(', ');
            addLog(`✓ [${tool.name}] 成功: 发现 ${result.newNodes.length} 个新实体 → ${entityNames}`, 'success');

            return enhancedNewNodes;
        } else {
            addLog(`✓ [${tool.name}] 执行完成: 分析了 [${node.title}]，未发现新实体`, 'success');
            return [];
        }
     } catch (e: any) {
        const errorMsg = e?.message || String(e);
        addLog(`✗ [${tool.name}] 执行失败 @ [${node.title}]: ${errorMsg}`, 'error');
        setNodeStatus([node.id], 'ERROR');
        console.error(`Tool execution error [${tool.name}]:`, e);
        return [];
     }
  };

  const handleRunTool = async (tool: Tool, targetNodes: IntelNode[]) => {
    setIsProcessing(true);
    setContextMenu(null);

    if (targetNodes.length > 1) {
      addLog(`📦 批量执行工具 [${tool.name}] → ${targetNodes.length} 个目标节点`, 'info');
    }

    for (const node of targetNodes) {
        await runToolOnNode(tool, node);
    }

    if (targetNodes.length > 1) {
      addLog(`✓ 批量执行完成 [${tool.name}]`, 'success');
    }

    // 不再自动重排所有节点，新节点位置已在 runToolOnNode 中计算（相对于源节点往右排列）
    setIsProcessing(false);
  };

  const handleSaveTool = async (newTool: Tool) => {
      setTools(prev => [...prev, newTool]);
      // 自动保存自定义工具到 IndexedDB
      try {
        await saveCustomTool(newTool);
        addLog(`新自定义插件已保存: ${newTool.name}`, 'success');
      } catch (error) {
        addLog(`保存插件失败: ${error}`, 'error');
      }
  };

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
     const node = nodes.find(n => n.id === nodeId);
     if (node) {
         setContextMenu({
             x: e.clientX,
             y: e.clientY,
             nodeId: nodeId
         });
     }
  }, [nodes]);

  // Trajectory Analysis Handler
  const handleAnalyzeTrajectory = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setTrajectoryModal({ isOpen: true, nodeId });
      addLog(`📍 分析时空轨迹: ${node.title}`, 'info');
    }
  }, [nodes, addLog]);

  // Graph Analysis Handler (Community Detection & Key Nodes + Investigation Completeness)
  const handleAnalyzeGraph = useCallback(() => {
    if (nodes.length === 0) {
      addLog('⚠️ 图谱为空，无法进行网络分析', 'warning');
      return;
    }

    addLog('🔍 正在进行网络分析 (社区发现 + 核心人物 + 完整性分析 + 数据质量)...', 'info');

    // 1. 网络结构分析
    const graphResult = analyzeGraph(nodes, connections);
    setGraphAnalysis(graphResult);

    // 2. 调查完整性分析
    const investigationResult = analyzeInvestigation(nodes, connections);
    setInvestigationAnalysis(investigationResult);

    // 3. 数据质量分析
    const qualityResult = analyzeDataQuality(nodes, connections);
    setDataQualityReport(qualityResult);

    // Log analysis results
    const keyNodeNames = graphResult.keyNodes
      .map(id => nodes.find(n => n.id === id)?.title || id)
      .slice(0, 5);

    addLog(
      `✓ 网络分析完成: ${graphResult.communityCount} 社区, ${graphResult.keyNodes.length} 核心节点, 完整性 ${(investigationResult.averageCompleteness * 100).toFixed(0)}%, 质量 ${(qualityResult.summary.averagePressure * 100).toFixed(0)}%`,
      'success'
    );

    if (graphResult.keyNodes.length > 0) {
      addLog(`🌟 核心人物: ${keyNodeNames.join(', ')}${graphResult.keyNodes.length > 5 ? '...' : ''}`, 'info');
    }

    if (investigationResult.prioritizedSuggestions.length > 0 || qualityResult.defectiveNodes.length > 0) {
      const issueCount = investigationResult.prioritizedSuggestions.length + qualityResult.defectiveNodes.length;
      addLog(`📋 发现 ${issueCount} 个需要关注的节点`, 'info');
    }

    // 打开分析面板
    setAnalysisModalOpen(true);
  }, [nodes, connections, addLog]);

  // Clear analysis when nodes are empty
  useEffect(() => {
    if (nodes.length === 0) {
      if (graphAnalysis) setGraphAnalysis(null);
      if (investigationAnalysis) setInvestigationAnalysis(null);
      if (dataQualityReport) setDataQualityReport(null);
    }
  }, [nodes.length, graphAnalysis, investigationAnalysis, dataQualityReport]);

  const handleSearch = (term: string) => {
      setSearchTerm(term);
      // Optional: Log search if needed, but avoiding spam
  };

  return (
    <div className="flex h-screen w-screen bg-[#0B0F19] text-slate-200 font-sans overflow-hidden">
       {/* Header Overlay */}
       <div className="absolute top-4 left-4 z-30 flex items-center gap-4">
          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 px-4 py-2 rounded shadow-lg flex flex-col">
             <span className="font-bold text-slate-100 tracking-[0.2em] text-sm">河图 情报分析系统</span>
             <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <span className="text-[9px] text-slate-400 font-mono">INTELLIGENCE WORKSTATION</span>
             </div>
          </div>

          {/* 6.0 项目/画布指示器 */}
          <div className="relative" data-dropdown>
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:border-blue-500 rounded shadow-lg h-[50px] px-4 flex items-center gap-2 transition-all hover:bg-blue-900/20 group"
            >
              <Folder className="w-4 h-4 text-blue-400" />
              <div className="flex flex-col items-start">
                <span className="text-[9px] text-slate-500">{projects.find(p => p.id === currentProjectId)?.name || '项目'}</span>
                <span className="text-xs text-slate-200">{canvases.find(c => c.id === currentCanvasId)?.name || '画布'}</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showWorkspaceDropdown && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* 项目选择 */}
                <div className="p-2 border-b border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 px-2">项目</div>
                  <div className="max-h-32 overflow-y-auto space-y-0.5">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => { handleSwitchProject(p.id); setShowWorkspaceDropdown(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs transition-colors ${
                          p.id === currentProjectId ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <input
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      placeholder="新项目..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => {
                        if (newProjectName.trim()) {
                          handleCreateProject(newProjectName.trim());
                          setNewProjectName('');
                        }
                      }}
                      disabled={!newProjectName.trim()}
                      className="p-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* 画布选择 */}
                <div className="p-2">
                  <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 px-2">画布</div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {canvases.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { handleSwitchCanvas(c.id); setShowWorkspaceDropdown(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                          c.id === currentCanvasId ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          {c.name}
                          {c.isDefault && <span className="text-[8px] opacity-60">(默认)</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-1">
                    <input
                      value={newCanvasName}
                      onChange={(e) => setNewCanvasName(e.target.value)}
                      placeholder="新画布..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 placeholder:text-slate-600 outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      onClick={() => {
                        if (newCanvasName.trim()) {
                          handleCreateCanvas(newCanvasName.trim());
                          setNewCanvasName('');
                        }
                      }}
                      disabled={!newCanvasName.trim()}
                      className="p-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900/90 backdrop-blur border border-slate-700 rounded shadow-lg flex items-center h-[50px] w-[300px] px-3 focus-within:border-cyan-500 transition-colors">
              <Search className="w-4 h-4 text-slate-500 mr-2" />
              <input
                  className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-600 w-full"
                  placeholder="全局指令 / 搜索实体..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  onBlur={() => { if(searchTerm) addLog(`执行全局搜索: "${searchTerm}"`, 'info') }}
              />
          </div>

          <button
              onClick={performAutoLayout}
              title="自动布局 / Auto Layout"
              className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:border-cyan-500 rounded shadow-lg h-[50px] w-[50px] flex items-center justify-center transition-all hover:bg-cyan-900/20 group"
          >
              <Layout className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
          </button>

          <button
              onClick={() => {
                if (nodes.length === 0) return;
                if (window.confirm(`确定要清空全部 ${nodes.length} 个节点吗？此操作不可撤销。`)) {
                  clearAllNodes();
                }
              }}
              title="清空全部节点 / Clear All"
              className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:border-red-500 rounded shadow-lg h-[50px] w-[50px] flex items-center justify-center transition-all hover:bg-red-900/20 group"
          >
              <Trash2 className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
          </button>

          <button
              onClick={handleGenerateBriefing}
              disabled={isGeneratingReport || nodes.length === 0}
              title={selectedNodeIds.length > 0 ? `生成简报 (${selectedNodeIds.length} 个选中节点)` : "生成简报 (全部节点)"}
              className={`bg-slate-900/90 backdrop-blur border rounded shadow-lg h-[50px] px-4 flex items-center justify-center gap-2 transition-all group ${
                isGeneratingReport
                  ? 'border-amber-500 bg-amber-900/20'
                  : 'border-slate-700 hover:border-amber-500 hover:bg-amber-900/20'
              } ${nodes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
              {isGeneratingReport
                ? <RefreshCw className="w-4 h-4 text-amber-400 animate-spin" />
                : <FileText className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition-colors" />
              }
              <span className={`text-xs transition-colors ${isGeneratingReport ? 'text-amber-400' : 'text-slate-400 group-hover:text-amber-400'}`}>
                {isGeneratingReport ? '生成中...' : (selectedNodeIds.length > 0 ? `简报(${selectedNodeIds.length})` : '简报')}
              </span>
          </button>

          <button
              onClick={handleAnalyzeGraph}
              title="分析网络 / Analyze Network (社区发现 & 核心人物)"
              className={`bg-slate-900/90 backdrop-blur border rounded shadow-lg h-[50px] px-4 flex items-center justify-center gap-2 transition-all group ${
                graphAnalysis
                  ? 'border-purple-500 bg-purple-900/20'
                  : 'border-slate-700 hover:border-purple-500 hover:bg-purple-900/20'
              }`}
          >
              <Network className={`w-4 h-4 transition-colors ${graphAnalysis ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`} />
              <span className={`text-xs transition-colors ${graphAnalysis ? 'text-purple-400' : 'text-slate-400 group-hover:text-purple-400'}`}>
                {graphAnalysis ? `${graphAnalysis.communityCount} 社区` : '分析网络'}
              </span>
          </button>

          <div className="flex items-center gap-1">
            <button
                onClick={handleSaveGraph}
                title="保存图谱 / Save Graph"
                className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:border-cyan-500 rounded shadow-lg h-[50px] px-4 flex items-center justify-center gap-2 transition-all hover:bg-cyan-900/20 group relative"
            >
                <Save className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-cyan-400">保存</span>
                {hasUnsavedChanges && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-pulse" title="有未保存的更改"></span>
                )}
            </button>
            <button
                onClick={handleLoadGraph}
                title="加载图谱 / Load Graph"
                className="bg-slate-900/90 backdrop-blur border border-slate-700 hover:border-slate-500 rounded shadow-lg h-[50px] px-4 flex items-center justify-center gap-2 transition-all hover:bg-slate-800/50 group"
            >
                <FolderOpen className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors" />
                <span className="text-xs text-slate-400 group-hover:text-slate-300">加载</span>
            </button>
          </div>

          {/* 6.0 快照按钮 */}
          <div className="relative" data-dropdown>
            <button
              onClick={() => setShowSnapshotDropdown(!showSnapshotDropdown)}
              title="快照 / Snapshots"
              className={`bg-slate-900/90 backdrop-blur border rounded shadow-lg h-[50px] px-4 flex items-center justify-center gap-2 transition-all group ${
                snapshots.length > 0
                  ? 'border-emerald-700 hover:border-emerald-500 hover:bg-emerald-900/20'
                  : 'border-slate-700 hover:border-emerald-500 hover:bg-emerald-900/20'
              }`}
            >
              <Camera className={`w-4 h-4 transition-colors ${snapshots.length > 0 ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`} />
              <span className={`text-xs transition-colors ${snapshots.length > 0 ? 'text-emerald-400' : 'text-slate-400 group-hover:text-emerald-400'}`}>
                {snapshots.length > 0 ? `快照(${snapshots.length})` : '快照'}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${showSnapshotDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSnapshotDropdown && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                {/* 创建快照 */}
                <div className="p-3 border-b border-slate-800">
                  <div className="text-[9px] text-slate-500 uppercase font-bold mb-2">创建快照</div>
                  <div className="flex gap-2">
                    <input
                      id="snapshot-name-input"
                      placeholder={`快照 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-emerald-500"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = e.target as HTMLInputElement;
                          const name = input.value.trim() || `快照 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                          handleCreateSnapshot(name);
                          input.value = '';
                          setShowSnapshotDropdown(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.getElementById('snapshot-name-input') as HTMLInputElement;
                        const name = input?.value.trim() || `快照 ${new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
                        handleCreateSnapshot(name);
                        if (input) input.value = '';
                        setShowSnapshotDropdown(false);
                      }}
                      disabled={nodes.length === 0}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded text-xs flex items-center gap-1 transition-colors"
                    >
                      <Camera className="w-3 h-3" />
                      创建
                    </button>
                  </div>
                  {nodes.length === 0 && (
                    <div className="text-[10px] text-slate-500 mt-1">画布为空，无法创建快照</div>
                  )}
                </div>

                {/* 快照列表 */}
                <div className="p-2">
                  <div className="text-[9px] text-slate-500 uppercase font-bold mb-1 px-1 flex items-center justify-between">
                    <span>历史快照</span>
                    <span className="text-slate-600">最多保留 20 个</span>
                  </div>
                  {snapshots.length === 0 ? (
                    <div className="text-xs text-slate-600 text-center py-4">暂无快照</div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {snapshots.map(s => (
                        <div
                          key={s.id}
                          className="group flex items-center justify-between px-2 py-1.5 rounded hover:bg-slate-800 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-slate-300 truncate">{s.name}</div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-2">
                              <span>{new Date(s.createdAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="text-slate-600">|</span>
                              <span>{s.nodeCount} 节点</span>
                              {s.trigger !== 'manual' && (
                                <span className="text-emerald-500/60">({s.trigger})</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                if (window.confirm(`确定要恢复到快照 "${s.name}" 吗？当前画布内容将被替换。`)) {
                                  handleRestoreSnapshot(s.id);
                                  setShowSnapshotDropdown(false);
                                }
                              }}
                              className="p-1 hover:bg-emerald-600 rounded text-slate-400 hover:text-white transition-colors"
                              title="恢复此快照"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`确定要删除快照 "${s.name}" 吗？`)) {
                                  handleDeleteSnapshot(s.id);
                                }
                              }}
                              className="p-1 hover:bg-red-600 rounded text-slate-400 hover:text-white transition-colors"
                              title="删除此快照"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
       </div>

       {/* Canvas */}
       <div className="flex-1 relative">
          <Canvas
            nodes={nodes}
            connections={connections}
            selectedNodeIds={selectedNodeIds}
            onSelectionChange={handleSelectionChange}
            onNodesMove={handleMoveNodes}
            onConnect={handleConnect}
            onAddNode={(pos, type) => addNode(pos, type, '手动创建', 0)}
            onNodeContextMenu={handleNodeContextMenu}
            searchTerm={searchTerm}
            graphAnalysis={graphAnalysis}
          />
          
          {contextMenu && (() => {
              const node = nodes.find(n => n.id === contextMenu.nodeId);
              if (!node) return null;
              
              const availableTools = tools.filter(t => 
                t.targetTypes.length === 0 || t.targetTypes.includes(node.type)
              );

              return (
                  <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    node={node}
                    availableTools={availableTools}
                    onRunTool={(tool) => handleRunTool(tool, [node])}
                    onDelete={() => deleteNodes([node.id])}
                    onClose={() => setContextMenu(null)}
                    onAnalyzeTrajectory={() => handleAnalyzeTrajectory(node.id)}
                    onViewDetail={() => setDetailPanel({ isOpen: true, nodeId: node.id })}
                  />
              )
          })()}
       </div>

       {/* Right Sidebar */}
       <ControlPanel
         selectedNodes={nodes.filter(n => selectedNodeIds.includes(n.id))}
         allNodes={nodes}
         allTools={tools}
         logs={logs}
         onRunTool={handleRunTool}
         onSaveTool={handleSaveTool}
         onUpdateNode={updateNode}
         onAddNode={(type) => addNode({x: 100, y: 100 + (nodes.length * 100)}, type, '新实体', 0)}
         onDeleteNode={deleteNodes}
         onImportData={handleImportData}
         onSelectNode={(id) => handleSelectionChange([id])}
         isProcessing={isProcessing}
         aiConfig={aiConfig}
         onUpdateAiConfig={handleUpdateAiConfig}
         onLog={addLog}
       />

       {/* Briefing Report Modal */}
       {showReportModal && (
         <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-8">
           <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
             {/* Header */}
             <div className="flex justify-between items-center p-4 border-b border-slate-700">
               <span className="font-bold text-slate-200 flex items-center gap-2">
                 <FileText className="w-5 h-5 text-amber-400" />
                 情报简报 (Intelligence Briefing)
               </span>
               <button
                 onClick={() => setShowReportModal(false)}
                 className="text-slate-400 hover:text-white transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Content */}
             <div className="flex-1 p-6 overflow-y-auto">
               {isGeneratingReport ? (
                 <div className="flex flex-col items-center justify-center h-64 gap-4">
                   <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                   <span className="text-slate-400">AI 正在撰写情报简报...</span>
                 </div>
               ) : (
                 <div className="font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                   {reportText}
                 </div>
               )}
             </div>

             {/* Footer */}
             {!isGeneratingReport && reportText && (
               <div className="p-4 border-t border-slate-700 flex justify-end gap-3">
                 <button
                   className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm flex items-center gap-2 transition-colors"
                   onClick={() => {
                     navigator.clipboard.writeText(reportText);
                     addLog('📋 简报已复制到剪贴板', 'success');
                   }}
                 >
                   <FileText className="w-4 h-4" />
                   复制内容
                 </button>
                 <button
                   className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded text-sm flex items-center gap-2 transition-colors shadow-lg"
                   onClick={() => {
                     const blob = new Blob([reportText], { type: 'text/markdown' });
                     const url = URL.createObjectURL(blob);
                     const a = document.createElement('a');
                     a.href = url;
                     a.download = `情报简报_${new Date().toISOString().split('T')[0]}.md`;
                     a.click();
                     URL.revokeObjectURL(url);
                     addLog('📝 Markdown 简报已下载', 'success');
                   }}
                 >
                   <FileOutput className="w-4 h-4" />
                   下载 .MD
                 </button>
               </div>
             )}
           </div>
         </div>
       )}

       {/* Trajectory Analysis Modal */}
       {trajectoryModal.isOpen && trajectoryModal.nodeId && (() => {
         const targetNode = nodes.find(n => n.id === trajectoryModal.nodeId);
         if (!targetNode) return null;
         const trajectoryPoints = extractTrajectoryPoints(targetNode, nodes, connections);
         return (
           <TrajectoryModal
             isOpen={trajectoryModal.isOpen}
             onClose={() => setTrajectoryModal({ isOpen: false, nodeId: null })}
             targetNode={targetNode}
             trajectoryPoints={trajectoryPoints}
           />
         );
       })()}

       {/* Node Detail Panel */}
       <NodeDetailPanel
         isOpen={detailPanel.isOpen}
         onClose={() => setDetailPanel({ isOpen: false, nodeId: null })}
         node={detailPanel.nodeId ? nodes.find(n => n.id === detailPanel.nodeId) || null : null}
       />

       {/* Network Analysis Panel */}
       <AnalysisPanel
         isOpen={analysisModalOpen}
         onClose={() => setAnalysisModalOpen(false)}
         nodes={nodes}
         graphAnalysis={graphAnalysis}
         investigationAnalysis={investigationAnalysis}
         dataQualityReport={dataQualityReport}
         onNodeSelect={(nodeId) => {
           handleSelectionChange([nodeId]);
           // 滚动到节点位置（可选功能，暂时只选中）
         }}
       />
    </div>
  );
};

export default App;
