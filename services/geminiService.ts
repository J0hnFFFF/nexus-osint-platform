
import { GoogleGenAI, Schema, Type } from "@google/genai";
import { IntelNode, NodeType, Tool, Connection, ToolCategory, AIModelConfig } from "../types";
import { ENTITY_DEFAULT_FIELDS } from "../constants";

const getAI = async () => {
  let apiKey = process.env.API_KEY;

  // 在 Electron 环境中，优先从本地存储获取 API Key
  if (typeof window !== 'undefined' && (window as any).electronAPI) {
    try {
      const storedKey = await (window as any).electronAPI.getApiKey();
      if (storedKey) apiKey = storedKey;
    } catch (e) {
      console.warn('Failed to get API key from Electron store:', e);
    }
  }

  if (!apiKey) throw new Error("API Key not found. Please configure your Gemini API Key in settings.");
  return new GoogleGenAI({ apiKey });
};

/**
 * 清理和解析 JSON 响应
 * 处理 AI 返回的可能包含 markdown 代码块或额外文本的响应
 */
const parseJsonResponse = (text: string): any => {
  let cleanText = text.trim();

  // 1. 尝试直接解析
  try {
    return JSON.parse(cleanText);
  } catch (e) {
    // 继续尝试其他方法
  }

  // 2. 清理 markdown 代码块标记 (```json ... ``` 或 ``` ... ```)
  const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {
      // 继续尝试其他方法
    }
  }

  // 3. 尝试提取第一个 JSON 对象 (从 { 到匹配的 })
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = cleanText.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      // 继续尝试其他方法
    }
  }

  // 4. 尝试提取 JSON 数组
  const firstBracket = cleanText.indexOf('[');
  const lastBracket = cleanText.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonCandidate = cleanText.substring(firstBracket, lastBracket + 1);
    try {
      return JSON.parse(jsonCandidate);
    } catch (e) {
      // 继续尝试其他方法
    }
  }

  // 5. 清理常见的非法字符并重试
  const sanitized = cleanText
    .replace(/[\x00-\x1F\x7F]/g, '') // 移除控制字符
    .replace(/,\s*}/g, '}')  // 移除尾随逗号
    .replace(/,\s*]/g, ']'); // 移除数组尾随逗号

  try {
    return JSON.parse(sanitized);
  } catch (e) {
    // 所有方法都失败了
  }

  // 6. 如果所有方法都失败，抛出详细错误
  const preview = cleanText.length > 200 ? cleanText.substring(0, 200) + '...' : cleanText;
  throw new Error(`无法解析 AI 响应为 JSON。响应内容预览: ${preview}`);
};

/**
 * MOCK API HANDLER
 * Simulates fetching data from external OSINT APIs
 */
const fetchMockApiData = async (tool: Tool, node: IntelNode): Promise<any> => {
    console.log(`[API] Simulating request to ${tool.apiConfig?.endpoint}`);
    
    // Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Return the mock response defined in the tool, potentially modified by input
    const mockData = tool.apiConfig?.mockResponse || {};
    
    // Dynamic injection for realism (injecting the queried IP/Domain into the mock response)
    if (tool.targetTypes.includes(NodeType.IP_ADDRESS) && node.data['IP地址']) {
        // Deep clone and inject
        const resp = JSON.parse(JSON.stringify(mockData));
        if (resp.data?.attributes) resp.data.attributes.ip_address = node.data['IP地址'];
        return resp;
    }
    
    return mockData;
};

/**
 * CORE EXECUTION ENGINE
 */
