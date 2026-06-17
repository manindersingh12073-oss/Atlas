import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

// ─── Company suggestions ──────────────────────────────────────────────────────

/**
 * Returns distinct company names from the authenticated user's people,
 * deduplicated case-insensitively with the most-frequent casing preserved.
 */
export async function getCompanySuggestions(
  supabase: SupabaseClient<Database>,
): Promise<string[]> {
  const { data } = await supabase
    .from("people")
    .select("company")
    .not("company", "is", null);

  const values = (data ?? [])
    .map((r) => r.company)
    .filter((c): c is string => !!c);

  const freq = new Map<string, number>();
  for (const c of values) {
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }

  const best = new Map<string, string>();
  for (const [company, count] of freq) {
    const key = company.toLowerCase();
    const current = best.get(key);
    if (!current || count > (freq.get(current) ?? 0)) {
      best.set(key, company);
    }
  }

  return [...best.values()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase()),
  );
}

// ─── Sort ─────────────────────────────────────────────────────────────────────

export type PeopleSort =
  | "name_asc"
  | "name_desc"
  | "created_desc"
  | "created_asc"
  | "updated_desc"
  | "events_desc";

export const PEOPLE_SORT_OPTIONS: readonly {
  value: PeopleSort;
  label: string;
}[] = [
  { value: "name_asc", label: "Name A-Z" },
  { value: "name_desc", label: "Name Z-A" },
  { value: "created_desc", label: "Recently added" },
  { value: "created_asc", label: "Oldest added" },
  { value: "updated_desc", label: "Recently updated" },
  { value: "events_desc", label: "Most events" },
] as const;

export const DEFAULT_PEOPLE_SORT: PeopleSort = "name_asc";

export function parsePeopleSort(value: string | undefined): PeopleSort {
  return (
    PEOPLE_SORT_OPTIONS.find((o) => o.value === value)?.value ??
    DEFAULT_PEOPLE_SORT
  );
}

// ─── Event data for people list ───────────────────────────────────────────────

type EventPreview = {
  id: string;
  name: string;
  event_date: string | null;
};

export type PersonEventData = {
  event_count: number;
  recent_events: EventPreview[]; // top 2, sorted by event_date DESC
};

/**
 * Returns a map of person_id → event count + top-2 recent event previews.
 * One query for all the authenticated user's event_people links.
 * Used by the people list to show per-person event metadata without N+1 queries.
 */
export async function getPersonEventData(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, PersonEventData>> {
  const { data } = await supabase
    .from("event_people")
    .select("person_id, events(id, name, event_date)");

  type LinkRow = {
    person_id: string;
    events: EventPreview | null;
  };

  const grouped = new Map<string, EventPreview[]>();
  for (const row of (data ?? []) as LinkRow[]) {
    if (!row.events) continue;
    const existing = grouped.get(row.person_id) ?? [];
    existing.push(row.events);
    grouped.set(row.person_id, existing);
  }

  const result = new Map<string, PersonEventData>();
  for (const [personId, events] of grouped) {
    const sorted = [...events].sort((a, b) => {
      if (!a.event_date && !b.event_date) return 0;
      if (!a.event_date) return 1;
      if (!b.event_date) return -1;
      return b.event_date.localeCompare(a.event_date);
    });
    result.set(personId, {
      event_count: sorted.length,
      recent_events: sorted.slice(0, 2),
    });
  }

  return result;
}

// ─── Search ───────────────────────────────────────────────────────────────────

type PersonResult = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
};

/**
 * Searches the authenticated user's people by query string.
 *
 * When query is empty: returns all people with the requested sort applied.
 * When query is set: runs FTS + name ilike + company ilike in parallel,
 * merges results, and sorts alphabetically (sort param is ignored).
 *
 * "events_desc" sort cannot be applied at the DB level; the caller is
 * responsible for JS-sorting by event count after calling getPersonEventData.
 *
 * Partial company matching uses a seq scan (no trigram index on company).
 * Fast at Atlas's user scale; add a GIN trigram index on company if needed.
 */
export async function searchPeople(
  supabase: SupabaseClient<Database>,
  query: string,
  sort: PeopleSort = DEFAULT_PEOPLE_SORT,
): Promise<PersonResult[]> {
  const q = query.trim();

  if (!q) {
    const buildOrderedQuery = () => {
      const base = supabase.from("people").select("id, name, company, role");
      switch (sort) {
        case "name_desc":
          return base.order("name", { ascending: false });
        case "created_desc":
          return base.order("created_at", { ascending: false });
        case "created_asc":
          return base.order("created_at", { ascending: true });
        case "updated_desc":
          return base.order("updated_at", { ascending: false });
        default: // name_asc + events_desc (events_desc is JS-sorted by caller)
          return base.order("name", { ascending: true });
      }
    };

    const { data } = await buildOrderedQuery();
    return data ?? [];
  }

  const ilikePattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const [ftsResult, fuzzyNameResult, fuzzyCompanyResult] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, company, role")
      .textSearch("search_vector", q, { type: "websearch", config: "english" }),
    supabase
      .from("people")
      .select("id, name, company, role")
      .ilike("name", ilikePattern),
    supabase
      .from("people")
      .select("id, name, company, role")
      .ilike("company", ilikePattern),
  ]);

  const seen = new Set<string>();
  const combined: PersonResult[] = [];

  for (const person of [
    ...(ftsResult.data ?? []),
    ...(fuzzyNameResult.data ?? []),
    ...(fuzzyCompanyResult.data ?? []),
  ]) {
    if (!seen.has(person.id)) {
      seen.add(person.id);
      combined.push(person);
    }
  }

  return combined.sort((a, b) => a.name.localeCompare(b.name));
}
