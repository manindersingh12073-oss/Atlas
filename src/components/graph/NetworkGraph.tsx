"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { useEdgesState, useNodesState, type Edge } from "@xyflow/react";

import { AskAtlasButton } from "@/components/assistant/AskAtlasButton";
import type {
  GraphEdgeKind,
  GraphNodeKind,
  NetworkGraphData,
} from "@/lib/graph/queries";
import {
  EDGE_COLOR,
  NODE_COLORS,
  computeForceLayout,
  nodeSize,
  relationshipColor,
} from "@/lib/graph/layout";
import { DetailsPanel } from "./DetailsPanel";
import { GraphCanvas } from "./GraphCanvas";
import { GraphHelpPanel } from "./GraphHelpPanel";
import type { AtlasFlowNode } from "./nodes";

// Interaction + orchestration layer: owns filter / selection / search / tooltip
// state, derives the React Flow elements, and composes the stats row, controls,
// tooltip, and details panel. Rendering primitives live in GraphCanvas / nodes.

type Layer = GraphNodeKind | "relationship";
const LAYER_CHIPS: { layer: Layer; label: string; color: string }[] = [
  { layer: "person", label: "People", color: NODE_COLORS.person },
  { layer: "company", label: "Companies", color: NODE_COLORS.company },
  { layer: "event", label: "Events", color: NODE_COLORS.event },
  { layer: "tag", label: "Tags", color: NODE_COLORS.tag },
  { layer: "relationship", label: "Relationships", color: "#9ca3af" },
];

type EdgeData = { kind: GraphEdgeKind; color: string };
type EdgeMode = "normal" | "highlight" | "dim";
const EMPTY_SET: Set<string> = new Set();

function isEdgeVisible(kind: GraphEdgeKind, layers: Set<Layer>): boolean {
  if (!layers.has("person")) return false; // every edge touches a person
  switch (kind) {
    case "person-company":
      return layers.has("company");
    case "person-event":
      return layers.has("event");
    case "person-tag":
      return layers.has("tag");
    case "relationship":
      return layers.has("relationship");
  }
}

