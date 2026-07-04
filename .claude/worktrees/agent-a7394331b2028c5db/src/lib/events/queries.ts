import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type EventSort =
  | "date_desc"
  | "date_asc"
  | "name_asc"
  | "name_desc"
  | "people_desc"
  | "people_asc"
  | "created_desc";

export const EVENT_SORT_OPTIONS: readonly {
  value: EventSort;
  label: string;
}[] = [
  { value: "date_desc", label: "Most recent" },
  { value: "date_asc", label: "Oldest first" },
  { value: "name_asc", label: "A-Z" },
  { value: "name_desc", label: "Z-A" },
  { value: "people_desc", label: "Most people" },
  { value: "people_asc", label: "Fewest people" },
  { value: "created_desc", label: "Recently added" },
] as const;

export const DEFAULT_EVENT_SORT: EventSort = "date_desc";

export function parseEventSort(value: string | undefined): EventSort {
  return (
    EVENT_SORT_OPTIONS.find((o) => o.value === value)?.value ?? DEFAULT_EVENT_SORT
  );
}

export type EventWithCount = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  people_count: number;
};

/**
 * Searches events across name, location, and description fields.
 * Three parallel ILIKE queries, one per field, merged and deduplicated by id
 * in JS — the same pattern used by People Search.
 *
 * Name results are merged first so relevance ordering favours name matches
 * over location or description matches.
 *
 * Empty query delegates to getEvents() so list/sort behaviour is unchanged.
 * Sort param is ignored during active search (results sorted alphabetically).
 * People count is attached from a parallel event_people query.
 */
export async function searchEvents(
  supabase: SupabaseClient<Database>,
  query: string,
  sort: EventSort,
): Promise<EventWithCount[]> {
  const q = query.trim();

  if (!q) return getEvents(supabase, sort);

  const ilikePattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const [nameResult, locationResult, descResult, countsResult] = await Promise.all([
    supabase.from("events").select("id, name, event_date, location").ilike("name", ilikePattern),
    supabase.from("events").select("id, name, event_date, location").ilike("location", ilikePattern),
    supabase.from("events").select("id, name, event_date, location").ilike("description", ilikePattern),
    supabase.from("event_people").select("event_id"),
  ]);

  // Merge name → location → description, deduplicate by id.
  const seen = new Set<string>();
  const combined: Array<{
    id: string;
    name: string;
    event_date: string | null;
    location: string | null;
  }> = [];

  for (const event of [
    ...(nameResult.data ?? []),
    ...(locationResult.data ?? []),
    ...(descResult.data ?? []),
  ]) {
    if (!seen.has(event.id)) {
      seen.add(event.id);
      combined.push(event);
    }
  }

  combined.sort((a, b) => a.name.localeCompare(b.name));

  const countMap = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    countMap.set(row.event_id, (countMap.get(row.event_id) ?? 0) + 1);
  }

  return combined.map((e) => ({
    ...e,
    people_count: countMap.get(e.id) ?? 0,
  }));
}

/**
 * Fetches events with a per-event people count.
 * Two parallel queries (events + event_people) merged in JS.
 * "Most people" / "Fewest people" sorts are applied client-side after joining.
 */
export async function getEvents(
  supabase: SupabaseClient<Database>,
  sort: EventSort,
): Promise<EventWithCount[]> {
  const needsClientSort = sort === "people_desc" || sort === "people_asc";

  const buildOrderedQuery = () => {
    const base = supabase.from("events").select("id, name, event_date, location");
    switch (sort) {
      case "date_asc":
        return base
          .order("event_date", { ascending: true, nullsFirst: false })
          .order("created_at", { ascending: false });
      case "name_asc":
        return base.order("name", { ascending: true });
      case "name_desc":
        return base.order("name", { ascending: false });
      case "created_desc":
        return base.order("created_at", { ascending: false });
      default: // date_desc + client-sort cases
        return base
          .order("event_date", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false });
    }
  };

  const [eventsResult, countsResult] = await Promise.all([
    buildOrderedQuery(),
    supabase.from("event_people").select("event_id"),
  ]);

  const events = eventsResult.data ?? [];

  const countMap = new Map<string, number>();
  for (const row of countsResult.data ?? []) {
    countMap.set(row.event_id, (countMap.get(row.event_id) ?? 0) + 1);
  }

  const withCounts: EventWithCount[] = events.map((e) => ({
    ...e,
    people_count: countMap.get(e.id) ?? 0,
  }));

  if (needsClientSort) {
    return withCounts.sort((a, b) =>
      sort === "people_desc"
        ? b.people_count - a.people_count
        : a.people_count - b.people_count,
    );
  }

  return withCounts;
}
