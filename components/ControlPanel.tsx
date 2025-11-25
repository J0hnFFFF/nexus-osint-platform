
import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Play, Save, Settings, Database,
  Terminal, Layers, Trash2, Edit3, Upload,
  Box, Cpu, Shield, Key, Hash, FileJson, PlusCircle, X, Zap,
  User, Building2, Car, MapPin, Server, Globe, Network, Image as ImageIcon, Video, FileText, MessageSquare, Clock, RefreshCw,
  Paperclip, Eye, Download, Mic, Music, Bug, ShieldAlert, Radio, DatabaseZap, Archive, Globe2, Bot, Braces, BrainCircuit, Sliders,
  Ghost, Lock, CreditCard, Gavel, Cloud, Wifi, Smartphone, Fingerprint, Users,
  Satellite, Plane, BedDouble, Ship, IdCard, Ticket, Tent, Bomb, Fish, Router, Radar, Landmark, Activity,
  Calendar, FileOutput, ChevronRight, AlertTriangle, CheckCircle2, AlertCircle, Info,
  GitBranch, Folder, UserCog, Award, Target, Microscope, FileCheck, Gauge, Camera, QrCode, Barcode,
  Package, FileSpreadsheet, Monitor, Scroll, Briefcase, GraduationCap, Heart, Home, Wrench, Podcast, Cast
} from 'lucide-react';
import { NodeType, IntelNode, Tool, LogEntry, ToolCategory, AIModelConfig } from '../types';
import { ENTITY_DEFAULT_FIELDS, AI_MODELS } from '../constants';
import { generateFinalReport } from '../services/geminiService';

