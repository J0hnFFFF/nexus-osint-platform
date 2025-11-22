
import React, { useRef, useState } from 'react';
import { IntelNode, Connection, Position, NodeType } from '../types';
import { NodeCard } from './NodeCard';

interface CanvasProps {
  nodes: IntelNode[];
  connections: Connection[];
  selectedNodeIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onNodesMove: (delta: Position) => void;
  onConnect: (source: string, target: string) => void;
  onAddNode: (pos: Position, type: NodeType) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  searchTerm?: string;
}

type InteractionMode = 'IDLE' | 'PANNING' | 'DRAGGING_NODE' | 'CONNECTING';

export const Canvas: React.FC<CanvasProps> = ({
  nodes,
  connections,
  selectedNodeIds,
  onSelectionChange,
  onNodesMove,
  onConnect,
  onAddNode,
  onNodeContextMenu,
  searchTerm = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interaction State
  const [mode, setMode] = useState<InteractionMode>('IDLE');
  const [pointerStart, setPointerStart] = useState<Position>({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState<Position>({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [dragStartOffset, setDragStartOffset] = useState<Position>({ x: 0, y: 0 }); // Snapshot of pan when drag started
  
  // Connecting State
  const [connectionSourceId, setConnectionSourceId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });

  // Helper: Screen to Canvas Coordinates
  const getCanvasPos = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x) / scale,
      y: (clientY - rect.top - panOffset.y) / scale
    };
  };

  // --- Pointer Events Logic ---

  const handlePointerDown = (e: React.PointerEvent) => {
    // 1. Handle Panning
    // Middle Click, Right Click, Alt+Left, OR Left Click on Background
    if (
        e.button === 1 || 
        e.button === 2 || 
        (e.button === 0 && e.altKey) || 
        (e.button === 0 && e.target === containerRef.current)
    ) {
      if (e.button === 0 && !e.altKey) {
          // If left clicking background, clear selection
          onSelectionChange([]);
      }
      e.preventDefault();
      setMode('PANNING');
      setPointerStart({ x: e.clientX, y: e.clientY });
      setDragStartOffset({ ...panOffset });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      return;
    }
  };

  const handleNodePointerDown = (e: React.PointerEvent, nodeId: string) => {
    if (e.button !== 0) return; // Only left click drags nodes
    e.stopPropagation(); // Prevent canvas pan
    
    // Handle Selection
    const isSelected = selectedNodeIds.includes(nodeId);
    if (!isSelected && !e.shiftKey) {
      onSelectionChange([nodeId]);
    } else if (e.shiftKey) {
      onSelectionChange(isSelected ? selectedNodeIds.filter(id => id !== nodeId) : [...selectedNodeIds, nodeId]);
    }

    // Start Dragging Node
    setMode('DRAGGING_NODE');
    setPointerStart({ x: e.clientX, y: e.clientY });
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const startConnection = (e: React.PointerEvent, nodeId: string) => {
      e.stopPropagation();
      e.preventDefault();
      
      setMode('CONNECTING');
      setConnectionSourceId(nodeId);
      const cPos = getCanvasPos(e.clientX, e.clientY);
      setMousePos(cPos);
      containerRef.current?.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === 'CONNECTING') {
         const cPos = getCanvasPos(e.clientX, e.clientY);
         setMousePos(cPos);
    }

    if (mode === 'PANNING') {
      const dx = e.clientX - pointerStart.x;
      const dy = e.clientY - pointerStart.y;
      setPanOffset({
        x: dragStartOffset.x + dx,
        y: dragStartOffset.y + dy
      });
    } 
    else if (mode === 'DRAGGING_NODE') {
      const dx = (e.clientX - pointerStart.x) / scale;
      const dy = (e.clientY - pointerStart.y) / scale;
      if (dx !== 0 || dy !== 0) {
        onNodesMove({ x: dx, y: dy });
        setPointerStart({ x: e.clientX, y: e.clientY });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
        (e.target as Element).releasePointerCapture(e.pointerId);
        containerRef.current?.releasePointerCapture(e.pointerId);
    } catch (err) { /* ignore */ }

    if (mode === 'CONNECTING' && connectionSourceId) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const nodeElement = element?.closest('[data-node-id]');
        
        if (nodeElement) {
            const targetId = nodeElement.getAttribute('data-node-id');
            if (targetId && targetId !== connectionSourceId) {
                onConnect(connectionSourceId, targetId);
            }
        }
        setConnectionSourceId(null);
    }
    setMode('IDLE');
  };

  const handleWheel = (e: React.WheelEvent) => {
      // Zoom Logic
      e.preventDefault();
      e.stopPropagation();

      const ZOOM_SPEED = 0.001;
      const delta = -e.deltaY * ZOOM_SPEED;
      const newScale = Math.min(Math.max(scale + delta, 0.1), 5);
      
      if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;

          // Calculate cursor position in canvas space before zoom
          const canvasX = (mouseX - panOffset.x) / scale;
          const canvasY = (mouseY - panOffset.y) / scale;

          // Adjust pan to keep cursor fixed on canvas
          const newPanX = mouseX - canvasX * newScale;
          const newPanY = mouseY - canvasY * newScale;

          setPanOffset({ x: newPanX, y: newPanY });
          setScale(newScale);
      }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  // --- Rendering Connections ---
  const renderConnections = () => {
    return connections.map(conn => {
      const source = nodes.find(n => n.id === conn.sourceId);
      const target = nodes.find(n => n.id === conn.targetId);
      if (!source || !target) return null;

      // Check if source or target is dimmed (for connections too)
      const isDimmed = searchTerm && (
         !source.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
         !target.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
         !source.type.includes(searchTerm.toUpperCase()) &&
         !target.type.includes(searchTerm.toUpperCase())
      );
      
      // Source: Right side of the card (width 280)
      const sx = source.position.x + 280; 
      const sy = source.position.y + 40; // Approx vertical center of header

      // Target: Left side of the card
      const tx = target.position.x;
      const ty = target.position.y + 40;

      // Bezier curve
      const dist = Math.abs(tx - sx);
      const cp1x = sx + Math.max(dist * 0.5, 50);
      const cp1y = sy;
      const cp2x = tx - Math.max(dist * 0.5, 50);
      const cp2y = ty;

      const pathD = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${tx} ${ty}`;

      return (
        <g key={conn.id} style={{ opacity: isDimmed ? 0.2 : 1, transition: 'opacity 0.2s' }}>
            {/* Shadow / Outline for visibility */}
            <path d={pathD} fill="none" stroke="#000000" strokeWidth={5 / scale} strokeOpacity="0.5" />
            {/* Main Line */}
            <path
              d={pathD}
              fill="none"
              stroke={source.status === 'PROCESSING' ? "#22d3ee" : "#475569"}
              strokeWidth={2 / scale}
              markerEnd="url(#arrowhead)"
              className={source.status === 'PROCESSING' ? "animate-pulse" : ""}
            />
        </g>
      );
    });
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden grid-bg cursor-grab active:cursor-grabbing select-none touch-none bg-[#0B0F19]"
      style={{
        backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
        backgroundSize: `${40 * scale}px ${40 * scale}px`
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={handleContextMenu}
      onWheel={handleWheel}
    >
      {/* Content Wrapper */}
      <div
        className="absolute top-0 left-0 w-0 h-0 overflow-visible transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0'
        }}
      >
        {/* SVG Layer - Z-Index 0 (Behind Nodes) */}
        {/* Note: width/height set to large value to ensure visibility in all browsers despite 0x0 parent */}
        <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-none z-0"
            style={{ width: '20000px', height: '20000px', overflow: 'visible' }}
        >
          <defs>
             {/* refX=10 ensures the arrow tip (at x=10) touches the target point exactly */}
             <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#475569" />
             </marker>
          </defs>
          {renderConnections()}
          
          {/* Dragging Line */}
          {mode === 'CONNECTING' && connectionSourceId && (() => {
             const source = nodes.find(n => n.id === connectionSourceId);
             if(!source) return null;
             
             const sx = source.position.x + 280; 
             const sy = source.position.y + 40;
             const tx = mousePos.x;
             const ty = mousePos.y;
             
             const dist = Math.abs(tx - sx);
             const pathD = `M ${sx} ${sy} C ${sx + dist * 0.5} ${sy}, ${tx - dist * 0.5} ${ty}, ${tx} ${ty}`;

             return (
                 <path d={pathD} stroke="#ffffff" strokeWidth={2 / scale} strokeDasharray="5,5" fill="none" className="drop-shadow-md" />
             )
          })()}
        </svg>

        {/* Node Layer - Z-Index 10+ */}
        {nodes.map(node => {
          // Filtering logic
          const isMatch = !searchTerm || 
             node.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             node.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
             node.type.toLowerCase().includes(searchTerm.toLowerCase());
          
          return (
            <div key={node.id} style={{ opacity: isMatch ? 1 : 0.2, transition: 'opacity 0.2s' }}>
                <NodeCard
                    node={node}
                    isSelected={selectedNodeIds.includes(node.id)}
                    onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                    onStartConnect={(e) => startConnection(e, node.id)}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onNodeContextMenu(e, node.id);
                    }}
                />
            </div>
          )
        })}
      </div>
      
      <div className="absolute bottom-4 right-4 text-slate-500 text-[10px] font-mono pointer-events-none flex flex-col items-end gap-1 select-none bg-slate-900/80 p-2 rounded border border-slate-800 backdrop-blur">
         <div className="flex items-center gap-2 mb-1">
             <span className="font-bold text-cyan-400">CANVAS CONTROLS</span>
         </div>
         <span>PAN: Left Click Drag (Background) / Space+Drag</span>
         <span>ZOOM: Mouse Wheel</span>
         <span>SCALE: {(scale * 100).toFixed(0)}%</span>
         <span>OFFSET: {Math.round(panOffset.x)}, {Math.round(panOffset.y)}</span>
      </div>
    </div>
  );
};
