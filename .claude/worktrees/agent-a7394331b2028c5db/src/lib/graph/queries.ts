import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

// ── Graph model (data-generation layer; no rendering concerns) ──────────────────

export type GraphNodeKind = "person" | "company" | "event" | "tag";

export type GraphNode = {
  id: string; // unique across the graph, prefixed by kind (e.g. "person:uuid")
  kind: GraphNodeKind;
  label: string;
  degree: number; // total incident edges → drives node size
  navHref: string; // double-click navigation target
  // Tooltip metadata (only the fields relevant to the kind are populated):
  company?: string | null;
  relationshipCount?: number;
  eventCount?: number;
  peopleCount?: number;
  attendeeCount?: number;
};

export type GraphEdgeKind =
  | "person-company"
  | "person-event"
  | "person-tag"
  | "relationship";

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  kind: GraphEdgeKind;
  relType?: string; // relationship type (only for kind === "relationship")
};

export type GraphStats = {
  mostConnectedPerson: { name: string; count: number } | null;
  mostConnectedCompany: { name: string; count: number } | null;
  mostConnectedEvent: { name: string; count: number } | null;
  largestCommunitySize: number;
  totalConnections: number;
};

export type NetworkGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  stats: GraphStats;
};

// ── Node id helpers ─────────────────────────────────────────────────────────────
const personId = (id: string) => `person:${id}`;
const companyId = (key: string) => `company:${key}`;
const eventId = (id: string) => `event:${id}`;
const tagId = (id: string) => `tag:${id}`;

// ── Query ─────────────────────────────────────────────────────────────────────

/**
 * Builds the full network graph (nodes + edges + summary stats) for the
 * authenticated user. Six parallel table reads — all owner-scoped via RLS,
 * no N+1. Companies are derived from `people.company` (there is no company
 * table). All graph maths (degree, stats, largest community) is computed here
 * once, so rendering never recomputes it.
 */
