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

  // Count occurrences of each exact casing.
  const freq = new Map<string, number>();
  for (const c of values) {
    freq.set(c, (freq.get(c) ?? 0) + 1);
  }

  // For each case-insensitive group, keep the most-frequent casing.
  const best = new Map<string, string>(); // lowercase key → winning casing
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
