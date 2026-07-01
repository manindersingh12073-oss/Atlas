import type { GraphNodeKind } from "./queries";

// Pure, framework-agnostic graph geometry: node palette, sizing, and a
// dependency-free force-directed layout. No React / React Flow imports here —
// this is the "layout" half of graph generation, separate from rendering.

// ── Palette ─────────────────────────────────────────────────────────────────────
export const NODE_COLORS: Record<GraphNodeKind, string> = {
  person: "#3b82f6", // blue
  company: "#f97316", // orange
  event: "#22c55e", // green
  tag: "#a855f7", // purple
};

export const EDGE_COLOR = "#d1d5db"; // neutral grey (person↔company/event/tag)
export const DEFAULT_RELATIONSHIP_COLOR = "#9ca3af"; // untyped relationship

// Relationship edges are coloured by type (nodes keep their kind colour).
export const RELATIONSHIP_TYPE_COLORS: Record<string, string> = {
  met_together: "#14b8a6", // teal
  introduced_by: "#ec4899", // pink
  works_with: "#6366f1", // indigo
  co_founder: "#f59e0b", // amber
  friend: "#f43f5e", // rose
};

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  met_together: "Met together",
  introduced_by: "Introduced by",
  works_with: "Works with",
  co_founder: "Co-founder",
  friend: "Friend",
};

export function relationshipColor(type: string | undefined | null): string {
  return (type && RELATIONSHIP_TYPE_COLORS[type]) || DEFAULT_RELATIONSHIP_COLOR;
}

// ── Node sizing (diameter in px), scaled by degree/importance ───────────────────
// Wider range than a plain sqrt so highly-connected hubs clearly stand out.
const MIN_SIZE = 18;
const MAX_SIZE = 74;

export function nodeSize(degree: number): number {
  const size = MIN_SIZE + Math.sqrt(degree) * 11;
  return Math.round(Math.min(MAX_SIZE, size));
}

// ── Seeded RNG (deterministic layout across renders) ────────────────────────────
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Point = { x: number; y: number };

/**
 * Label-propagation community detection — dependency-free and near-linear.
 * Each node adopts the most common label among its neighbours over a few
 * shuffled passes. Returns a map of node id → community label (a number).
 * Used to pull natural clusters apart in the layout (not for colouring).
 */
export function detectCommunities(
  nodes: { id: string }[],
  edges: { source: string; target: string }[],
): Map<string, number> {
  const adj = new Map<string, string[]>();
  for (const node of nodes) adj.set(node.id, []);
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      adj.get(e.target)!.push(e.source);
    }
  }

  const label = new Map<string, number>();
  nodes.forEach((node, i) => label.set(node.id, i));

  const rand = mulberry32(0x1a2b3c4d);
  const order = nodes.map((node) => node.id);

  for (let iter = 0; iter < 8; iter++) {
    // Fisher–Yates shuffle for order independence.
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    let changed = false;
    for (const id of order) {
      const neighbours = adj.get(id)!;
      if (neighbours.length === 0) continue;
      const freq = new Map<number, number>();
      for (const nb of neighbours) {
        const l = label.get(nb)!;
        freq.set(l, (freq.get(l) ?? 0) + 1);
      }
      let best = label.get(id)!;
      let bestCount = -1;
      for (const [l, count] of freq) {
        if (count > bestCount || (count === bestCount && l < best)) {
          bestCount = count;
          best = l;
        }
      }
      if (label.get(id) !== best) {
        label.set(id, best);
        changed = true;
      }
    }
    if (!changed) break;
  }

  return label;
}

/**
 * Community-aware Fruchterman–Reingold layout. On top of pairwise repulsion and
 * edge attraction, each node feels a gentle gravity toward its community's
 * centre (communities are seeded on a ring), so natural clusters separate
 * instead of collapsing into one hairball. Bridge nodes settle between the
 * clusters they connect. O(n²) per iteration with a cooling schedule; iteration
 * count scales down for larger graphs so a one-time (memoised) run stays snappy.
 */
