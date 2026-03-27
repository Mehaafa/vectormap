/* eslint-disable */
import React, { useState, useCallback, useEffect } from 'react';
import { ReactFlow, Controls, Background, applyNodeChanges, applyEdgeChanges, Node, Edge, Panel, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Scissors, Trash2, Save, FileText } from 'lucide-react';

const CustomNode = ({ data, isConnectable }: any) => {
  return (
    <div className={`px-4 py-3 shadow-xl rounded-xl border-2 bg-white flex flex-col items-center ${data.isRoot ? 'border-indigo-500' : 'border-gray-200'}`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500" />
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 mb-2 shadow-inner">
        {data.icon || <FileText className="text-indigo-500"/>}
      </div>
      <div className="text-sm font-bold text-gray-800">{data.label}</div>
      <div className="text-xs text-gray-500 mt-1">{data.subLabel}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-3 h-3 bg-indigo-500" />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

export default function HistoryTreeMap({ theme, activeVectorName, externalOperations }: { theme: string, activeVectorName?: string, externalOperations?: any[] }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onNodesChange = useCallback((changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
  
  // Sync external operations from OVE into the tree dynamically per-vector
  useEffect(() => {
    const rootNodeId = 'root-vector';
    const rootNode: Node = {
      id: rootNodeId,
      type: 'custom',
      position: { x: 250, y: 50 },
      data: { 
        label: activeVectorName || 'Untitled Vector', 
        subLabel: 'Original Imported Baseline', 
        isRoot: true, 
        icon: <div className="text-xl">🧬</div> 
      }
    };

    if (externalOperations && externalOperations.length > 0) {
      const liveNodes = externalOperations.map((op, i) => ({
        id: op.id,
        type: 'custom',
        position: { x: 250, y: (i + 1) * 160 + 50 },
        data: {
          label: op.label,
          subLabel: `${op.size} bp`,
          icon: <span className="text-xl">✍️</span>
        }
      }));
      
      const liveEdges = externalOperations.map((op, i) => {
        // Link the first operation to the baseline root, and subsequent ops to their direct ancestor
        const sourceId = i === 0 ? rootNodeId : externalOperations[i-1].id; 
        return {
          id: `e-${sourceId}-${op.id}`,
          source: sourceId,
          target: op.id,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3 }
        };
      });
      
      setNodes([rootNode, ...liveNodes]);
      setEdges(liveEdges);
    } else {
      setNodes([rootNode]);
      setEdges([]);
    }
  }, [externalOperations, activeVectorName]);

  const onNodeClick = (event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const handleTrimHistory = () => {
    if (!selectedNode) return;
    
    // Trim visually: Make the selected node the new apparent "Root" and discard earlier history lines
    const newNodes = [
      {
        ...selectedNode,
        position: { x: 250, y: 50 }, // Move to Top
        data: { ...selectedNode.data, isRoot: true, subLabel: selectedNode.data.subLabel + ' (Trimmed Baseline)' }
      }
    ];
    setNodes(newNodes);
    setEdges([]);
    setSelectedNode(null);
    alert('History Trimmed! The selected edit state has been flattened into a new Baseline Root, discarding previous overhead.');
  };

  const handleReset = () => {
    // Triggers local component reset. In a real app this would dispatch to clear externalOperations array.
    setSelectedNode(null);
  };

  return (
    <div className={`w-full h-full flex flex-col ${theme === 'dark' ? 'bg-gray-900 border-l border-gray-800' : 'bg-gray-50 border-l border-gray-200'}`}>
      
      {/* Header Context Menu */}
      <div className={`h-20 shrink-0 px-8 flex justify-between items-center border-b shadow-sm z-10 ${theme === 'dark' ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div>
          <h2 className={`text-2xl font-extrabold flex items-center tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Cloning History Tree
            <span className="ml-4 px-2.5 py-1 text-[11px] uppercase tracking-wider font-bold rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">SnapGene Mode</span>
          </h2>
          <p className={`mt-1 text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Graphic record generation and precise ancestry trimming workspace.</p>
        </div>
        
        {/* Dynamic Action Toolbar based on selection */}
        {selectedNode ? (
          <div className="flex space-x-3 items-center animate-in fade-in zoom-in slide-in-from-right-4 duration-300">
            <div className={`px-4 py-2 flex items-center text-sm font-medium rounded-xl border shadow-inner ${theme === 'dark' ? 'bg-gray-950 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
              <span className="opacity-50 mr-2">Target:</span>
              <span className="font-bold text-indigo-500">{selectedNode.data.label as React.ReactNode}</span>
            </div>
            <button 
              onClick={handleTrimHistory}
              className="flex items-center px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-500/20 transition-all hover:-translate-y-0.5"
            >
              <Trash2 size={18} className="mr-2" />
              Trim History
            </button>
          </div>
        ) : (
          <div className={`px-4 py-2 text-sm font-medium italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
            Select any node below to enable trimming actions...
          </div>
        )}
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 w-full relative">
        <ReactFlow 
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className={`transition-colors ${theme === 'dark' ? 'bg-dotted-spacing-6 bg-dotted-gray-800' : 'bg-dotted-spacing-6 bg-dotted-gray-300'}`}
        >
          <Background color={theme === 'dark' ? '#374151' : '#cbd5e1'} gap={24} size={2} />
          <Controls className={`shadow-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`} />
          
          <Panel position="bottom-left" className={`p-4 rounded-xl shadow-xl border backdrop-blur-md ${theme === 'dark' ? 'bg-gray-900/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
            <h3 className={`font-bold text-sm mb-2 ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Workspace Controls</h3>
            <button 
              onClick={handleReset} 
              className={`w-full py-2 px-4 text-xs font-bold rounded-lg transition-colors ${theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
            >
              Reset Mock Ancestry
            </button>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}
