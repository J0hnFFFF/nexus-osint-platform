
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
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: graphSchema,
        tools: toolsConfig.length > 0 ? toolsConfig : undefined,
        temperature: aiConfig.temperature
    };

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
    const result = JSON.parse(resultText);
    
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

export const generateFinalReport = async (nodes: IntelNode[], persona: string): Promise<string> => {
    const ai = await getAI();
    const context = nodes.map(n => {
        const safeData = { ...n.data };
        for (const key in safeData) {
            const value = safeData[key];
            if (typeof value === 'string' && value.startsWith('data:')) {
                safeData[key] = '[MEDIA_ATTACHMENT]';
            }
        }
        return `[${n.type}] ${n.title}\nInfo: ${n.content}\nData: ${JSON.stringify(safeData)}`;
    }).join('\n---\n');
    
    const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a professional intelligence report in Chinese based on these entities. Persona: ${persona}.\n\nData:\n${context}`
    });
    return res.text || "生成失败";
}