export async function getNetworkGraphData(
  supabase: SupabaseClient<Database>,
): Promise<NetworkGraphData> {
  const [
    peopleResult,
    eventsResult,
    tagsResult,
    eventPeopleResult,
    personTagsResult,
    relationshipsResult,
  ] = await Promise.all([
    supabase.from("people").select("id, name, company"),
    supabase.from("events").select("id, name"),
    supabase.from("tags").select("id, name"),
    supabase.from("event_people").select("person_id, event_id"),
    supabase.from("person_tags").select("person_id, tag_id"),
    // person_relationships cast until db:types is regenerated post-migration.
    (async () => {
      try {
        const { data, error } = await (supabase as any)
          .from("person_relationships")
          .select("id, person_a, person_b, type");
        return { data: error ? [] : (data ?? []) };
      } catch {
        return { data: [] };
      }
    })(),
  ]);

  const people = (peopleResult.data ?? []) as {
    id: string;
    name: string;
    company: string | null;
  }[];
  const events = (eventsResult.data ?? []) as { id: string; name: string }[];
  const tags = (tagsResult.data ?? []) as { id: string; name: string }[];
  const eventPeople = (eventPeopleResult.data ?? []) as {
    person_id: string;
    event_id: string;
  }[];
  const personTags = (personTagsResult.data ?? []) as {
    person_id: string;
    tag_id: string;
  }[];
  const relationships = (relationshipsResult.data ?? []) as {
    id: string;
    person_a: string;
    person_b: string;
    type: string | null;
  }[];

  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  // ── People nodes ─────────────────────────────────────────────────────────
  const validPersonIds = new Set(people.map((p) => p.id));
  for (const p of people) {
    nodes.set(personId(p.id), {
      id: personId(p.id),
      kind: "person",
      label: p.name,
      degree: 0,
      navHref: `/people/${p.id}`,
      company: p.company,
      relationshipCount: 0,
      eventCount: 0,
    });
  }

  // ── Company nodes + person↔company edges ───────────────────────────────────
  // Companies are keyed case-insensitively; first-seen casing is the label.
  for (const p of people) {
    if (!p.company) continue;
    const key = p.company.trim().toLowerCase();
    if (!key) continue;
    const cId = companyId(key);
    if (!nodes.has(cId)) {
      nodes.set(cId, {
        id: cId,
        kind: "company",
        label: p.company.trim(),
        degree: 0,
        navHref: `/people?q=${encodeURIComponent(p.company.trim())}`,
        peopleCount: 0,
      });
    }
    edges.push({
      id: `pc:${p.id}:${key}`,
      source: personId(p.id),
      target: cId,
      kind: "person-company",
    });
  }

  // ── Event nodes ────────────────────────────────────────────────────────────
  const validEventIds = new Set(events.map((e) => e.id));
  for (const e of events) {
    nodes.set(eventId(e.id), {
      id: eventId(e.id),
      kind: "event",
      label: e.name,
      degree: 0,
      navHref: `/events/${e.id}`,
      attendeeCount: 0,
    });
  }

  // ── Tag nodes ────────────────────────────────────────────────────────────
  const validTagIds = new Set(tags.map((t) => t.id));
  for (const t of tags) {
    nodes.set(tagId(t.id), {
      id: tagId(t.id),
      kind: "tag",
      label: t.name,
      degree: 0,
      navHref: `/people?tags=${t.id}`,
      peopleCount: 0,
    });
  }

  // ── Person↔event edges ─────────────────────────────────────────────────────
  for (const ep of eventPeople) {
    if (!validPersonIds.has(ep.person_id) || !validEventIds.has(ep.event_id))
      continue;
    edges.push({
      id: `pe:${ep.person_id}:${ep.event_id}`,
      source: personId(ep.person_id),
      target: eventId(ep.event_id),
      kind: "person-event",
    });
  }

  // ── Person↔tag edges ────────────────────────────────────────────────────────
  for (const pt of personTags) {
    if (!validPersonIds.has(pt.person_id) || !validTagIds.has(pt.tag_id)) continue;
    edges.push({
      id: `pt:${pt.person_id}:${pt.tag_id}`,
      source: personId(pt.person_id),
      target: tagId(pt.tag_id),
      kind: "person-tag",
    });
  }

  // ── Person↔person relationship edges ────────────────────────────────────────
  for (const r of relationships) {
    if (!validPersonIds.has(r.person_a) || !validPersonIds.has(r.person_b))
      continue;
    edges.push({
      id: `rel:${r.id}`,
      source: personId(r.person_a),
      target: personId(r.person_b),
      kind: "relationship",
      relType: r.type ?? undefined,
    });
  }

  // ── Tally degree + per-node counts ──────────────────────────────────────────
  for (const edge of edges) {
    const s = nodes.get(edge.source);
    const t = nodes.get(edge.target);
    if (s) s.degree += 1;
    if (t) t.degree += 1;

    if (edge.kind === "person-company" && t) t.peopleCount = (t.peopleCount ?? 0) + 1;
    if (edge.kind === "person-tag" && t) t.peopleCount = (t.peopleCount ?? 0) + 1;
    if (edge.kind === "person-event") {
      if (t) t.attendeeCount = (t.attendeeCount ?? 0) + 1;
      if (s) s.eventCount = (s.eventCount ?? 0) + 1;
    }
    if (edge.kind === "relationship") {
      if (s) s.relationshipCount = (s.relationshipCount ?? 0) + 1;
      if (t) t.relationshipCount = (t.relationshipCount ?? 0) + 1;
    }
  }

  const nodeList = [...nodes.values()];

  return {
    nodes: nodeList,
    edges,
    stats: computeStats(nodeList, edges),
  };
}

// ── Stats (computed once, alongside data generation) ────────────────────────────

function computeStats(nodes: GraphNode[], edges: GraphEdge[]): GraphStats {
  const topOfKind = (kind: GraphNodeKind) => {
    let best: GraphNode | null = null;
    for (const n of nodes) {
      if (n.kind !== kind) continue;
      if (!best || n.degree > best.degree) best = n;
    }
    return best && best.degree > 0
      ? { name: best.label, count: best.degree }
      : null;
  };

  return {
    mostConnectedPerson: topOfKind("person"),
    mostConnectedCompany: topOfKind("company"),
    mostConnectedEvent: topOfKind("event"),
    largestCommunitySize: largestCommunity(nodes, edges),
    totalConnections: edges.length,
  };
}

/** Union-find over all nodes/edges; returns the size of the largest component. */
function largestCommunity(nodes: GraphNode[], edges: GraphEdge[]): number {
  const parent = new Map<string, string>();
  for (const n of nodes) parent.set(n.id, n.id);

  const find = (x: string): string => {
    let root = x;
    while (parent.get(root) !== root) root = parent.get(root)!;
    // Path compression.
    let cur = x;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  };

  const union = (a: string, b: string) => {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  };

  for (const e of edges) {
    if (parent.has(e.source) && parent.has(e.target)) union(e.source, e.target);
  }

  const sizes = new Map<string, number>();
  let max = 0;
  for (const n of nodes) {
    const root = find(n.id);
    const size = (sizes.get(root) ?? 0) + 1;
    sizes.set(root, size);
    if (size > max) max = size;
  }
  return max;
}