interface ControlPanelProps {
  selectedNodes: IntelNode[];
  allNodes: IntelNode[];
  allTools: Tool[];
  logs: LogEntry[];
  onRunTool: (tool: Tool, nodes: IntelNode[]) => void;
  onSaveTool: (tool: Tool) => void;
  onUpdateNode: (nodeId: string, data: Partial<IntelNode>) => void;
  onAddNode: (type: NodeType) => void;
  onDeleteNode: (nodeIds: string[]) => void;
  onImportData: (content: string, type: 'json' | 'text') => void;
  onSelectNode: (nodeId: string) => void;
  isProcessing: boolean;
  aiConfig: AIModelConfig;
  onUpdateAiConfig: (config: AIModelConfig) => void;
  onLog: (message: string, status?: LogEntry['status']) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  selectedNodes,
  allNodes,
  allTools,
  logs,
  onRunTool,
  onSaveTool,
  onUpdateNode,
  onAddNode,
  onDeleteNode,
  onImportData,
  onSelectNode,
  isProcessing,
  aiConfig,
  onUpdateAiConfig,
  onLog
}) => {
  const [activeTab, setActiveTab] = useState<'inspector' | 'plugins' | 'timeline' | 'logs' | 'settings'>('plugins');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reportText, setReportText] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // API Key Management
  const [apiKey, setApiKey] = useState<string>('');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  
  // Plugin Creator State
  const [isCreatingTool, setIsCreatingTool] = useState(false);
  const [mockJsonText, setMockJsonText] = useState('{}');
  const [newTool, setNewTool] = useState<Partial<Tool>>({
    name: '新工具',
    category: ToolCategory.AGENT,
    version: '1.0.0',
    author: 'User',
    description: '描述插件功能...',
    promptTemplate: '分析 {{title}}...',
    targetTypes: [],
    autoExpand: true,
    apiConfig: { endpoint: 'https://api.example.com/v1/query', method: 'GET', mockResponse: {} },
    mcpConfig: { functionName: 'googleSearch', parameters: {} }
  });

  useEffect(() => {
    if (selectedNodes.length > 0) {
      setActiveTab('inspector');
    }
  }, [selectedNodes.length]);

  // Check for API Key on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        try {
          const key = await (window as any).electronAPI.getApiKey();
          if (key) {
            setApiKey(key);
            setHasApiKey(true);
            onLog('✅ API Key 已加载', 'success');
          } else {
            setHasApiKey(false);
            onLog('⚠️ 未配置 API Key', 'warning');
          }
        } catch (error) {
          console.error('Failed to get API key:', error);
        }
      }
    };
    checkApiKey();
  }, [onLog]);

  const handleTabChange = (tab: typeof activeTab) => {
      setActiveTab(tab);
      // Optional: Log tab switching if needed, but might be too noisy
      // onLog(`切换视图面板: ${tab.toUpperCase()}`, 'info');
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      onLog('❌ API Key 不能为空', 'error');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.setApiKey(apiKeyInput.trim());
        setApiKey(apiKeyInput.trim());
        setHasApiKey(true);
        setApiKeyInput('');
        onLog('✅ API Key 已保存', 'success');
      } catch (error) {
        onLog('❌ 保存 API Key 失败', 'error');
        console.error('Failed to save API key:', error);
      }
    } else {
      onLog('⚠️ Electron 环境不可用', 'warning');
    }
  };

  const handleDeleteApiKey = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      try {
        await (window as any).electronAPI.deleteApiKey();
        setApiKey('');
        setHasApiKey(false);
        setApiKeyInput('');
        onLog('🗑️ API Key 已删除', 'warning');
      } catch (error) {
        onLog('❌ 删除 API Key 失败', 'error');
        console.error('Failed to delete API key:', error);
      }
    }
  };

  const handleSaveTool = () => {
    if (!newTool.name) return;
    
    const toolToSave: Tool = {
      id: Math.random().toString(36).substr(2, 9),
      name: newTool.name!,
      category: newTool.category || ToolCategory.AGENT,
      version: newTool.version || '1.0.0',
      author: newTool.author || 'Local',
      description: newTool.description || '',
      targetTypes: newTool.targetTypes || [],
      autoExpand: newTool.autoExpand || false,
      isCustom: true,
      isSimulated: newTool.category === ToolCategory.API
    } as Tool;

     if (newTool.category === ToolCategory.AGENT) {
        toolToSave.promptTemplate = newTool.promptTemplate || "";
    } else if (newTool.category === ToolCategory.API) {
        toolToSave.promptTemplate = newTool.promptTemplate || "解析 API 返回的 JSON 数据。";
        try {
            const parsedMock = JSON.parse(mockJsonText);
            toolToSave.apiConfig = {
                endpoint: newTool.apiConfig?.endpoint || "",
                method: newTool.apiConfig?.method || "GET",
                mockResponse: parsedMock
            };
        } catch (e) {
            onLog("自定义工具 JSON 格式错误", 'error');
            return;
        }
    } else if (newTool.category === ToolCategory.MCP) {
        toolToSave.promptTemplate = newTool.promptTemplate || "调用工具并整合结果。";
        toolToSave.mcpConfig = {
            functionName: newTool.mcpConfig?.functionName || "unknown"
        };
    }

    onSaveTool(toolToSave);
    onLog(`创建新工具: ${toolToSave.name}`, 'success');
    setIsCreatingTool(false);
  };

  const handleGenerateReport = async () => {
      setIsGeneratingReport(true);
      onLog("正在通过 AI 生成情报简报...", 'info');
      try {
          const report = await generateFinalReport(allNodes, "Senior Intelligence Analyst");
          setReportText(report);
          onLog("情报简报生成成功", 'success');
      } catch (e) {
          setReportText("生成报告失败，请重试。");
          onLog("情报简报生成失败", 'error');
      }
      setIsGeneratingReport(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      onLog(`开始导入文件: ${file.name}`, 'info');
      const reader = new FileReader();
      reader.onload = (event) => {
          const content = event.target?.result as string;
          if (file.name.endsWith('.json')) {
              onImportData(content, 'json');
          } else {
              onImportData(content, 'text');
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 独立的属性输入组件，使用本地状态管理以避免焦点丢失
  const PropertyInput = ({ propKey, initialValue, nodeId, nodeTitle, onUpdate, onLog: logFn }: {
      propKey: string;
      initialValue: string;
      nodeId: string;
      nodeTitle: string;
      onUpdate: (key: string, value: string) => void;
      onLog: (msg: string, status: LogEntry['status']) => void;
  }) => {
      const [localValue, setLocalValue] = useState(initialValue);
      const isEmpty = localValue.trim() === '';

      // 当外部值变化时同步（例如从其他地方更新了属性）
      useEffect(() => {
          setLocalValue(initialValue);
      }, [initialValue]);

      const handleBlur = () => {
          if (localValue !== initialValue) {
              onUpdate(propKey, localValue);
              if (localValue) {
                  logFn(`更新属性 [${nodeTitle}]: ${propKey} = ${localValue.substring(0, 20)}${localValue.length > 20 ? '...' : ''}`, 'info');
              }
          }
      };

      return (
          <input
              className={`flex-1 bg-transparent px-3 py-2 font-mono outline-none w-full ${isEmpty ? 'text-slate-600 italic' : 'text-cyan-400'}`}
              value={localValue}
              placeholder="未填写"
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={handleBlur}
          />
      );
  };

  const PropertyGrid = ({ node }: { node: IntelNode }) => {
      const [newKey, setNewKey] = useState('');
      const [newValue, setNewValue] = useState('');
      const propertyFileInputRef = useRef<HTMLInputElement>(null);
      const [uploadKey, setUploadKey] = useState<string | null>(null);

      const handleUpdate = (key: string, value: string) => {
          const newData = { ...node.data, [key]: value };
          onUpdateNode(node.id, { data: newData });
      };

      const handleDelete = (key: string) => {
          const newData = { ...node.data };
          delete newData[key];
          onUpdateNode(node.id, { data: newData });
          onLog(`删除属性 [${node.title}]: ${key}`, 'warning');
      };

      const handleAdd = () => {
          if(!newKey) return;
          handleUpdate(newKey, newValue);
          onLog(`添加属性 [${node.title}]: ${newKey} = ${newValue}`, 'info');
          setNewKey('');
          setNewValue('');
      };

      const applyTemplate = () => {
          const defaultData = ENTITY_DEFAULT_FIELDS[node.type] || {};
          const newData = { ...defaultData, ...node.data };
          onUpdateNode(node.id, { data: newData });
          onLog(`应用标准属性模版: ${node.type}`, 'info');
      };

      const triggerUpload = (key: string) => {
          setUploadKey(key);
          propertyFileInputRef.current?.click();
      }

      const handlePropertyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const file = e.target.files?.[0];
          if (!file || !uploadKey) return;

          const reader = new FileReader();
          reader.onload = (event) => {
              const base64 = event.target?.result as string;
              handleUpdate(uploadKey, base64);
              onLog(`上传附件至属性 [${node.title}]: ${uploadKey}`, 'success');
          };
          reader.readAsDataURL(file);
          if (propertyFileInputRef.current) propertyFileInputRef.current.value = '';
      }

      return (
          <div className="bg-slate-950 border border-slate-800 rounded overflow-hidden">
              <input
                  type="file"
                  ref={propertyFileInputRef}
                  className="hidden"
                  onChange={handlePropertyFileChange}
              />

              <div className="px-3 py-2 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">属性 (Properties)</span>
                      <button onClick={applyTemplate} className="p-1 text-slate-600 hover:text-cyan-400" title="应用默认模版">
                          <RefreshCw className="w-3 h-3" />
                      </button>
                  </div>
                  <FileJson className="w-3 h-3 text-slate-600" />
              </div>
              <div className="p-0 divide-y divide-slate-800/50">
                  {Object.entries(node.data || {}).map(([k, v]) => {
                      const strVal = String(v);
                      const isEmpty = strVal.trim() === '';
                      const isFile = strVal.startsWith('data:');

                      return (
                          <div key={k} className="flex flex-col group text-xs relative border-b border-slate-800/30 last:border-0">
                              <div className="flex items-center">
                                  <div className={`w-1/3 px-3 py-2 font-mono bg-slate-900/30 truncate border-r border-slate-800/30 ${isEmpty ? 'text-slate-600' : 'text-slate-400'}`} title={k}>
                                      {k}
                                  </div>
                                  <div className="flex-1 flex items-center min-w-0 bg-transparent hover:bg-slate-900/30 transition-colors relative min-h-[34px]">
                                      {isFile ? (
                                          <div className="flex-1 px-3 py-1.5 flex items-center gap-2 overflow-hidden">
                                              <Paperclip className="w-3 h-3 text-cyan-500" />
                                              <span className="text-[10px] text-cyan-500 font-mono truncate flex-1">
                                                  文件资源 ({(strVal.length / 1024).toFixed(1)} KB)
                                              </span>
                                          </div>
                                      ) : (
                                        <PropertyInput
                                            propKey={k}
                                            initialValue={strVal}
                                            nodeId={node.id}
                                            nodeTitle={node.title}
                                            onUpdate={handleUpdate}
                                            onLog={onLog}
                                        />
                                      )}
                                      <div className="flex items-center gap-1 pr-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bg-slate-900/80 h-full z-10">
                                         <button
                                              onClick={() => triggerUpload(k)}
                                              className="p-1.5 text-slate-500 hover:text-cyan-400"
                                          >
                                              <Paperclip className="w-3 h-3" />
                                          </button>
                                          <button
                                              onClick={() => handleDelete(k)}
                                              className="p-1.5 text-slate-500 hover:text-red-400"
                                          >
                                              <X className="w-3 h-3" />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
                  <div className="flex items-center border-t border-slate-800/50">
                      <input
                          className="w-1/3 px-3 py-2 bg-slate-950 text-xs text-slate-400 placeholder:text-slate-700 outline-none font-mono"
                          placeholder="Key"
                          value={newKey}
                          onChange={e => setNewKey(e.target.value)}
                      />
                      <input
                          className="flex-1 px-3 py-2 bg-slate-950 text-xs text-slate-400 placeholder:text-slate-700 outline-none font-mono border-l border-slate-800"
                          placeholder="Value"
                          value={newValue}
                          onChange={e => setNewValue(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                      />
                      <button onClick={handleAdd} className="px-2 text-cyan-600 hover:text-cyan-400">
                          <Plus className="w-3 h-3" />
                      </button>
                  </div>
              </div>
          </div>
      )
  }

  const renderInspector = () => {
    if (selectedNodes.length === 0) return null;
    if (selectedNodes.length > 1) {
       return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
            <div className="text-slate-500 text-xs italic">已选择 {selectedNodes.length} 个实体</div>
            <button 
                onClick={() => onDeleteNode(selectedNodes.map(n => n.id))}
                className="px-4 py-2 bg-red-900/20 border border-red-900/50 hover:bg-red-900/40 text-red-400 rounded text-xs flex items-center gap-2 transition-all"
            >
                <Trash2 className="w-4 h-4" /> 批量删除
            </button>
        </div>
       );
    }

    const node = selectedNodes[0];
    const boundPlugins = allTools.filter(t => t.targetTypes.includes(node.type) || t.targetTypes.length === 0);

    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 space-y-3">
          <div className="flex items-center justify-between gap-2">
             <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="p-1.5 bg-cyan-500/10 rounded border border-cyan-500/30 text-cyan-400 shrink-0">
                    <Box className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-cyan-500 font-mono uppercase tracking-wider">实体 (Entity)</div>
                    <input 
                        className="w-full bg-transparent text-sm font-bold text-white outline-none border-b border-transparent focus:border-slate-600"
                        value={node.title}
                        onChange={(e) => onUpdateNode(node.id, { title: e.target.value })}
                        onBlur={() => onLog(`重命名实体: ${node.title}`, 'info')}
                    />
                </div>
             </div>
             <button 
                onClick={() => onDeleteNode([node.id])}
                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded transition-colors"
             >
                <Trash2 className="w-4 h-4" />
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] uppercase font-bold text-slate-500">摘要 (Summary)</label>
              <textarea
                className="w-full h-20 bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 font-mono resize-none outline-none focus:border-cyan-900"
                value={node.content}
                onChange={(e) => onUpdateNode(node.id, { content: e.target.value })}
                onBlur={() => onLog(`更新实体摘要: ${node.title}`, 'info')}
              />
           </div>

           <PropertyGrid node={node} />

           <div className="space-y-2">
              <div className="flex items-center justify-between">
                  <label className="text-[9px] uppercase font-bold text-slate-500 flex items-center gap-2">
                    <Cpu className="w-3 h-3" /> 绑定插件
                  </label>
                  <button 
                    onClick={() => {
                        setNewTool({...newTool, targetTypes: [node.type]});
                        setIsCreatingTool(true);
                        setActiveTab('plugins');
                    }}
                    className="text-[9px] text-cyan-500 hover:underline cursor-pointer"
                  >
                    + 新建
                  </button>
              </div>
              
              <div className="space-y-1">
                 {boundPlugins.map(tool => (
                   <button
                     key={tool.id}
                     onClick={() => onRunTool(tool, [node])}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-between p-2 bg-slate-900/50 hover:bg-cyan-900/20 border border-slate-800 hover:border-cyan-800 rounded transition-all group text-left"
                   >
                      <div className="flex items-center gap-2">
                         {tool.category === ToolCategory.AGENT ? <Bot className="w-3.5 h-3.5 text-purple-400" /> :
                          tool.category === ToolCategory.API ? <Globe2 className="w-3.5 h-3.5 text-emerald-400" /> :
                          <Braces className="w-3.5 h-3.5 text-orange-400" />}
                        <div>
                            <div className="text-xs text-slate-300 font-medium group-hover:text-cyan-300">{tool.name}</div>
                            <div className="text-[9px] text-slate-600 flex gap-2">
                                {tool.isSimulated ? 
                                    <span className="text-yellow-600 border border-yellow-900/50 px-1 rounded">SIM (MOCK)</span> :
                                    tool.mcpConfig?.functionName === 'googleSearch' ? 
                                    <span className="text-green-600 border border-green-900/50 px-1 rounded">REAL (WEB)</span> :
                                    <span className="text-purple-600 border border-purple-900/50 px-1 rounded">REAL (AI)</span>
                                }
                            </div>
                        </div>
                      </div>
                      <Play className="w-3 h-3 text-slate-600 group-hover:text-cyan-400" />
                   </button>
                 ))}
              </div>
           </div>
        </div>
      </div>
    );
  };
  
  const renderTimeline = () => {
    // Extract dates from all nodes
    const events: { date: Date, node: IntelNode, label: string }[] = [];
    const dateRegex = /(\d{4})[-/](0[1-9]|1[0-12])[-/](0[1-9]|[12][0-9]|3[01])/;
    
    allNodes.forEach(node => {
        // Check content
        let match = node.content.match(dateRegex);
        if (match) {
            events.push({ date: new Date(match[0]), node, label: 'Content Mentions' });
        }
        
        // Check data properties
        Object.entries(node.data || {}).forEach(([key, val]) => {
            if (typeof val === 'string') {
                const dataMatch = val.match(dateRegex);
                if (dataMatch) {
                    events.push({ date: new Date(dataMatch[0]), node, label: key });
                }
            }
        });
    });

    // Sort by date desc
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                   <Calendar className="w-4 h-4 text-orange-400" /> 情报时间线 (Timeline)
                </span>
                <button 
                   onClick={() => setActiveTab('timeline')} // Refresh trigger
                   className="text-slate-500 hover:text-orange-400"
                >
                   <RefreshCw className="w-3.5 h-3.5" />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 relative">
                <div className="absolute left-6 top-4 bottom-4 w-px bg-slate-800"></div>
                
                {events.length === 0 ? (
                    <div className="text-center text-slate-600 text-xs mt-10 p-4 border border-dashed border-slate-800 rounded">
                        <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-50"/>
                        未检测到实体数据中包含具体的日期格式 (YYYY-MM-DD)。
                        <br/>请完善实体属性或摘要。
                    </div>
                ) : (
                    <div className="space-y-6">
                        {events.map((event, idx) => (
                            <div 
                                key={idx} 
                                className="relative pl-8 group cursor-pointer"
                                onClick={() => onSelectNode(event.node.id)}
                            >
                                <div className="absolute left-[21px] top-1.5 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-orange-400 ring-4 ring-slate-950 transition-colors"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-mono text-orange-400 font-bold">
                                        {event.date.toISOString().split('T')[0]}
                                    </span>
                                    <div className="bg-slate-900/50 border border-slate-800 group-hover:border-orange-500/50 rounded p-2 mt-1 transition-colors">
                                        <div className="text-xs text-slate-200 font-bold mb-0.5">{event.node.title}</div>
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <span className="px-1 bg-slate-800 rounded border border-slate-700">{event.node.type}</span>
                                            <span>via {event.label}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Report Generation Area */}
            <div className="border-t border-slate-800 bg-slate-900/20 p-3">
                <button
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="w-full py-2 bg-gradient-to-r from-cyan-900 to-blue-900 hover:from-cyan-800 hover:to-blue-800 border border-cyan-800 text-cyan-100 rounded text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                    {isGeneratingReport ? <RefreshCw className="w-3 h-3 animate-spin"/> : <FileOutput className="w-3 h-3" />}
                    {isGeneratingReport ? 'AI 撰写中...' : '生成情报简报 (Briefing)'}
                </button>
            </div>
            
            {reportText && (
                <div className="absolute inset-0 bg-slate-950 z-20 flex flex-col animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center p-3 border-b border-slate-800 bg-slate-900">
                        <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                           <FileText className="w-4 h-4 text-cyan-400"/> 情报简报预览
                        </span>
                        <button onClick={() => setReportText('')} className="text-slate-500 hover:text-white"><X className="w-4 h-4"/></button>
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {reportText}
                    </div>
                    <div className="p-3 border-t border-slate-800 flex justify-end gap-2">
                        <button 
                            className="px-3 py-1.5 bg-cyan-600 text-white rounded text-xs"
                            onClick={() => {
                                const blob = new Blob([reportText], {type: 'text/plain'});
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `Intel_Briefing_${new Date().toISOString().split('T')[0]}.txt`;
                                a.click();
                            }}
                        >
                            下载 .TXT
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
  }

  const renderLogs = () => {
    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">系统日志 (System Logs)</span>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">{logs.length} entries</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {logs.length === 0 && (
                    <div className="text-center text-slate-600 text-xs italic mt-10">暂无操作日志</div>
                )}
                {logs.map((log) => {
                    let Icon = Info;
                    let colorClass = 'text-slate-300';
                    let bgClass = 'bg-slate-900/30 border-slate-800';

                    if (log.status === 'error') {
                        Icon = AlertCircle;
                        colorClass = 'text-red-400';
                        bgClass = 'bg-red-950/20 border-red-900/30';
                    } else if (log.status === 'success') {
                        Icon = CheckCircle2;
                        colorClass = 'text-emerald-400';
                        bgClass = 'bg-emerald-950/20 border-emerald-900/30';
                    } else if (log.status === 'warning') {
                        Icon = AlertTriangle;
                        colorClass = 'text-amber-400';
                        bgClass = 'bg-amber-950/20 border-amber-900/30';
                    }

                    return (
                        <div key={log.id} className={`flex flex-col text-[10px] font-mono border rounded p-2 mb-2 ${bgClass}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-3 h-3 ${colorClass}`} />
                                <span className="text-slate-500 opacity-75">
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                                </span>
                            </div>
                            <span className={`${colorClass} break-all pl-5`}>
                                {log.action}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  const renderPlugins = () => {
    if (isCreatingTool) {
      return (
        <div className="flex flex-col h-full bg-slate-950">
           <div className="p-4 border-b border-slate-800 flex items-center justify-between">
             <span className="font-bold text-slate-200 text-xs flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400"/> 插件编辑器
             </span>
             <button onClick={() => setIsCreatingTool(false)} className="text-xs text-slate-500 hover:text-slate-300">取消</button>
           </div>
           
           <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              {/* ... (Tool Creation Form inputs, omitted for brevity but logic implies updates) ... */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                    <label className="text-[9px] text-slate-500 uppercase">名称</label>
                    <input 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200"
                        value={newTool.name}
                        onChange={e => setNewTool({...newTool, name: e.target.value})}
                    />
                </div>
                <div>
                    <label className="text-[9px] text-slate-500 uppercase">类型 (Category)</label>
                    <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                        value={newTool.category}
                        onChange={e => setNewTool({...newTool, category: e.target.value as ToolCategory})}
                    >
                        <option value={ToolCategory.AGENT}>Agent (纯推理)</option>
                        <option value={ToolCategory.MCP}>MCP (真实工具/搜索)</option>
                        <option value={ToolCategory.API}>API (模拟数据)</option>
                    </select>
                </div>
              </div>

              <div>
                 <label className="text-[9px] text-slate-500 uppercase">目标实体类型</label>
                 <select 
                    className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                    value={newTool.targetTypes?.[0] || ''}
                    onChange={e => setNewTool({...newTool, targetTypes: e.target.value ? [e.target.value as NodeType] : []})}
                 >
                    <option value="">全局工具 (Global)</option>
                    {Object.values(NodeType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                 </select>
              </div>

              {/* AGENT */}
              {newTool.category === ToolCategory.AGENT && (
                 <div>
                     <label className="text-[9px] text-slate-500 uppercase">Prompt 指令</label>
                     <textarea 
                        className="w-full h-64 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-purple-400 font-mono leading-relaxed"
                        value={newTool.promptTemplate}
                        onChange={e => setNewTool({...newTool, promptTemplate: e.target.value})}
                     />
                 </div>
              )}

              {/* API */}
              {newTool.category === ToolCategory.API && (
                  <div className="space-y-3 p-3 border border-slate-800 rounded bg-slate-900/30">
                      <div className="grid grid-cols-3 gap-2">
                         <div className="col-span-2">
                             <label className="text-[9px] text-slate-500 uppercase">Endpoint</label>
                             <input 
                                 className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-mono"
                                 value={newTool.apiConfig?.endpoint}
                                 onChange={e => setNewTool({...newTool, apiConfig: {...newTool.apiConfig!, endpoint: e.target.value}})}
                             />
                         </div>
                         <div>
                             <label className="text-[9px] text-slate-500 uppercase">Method</label>
                             <select 
                                className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 outline-none"
                                value={newTool.apiConfig?.method}
                                onChange={e => setNewTool({...newTool, apiConfig: {...newTool.apiConfig!, method: e.target.value as 'GET'|'POST'}})}
                             >
                                 <option value="GET">GET</option>
                                 <option value="POST">POST</option>
                             </select>
                         </div>
                      </div>
                      <div>
                          <label className="text-[9px] text-slate-500 uppercase">Mock JSON Response</label>
                          <textarea 
                             className="w-full h-40 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-yellow-400 font-mono leading-relaxed"
                             value={mockJsonText}
                             onChange={e => setMockJsonText(e.target.value)}
                          />
                      </div>
                  </div>
              )}

              {/* MCP */}
              {newTool.category === ToolCategory.MCP && (
                  <div className="space-y-3 p-3 border border-slate-800 rounded bg-slate-900/30">
                      <div>
                         <label className="text-[9px] text-slate-500 uppercase">Function Name</label>
                         <input 
                             className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-orange-400 font-mono"
                             value={newTool.mcpConfig?.functionName}
                             onChange={e => setNewTool({...newTool, mcpConfig: {...newTool.mcpConfig!, functionName: e.target.value}})}
                         />
                      </div>
                      <div>
                         <label className="text-[9px] text-slate-500 uppercase">调用上下文 (Context)</label>
                         <textarea 
                            className="w-full h-24 bg-slate-900 border border-slate-700 rounded p-2 text-xs text-green-400 font-mono leading-relaxed"
                            value={newTool.promptTemplate}
                            onChange={e => setNewTool({...newTool, promptTemplate: e.target.value})}
                         />
                      </div>
                  </div>
              )}
              
              <div className="flex items-center gap-2 border p-2 border-slate-800 rounded">
                  <input 
                    type="checkbox" 
                    checked={newTool.autoExpand} 
                    onChange={e => setNewTool({...newTool, autoExpand: e.target.checked})} 
                  />
                  <span className="text-xs text-slate-300">自动扩展图谱</span>
              </div>
           </div>
           
           <div className="p-4 border-t border-slate-800">
             <button 
               onClick={handleSaveTool}
               className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold flex items-center justify-center gap-2"
             >
               <Save className="w-3 h-3" /> 保存插件
             </button>
           </div>
        </div>
      )
    }

    const EntityCategory = ({ title, items }: { title: string, items: {t: NodeType, l: string, Icon: any}[] }) => (
        <div className="space-y-2">
            <h3 className="text-[9px] uppercase font-bold text-slate-500 pl-1 flex items-center gap-1">
              <div className="w-1 h-1 bg-cyan-500 rounded-full"></div> {title}
            </h3>
            <div className="grid grid-cols-3 gap-2">
                {items.map(item => (
                    <button 
                        key={item.t}
                        onClick={() => onAddNode(item.t)}
                        className="p-2 bg-slate-900 border border-slate-800 rounded hover:bg-slate-800 hover:border-slate-600 flex flex-col items-center gap-1.5 group transition-colors"
                    >
                        <item.Icon className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                        <span className="text-[8px] text-slate-400 group-hover:text-slate-200 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">{item.l}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    const getToolIcon = (cat: ToolCategory) => {
        switch(cat) {
            case ToolCategory.AGENT: return <Bot className="w-3 h-3 text-purple-400" />;
            case ToolCategory.API: return <Globe2 className="w-3 h-3 text-emerald-400" />;
            case ToolCategory.MCP: return <Braces className="w-3 h-3 text-orange-400" />;
        }
    }

    return (
      <div className="flex flex-col h-full bg-slate-950">
         <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/30">
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" /> 资产 & 工具库
             </span>
             <div className="flex gap-2">
                 <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-500 hover:text-cyan-400 border border-transparent hover:border-cyan-900 rounded transition-colors"
                    title="导入数据"
                 >
                    <Upload className="w-3.5 h-3.5" />
                 </button>
                 <button 
                    onClick={() => setIsCreatingTool(true)}
                    className="p-1.5 bg-cyan-900/20 hover:bg-cyan-900/40 text-cyan-400 rounded border border-cyan-900/50 transition-colors"
                    title="创建自定义工具"
                 >
                    <Plus className="w-3.5 h-3.5" />
                 </button>
             </div>
             <input 
                 type="file" 
                 ref={fileInputRef} 
                 className="hidden" 
                 accept=".json,.txt,.md,.csv"
                 onChange={handleFileChange}
             />
         </div>

         <div className="flex-1 overflow-y-auto p-4 space-y-6">
             <EntityCategory 
               title="情报采集 (Collection)"
               items={[
                 {t: NodeType.SOURCE_HUMINT, l: 'HUMINT (人)', Icon: Users},
                 {t: NodeType.SOURCE_SIGINT, l: 'SIGINT (信)', Icon: Radio},
                 {t: NodeType.SOURCE_IMINT, l: 'IMINT (图)', Icon: Satellite},
                 {t: NodeType.SOURCE_GEOINT, l: 'GEOINT (地)', Icon: MapPin},
                 {t: NodeType.SOURCE_OSINT, l: 'OSINT (网)', Icon: Globe},
                 {t: NodeType.SOURCE_MASINT, l: 'MASINT (特)', Icon: Activity},
               ]}
             />
             <EntityCategory 
               title="主体 & 组织 (Subjects)"
               items={[
                 {t: NodeType.ENTITY, l: '人员目标', Icon: User},
                 {t: NodeType.ORGANIZATION, l: '企业/组织', Icon: Building2},
                 {t: NodeType.MILITARY_UNIT, l: '军事单位', Icon: Tent},
                 {t: NodeType.GOV_AGENCY, l: '政府机构', Icon: Landmark},
                 {t: NodeType.THREAT_ACTOR, l: '威胁团伙', Icon: Ghost},
                 {t: NodeType.IDENTITY, l: '虚假身份', Icon: Fingerprint},
               ]}
             />
             <EntityCategory 
               title="差旅 & 物流 (Logistics)"
               items={[
                 {t: NodeType.FLIGHT, l: '航班信息', Icon: Plane},
                 {t: NodeType.HOTEL, l: '酒店住宿', Icon: BedDouble},
                 {t: NodeType.PASSPORT, l: '护照证件', Icon: IdCard},
                 {t: NodeType.VISA, l: '签证许可', Icon: Ticket},
                 {t: NodeType.SHIPPING, l: '海运/货运', Icon: Ship},
               ]}
             />
             <EntityCategory 
               title="网络 & 威胁 (Cyber)"
               items={[
                 {t: NodeType.IP_ADDRESS, l: 'IP地址', Icon: Server},
                 {t: NodeType.DOMAIN, l: '域名', Icon: Globe},
                 {t: NodeType.C2_SERVER, l: 'C2服务器', Icon: Router},
                 {t: NodeType.BOTNET, l: '僵尸网络', Icon: Network},
                 {t: NodeType.EXPLOIT, l: '漏洞利用', Icon: Bomb},
                 {t: NodeType.PHISHING_KIT, l: '钓鱼套件', Icon: Fish},
               ]}
             />
             <EntityCategory 
               title="通信 & 账号 (Comms)"
               items={[
                 {t: NodeType.PHONE_NUMBER, l: '电话号码', Icon: Smartphone},
                 {t: NodeType.EMAIL, l: '电子邮箱', Icon: MessageSquare},
                 {t: NodeType.SOCIAL_PROFILE, l: '社交账号', Icon: Users},
                 {t: NodeType.MESSAGING_ID, l: '即时通讯', Icon: MessageSquare},
                 {t: NodeType.CRYPTO_WALLET, l: '加密钱包', Icon: Box},
                 {t: NodeType.BANK_ACCOUNT, l: '银行账户', Icon: CreditCard},
               ]}
             />
             <EntityCategory 
               title="内容 & 证据 (Evidence)"
               items={[
                 {t: NodeType.IMAGE, l: '图像', Icon: ImageIcon},
                 {t: NodeType.VIDEO, l: '视频', Icon: Video},
                 {t: NodeType.DOCUMENT, l: '文档', Icon: FileText},
                 {t: NodeType.REPORT, l: '情报报告', Icon: FileText},
                 {t: NodeType.DARKWEB_SITE, l: '暗网', Icon: Globe2},
                 {t: NodeType.LEAK_DUMP, l: '数据泄露', Icon: Archive},
               ]}
             />
            <EntityCategory
              title="威胁情报 (CTI/STIX)"
              items={[
                {t: NodeType.ATTACK_PATTERN, l: '攻击模式', Icon: Target},
                {t: NodeType.INTRUSION_SET, l: '入侵集合', Icon: Shield},
                {t: NodeType.MALWARE_ANALYSIS, l: '恶意软件分析', Icon: Microscope},
                {t: NodeType.INDICATOR, l: 'IOC指标', Icon: Gauge},
                {t: NodeType.TOOL_SOFTWARE, l: '工具软件', Icon: Wrench},
                {t: NodeType.COURSE_OF_ACTION, l: '应对措施', Icon: ShieldAlert},
              ]}
            />
            <EntityCategory
              title="数字取证 (Forensics)"
              items={[
                {t: NodeType.SCREENSHOT, l: '截图', Icon: Monitor},
                {t: NodeType.METADATA, l: '元数据', Icon: FileText},
                {t: NodeType.QR_CODE, l: '二维码', Icon: QrCode},
                {t: NodeType.BARCODE, l: '条形码', Icon: Barcode},
                {t: NodeType.ARTIFACT, l: '数字证物', Icon: Package},
                {t: NodeType.PDF_DOCUMENT, l: 'PDF文档', Icon: FileText},
              ]}
            />
            <EntityCategory
              title="背景调查 (Background)"
              items={[
                {t: NodeType.EMPLOYMENT_RECORD, l: '就业记录', Icon: Briefcase},
                {t: NodeType.EDUCATION_RECORD, l: '教育记录', Icon: GraduationCap},
                {t: NodeType.COURT_RECORD, l: '法庭记录', Icon: Gavel},
                {t: NodeType.PROPERTY, l: '房产信息', Icon: Home},
                {t: NodeType.PATENT, l: '专利商标', Icon: Scroll},
                {t: NodeType.COMPANY_REGISTRATION, l: '公司注册', Icon: Building2},
              ]}
            />
            <EntityCategory
              title="物理监控 (Physical)"
              items={[
                {t: NodeType.LICENSE_PLATE, l: '车牌号', Icon: Car},
                {t: NodeType.BIOMETRIC, l: '生物识别', Icon: Fingerprint},
                {t: NodeType.CCTV_FOOTAGE, l: '监控录像', Icon: Camera},
                {t: NodeType.SATELLITE_IMAGE, l: '卫星图像', Icon: Satellite},
                {t: NodeType.DRONE, l: '无人机', Icon: Radar},
              ]}
            />
            <EntityCategory
              title="新媒体 (New Media)"
              items={[
                {t: NodeType.BLOG, l: '博客', Icon: FileText},
                {t: NodeType.PODCAST, l: '播客', Icon: Podcast},
                {t: NodeType.LIVESTREAM, l: '直播', Icon: Cast},
                {t: NodeType.FORUM_POST, l: '论坛帖子', Icon: MessageSquare},
              ]}
            />

             <div className="space-y-2 pt-4 border-t border-slate-800">
                 <h3 className="text-[9px] uppercase font-bold text-slate-500 pl-1 flex items-center justify-between">
                    <span>已安装插件库 ({allTools.length})</span>
                 </h3>
                 <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                     {allTools.map(tool => (
                         <div
                             key={tool.id}
                             className="w-full flex items-center justify-between p-2 bg-slate-900/30 border border-slate-800/50 rounded hover:border-slate-700 transition-colors group"
                         >
                             <div className="flex items-center gap-2 min-w-0">
                                 {getToolIcon(tool.category)}
                                 <div className="flex flex-col min-w-0">
                                     <span className="text-xs text-slate-400 truncate font-medium group-hover:text-cyan-400" title={tool.name}>{tool.name}</span>
                                     <span className="text-[9px] text-slate-600 truncate" title={tool.description}>{tool.description}</span>
                                 </div>
                             </div>
                             <div className="flex flex-col items-end gap-1 shrink-0">
                                 <span className="text-[8px] font-mono text-slate-500 bg-slate-900 px-1 rounded border border-slate-800">
                                     {tool.targetTypes.length === 0 ? 'GLOBAL' : tool.targetTypes.length > 1 ? 'MULTI' : tool.targetTypes[0]}
                                 </span>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      </div>
    );
  }

  const renderSettings = () => {
    return (
        <div className="flex flex-col h-full bg-slate-950">
            <div className="p-4 border-b border-slate-800 flex items-center gap-2 bg-slate-900/30">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">系统设置 (System Config)</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* API Key Section */}
                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                        <Key className="w-3.5 h-3.5" /> Gemini API Key
                    </label>
                    {hasApiKey ? (
                        <div className="bg-green-900/20 border border-green-500/30 rounded p-3 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-green-400 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    API Key 已配置
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type={showApiKey ? "text" : "password"}
                                    value={showApiKey ? apiKey : '••••••••••••••••••••••••••'}
                                    readOnly
                                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 font-mono"
                                />
                                <button
                                    onClick={() => setShowApiKey(!showApiKey)}
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs transition-colors"
                                >
                                    <Eye className="w-4 h-4 text-slate-400" />
                                </button>
                            </div>
                            <button
                                onClick={handleDeleteApiKey}
                                className="w-full px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-500/30 rounded text-xs text-red-400 transition-colors flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                删除 API Key
                            </button>
                        </div>
                    ) : (
                        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded p-3 space-y-3">
                            <div className="flex items-center gap-2 text-yellow-400 text-xs">
                                <AlertTriangle className="w-4 h-4" />
                                未配置 API Key，AI 功能将无法使用
                            </div>
                            <input
                                type="text"
                                placeholder="输入您的 Gemini API Key"
                                value={apiKeyInput}
                                onChange={(e) => setApiKeyInput(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSaveApiKey}
                                    className="flex-1 px-3 py-2 bg-cyan-600 hover:bg-cyan-500 rounded text-xs text-white font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    保存 API Key
                                </button>
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors flex items-center gap-2"
                                >
                                    <Globe className="w-3.5 h-3.5" />
                                    获取
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-slate-800/50"></div>

                <div className="space-y-3">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                        <Bot className="w-3.5 h-3.5" /> 基础模型 (Backbone)
                    </label>
                    <div className="space-y-2">
                        {AI_MODELS.map(model => (
                            <div 
                                key={model.id}
                                onClick={() => onUpdateAiConfig({...aiConfig, modelId: model.id})}
                                className={`p-3 rounded border cursor-pointer transition-all ${
                                    aiConfig.modelId === model.id 
                                    ? 'bg-cyan-900/20 border-cyan-500/50 ring-1 ring-cyan-500/30' 
                                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-xs font-bold ${aiConfig.modelId === model.id ? 'text-cyan-300' : 'text-slate-300'}`}>
                                        {model.name}
                                    </span>
                                    {aiConfig.modelId === model.id && <div className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_5px_cyan]"></div>}
                                </div>
                                <div className="text-[10px] text-slate-500 leading-relaxed">{model.description}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                            <BrainCircuit className="w-3.5 h-3.5" /> 深度思考 (Thinking)
                        </label>
                        <div 
                            onClick={() => onUpdateAiConfig({...aiConfig, enableThinking: !aiConfig.enableThinking})}
                            className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${aiConfig.enableThinking ? 'bg-cyan-600' : 'bg-slate-700'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${aiConfig.enableThinking ? 'translate-x-4' : 'translate-x-0'}`}></div>
                        </div>
                     </div>
                     
                     {aiConfig.enableThinking && (
                         <div className="bg-slate-900/50 p-3 rounded border border-slate-800 space-y-3 animate-in fade-in slide-in-from-top-2">
                             <div className="flex justify-between text-[10px]">
                                 <span className="text-slate-400">Token Budget</span>
                                 <span className="text-cyan-400 font-mono">{aiConfig.thinkingBudget}</span>
                             </div>
                             <input 
                                type="range" 
                                min="0" 
                                max="16000" 
                                step="1024"
                                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                value={aiConfig.thinkingBudget}
                                onChange={(e) => onUpdateAiConfig({...aiConfig, thinkingBudget: parseInt(e.target.value)})}
                             />
                         </div>
                     )}
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800/50">
                    <label className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-2">
                         <Sliders className="w-3.5 h-3.5" /> 随机性 (Temperature)
                    </label>
                    <div className="bg-slate-900/30 p-3 rounded border border-slate-800 space-y-2">
                         <div className="flex justify-between text-[10px]">
                             <span className="text-slate-400">严谨 (0.0)</span>
                             <span className="text-cyan-400 font-mono">{aiConfig.temperature}</span>
                             <span className="text-slate-400">创意 (1.0)</span>
                         </div>
                         <input 
                            type="range" 
                            min="0" 
                            max="1" 
                            step="0.1"
                            className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                            value={aiConfig.temperature}
                            onChange={(e) => onUpdateAiConfig({...aiConfig, temperature: parseFloat(e.target.value)})}
                         />
                    </div>
                </div>
            </div>
        </div>
    )
  }

  return (
      <div className="w-[450px] h-full bg-[#0B0F19] border-l border-slate-800 flex flex-col shadow-2xl z-20">
      <div className="flex border-b border-slate-800 bg-slate-950 relative">
        <button
          onClick={() => handleTabChange('plugins')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'plugins' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Shield className="w-3 h-3" /> 资产库
        </button>
        <button
          onClick={() => handleTabChange('timeline')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'timeline' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Calendar className="w-3 h-3" /> 时间线
        </button>
        <button
          onClick={() => handleTabChange('inspector')}
          disabled={selectedNodes.length === 0}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'inspector' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-500 hover:text-slate-300 disabled:opacity-30'
          }`}
        >
          <Settings className="w-3 h-3" /> 属性
        </button>
        <button
          onClick={() => handleTabChange('logs')}
          className={`w-12 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center border-l border-slate-800 ${
            activeTab === 'logs' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleTabChange('settings')}
          className={`w-12 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center border-l border-slate-800 ${
            activeTab === 'settings' ? 'text-slate-200 bg-slate-800' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden bg-[#0e121b]">
        {activeTab === 'plugins' && renderPlugins()}
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'inspector' && renderInspector()}
        {activeTab === 'logs' && renderLogs()}
        {activeTab === 'settings' && renderSettings()}
      </div>

      <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between items-center">
         <div className="flex items-center gap-2">
             <span>OSINT Kernel v5.3</span>
             <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                 {aiConfig.modelId.includes('flash') ? 'FLASH' : 'PRO'}
             </span>
         </div>
         {isProcessing && <span className="text-cyan-400 animate-pulse flex items-center gap-1"><Zap className="w-3 h-3"/> Processing...</span>}
      </div>
    </div>
  );
};
