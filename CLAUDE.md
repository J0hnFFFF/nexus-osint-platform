# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nexus OSINT Platform** is a professional-grade Open Source Intelligence analysis platform combining infinite canvas visualization, graph-based data correlation, and Google Gemini AI-powered automated reasoning. Built with React 19, TypeScript, and Tailwind CSS, it enables intelligence analysts to collect, organize, analyze and make decisions from information.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Start development server (requires API key)
# Linux/Mac:
export API_KEY="your_google_gemini_api_key"
npm run dev

# Windows PowerShell:
$env:API_KEY="your_google_gemini_api_key"
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Setup
The platform requires a **Google Gemini API Key** with **Paid Tier** (for Search Grounding/MCP features).

Set via `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

The vite config injects this as `process.env.API_KEY` at build time (see vite.config.ts:14).

### Desktop Application Build
See `BUILD_GUIDE.md` for full Electron packaging instructions. Summary:
```bash
npm install electron electron-builder concurrently wait-on cross-env --save-dev
npm run electron:dev    # Development mode
npm run electron:build  # Production installer (.exe/.dmg/.AppImage)
```

## Architecture

### High-Level Data Flow

```
User Interaction (Canvas/UI)
  ↓
State Update (React useState)
  ↓
executeTool (geminiService.ts) → Constructs Prompt
  ↓
Google Gemini API (with optional Search Grounding)
  ↓
Structured JSON Response → Graph Expansion
  ↓
