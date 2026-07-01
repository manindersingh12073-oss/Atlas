import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { searchPeople } from "@/lib/people/queries";
import { getTagsWithCounts } from "@/lib/tags/queries";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SearchPerson = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
};

export type SearchCompany = { name: string; count: number };
export type SearchTag = { id: string; name: string; color: string };
export type SearchEvent = { id: string; name: string; event_date: string | null };
export type SearchRelationship = {
  id: string;
  type: string;
  aId: string;
  aName: string;
  bId: string;
  bName: string;
};

export type SearchResults = {
  people: SearchPerson[];
  companies: SearchCompany[];
  tags: SearchTag[];
  events: SearchEvent[];
  relationships: SearchRelationship[];
};

export type SearchSuggestions = {
  recentEvents: SearchEvent[];
  popularTags: SearchTag[];
  topCompanies: SearchCompany[];
};

// Per-group caps keep the dropdown compact.
const GROUP_LIMIT = 6;

// ── Universal network search (grouped) ─────────────────────────────────────────

/**
 * Grouped universal search for the dashboard search dropdown.
 *
 * The People group is produced by the existing Universal Search
 * (`searchPeople`) — which already spans name, company, role, notes, tags,
 * events, and relationships — so the "person who attended event X" and
 * "person related to Y" behaviour is reused, not re-implemented.
 *
 * The Companies / Tags / Events groups are lightweight entity lookups so the
 * dropdown can offer direct navigation to a filtered People view, a tag
 * filter, or an event page. One ilike query per group; all run in parallel
 * alongside searchPeople.
 */
export async function searchNetwork(
  supabase: SupabaseClient<Database>,
  rawQuery: string,
): Promise<SearchResults> {
  const q = rawQuery.trim();
  if (!q)
    return { people: [], companies: [], tags: [], events: [], relationships: [] };

  const qLower = q.toLowerCase();
  const ilikePattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const [people, companyResult, tagResult, eventResult, relResult] =
    await Promise.all([
      searchPeople(supabase, q), // reuse Universal Search for the People group
      supabase
        .from("people")
        .select("company")
        .not("company", "is", null)
        .ilike("company", ilikePattern),
      supabase
        .from("tags")
        .select("id, name, color")
        .ilike("name", ilikePattern),
      supabase
        .from("events")
        .select("id, name, event_date")
        .ilike("name", ilikePattern),
      // Relationships: one query for all edges (with both people's names),
      // filtered by name match in JS. person_relationships is cast until
      // db:types is regenerated post-migration.
      (async () => {
        try {
          const { data, error } = await (supabase as any)
            .from("person_relationships")
            .select(
              "id, type, a:people!person_a(id, name), b:people!person_b(id, name)",
            );
          return { data: error ? [] : (data ?? []) };
        } catch {
          return { data: [] };
        }
      })(),
    ]);

  // Companies: dedupe case-insensitively, keep most-frequent casing + count.
  const companyFreq = new Map<string, { name: string; count: number }>();
  for (const row of (companyResult.data ?? []) as { company: string | null }[]) {
    if (!row.company) continue;
    const key = row.company.toLowerCase();
    const existing = companyFreq.get(key);
    if (existing) existing.count += 1;
    else companyFreq.set(key, { name: row.company, count: 1 });
  }
  const companies = [...companyFreq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  const tags: SearchTag[] = ((tagResult.data ?? []) as SearchTag[])
    .map((t) => ({ id: t.id, name: t.name, color: t.color ?? "blue" }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  const events: SearchEvent[] = ((eventResult.data ?? []) as SearchEvent[])
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, GROUP_LIMIT);

  // Relationships: keep edges where either endpoint's name matches the query.
  type RelRow = {
    id: string;
    type: string;
    a: { id: string; name: string } | null;
    b: { id: string; name: string } | null;
  };
  const relationships: SearchRelationship[] = ((relResult.data ?? []) as RelRow[])
    .filter(
      (r) =>
        r.a &&
        r.b &&
        (r.a.name.toLowerCase().includes(qLower) ||
          r.b.name.toLowerCase().includes(qLower)),
    )
    .map((r) => ({
      id: r.id,
      type: r.type,
      aId: r.a!.id,
      aName: r.a!.name,
      bId: r.b!.id,
      bName: r.b!.name,
    }))
    .slice(0, GROUP_LIMIT);

  return {
    people: people.slice(0, GROUP_LIMIT),
    companies,
    tags,
    events,
    relationships,
  };
}

// ── Empty-state suggestions ─────────────────────────────────────────────────────

/**
 * Suggestions shown when the dashboard search is focused with an empty query:
 * recent events, popular tags, and top companies. (Recent *viewed* people are
 * sourced from localStorage on the client — see useNetworkSearch.)
 *
 * Runs once on dashboard load, not per keystroke. Three parallel reads
 * (getTagsWithCounts is itself two parallel reads it already batches).
 */
export async function getSearchSuggestions(
  supabase: SupabaseClient<Database>,
): Promise<SearchSuggestions> {
  const [eventsResult, tags, companyResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date")
      .order("event_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(5),
    getTagsWithCounts(supabase),
    supabase.from("people").select("company").not("company", "is", null),
  ]);

  // Top companies by frequency (case-insensitive, most-frequent casing wins).
  const companyFreq = new Map<string, { name: string; count: number }>();
  for (const row of (companyResult.data ?? []) as { company: string | null }[]) {
    if (!row.company) continue;
    const key = row.company.toLowerCase();
    const existing = companyFreq.get(key);
    if (existing) existing.count += 1;
    else companyFreq.set(key, { name: row.company, count: 1 });
  }
  const topCompanies = [...companyFreq.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 5);

  return {
    recentEvents: (eventsResult.data ?? []) as SearchEvent[],
    popularTags: tags
      .filter((t) => t.count > 0)
      .slice(0, 5)
      .map((t) => ({ id: t.id, name: t.name, color: t.color ?? "blue" })),
    topCompanies,
  };
}
