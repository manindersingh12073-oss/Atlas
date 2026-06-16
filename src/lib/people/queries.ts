import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * Returns distinct company names from the authenticated user's people,
 * deduplicated case-insensitively with the most-frequent casing preserved.
 *
 * Example: if "Google" appears 5×, "google" 1×, "GOOGLE" 1×, the result
 * contains "Google" only — guiding future entries toward the dominant casing.
 * "Google LLC" and "Google" are kept separate because they differ after
 * case-normalisation.
 *
 * Used to populate the <datalist> on PersonForm.
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

// ─────────────────────────────────────────────────────────────────────────────

type PersonResult = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
};

/**
 * Searches the authenticated user's people by query string.
 *
 * Strategy:
 *   FTS  — websearch_to_tsquery on search_vector (GIN index).
 *          Covers complete-word matches across name, company, role, notes.
 *   ILIKE — trigram ilike on name (GIN trigram index).
 *           Covers partial names and typos ("Mani" → "Maninder").
 *
 * Both queries run in parallel. Results are merged (FTS first for relevance
 * ordering), deduplicated by id, then sorted alphabetically.
 * Empty query returns all people sorted by name.
 *
 * Partial company matching uses a seq scan (no trigram index on company).
 * Fast at Atlas's user scale; add a GIN trigram index on company if it becomes
 * a bottleneck at larger scale.
 */
export async function searchPeople(
  supabase: SupabaseClient<Database>,
  query: string,
): Promise<PersonResult[]> {
  const q = query.trim();

  if (!q) {
    const { data } = await supabase
      .from("people")
      .select("id, name, company, role")
      .order("name");
    return data ?? [];
  }

  // Escape ILIKE pattern metacharacters so user input is treated literally,
  // not as SQL pattern syntax.
  const ilikePattern = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;

  const [ftsResult, fuzzyNameResult, fuzzyCompanyResult] = await Promise.all([
    // Full-text: complete-word matches across all four columns.
    supabase
      .from("people")
      .select("id, name, company, role")
      .textSearch("search_vector", q, { type: "websearch", config: "english" }),
    // Fuzzy name: partial / typo-tolerant name matching (GIN trigram index).
    supabase
      .from("people")
      .select("id, name, company, role")
      .ilike("name", ilikePattern),
    // Partial company: "king" → "Kings", "bioeng" → "Kings Bioeng".
    // No trigram index on company — seq scan is fast at Atlas's user scale.
    supabase
      .from("people")
      .select("id, name, company, role")
      .ilike("company", ilikePattern),
  ]);

  // Merge FTS first (most relevant), then name fuzzy, then company fuzzy.
  // Deduplication by id ensures each person appears once.
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
