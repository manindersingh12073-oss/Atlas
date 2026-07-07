import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type AtlasMemoryCategory = "goal" | "preference" | "note";

export type AtlasMemoryEntry = {
  id: string;
  category: AtlasMemoryCategory;
  content: string;
  created_at: string;
  updated_at: string;
};

/**
 * Returns all Atlas Memory entries (networking goals, preferences, notes)
 * for the authenticated user, newest first.
 *
 * Cast until `db:types` is regenerated post-migration — same convention as
 * `person_relationships` elsewhere in this codebase.
 */
export async function getAtlasMemory(
  supabase: SupabaseClient<Database>,
): Promise<AtlasMemoryEntry[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("atlas_memory")
      .select("id, category, content, created_at, updated_at")
      .order("created_at", { ascending: false });
    return (error ? [] : (data ?? [])) as AtlasMemoryEntry[];
  } catch {
    return [];
  }
}

export async function getAtlasGoals(
  supabase: SupabaseClient<Database>,
): Promise<AtlasMemoryEntry[]> {
  const all = await getAtlasMemory(supabase);
  return all.filter((e) => e.category === "goal");
}
