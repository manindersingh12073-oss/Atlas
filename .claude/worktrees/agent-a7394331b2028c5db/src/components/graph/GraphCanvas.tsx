"use client";

import {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlow,
  useReactFlow,
  type Edge,
  type OnNodesChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  NODE_COLORS,
  RELATIONSHIP_TYPE_COLORS,
  RELATIONSHIP_TYPE_LABELS,
} from "@/lib/graph/layout";
import { type AtlasFlowNode, type AtlasNodeData, nodeTypes } from "./nodes";

// Pure rendering layer: wires our nodes/edges into React Flow and adds the
// viewport controls, minimap, legend, and background. No data or interaction
// logic beyond viewport actions.

const NODE_LEGEND: { color: string; label: string }[] = [
  { color: NODE_COLORS.person, label: "People" },
  { color: NODE_COLORS.company, label: "Companies" },
  { color: NODE_COLORS.event, label: "Events" },
  { color: NODE_COLORS.tag, label: "Tags" },
];

const REL_LEGEND = Object.keys(RELATIONSHIP_TYPE_LABELS).map((type) => ({
  color: RELATIONSHIP_TYPE_COLORS[type],
  label: RELATIONSHIP_TYPE_LABELS[type],
}));

function ViewportButtons({ onResetLayout }: { onResetLayout: () => void }) {
  const { fitView } = useReactFlow();
  const btn =
    "rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium shadow-sm hover:bg-gray-50 dark:border-[#3d444e] dark:bg-[#161b22] dark:hover:bg-[#1c2230]";
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        className={btn}
        onClick={() => {
          onResetLayout();
          // Let the position reset flush before framing.
          requestAnimationFrame(() => fitView({ padding: 0.2, duration: 300 }));
        }}
      >
        Reset layout
      </button>
      <button
        type="button"
        className={btn}
        onClick={() => fitView({ padding: 0.1, duration: 300 })}
      >
        Fit to screen
      </button>
    </div>
  );
}

function Legend() {
  return (
    <div className="max-w-[220px] rounded-lg border border-gray-200 bg-white/90 p-2.5 shadow-sm backdrop-blur dark:border-[#30363d] dark:bg-[#161b22]/90">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Nodes
      </p>
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1">
        {NODE_LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        Relationships
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {REL_LEGEND.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-[#8b949e]">
            <span className="h-0.5 w-3 rounded" style={{ background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function GraphCanvas({
  nodes,
  edges,
  onNodesChange,
  onResetLayout,
  onNodeClick,
  onNodeDoubleClick,
  onPaneClick,
  onNodeMouseEnter,
  onNodeMouseLeave,
}: {
  nodes: AtlasFlowNode[];
  edges: Edge[];
  onNodesChange: OnNodesChange<AtlasFlowNode>;
  onResetLayout: () => void;
  onNodeClick: (event: React.MouseEvent, node: AtlasFlowNode) => void;
  onNodeDoubleClick: (event: React.MouseEvent, node: AtlasFlowNode) => void;
  onPaneClick: () => void;
  onNodeMouseEnter: (event: React.MouseEvent, node: AtlasFlowNode) => void;
  onNodeMouseLeave: () => void;
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      onPaneClick={onPaneClick}
      onNodeMouseEnter={onNodeMouseEnter}
      onNodeMouseLeave={onNodeMouseLeave}
      fitView
      onlyRenderVisibleElements
      minZoom={0.1}
      maxZoom={2.5}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: false }}
    >
      <Background gap={22} size={1} color="#e5e7eb" />
      <Controls showInteractive={false} />
      <MiniMap
        pannable
        zoomable
        nodeColor={(n) => (n.data as AtlasNodeData).color}
        nodeStrokeWidth={0}
        className="!hidden sm:!block"
      />
      <Panel position="top-right">
        <ViewportButtons onResetLayout={onResetLayout} />
      </Panel>
      <Panel position="top-left">
        <Legend />
      </Panel>
    </ReactFlow>
  );
}