Nodes/Connections Update → Canvas Re-render
```

### Core Architectural Pattern

**Client-Side Heavy (Serverless)**: All graph rendering, state management, and logic runs in the browser. AI inference calls Google Gemini API directly without an intermediary backend.

### Key Modules

**1. State Management (App.tsx)**
- Central state container using React hooks
- `nodes`: Array of IntelNode entities
- `connections`: Array of Connection edges
- `tools`: Loaded plugin definitions (from tools.ts)
- `aiConfig`: User-selected AI model, temperature, thinking mode

**2. Canvas Engine (components/Canvas.tsx)**
- Infinite pan/zoom workspace
- SVG-based connection rendering
- Pointer event handling for drag, select, connect
- Search highlighting

**3. Tool Execution System (services/geminiService.ts)**
Implements strategy pattern for three tool categories:

- **AGENT**: Pure LLM reasoning (prompt templates with variable injection)
- **API**: External data fetching (currently simulated/mocked)
- **MCP**: Function calling / Google Search Grounding
  - When `tool.mcpConfig.functionName === 'googleSearch'`, enables real-time web data via `tools: [{googleSearch: {}}]`

**4. Graph Expansion Protocol**
All tools return structured JSON conforming to `graphSchema` (geminiService.ts:122-156):
```typescript
{
  summary: string,
  updated_properties: [{ key, value }],
  new_entities: [{
    title: string,
    type: NodeType (enum),
    description: string,
    data: [{ key, value }],
    relationship_label: string
  }]
}
```

The engine automatically:
- Creates new IntelNode instances with proper depth/position
- Establishes connections from source → new entities
- Merges `updated_properties` into existing node.data

**5. Entity Type System (types.ts)**
60+ intelligence entity types organized into 10 categories:
- Subjects (ENTITY, ORGANIZATION, THREAT_ACTOR)
- Network Infrastructure (IP_ADDRESS, DOMAIN, C2_SERVER)
- Communication (EMAIL, PHONE_NUMBER, SOCIAL_PROFILE)
- Financial (CRYPTO_WALLET, TRANSACTION)
- Physical World (GEO_LOCATION, VEHICLE, WEAPON)
- Travel & Logistics (FLIGHT, HOTEL, PASSPORT)
- Content & Media (IMAGE, VIDEO, MALWARE, EXPLOIT)
- Intelligence Collection (SOURCE_HUMINT, SOURCE_SIGINT)
- Analysis (REPORT, EVENT, VULNERABILITY)
- Operational (SEARCH_QUERY, LEAK_DUMP, SENSOR)

Each type has predefined field schemas in `constants.ts` ENTITY_DEFAULT_FIELDS.

## Critical Implementation Details

### Adding New Entity Types

1. Add to `NodeType` enum (types.ts:3-91)
2. Define default fields in `ENTITY_DEFAULT_FIELDS` (constants.ts:10-234)
3. Add icon mapping in `components/NodeCard.tsx` `getIcon()` function
4. Register in Control Panel entity buttons (components/ControlPanel.tsx)

### Creating New Tools

Add to `DEFAULT_TOOLS` array in `tools.ts`:
```typescript
{
  id: 'unique_id',
  category: ToolCategory.AGENT | API | MCP,
  name: 'Display Name',
  version: '1.0',
  author: 'Author',
  description: 'Brief description',
  targetTypes: [NodeType.ENTITY], // Empty = global tool
  autoExpand: true, // Whether to create new nodes from results
  promptTemplate: "Your prompt here. Use {{title}}, {{content}}, {{data.fieldName}}",
  // For MCP tools:
  mcpConfig: { functionName: 'googleSearch' },
  isSimulated: false
}
```

**Prompt Engineering Tips**:
- Explicitly request JSON output
- Define expected extraction fields
- Use Chinese output language preference (per system instruction)
- For AGENT tools, use template variables: `{{title}}`, `{{content}}`, `{{data.fieldName}}`

### Multimodal Data Handling

geminiService.ts automatically detects base64-encoded media in `node.data` (lines 106-119):
- Extracts `data:image/png;base64,...` patterns
- Converts to `{inlineData: {mimeType, data}}` format
- Passes to Gemini API alongside text prompt

Supports: images, audio, PDFs

### AI Configuration

Users can adjust AI behavior via Control Panel → Settings:
- **Model Selection**: `gemini-2.5-flash` (fast) or `gemini-3-pro-preview` (deep reasoning)
- **Temperature**: 0.0-1.0 (default 0.4)
- **Thinking Mode**: Extended reasoning budget (requires compatible models)

These settings are passed to `executeTool()` and injected into the generation config (geminiService.ts:165-176).

### Google Search Grounding (MCP)

When a tool has `mcpConfig.functionName === 'googleSearch'`:
1. Service adds `tools: [{googleSearch: {}}]` to API config (line 80)
2. Gemini model can perform live web searches
3. Grounding metadata (source URLs) extracted and appended to node data (lines 235-244)

**Requirement**: API key must have Google Search Grounding enabled (Paid tier).

### Layout Engine

Auto-layout algorithm (App.tsx:79-118):
- Uses node `depth` property for horizontal layering
- Column width: 350px, Row height: 180px
- Depth-based positioning: `x = 100 + (depth * 350)`

Triggered automatically after tool execution or via manual button.

### Intelligence Rating System

Uses NATO Admiralty Code:
- **Reliability**: A-F (source trustworthiness)
- **Credibility**: 1-6 (information accuracy)

Stored in `IntelNode.rating` (types.ts:100-103).

## Testing Strategy

Currently no automated tests. When adding tests:
- Mock `geminiService.ts` executeTool for integration tests
- Test graph manipulation logic (node creation, connection, deletion)
- Test state synchronization between App and Canvas
- Mock Gemini API responses using predefined graphSchema fixtures

## Known Constraints

- **No git repo**: Currently not initialized as git repository
- **API Key Security**: In desktop builds, API key is bundled (see BUILD_GUIDE.md Section 5 for secure alternatives)
- **No Backend**: All state is client-side; no persistence without explicit save/load
- **Search Grounding Requires Paid API**: Free tier Gemini keys cannot use MCP googleSearch

## File Structure Highlights

```
/
├── App.tsx              # Main application container & state management
├── types.ts             # TypeScript interfaces & enums (NodeType, Tool, etc.)
├── constants.ts         # Entity field schemas, AI model configs
├── tools.ts             # Default tool definitions (60+ built-in tools)
├── /components
│   ├── Canvas.tsx       # Infinite canvas rendering & interaction
│   ├── NodeCard.tsx     # Individual entity card component
│   ├── ControlPanel.tsx # Right sidebar (tools, timeline, logs, settings)
│   └── ContextMenu.tsx  # Right-click menu for nodes
├── /services
│   └── geminiService.ts # AI execution engine & tool dispatcher
├── vite.config.ts       # Build config & env variable injection
└── BUILD_GUIDE.md       # Electron desktop packaging instructions
```

## Intelligence Domain Conventions

- **HUMINT**: Human Intelligence sources (informants, interviews)
- **SIGINT**: Signals Intelligence (communications intercepts)
- **IMINT**: Imagery Intelligence (satellite, drone photos)
- **GEOINT**: Geospatial Intelligence (mapping, location analysis)
- **OSINT**: Open Source Intelligence (public data)
- **MASINT**: Measurement & Signature Intelligence (technical sensors)

These categories are reflected in the `SOURCE_*` NodeType enums and corresponding field schemas.

## Performance Considerations

- Canvas renders all nodes via React; for >500 nodes, consider virtualization
- AI tool execution is sequential in batch runs (App.tsx:250-252)
- No debouncing on canvas drag; may need optimization for low-end devices
- Search highlighting (searchTerm) triggers full node re-render
