import type { SupabaseClient } from "@supabase/supabase-js";
// Adjust this import to wherever your generated Database type actually
// lives (per ARCHITECTURE.md, that's under `src/types/`).
import type { Database } from "@/types/database";

export type PersonLite = {
  id: string;
  name: string;
  company: string | null;
  linkedin_url: string | null;
};

/**
 * One query, not one-per-candidate — same batching approach as
 * getPersonEventData(): fetch everything the duplicate check could need,
 * then match in JS. RLS already scopes this to the authenticated user, so
 * no explicit owner_id filter is needed for a read (consistent with the
 * rest of the query layer).
 */
export async function getPeopleLiteForDuplicateCheck(
  supabase: SupabaseClient<Database>
): Promise<PersonLite[]> {
  const { data, error } = await supabase
    .from("people")
    .select("id, name, company, linkedin_url");

  if (error) {
    console.error("getPeopleLiteForDuplicateCheck error:", error);
    return [];
  }

  return data ?? [];
}