export function computeForceLayout(
  nodes: { id: string; degree: number }[],
  edges: { source: string; target: string }[],
  opts?: { iterations?: number },
): Map<string, Point> {
  const n = nodes.length;
  const result = new Map<string, Point>();
  if (n === 0) return result;
  if (n === 1) {
    result.set(nodes[0].id, { x: 0, y: 0 });
    return result;
  }

  const area = Math.max(800, Math.sqrt(n) * 200) ** 2;
  const k = Math.sqrt(area / n); // ideal edge length
  const iterations =
    opts?.iterations ?? (n <= 150 ? 260 : n <= 400 ? 150 : 90);
  const span = Math.sqrt(area);

  const rand = mulberry32(0x9e3779b9);
  const idx = new Map<string, number>();
  nodes.forEach((node, i) => idx.set(node.id, i));

  // ── Community centres arranged on a ring ────────────────────────────────────
  const communities = detectCommunities(nodes, edges);
  const communityIds = [...new Set(communities.values())];
  const centreRadius = communityIds.length > 1 ? span * 0.6 : 0;
  const centre = new Map<number, Point>();
  communityIds.forEach((c, i) => {
    const angle = (2 * Math.PI * i) / communityIds.length;
    centre.set(c, {
      x: Math.cos(angle) * centreRadius,
      y: Math.sin(angle) * centreRadius,
    });
  });
  const nodeCentre: Point[] = nodes.map(
    (node) => centre.get(communities.get(node.id)!) ?? { x: 0, y: 0 },
  );

  // Seed near community centre so clusters form quickly.
  const pos: Point[] = nodes.map((_, i) => ({
    x: nodeCentre[i].x + (rand() - 0.5) * span * 0.25,
    y: nodeCentre[i].y + (rand() - 0.5) * span * 0.25,
  }));

  const edgePairs: [number, number][] = [];
  for (const e of edges) {
    const a = idx.get(e.source);
    const b = idx.get(e.target);
    if (a !== undefined && b !== undefined && a !== b) edgePairs.push([a, b]);
  }

  const disp: Point[] = pos.map(() => ({ x: 0, y: 0 }));
  const GRAVITY = 0.06;
  let temp = span * 0.1;
  const cool = temp / (iterations + 1);
  const EPS = 0.01;

  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < n; i++) {
      disp[i].x = 0;
      disp[i].y = 0;
    }

    // Repulsion between every pair.
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let dx = pos[i].x - pos[j].x;
        let dy = pos[i].y - pos[j].y;
        let dist = Math.hypot(dx, dy);
        if (dist < EPS) {
          dx = (rand() - 0.5) * EPS;
          dy = (rand() - 0.5) * EPS;
          dist = EPS;
        }
        const force = (k * k) / dist;
        const ux = dx / dist;
        const uy = dy / dist;
        disp[i].x += ux * force;
        disp[i].y += uy * force;
        disp[j].x -= ux * force;
        disp[j].y -= uy * force;
      }
    }

    // Attraction along edges.
    for (const [a, b] of edgePairs) {
      let dx = pos[a].x - pos[b].x;
      let dy = pos[a].y - pos[b].y;
      const dist = Math.max(Math.hypot(dx, dy), EPS);
      const force = (dist * dist) / k;
      const ux = dx / dist;
      const uy = dy / dist;
      disp[a].x -= ux * force;
      disp[a].y -= uy * force;
      disp[b].x += ux * force;
      disp[b].y += uy * force;
    }

    // Gravity toward each node's community centre.
    for (let i = 0; i < n; i++) {
      disp[i].x += (nodeCentre[i].x - pos[i].x) * GRAVITY;
      disp[i].y += (nodeCentre[i].y - pos[i].y) * GRAVITY;
    }

    // Apply displacement, capped by the current temperature.
    for (let i = 0; i < n; i++) {
      const d = Math.max(Math.hypot(disp[i].x, disp[i].y), EPS);
      pos[i].x += (disp[i].x / d) * Math.min(d, temp);
      pos[i].y += (disp[i].y / d) * Math.min(d, temp);
    }

    temp = Math.max(temp - cool, 0);
  }

  nodes.forEach((node, i) => result.set(node.id, pos[i]));
  return result;
}
