import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { nanoid } from 'nanoid';
import {
  IntelNode, Connection, Tool, AIModelConfig,
  Project, CanvasData, Snapshot, SnapshotData, SnapshotTrigger
} from '../types';

const DB_NAME = 'nexus-osint-db';
const DB_VERSION = 2;  // 升级版本触发迁移

// 默认项目和画布 ID
const DEFAULT_PROJECT_ID = 'default-project';
const DEFAULT_CANVAS_ID = 'default-canvas';

interface NexusDBSchema extends DBSchema {
  config: {
    key: string;
    value: any;
  };
  customTools: {
    key: string;
    value: Tool;
  };
  // 6.0 新增
  projects: {
    key: string;
    value: Project;
  };
  canvases: {
    key: string;
    value: CanvasData;
    indexes: { 'by-project': string };
  };
  nodes: {
    key: string;
    value: IntelNode & { canvasId: string };
    indexes: { 'by-canvas': string };
  };
  connections: {
    key: string;
    value: Connection & { canvasId: string };
    indexes: { 'by-canvas': string };
  };
  snapshots: {
    key: string;
    value: Snapshot;
    indexes: { 'by-canvas': string };
  };
  snapshotData: {
    key: string;
    value: SnapshotData;
  };
}

let dbInstance: IDBPDatabase<NexusDBSchema> | null = null;

/**
 * 获取数据库实例（单例模式）
 */
const getDB = async (): Promise<IDBPDatabase<NexusDBSchema>> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NexusDBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // 配置表
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config');
      }

      // 自定义工具表
      if (!db.objectStoreNames.contains('customTools')) {
        db.createObjectStore('customTools', { keyPath: 'id' });
      }

      // 6.0: 项目表
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }

      // 6.0: 画布表
      if (!db.objectStoreNames.contains('canvases')) {
        const canvasStore = db.createObjectStore('canvases', { keyPath: 'id' });
        canvasStore.createIndex('by-project', 'projectId');
      }

      // 6.0: 快照表
      if (!db.objectStoreNames.contains('snapshots')) {
        const snapshotStore = db.createObjectStore('snapshots', { keyPath: 'id' });
        snapshotStore.createIndex('by-canvas', 'canvasId');
      }

      // 6.0: 快照数据表
      if (!db.objectStoreNames.contains('snapshotData')) {
        db.createObjectStore('snapshotData', { keyPath: 'snapshotId' });
      }

      // 节点表 - 处理迁移
      if (!db.objectStoreNames.contains('nodes')) {
        const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
        nodeStore.createIndex('by-canvas', 'canvasId');
      } else if (oldVersion < 2) {
        // 迁移: workspaceId → canvasId
        const nodeStore = transaction.objectStore('nodes');
        // 删除旧索引，创建新索引
        if (nodeStore.indexNames.contains('by-workspace')) {
          nodeStore.deleteIndex('by-workspace');
        }
        if (!nodeStore.indexNames.contains('by-canvas')) {
          nodeStore.createIndex('by-canvas', 'canvasId');
        }
      }

      // 连接表 - 处理迁移
      if (!db.objectStoreNames.contains('connections')) {
        const connStore = db.createObjectStore('connections', { keyPath: 'id' });
        connStore.createIndex('by-canvas', 'canvasId');
      } else if (oldVersion < 2) {
        // 迁移: workspaceId → canvasId
        const connStore = transaction.objectStore('connections');
        if (connStore.indexNames.contains('by-workspace')) {
          connStore.deleteIndex('by-workspace');
        }
        if (!connStore.indexNames.contains('by-canvas')) {
          connStore.createIndex('by-canvas', 'canvasId');
        }
      }

      // 数据迁移: 创建默认项目和画布，迁移现有数据
      if (oldVersion < 2 && oldVersion > 0) {
        const now = new Date().toISOString();

        // 创建默认项目
        const projectStore = transaction.objectStore('projects');
        projectStore.put({
          id: DEFAULT_PROJECT_ID,
          name: '默认项目',
          description: '从旧版本迁移的数据',
          createdAt: now,
          updatedAt: now,
        });

        // 创建默认画布
        const canvasStore = transaction.objectStore('canvases');
        canvasStore.put({
          id: DEFAULT_CANVAS_ID,
          projectId: DEFAULT_PROJECT_ID,
          name: '主画布',
          createdAt: now,
          updatedAt: now,
          isDefault: true,
        });

        // 迁移节点数据: workspaceId → canvasId
        const nodeStore = transaction.objectStore('nodes');
        nodeStore.openCursor().then(function migratNodes(cursor) {
          if (!cursor) return;
          const node = cursor.value as any;
          if (node.workspaceId && !node.canvasId) {
            delete node.workspaceId;
            node.canvasId = DEFAULT_CANVAS_ID;
            cursor.update(node);
          }
          return cursor.continue().then(migratNodes);
        });

        // 迁移连接数据
        const connStore = transaction.objectStore('connections');
        connStore.openCursor().then(function migrateConns(cursor) {
          if (!cursor) return;
          const conn = cursor.value as any;
          if (conn.workspaceId && !conn.canvasId) {
            delete conn.workspaceId;
            conn.canvasId = DEFAULT_CANVAS_ID;
            cursor.update(conn);
          }
          return cursor.continue().then(migrateConns);
        });
      }
    },
  });

  return dbInstance;
};