export const executeTool = async (
  tool: Tool,
  node: IntelNode,
  allNodes: IntelNode[],
  aiConfig: AIModelConfig
): Promise<{ newNodes: IntelNode[], newConnections: Connection[], updateData?: any }> => {
  try {
    const ai = await getAI();
    let finalPrompt = tool.promptTemplate || "";
    let toolsConfig: any = [];
    let systemInstruction = `
      Role: Senior Intelligence Analyst (OSINT).
      Task: Execute the specific tool logic provided.
      Output Language: Simplified Chinese.
      Format: Strict JSON.
    `;

    // --- 1. STRATEGY SELECTION ---
    
    // STRATEGY: API TOOL
    if (tool.category === ToolCategory.API && tool.apiConfig) {
        const apiResult = await fetchMockApiData(tool, node);
        finalPrompt = `
        [API EXECUTION MODE]
        TARGET: ${node.title}
        API ENDPOINT: ${tool.apiConfig.endpoint}
        
        RAW API RESPONSE (JSON):
        ${JSON.stringify(apiResult, null, 2)}

        INSTRUCTION:
        ${tool.promptTemplate}
        
        Parse the API response above and extract intelligence according to the instruction.
        `;
    }
    
    // STRATEGY: MCP / FUNCTION CALLING
    else if (tool.category === ToolCategory.MCP && tool.mcpConfig) {
        // Special Case: Google Grounding (Native Support)
        if (tool.mcpConfig.functionName === 'googleSearch') {
            toolsConfig = [{ googleSearch: {} }];
            systemInstruction += "\nUse Google Search to verify facts and find new information.";
        } 
        // General MCP Simulation (Function Call pattern)
        else {
            // In a real MCP client, we would pass the tool definition to the model.
            // Here we simulate the prompt context being "aware" of the tool capability.
            finalPrompt = `[MCP TOOL: ${tool.mcpConfig.functionName}]\n${finalPrompt}`;
        }
    }

    // STRATEGY: AGENT (Default)
    else {
        // Variable Injection for Agent prompts
        finalPrompt = finalPrompt.replace(/{{title}}/g, node.title);
        finalPrompt = finalPrompt.replace(/{{content}}/g, node.content);
        finalPrompt = finalPrompt.replace(/{{type}}/g, node.type);
        for (const [key, value] of Object.entries(node.data || {})) {
            if (typeof value === 'string' && !value.startsWith('data:')) {
                finalPrompt = finalPrompt.replace(new RegExp(`{{data.${key}}}`, 'g'), String(value));
            }
        }
    }

    // --- 2. DATA PREPARATION ---

    // Scan node.data for Base64 encoded media
    const mediaParts: any[] = [];
    for (const [key, value] of Object.entries(node.data || {})) {
        if (typeof value === 'string' && value.startsWith('data:')) {
            const matches = value.match(/^data:(.*?);base64,(.*)$/);
            if (matches) {
                const mimeType = matches[1];
                const data = matches[2];
                if (mimeType.startsWith('image/') || mimeType.startsWith('audio/') || mimeType === 'application/pdf') {
                    mediaParts.push({ inlineData: { mimeType, data } });
                }
            }
        }
    }

    // --- 3. SCHEMA DEFINITION ---
    const graphSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING, description: "Analysis finding summary in Chinese." },
        updated_properties: { 
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { key: { type: Type.STRING }, value: { type: Type.STRING } },
            required: ["key", "value"]
          }
        },
        new_entities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: Object.values(NodeType) },
              description: { type: Type.STRING },
              data: { 
                type: Type.ARRAY, 
                items: {
                    type: Type.OBJECT,
                    properties: { key: { type: Type.STRING }, value: { type: Type.STRING } },
                    required: ["key", "value"]
                }
              },
              relationship_label: { type: Type.STRING }
            },
            required: ['title', 'type', 'relationship_label']
          }
        }
      }
    };

    // --- 4. EXECUTION ---
    const userContentParts = [
        { text: `INSTRUCTION:\n${finalPrompt}\n\nINPUT DATA CONTEXT:\n${JSON.stringify(node.data, (k, v) => (typeof v === 'string' && v.startsWith('data:') ? '[MEDIA_BLOB]' : v))}` },
        ...mediaParts
    ];

    // Construct Config with user preferences
    const generationConfig: any = {
        temperature: aiConfig.temperature
    };

    // Add tools OR structured output (mutually exclusive per Gemini API constraints)
    if (toolsConfig.length > 0) {
        // When using tools (e.g., googleSearch), cannot use responseMimeType/responseSchema
        generationConfig.tools = toolsConfig;
        // Add explicit JSON format instruction to system prompt when tools are used
        systemInstruction += `

CRITICAL: Your response MUST be valid JSON with this exact structure:
{
  "summary": "string - Analysis summary in Chinese",
  "updated_properties": [{"key": "string", "value": "string"}],
  "new_entities": [{
    "title": "string",
    "type": "string (must be one of the NodeType enum values)",
    "description": "string",
    "data": [{"key": "string", "value": "string"}],
    "relationship_label": "string"
  }]
}`;
    } else {
        // When not using tools, enforce structured JSON output via schema
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = graphSchema;
    }

    // Set system instruction for all cases
    generationConfig.systemInstruction = systemInstruction;

    // Add Thinking Config if enabled and budget > 0
    if (aiConfig.enableThinking && aiConfig.thinkingBudget > 0) {
        generationConfig.thinkingConfig = { thinkingBudget: aiConfig.thinkingBudget };
    }

    const response = await ai.models.generateContent({
      model: aiConfig.modelId, // Use user-selected model
      contents: [{ role: 'user', parts: userContentParts }],
      config: generationConfig
    });

    // Handle response (Potential grounding metadata for MCP)
    const resultText = response.text || "{}";
    const result = parseJsonResponse(resultText);
    
    // Helper: Convert KV Array back to Object
    const kvToObject = (arr: any[]) => {
        if (!Array.isArray(arr)) return {};
        return arr.reduce((acc, item) => {
            if (item.key) acc[item.key] = item.value;
            return acc;
        }, {} as Record<string, any>);
    };

    const newNodes: IntelNode[] = [];
    const newConnections: Connection[] = [];

    // --- 5. RESULT PROCESSING ---
    if (result.new_entities && tool.autoExpand) {
        result.new_entities.forEach((ent: any) => {
            const newId = Math.random().toString(36).substr(2, 9);
            const entType = ent.type as NodeType;
            const defaultData = ENTITY_DEFAULT_FIELDS[entType] ? { ...ENTITY_DEFAULT_FIELDS[entType] } : {};
            const extractedData = kvToObject(ent.data);
            const finalData = { ...defaultData, ...extractedData };

            newNodes.push({
                id: newId,
                type: entType,
                title: ent.title,
                content: ent.description || 'Generated by Tool',
                position: { 
                    x: node.position.x + 300 + (Math.random() * 100 - 50), 
                    y: node.position.y + (newNodes.length * 150) - 100 
                },
                data: finalData, 
                rating: { reliability: 'C', credibility: '3' },
                status: 'NEW',
                depth: node.depth + 1
            });
            newConnections.push({
                id: Math.random().toString(36).substr(2, 9),
                sourceId: node.id,
                targetId: newId,
                label: ent.relationship_label,
                type: 'SUSPECTED'
            });
        });
    }

    // Append Search Grounding Metadata if available (For MCP Google Search)
    let updateData = kvToObject(result.updated_properties);
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        const chunks = response.candidates[0].groundingMetadata.groundingChunks;
        const links = chunks
            .map((c: any) => c.web?.uri)
            .filter((u: string) => u)
            .join(', ');
        if (links) {
            updateData['来源链接 (Grounding)'] = links;
        }
    }

    return {
        newNodes,
        newConnections,
        updateData
    };

  } catch (error) {
    console.error("Tool Execution Error", error);
    throw error;
  }
};

