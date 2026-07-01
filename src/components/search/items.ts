// Shared result-item model for every search surface (dashboard bar, People
// page bar, command palette). Keeping the item shape + builders here is what
// lets all surfaces render the ONE search engine's output identically.

import type {
  SearchCompany,
  SearchEvent,
  SearchPerson,
  SearchRelationship,
  SearchTag,
} from "@/lib/search/queries";
import type { RecentPerson } from "@/lib/search/recent-people";

export type ItemKind =
  | "person"
  | "company"
  | "tag"
  | "event"
  | "relationship"
  | "action";

export type Item = {
  key: string; // stable, unique across the whole dropdown (drives keyboard nav)
  kind: ItemKind;
  label: string;
  sublabel?: string;
  href: string;
  color?: string; // tag dot colour
};

export type Section = { heading: string; items: Item[] };

// ── Tag dot colours ─────────────────────────────────────────────────────────
export const TAG_DOT: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  red: "bg-red-500",
  amber: "bg-amber-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
};

// ── Relationship type labels (kept local to avoid importing server query code)
const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  met_together: "Met together",
  introduced_by: "Introduced by",
  works_with: "Works with",
  co_founder: "Co-founder",
  friend: "Friend",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export function formatEventDate(dateStr: string | null): string | undefined {
  if (!dateStr) return undefined;
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Builders ──────────────────────────────────────────────────────────────────
export function personItem(p: SearchPerson | RecentPerson): Item {
  const role = "role" in p ? p.role : null;
  return {
    key: `person:${p.id}`,
    kind: "person",
    label: p.name,
    sublabel: [role, p.company].filter(Boolean).join(" · ") || undefined,
    href: `/people/${p.id}`,
  };
}

export function companyItem(c: SearchCompany): Item {
  return {
    key: `company:${c.name.toLowerCase()}`,
    kind: "company",
    label: c.name,
    sublabel: `${c.count} ${c.count === 1 ? "person" : "people"}`,
    href: `/people?q=${encodeURIComponent(c.name)}`,
  };
}

export function tagItem(t: SearchTag): Item {
  return {
    key: `tag:${t.id}`,
    kind: "tag",
    label: t.name,
    href: `/people?tags=${t.id}`,
    color: t.color,
  };
}

export function eventItem(e: SearchEvent): Item {
  return {
    key: `event:${e.id}`,
    kind: "event",
    label: e.name,
    sublabel: formatEventDate(e.event_date),
    href: `/events/${e.id}`,
  };
}

export function relationshipItem(r: SearchRelationship): Item {
  const typeLabel = RELATIONSHIP_TYPE_LABEL[r.type] ?? r.type;
  return {
    key: `relationship:${r.id}`,
    kind: "relationship",
    label: `${r.aName} ↔ ${r.bName}`,
    sublabel: typeLabel,
    href: `/people/${r.aId}`,
  };
}

// ── Command palette actions ─────────────────────────────────────────────────
export type ActionDef = { label: string; href: string; keywords?: string };

export const COMMAND_ACTIONS: ActionDef[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "People", href: "/people" },
  { label: "Events", href: "/events" },
  { label: "Capture", href: "/capture" },
  { label: "Insights", href: "/insights" },
  { label: "Settings", href: "/settings" },
  { label: "New Person", href: "/people/new", keywords: "add create person" },
  { label: "New Event", href: "/events/new", keywords: "add create event" },
  { label: "Capture Person", href: "/capture", keywords: "conference capture person" },
];

export function actionItem(a: ActionDef): Item {
  return {
    key: `action:${a.label}`,
    kind: "action",
    label: a.label,
    href: a.href,
  };
}

/** Filters actions by a query against label + keywords (empty query → all). */
export function filterActions(query: string): ActionDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return COMMAND_ACTIONS;
  return COMMAND_ACTIONS.filter((a) =>
    `${a.label} ${a.keywords ?? ""}`.toLowerCase().includes(q),
  );
}

/**
 * Flattens sections into one list for keyboard navigation, dropping any item
 * whose key already appeared (defensive dedupe across groups).
 */
export function flattenUnique(sections: Section[]): Item[] {
  const seen = new Set<string>();
  const flat: Item[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      flat.push(item);
    }
  }
  return flat;
}
