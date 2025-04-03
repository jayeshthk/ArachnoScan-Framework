"use client";
import { useState, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";

const customNodes = new Set();

const CustomNode = ({ data }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="px-4 py-2 shadow-lg rounded-md bg-white border-2 border-blue-400 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="text-sm font-medium text-blue-600">{data.label}</div>

      {isHovered && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white shadow-xl rounded-lg p-4 border border-gray-200 z-50">
          <h3 className="font-bold text-gray-800 mb-2">Link Analysis</h3>
          <p className="text-sm text-gray-600">URL: {data.url}</p>
          <div className="mt-2">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
              Status: 200 OK
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

customNodes.add(CustomNode);

export default function FlowDiagram({ initialNodes, initialEdges }) {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div className="w-full h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={Object.fromEntries(
          Array.from(customNodes).map((nodeType) => [nodeType.name, nodeType])
        )}
        fitView
      >
        <Background className="bg-gray-200" />
        <Controls className="bg-white p-2 rounded-md shadow-md" />
      </ReactFlow>
    </div>
  );
}