function edgeStyle(color: string, kind: GraphEdgeKind, mode: EdgeMode): React.CSSProperties {
  if (mode === "highlight")
    return { stroke: color, strokeWidth: kind === "relationship" ? 2.6 : 2, opacity: 0.95 };
  if (mode === "dim") return { stroke: color, strokeWidth: 1, opacity: 0.06 };
  return {
    stroke: color,
    strokeWidth: kind === "relationship" ? 1.8 : 1,
    opacity: kind === "relationship" ? 0.75 : 0.45,
  };
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold" title={value}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

export function NetworkGraph({ data }: { data: NetworkGraphData }) {
  const router = useRouter();

  const nodeMap = useMemo(() => new Map(data.nodes.map((n) => [n.id, n])), [data]);
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const e of data.edges) {
      (m.get(e.source) ?? m.set(e.source, new Set()).get(e.source)!).add(e.target);
      (m.get(e.target) ?? m.set(e.target, new Set()).get(e.target)!).add(e.source);
    }
    return m;
  }, [data]);

  // Force layout runs once (client-only, memoised).
  const positions = useMemo(() => computeForceLayout(data.nodes, data.edges), [data]);

  const initialNodes = useMemo<AtlasFlowNode[]>(
    () =>
      data.nodes.map((n) => {
        const p = positions.get(n.id) ?? { x: 0, y: 0 };
        return {
          id: n.id,
          type: "atlas",
          position: { x: p.x, y: p.y },
          data: {
            kind: n.kind,
            label: n.label,
            size: nodeSize(n.degree),
            color: NODE_COLORS[n.kind],
          },
        };
      }),
    [data, positions],
  );

  const initialEdges = useMemo<Edge[]>(
    () =>
      data.edges.map((e) => {
        const color =
          e.kind === "relationship" ? relationshipColor(e.relType) : EDGE_COLOR;
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          type: "straight",
          data: { kind: e.kind, color } satisfies EdgeData,
          style: edgeStyle(color, e.kind, "normal"),
        };
      }),
    [data],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges] = useEdgesState(initialEdges);

  const [layers, setLayers] = useState<Set<Layer>>(
    () => new Set<Layer>(LAYER_CHIPS.map((c) => c.layer)),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [matchIds, setMatchIds] = useState<Set<string>>(EMPTY_SET);
  const [tooltip, setTooltip] = useState<{ id: string; x: number; y: number } | null>(null);

  // ── Single source of styling: derives node/edge visuals from selection,
  //    search matches, and visible layers. Called from event handlers only. ──
  const paint = useCallback(
    (sel: string | null, matches: Set<string>, lyrs: Set<Layer>) => {
      const nbr = sel ? adjacency.get(sel) ?? EMPTY_SET : null;
      const searching = matches.size > 0;
      setNodes((nds) =>
        nds.map((n) => {
          let dimmed = false;
          let highlighted = false;
          if (sel) {
            highlighted = n.id === sel;
            dimmed = !(n.id === sel || nbr!.has(n.id));
          } else if (searching) {
            highlighted = matches.has(n.id);
            dimmed = !matches.has(n.id);
          }
          return {
            ...n,
            hidden: !lyrs.has(n.data.kind),
            data: { ...n.data, dimmed, highlighted },
          };
        }),
      );
      setEdges((eds) =>
        eds.map((e) => {
          const ed = e.data as EdgeData;
          let mode: EdgeMode = "normal";
          if (sel) mode = e.source === sel || e.target === sel ? "highlight" : "dim";
          else if (searching) mode = "dim";
          return {
            ...e,
            hidden: !isEdgeVisible(ed.kind, lyrs),
            style: edgeStyle(ed.color, ed.kind, mode),
          };
        }),
      );
    },
    [adjacency, setNodes, setEdges],
  );

  // ── Handlers (all event-driven) ─────────────────────────────────────────────
  const toggleLayer = useCallback(
    (layer: Layer) => {
      const next = new Set(layers);
      if (next.has(layer)) next.delete(layer);
      else next.add(layer);
      setLayers(next);
      paint(selectedId, matchIds, next);
    },
    [layers, selectedId, matchIds, paint],
  );

  const selectNode = useCallback(
    (id: string) => {
      setSelectedId(id);
      paint(id, matchIds, layers);
    },
    [matchIds, layers, paint],
  );

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    paint(null, matchIds, layers);
  }, [matchIds, layers, paint]);

  const onSearchChange = useCallback(
    (q: string) => {
      const t = q.trim().toLowerCase();
      const matches = new Set<string>();
      if (t) for (const n of data.nodes) if (n.label.toLowerCase().includes(t)) matches.add(n.id);
      setSearch(q);
      setMatchIds(matches);
      setSelectedId(null); // search view takes over from any selection
      paint(null, matches, layers);
    },
    [data, layers, paint],
  );

  const resetLayout = useCallback(() => {
    setSelectedId(null);
    setSearch("");
    setMatchIds(EMPTY_SET);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        position: { ...(positions.get(n.id) ?? n.position) },
        hidden: !layers.has(n.data.kind),
        data: { ...n.data, dimmed: false, highlighted: false },
      })),
    );
    setEdges((eds) =>
      eds.map((e) => {
        const ed = e.data as EdgeData;
        return {
          ...e,
          hidden: !isEdgeVisible(ed.kind, layers),
          style: edgeStyle(ed.color, ed.kind, "normal"),
        };
      }),
    );
  }, [positions, layers, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: AtlasFlowNode) => selectNode(node.id),
    [selectNode],
  );
  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: AtlasFlowNode) => {
      const gn = nodeMap.get(node.id);
      if (gn) router.push(gn.navHref);
    },
    [nodeMap, router],
  );
  const onNodeMouseEnter = useCallback(
    (evt: React.MouseEvent, node: AtlasFlowNode) =>
      setTooltip({ id: node.id, x: evt.clientX, y: evt.clientY }),
    [],
  );
  const onNodeMouseLeave = useCallback(() => setTooltip(null), []);

  const tooltipNode = tooltip ? nodeMap.get(tooltip.id) : null;
  const selectedNode = selectedId ? nodeMap.get(selectedId) ?? null : null;

  // Client-serialized cluster description for "Explain cluster" / "Find a
  // connector" — no server tool needed, the graph is already loaded here.
  const clusterPrompt = useMemo(() => {
    if (!selectedId || !selectedNode) return null;
    const neighbourNames = [...(adjacency.get(selectedId) ?? [])]
      .slice(0, 12)
      .map((id) => nodeMap.get(id)?.label)
      .filter((n): n is string => !!n);
    const names = [selectedNode.label, ...neighbourNames].join(", ");
    return `Explain this part of my network: ${names}. What connects these, and is there a good connector or introduction opportunity here?`;
  }, [selectedId, selectedNode, adjacency, nodeMap]);

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold">Network Graph</h2>

      {/* ── How-to (collapsible, first-visit) ────────────────────────── */}
      <GraphHelpPanel />

      {/* ── Graph statistics ─────────────────────────────────────────── */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Most connected person"
          value={data.stats.mostConnectedPerson?.name ?? "—"}
          sub={
            data.stats.mostConnectedPerson
              ? `${data.stats.mostConnectedPerson.count} connections`
              : undefined
          }
        />
        <StatCard
          label="Most connected company"
          value={data.stats.mostConnectedCompany?.name ?? "—"}
          sub={
            data.stats.mostConnectedCompany
              ? `${data.stats.mostConnectedCompany.count} people`
              : undefined
          }
        />
        <StatCard
          label="Most connected event"
          value={data.stats.mostConnectedEvent?.name ?? "—"}
          sub={
            data.stats.mostConnectedEvent
              ? `${data.stats.mostConnectedEvent.count} attendees`
              : undefined
          }
        />
        <StatCard label="Largest community" value={`${data.stats.largestCommunitySize}`} sub="nodes" />
        <StatCard label="Total connections" value={`${data.stats.totalConnections}`} />
      </div>

      {/* ── Graph search + filter chips ──────────────────────────────── */}
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search the graph…"
          autoComplete="off"
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-gray-500 focus:outline-none dark:bg-[#161b22] sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          {LAYER_CHIPS.map((chip) => {
            const active = layers.has(chip.layer);
            return (
              <button
                key={chip.layer}
                type="button"
                onClick={() => toggleLayer(chip.layer)}
                aria-pressed={active}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-gray-300 bg-gray-50 text-gray-700 dark:border-[#3d444e] dark:bg-[#1c2230] dark:text-[#cdd5de]"
                    : "border-gray-200 text-gray-400 dark:border-[#30363d]"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: chip.color, opacity: active ? 1 : 0.4 }}
                />
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Canvas ───────────────────────────────────────────────────── */}
      <div className="relative h-[560px] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50/40 dark:bg-[#0f1117] sm:h-[620px]">
        {data.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm text-gray-500">
            Your network graph will appear here once you add people, events, and tags.
          </div>
        ) : (
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onResetLayout={resetLayout}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onPaneClick={clearSelection}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            clusterActionSlot={
              clusterPrompt ? (
                <AskAtlasButton
                  label="Explain cluster"
                  prompt={clusterPrompt}
                  className="inline-flex items-center gap-1.5 rounded-md border border-teal-200 bg-white/95 px-2.5 py-1 text-xs font-medium text-teal-700 shadow-sm hover:bg-teal-50 dark:border-teal-800/50 dark:bg-[#161b22]/95 dark:text-teal-300 dark:hover:bg-teal-500/10"
                />
              ) : null
            }
          />
        )}
      </div>

      {/* ── Hover tooltip ────────────────────────────────────────────── */}
      {tooltip && tooltipNode && (
        <div
          className="pointer-events-none fixed z-50 max-w-[220px] rounded-lg border border-gray-200 bg-white p-2.5 text-xs shadow-lg dark:border-[#30363d] dark:bg-[#161b22]"
          style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}
        >
          <p className="font-semibold">{tooltipNode.label}</p>
          <p className="capitalize text-gray-400">{tooltipNode.kind}</p>
          {tooltipNode.kind === "person" && (
            <div className="mt-1 space-y-0.5 text-gray-500">
              {tooltipNode.company && <p>{tooltipNode.company}</p>}
              <p>{tooltipNode.relationshipCount ?? 0} relationships</p>
              <p>{tooltipNode.eventCount ?? 0} events</p>
            </div>
          )}
          {tooltipNode.kind === "company" && (
            <p className="mt-1 text-gray-500">{tooltipNode.peopleCount ?? 0} people</p>
          )}
          {tooltipNode.kind === "event" && (
            <p className="mt-1 text-gray-500">{tooltipNode.attendeeCount ?? 0} attendees</p>
          )}
          {tooltipNode.kind === "tag" && (
            <p className="mt-1 text-gray-500">{tooltipNode.peopleCount ?? 0} people</p>
          )}
        </div>
      )}

      {/* ── Details panel ────────────────────────────────────────────── */}
      <DetailsPanel
        node={selectedNode}
        nodeMap={nodeMap}
        adjacency={adjacency}
        onSelectNode={selectNode}
        onClose={clearSelection}
      />
    </section>
  );
}
