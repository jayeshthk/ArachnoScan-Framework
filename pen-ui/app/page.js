"use client";
import { useState } from "react";
import Tree from "react-d3-tree";

// --- Helper: Collapse nodes beyond level 1 ---
// Root is level 0; its children (level 1) will be visible, but their children (level 2 and deeper) will be collapsed.
function collapseTree(node, currentLevel = 0) {
  if (!node || !node.children) return;
  if (currentLevel === 1) {
    node.collapsed = true; // collapse any node at level 1 (hiding its children)
  } else {
    node.children.forEach((child) => collapseTree(child, currentLevel + 1));
  }
}

// --- DFS Tree Builder (avoids cycles) ---
function buildTreeDFS(nodeId, nodes, edges, visited = new Set()) {
  if (visited.has(nodeId)) return null;
  visited.add(nodeId);
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return null;

  // Find children edges (skip self-reference)
  const childrenEdges = edges.filter(
    (e) => e.source === nodeId && e.target !== nodeId
  );

  const children = [];
  for (const edge of childrenEdges) {
    const childTree = buildTreeDFS(edge.target, nodes, edges, new Set(visited));
    if (childTree) {
      children.push(childTree);
    }
  }
  return { ...node, children: children.length > 0 ? children : undefined };
}

// Build tree starting from node "1" (or first node)
function buildTree(nodes, edges) {
  const rootId = nodes.find((n) => n.id === "1")?.id || nodes[0].id;
  const tree = buildTreeDFS(rootId, nodes, edges);
  collapseTree(tree, 0); // collapse nodes at level 1 so that children beyond level 1 are hidden
  return tree;
}

// --- Custom Node Component ---
const CustomNode = ({ nodeDatum, toggleNode }) => {
  // Truncate label if too long (max 15 characters)
  const maxLabelLength = 15;
  const displayLabel =
    nodeDatum.label && nodeDatum.label.length > maxLabelLength
      ? nodeDatum.label.slice(0, maxLabelLength) + "..."
      : nodeDatum.label;

  return (
    <g onClick={toggleNode} className="cursor-pointer">
      {/* Node Background */}
      <rect
        width="160"
        height="70"
        x="-80"
        y="-35"
        rx="12"
        className="fill-white stroke-gray-400 shadow-lg"
      />
      {/* Node Label */}
      <text
        textAnchor="middle"
        dy="5"
        fill="black"
        fontSize="12"
        fontWeight="100"
        style={{
          fontFamily: "Inter, sans-serif",
          letterSpacing: "0.5px",
          opacity: 0.9,
        }}
      >
        {displayLabel}
      </text>
      {/* Expand/Collapse Indicator */}
      {nodeDatum.children && (
        <text x="60" y="30" fontSize="16" fontWeight="bold" fill="blue">
          {nodeDatum.__rd3t?.collapsed ? "+" : "-"}
        </text>
      )}
      {/* Analysis Tooltip (using foreignObject so it appears on top) */}
      {nodeDatum.hover && (
        <foreignObject
          x="90"
          y="-35"
          width="220"
          height="120"
          style={{ pointerEvents: "none" }}
        >
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            className="bg-white border border-gray-300 rounded-lg shadow-xl p-3 text-xs text-gray-700"
          >
            <p className="font-semibold">URL:</p>
            <p className="break-words">{nodeDatum.url}</p>
            <p className="mt-1 font-semibold">Analysis:</p>
            <p className="break-words">{nodeDatum.analysis}</p>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

// Wrapper to add hover state to nodeDatum
const CustomNodeWithHover = (props) => {
  const [hover, setHover] = useState(false);
  const extendedNodeDatum = { ...props.nodeDatum, hover };

  return (
    <g
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={props.toggleNode}
      className="cursor-pointer"
    >
      <CustomNode {...props} nodeDatum={extendedNodeDatum} />
    </g>
  );
};

// --- Main Component ---
export default function TreeVisualizer() {
  const [url, setUrl] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Async fetch with loading state
  const handleFetchData = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/crawler/", {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: [url],
          inside: false,
          threads: 8,
          depth: 1,
          max_size: -1,
          insecure: false,
          subs: false,
          json: false,
          show_source: false,
          show_where: false,
          headers: "",
          unique: false,
          proxy: "",
          timeout: -1,
          disable_redirects: false,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      // Expected response structure: { nodes: [...], edges: [...] }
      const data = await res.json();
      const tree = buildTree(data.nodes, data.edges);
      setTreeData(tree);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white drop-shadow-md my-4">
        🌍 Link Analysis
      </h1>

      <form
        className="flex flex-col md:flex-row gap-2 mt-4 w-full max-w-xl"
        onSubmit={handleFetchData}
      >
        <input
          type="text"
          className="w-full p-3 rounded-lg shadow-md border border-gray-300 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          placeholder="Enter a URL (e.g., https://www.arkvien.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition"
        >
          Analyze
        </button>
      </form>

      {loading && (
        <div className="mt-8 flex flex-col items-center">
          <svg
            className="animate-spin h-10 w-10 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Loading data...
          </p>
        </div>
      )}

      {treeData && !loading && (
        <div className="mt-8 w-full h-[80vh] md:h-[85vh] p-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
          <div id="treeWrapper" className="w-full h-full">
            <Tree
              data={treeData}
              orientation="vertical"
              collapsible
              nodeSize={{ x: 180, y: 120 }}
              separation={{ siblings: 1, nonSiblings: 1.5 }}
              translate={{ x: window.innerWidth / 2, y: 100 }}
              renderCustomNodeElement={(rd3tProps) => (
                <CustomNodeWithHover {...rd3tProps} />
              )}
            />
          </div>
        </div>
      )}

      {!treeData && !loading && (
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400">
          Enter a URL to visualize its structure.
        </p>
      )}
    </div>
  );
}