export interface BriefingContext {
    nodes: IntelNode[];
    connections: { sourceTitle: string; targetTitle: string; label?: string }[];
    communities?: { id: number; members: string[] }[];
    keyNodes?: string[];
}

export const generateFinalReport = async (context: BriefingContext): Promise<string> => {
    const ai = await getAI();

    // 1. 构建实体列表
    const entityList = context.nodes.map(n => {
        const safeData = { ...n.data };
        for (const key in safeData) {
            const value = safeData[key];
            if (typeof value === 'string' && value.startsWith('data:')) {
                safeData[key] = '[附件]';
            }
        }
        const dataStr = Object.entries(safeData)
            .filter(([_, v]) => v && String(v).trim())
            .map(([k, v]) => `${k}: ${v}`)
            .join('; ');
        return `- **${n.title}** [${n.type}]: ${n.content || '无描述'}${dataStr ? ` | 属性: ${dataStr}` : ''}`;
    }).join('\n');

    // 2. 构建关系列表
    const relationList = context.connections.length > 0
        ? context.connections.map(c => `- ${c.sourceTitle} → ${c.targetTitle}${c.label ? ` (${c.label})` : ''}`).join('\n')
        : '无已建立的关系连接';

    // 3. 构建社区信息
    const communityInfo = context.communities && context.communities.length > 0
        ? context.communities.map(c => `- 社区 ${c.id + 1}: ${c.members.join(', ')}`).join('\n')
        : '未进行社区分析';

    // 4. 核心节点
    const keyNodesInfo = context.keyNodes && context.keyNodes.length > 0
        ? context.keyNodes.join(', ')
        : '未识别核心节点';

    const prompt = `你是一名资深情报分析师。请根据以下**画布中的实际数据**撰写一份情报简报。

## 严格要求
1. **只能使用下方提供的数据**，禁止编造、推测或添加任何不存在的信息
2. 如果某方面信息不足，直接说明"信息不足"，不要虚构
3. 输出格式为 **Markdown**
4. 使用中文撰写

## 画布数据

### 实体清单 (共 ${context.nodes.length} 个)
${entityList}

### 关系网络 (共 ${context.connections.length} 条连接)
${relationList}

### 社区结构
${communityInfo}

### 核心节点
${keyNodesInfo}

## 简报结构要求
请按以下结构输出：

# 情报简报

## 一、概述
(简要说明本次分析涉及的实体数量、类型分布、主要关注点)

## 二、核心发现
(列出 3-5 个基于数据的关键发现，每条必须有数据支撑)

## 三、实体分析
(按重要性或类型分组描述关键实体)

## 四、关系网络
(描述已建立的关系连接，分析网络结构特点)

## 五、风险评估
(基于现有数据的风险判断，信息不足时明确标注)

## 六、情报空白
(指出当前数据中缺失但需要补充的信息)

---
*本简报基于画布中 ${context.nodes.length} 个实体和 ${context.connections.length} 条关系生成*
`;

    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    return res.text || "生成失败";
}
