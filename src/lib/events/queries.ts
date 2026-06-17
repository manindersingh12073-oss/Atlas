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
