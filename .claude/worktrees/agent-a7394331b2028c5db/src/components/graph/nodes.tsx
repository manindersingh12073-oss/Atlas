"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

import type { GraphNodeKind } from "@/lib/graph/queries";

// Rendering-only node definition. All geometry/colour decisions arrive as data
// (computed in the layout layer); this component just draws them. Selection
// highlight is driven by `data.highlighted` so the interaction layer has full
// control (React Flow's own selection is disabled).

export type AtlasNodeData = {
  kind: GraphNodeKind;
  label: string;
  size: number;
  color: string;
  dimmed?: boolean;
  highlighted?: boolean;
};

export type AtlasFlowNode = Node<AtlasNodeData, "atlas">;

const HANDLE_STYLE: React.CSSProperties = {
  width: 1,
  height: 1,
  minWidth: 0,
  minHeight: 0,
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  opacity: 0,
  border: "none",
  background: "transparent",
  pointerEvents: "none",
};

function AtlasNodeComponent({ data }: NodeProps<AtlasFlowNode>) {
  const { label, size, color, dimmed, highlighted } = data;

  return (
    <div
      className="relative flex items-center justify-center rounded-full transition-[opacity,box-shadow] duration-150"
      style={{
        width: size,
        height: size,
        background: color,
        opacity: dimmed ? 0.18 : 1,
        boxShadow: highlighted
          ? `0 0 0 4px ${color}55`
          : "0 1px 3px rgba(0,0,0,0.18)",
      }}
    >
      {/* Hidden, centred handles so edges connect node centres. */}
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} isConnectable={false} />
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} isConnectable={false} />

      <span
        className="pointer-events-none absolute left-1/2 top-full mt-1 max-w-[120px] -translate-x-1/2 truncate text-center text-[10px] font-medium text-gray-600 dark:text-[#8b949e]"
        style={{ opacity: dimmed ? 0.25 : 1 }}
      >
        {label}
      </span>
    </div>
  );
}

export const nodeTypes = { atlas: AtlasNodeComponent };
