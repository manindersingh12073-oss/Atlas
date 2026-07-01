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
 * Universal search across the authenticated user's network.
 *
 * When query is empty: returns all people with the requested sort applied.
 * When query is set: searches across name, company, role, notes, tag names,
 * event names, and relationship names in two parallel rounds, then merges
 * and sorts alphabetically (sort param is ignored during search).
 *
 * Round 1 (all parallel): FTS on search_vector, name ilike, company ilike,
 *   tag name via person_tags join, event name via event_people join.
 * Round 2 (conditional): person_relationships lookup when Round 1 name
 *   matches exist, to surface people related to those matches.
 *
 * Ranking (best/lowest score wins per person, tie-break alphabetical):
 *   0 Exact name · 1 Partial name · 2 Company · 3 Tags · 4 Events ·
 *   5 Relationships · 6 Notes/role (FTS-only match)
 *
 * "events_desc" sort cannot be applied at the DB level; the caller is
 * responsible for JS-sorting by event count after calling getPersonEventData.
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

  // ── Round 1: all parallel ──────────────────────────────────────────────────
  const [ftsResult, nameResult, companyResult, tagResult, eventResult] =
    await Promise.all([
      // FTS on search_vector (covers name, company, role, notes)
      supabase
        .from("people")
        .select("id, name, company, role")
        .textSearch("search_vector", q, { type: "websearch", config: "english" }),
      // Name ilike
      supabase
        .from("people")
        .select("id, name, company, role")
        .ilike("name", ilikePattern),
      // Company ilike
      supabase
        .from("people")
        .select("id, name, company, role")
        .ilike("company", ilikePattern),
      // Tag name: person_tags joined to tags, filtered by tag name
      (async () => {
        try {
          const { data, error } = await (supabase as any)
            .from("person_tags")
            .select("people(id, name, company, role), tags!inner(name)")
            .ilike("tags.name", ilikePattern);
          return { data: error ? [] : (data ?? []) };
        } catch {
          return { data: [] };
        }
      })(),
      // Event name: event_people joined to events, filtered by event name
      (async () => {
        try {
          const { data, error } = await (supabase as any)
            .from("event_people")
            .select("people(id, name, company, role), events!inner(name)")
            .ilike("events.name", ilikePattern);
          return { data: error ? [] : (data ?? []) };
        } catch {
          return { data: [] };
        }
      })(),
    ]);

  // ── Round 2: relationship lookup (only when name matches exist) ────────────
  const nameMatchIds = (nameResult.data ?? []).map((p) => p.id);
  let relRows: Array<{
    person_a: string;
    person_b: string;
    a: PersonResult | null;
    b: PersonResult | null;
  }> = [];

  if (nameMatchIds.length > 0) {
    try {
      const { data, error } = await (supabase as any)
        .from("person_relationships")
        .select(
          "person_a, person_b, a:people!person_a(id, name, company, role), b:people!person_b(id, name, company, role)",
        )
        .or(
          `person_a.in.(${nameMatchIds.join(",")}),person_b.in.(${nameMatchIds.join(",")})`,
        );
      relRows = (error ? [] : (data ?? [])) as typeof relRows;
    } catch {
      relRows = [];
    }
  }

  // ── Extract people from join results ──────────────────────────────────────
  type JoinRow = { people: PersonResult | null };

  const tagPeople = ((tagResult?.data ?? []) as JoinRow[])
    .map((r) => r.people)
    .filter((p): p is PersonResult => p !== null);

  const eventPeople = ((eventResult?.data ?? []) as JoinRow[])
    .map((r) => r.people)
    .filter((p): p is PersonResult => p !== null);

  // For each relationship, surface the person NOT in the name-match set
  const nameMatchIdSet = new Set(nameMatchIds);
  const relatedPeople: PersonResult[] = [];
  for (const rel of relRows) {
    if (nameMatchIdSet.has(rel.person_a) && rel.b) relatedPeople.push(rel.b);
    if (nameMatchIdSet.has(rel.person_b) && rel.a) relatedPeople.push(rel.a);
  }

  // ── Rank: keep the best (lowest) rank each person qualifies for ─────────────
  const qLower = q.toLowerCase();
  const ranked = new Map<string, { person: PersonResult; rank: number }>();
  const consider = (person: PersonResult, rank: number) => {
    const existing = ranked.get(person.id);
    if (!existing || rank < existing.rank) ranked.set(person.id, { person, rank });
  };

  // Buckets applied low-to-high rank; consider() keeps the strongest signal.
  for (const p of nameResult.data ?? [])
    consider(p, p.name.toLowerCase() === qLower ? 0 : 1); // exact vs partial name
  for (const p of companyResult.data ?? []) consider(p, 2); // company
  for (const p of tagPeople) consider(p, 3); // tags
  for (const p of eventPeople) consider(p, 4); // events
  for (const p of relatedPeople) consider(p, 5); // relationships
  for (const p of ftsResult.data ?? []) consider(p, 6); // notes/role (FTS only)

  return [...ranked.values()]
    .sort((a, b) => a.rank - b.rank || a.person.name.localeCompare(b.person.name))
    .map((r) => r.person);
}