// ============ 配置相关 ============

export const saveAIConfig = async (config: AIModelConfig): Promise<void> => {
  const db = await getDB();
  await db.put('config', config, 'aiConfig');
};

export const loadAIConfig = async (): Promise<AIModelConfig | undefined> => {
  const db = await getDB();
  return db.get('config', 'aiConfig');
};

// ============ 自定义工具相关 ============

export const saveCustomTool = async (tool: Tool): Promise<void> => {
  const db = await getDB();
  await db.put('customTools', tool);
};

export const loadCustomTools = async (): Promise<Tool[]> => {
  const db = await getDB();
  return db.getAll('customTools');
};

export const deleteCustomTool = async (toolId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('customTools', toolId);
};

// ============ 项目管理 ============

export const createProject = async (name: string, description?: string): Promise<Project> => {
  const db = await getDB();
  const now = new Date().toISOString();
  const project: Project = {
    id: nanoid(),
    name,
    description,
    createdAt: now,
    updatedAt: now,
  };
  await db.put('projects', project);

  // 自动创建默认画布
  await createCanvas(project.id, '主画布', undefined, true);

  return project;
};

export const loadProjects = async (): Promise<Project[]> => {
  const db = await getDB();
  const projects = await db.getAll('projects');
  // 按更新时间降序
  return projects.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
};

export const updateProject = async (id: string, updates: Partial<Pick<Project, 'name' | 'description'>>): Promise<void> => {
  const db = await getDB();
  const project = await db.get('projects', id);
  if (project) {
    await db.put('projects', {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  const db = await getDB();

  // 获取项目下所有画布
  const canvases = await db.getAllFromIndex('canvases', 'by-project', projectId);

  // 删除每个画布及其数据
  for (const canvas of canvases) {
    await deleteCanvas(canvas.id);
  }

  // 删除项目
  await db.delete('projects', projectId);
};

// ============ 画布管理 ============

export const createCanvas = async (
  projectId: string,
  name: string,
  description?: string,
  isDefault?: boolean
): Promise<CanvasData> => {
  const db = await getDB();
  const now = new Date().toISOString();
  const canvas: CanvasData = {
    id: nanoid(),
    projectId,
    name,
    description,
    createdAt: now,
    updatedAt: now,
    isDefault,
  };
  await db.put('canvases', canvas);

  // 更新项目时间
  const project = await db.get('projects', projectId);
  if (project) {
    await db.put('projects', { ...project, updatedAt: now });
  }

  return canvas;
};

export const loadCanvases = async (projectId: string): Promise<CanvasData[]> => {
  const db = await getDB();
  const canvases = await db.getAllFromIndex('canvases', 'by-project', projectId);
  // 默认画布排第一，其余按创建时间
  return canvases.sort((a, b) => {
    if (a.isDefault) return -1;
    if (b.isDefault) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
};

export const updateCanvas = async (id: string, updates: Partial<Pick<CanvasData, 'name' | 'description'>>): Promise<void> => {
  const db = await getDB();
  const canvas = await db.get('canvases', id);
  if (canvas) {
    const now = new Date().toISOString();
    await db.put('canvases', {
      ...canvas,
      ...updates,
      updatedAt: now,
    });
    // 更新项目时间
    const project = await db.get('projects', canvas.projectId);
    if (project) {
      await db.put('projects', { ...project, updatedAt: now });
    }
  }
};

export const deleteCanvas = async (canvasId: string): Promise<void> => {
  const db = await getDB();

  // 删除画布下所有节点
  const nodes = await db.getAllFromIndex('nodes', 'by-canvas', canvasId);
  for (const node of nodes) {
    await db.delete('nodes', node.id);
  }

  // 删除画布下所有连接
  const conns = await db.getAllFromIndex('connections', 'by-canvas', canvasId);
  for (const conn of conns) {
    await db.delete('connections', conn.id);
  }

  // 删除画布下所有快照
  const snapshots = await db.getAllFromIndex('snapshots', 'by-canvas', canvasId);
  for (const snapshot of snapshots) {
    await db.delete('snapshotData', snapshot.id);
    await db.delete('snapshots', snapshot.id);
  }

  // 删除画布
  await db.delete('canvases', canvasId);
};

export const duplicateCanvas = async (canvasId: string, newName: string): Promise<CanvasData> => {
  const db = await getDB();
  const sourceCanvas = await db.get('canvases', canvasId);
  if (!sourceCanvas) throw new Error('Canvas not found');

  // 创建新画布
  const newCanvas = await createCanvas(sourceCanvas.projectId, newName);

  // 复制节点
  const nodes = await db.getAllFromIndex('nodes', 'by-canvas', canvasId);
  const nodeIdMap = new Map<string, string>();

  for (const node of nodes) {
    const { canvasId: _, ...nodeData } = node;
    const newId = nanoid();
    nodeIdMap.set(node.id, newId);
    await db.put('nodes', {
      ...nodeData,
      id: newId,
      canvasId: newCanvas.id,
    });
  }

  // 复制连接（更新节点 ID 引用）
  const conns = await db.getAllFromIndex('connections', 'by-canvas', canvasId);
  for (const conn of conns) {
    const { canvasId: _, ...connData } = conn;
    await db.put('connections', {
      ...connData,
      id: nanoid(),
      sourceId: nodeIdMap.get(conn.sourceId) || conn.sourceId,
      targetId: nodeIdMap.get(conn.targetId) || conn.targetId,
      canvasId: newCanvas.id,
    });
  }

  return newCanvas;
};

// ============ 图谱数据（画布级） ============

export const saveCanvasData = async (
  canvasId: string,
  nodes: IntelNode[],
  connections: Connection[]
): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(['nodes', 'connections', 'canvases'], 'readwrite');

  // 清除当前画布的旧数据
  const nodeStore = tx.objectStore('nodes');
  const connStore = tx.objectStore('connections');

  const existingNodes = await nodeStore.index('by-canvas').getAllKeys(canvasId);
  const existingConns = await connStore.index('by-canvas').getAllKeys(canvasId);

  for (const key of existingNodes) {
    await nodeStore.delete(key);
  }
  for (const key of existingConns) {
    await connStore.delete(key);
  }

  // 写入新数据
  for (const node of nodes) {
    await nodeStore.put({ ...node, canvasId });
  }
  for (const conn of connections) {
    await connStore.put({ ...conn, canvasId });
  }

  // 更新画布时间
  const canvasStore = tx.objectStore('canvases');
  const canvas = await canvasStore.get(canvasId);
  if (canvas) {
    await canvasStore.put({ ...canvas, updatedAt: new Date().toISOString() });
  }

  await tx.done;
};

export const loadCanvasData = async (canvasId: string): Promise<{
  nodes: IntelNode[];
  connections: Connection[];
}> => {
  const db = await getDB();

  const nodesWithCanvas = await db.getAllFromIndex('nodes', 'by-canvas', canvasId);
  const connsWithCanvas = await db.getAllFromIndex('connections', 'by-canvas', canvasId);

  // 移除 canvasId 字段返回
  const nodes: IntelNode[] = nodesWithCanvas.map(({ canvasId: _, ...node }) => node as IntelNode);
  const connections: Connection[] = connsWithCanvas.map(({ canvasId: _, ...conn }) => conn as Connection);

  return { nodes, connections };
};

// ============ 快照管理 ============

export const createSnapshot = async (
  canvasId: string,
  name: string,
  trigger: SnapshotTrigger,
  nodes: IntelNode[],
  connections: Connection[],
  description?: string
): Promise<Snapshot> => {
  const db = await getDB();
  const id = nanoid();
  const now = new Date().toISOString();

  const snapshot: Snapshot = {
    id,
    canvasId,
    name,
    description,
    createdAt: now,
    trigger,
    nodeCount: nodes.length,
    connectionCount: connections.length,
  };

  const snapshotData: SnapshotData = {
    snapshotId: id,
    nodes,
    connections,
  };

  await db.put('snapshots', snapshot);
  await db.put('snapshotData', snapshotData);

  return snapshot;
};

export const loadSnapshots = async (canvasId: string): Promise<Snapshot[]> => {
  const db = await getDB();
  const snapshots = await db.getAllFromIndex('snapshots', 'by-canvas', canvasId);
  // 按创建时间降序
  return snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const loadSnapshotData = async (snapshotId: string): Promise<SnapshotData | undefined> => {
  const db = await getDB();
  return db.get('snapshotData', snapshotId);
};

export const deleteSnapshot = async (snapshotId: string): Promise<void> => {
  const db = await getDB();
  await db.delete('snapshotData', snapshotId);
  await db.delete('snapshots', snapshotId);
};

export const updateSnapshot = async (id: string, updates: Partial<Pick<Snapshot, 'name' | 'description'>>): Promise<void> => {
  const db = await getDB();
  const snapshot = await db.get('snapshots', id);
  if (snapshot) {
    await db.put('snapshots', { ...snapshot, ...updates });
  }
};

// 清理旧快照（保留最近 N 个）
export const cleanupSnapshots = async (canvasId: string, keepCount: number = 20): Promise<number> => {
  const db = await getDB();
  const snapshots = await loadSnapshots(canvasId);

  if (snapshots.length <= keepCount) return 0;

  const toDelete = snapshots.slice(keepCount);
  for (const snapshot of toDelete) {
    await deleteSnapshot(snapshot.id);
  }

  return toDelete.length;
};

// ============ 兼容旧 API（保持向后兼容） ============

/**
 * @deprecated 使用 saveCanvasData 替代
 */
export const saveGraphData = async (
  nodes: IntelNode[],
  connections: Connection[]
): Promise<void> => {
  // 确保默认项目和画布存在
  await ensureDefaultProjectAndCanvas();
  await saveCanvasData(DEFAULT_CANVAS_ID, nodes, connections);
};

/**
 * @deprecated 使用 loadCanvasData 替代
 */
export const loadGraphData = async (): Promise<{
  nodes: IntelNode[];
  connections: Connection[];
}> => {
  await ensureDefaultProjectAndCanvas();
  return loadCanvasData(DEFAULT_CANVAS_ID);
};

export const hasGraphData = async (): Promise<boolean> => {
  const db = await getDB();
  await ensureDefaultProjectAndCanvas();
  const count = await db.countFromIndex('nodes', 'by-canvas', DEFAULT_CANVAS_ID);
  return count > 0;
};

// 确保默认项目和画布存在（首次使用或迁移后）
const ensureDefaultProjectAndCanvas = async (): Promise<void> => {
  const db = await getDB();

  // 检查默认项目
  let project = await db.get('projects', DEFAULT_PROJECT_ID);
  if (!project) {
    const now = new Date().toISOString();
    project = {
      id: DEFAULT_PROJECT_ID,
      name: '默认项目',
      createdAt: now,
      updatedAt: now,
    };
    await db.put('projects', project);
  }

  // 检查默认画布
  const canvas = await db.get('canvases', DEFAULT_CANVAS_ID);
  if (!canvas) {
    const now = new Date().toISOString();
    await db.put('canvases', {
      id: DEFAULT_CANVAS_ID,
      projectId: DEFAULT_PROJECT_ID,
      name: '主画布',
      createdAt: now,
      updatedAt: now,
      isDefault: true,
    });
  }
};

// ============ 初始化（应用启动时调用） ============

export const initializeStorage = async (): Promise<{
  currentProjectId: string;
  currentCanvasId: string;
}> => {
  await ensureDefaultProjectAndCanvas();

  // 加载上次使用的项目和画布
  const db = await getDB();
  const lastProjectId = await db.get('config', 'lastProjectId') as string | undefined;
  const lastCanvasId = await db.get('config', 'lastCanvasId') as string | undefined;

  // 验证是否存在
  let projectId = DEFAULT_PROJECT_ID;
  let canvasId = DEFAULT_CANVAS_ID;

  if (lastProjectId) {
    const project = await db.get('projects', lastProjectId);
    if (project) projectId = lastProjectId;
  }

  if (lastCanvasId) {
    const canvas = await db.get('canvases', lastCanvasId);
    if (canvas && canvas.projectId === projectId) {
      canvasId = lastCanvasId;
    } else {
      // 获取项目的默认画布
      const canvases = await loadCanvases(projectId);
      if (canvases.length > 0) {
        canvasId = canvases[0].id;
      }
    }
  }

  return { currentProjectId: projectId, currentCanvasId: canvasId };
};

export const saveLastUsed = async (projectId: string, canvasId: string): Promise<void> => {
  const db = await getDB();
  await db.put('config', projectId, 'lastProjectId');
  await db.put('config', canvasId, 'lastCanvasId');
};

// ============ 导出/导入 ============

export interface ExportData {
  version: string;
  exportedAt: string;
  nodes: IntelNode[];
  connections: Connection[];
  customTools: Tool[];
  aiConfig?: AIModelConfig;
}

export interface ExportCanvasData {
  version: string;
  exportedAt: string;
  canvas: Omit<CanvasData, 'id' | 'projectId'>;
  nodes: IntelNode[];
  connections: Connection[];
}

export interface ExportProjectData {
  version: string;
  exportedAt: string;
  project: Omit<Project, 'id'>;
  canvases: Array<{
    canvas: Omit<CanvasData, 'id' | 'projectId'>;
    nodes: IntelNode[];
    connections: Connection[];
  }>;
}

/**
 * 导出单个画布
 */
export const exportCanvas = async (canvasId: string): Promise<ExportCanvasData> => {
  const db = await getDB();
  const canvas = await db.get('canvases', canvasId);
  if (!canvas) throw new Error('Canvas not found');

  const { nodes, connections } = await loadCanvasData(canvasId);
  const { id, projectId, ...canvasData } = canvas;

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    canvas: canvasData,
    nodes,
    connections,
  };
};

/**
 * 导出整个项目
 */
export const exportProject = async (projectId: string): Promise<ExportProjectData> => {
  const db = await getDB();
  const project = await db.get('projects', projectId);
  if (!project) throw new Error('Project not found');

  const canvases = await loadCanvases(projectId);
  const canvasExports = await Promise.all(
    canvases.map(async (canvas) => {
      const { nodes, connections } = await loadCanvasData(canvas.id);
      const { id, projectId, ...canvasData } = canvas;
      return { canvas: canvasData, nodes, connections };
    })
  );

  const { id, ...projectData } = project;

  return {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    project: projectData,
    canvases: canvasExports,
  };
};

/**
 * 导入画布到项目
 */
export const importCanvas = async (
  projectId: string,
  data: ExportCanvasData
): Promise<CanvasData> => {
  const canvas = await createCanvas(projectId, data.canvas.name, data.canvas.description);
  await saveCanvasData(canvas.id, data.nodes, data.connections);
  return canvas;
};

/**
 * 导入项目
 */
export const importProject = async (data: ExportProjectData): Promise<Project> => {
  const project = await createProject(data.project.name, data.project.description);

  // 删除自动创建的默认画布
  const defaultCanvases = await loadCanvases(project.id);
  for (const canvas of defaultCanvases) {
    await deleteCanvas(canvas.id);
  }

  // 导入所有画布
  for (const canvasData of data.canvases) {
    const canvas = await createCanvas(
      project.id,
      canvasData.canvas.name,
      canvasData.canvas.description,
      canvasData.canvas.isDefault
    );
    await saveCanvasData(canvas.id, canvasData.nodes, canvasData.connections);
  }

  return project;
};

/**
 * @deprecated 使用 exportCanvas 或 exportProject 替代
 */
export const exportAllData = async (
  nodes: IntelNode[],
  connections: Connection[],
  customTools: Tool[],
  aiConfig: AIModelConfig
): Promise<ExportData> => {
  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    nodes,
    connections,
    customTools: customTools.filter(t => t.isCustom),
    aiConfig,
  };
};

export const clearAllData = async (): Promise<void> => {
  const db = await getDB();
  const tx = db.transaction(
    ['nodes', 'connections', 'customTools', 'config', 'projects', 'canvases', 'snapshots', 'snapshotData'],
    'readwrite'
  );

  await tx.objectStore('nodes').clear();
  await tx.objectStore('connections').clear();
  await tx.objectStore('customTools').clear();
  await tx.objectStore('config').clear();
  await tx.objectStore('projects').clear();
  await tx.objectStore('canvases').clear();
  await tx.objectStore('snapshots').clear();
  await tx.objectStore('snapshotData').clear();

  await tx.done;
};
