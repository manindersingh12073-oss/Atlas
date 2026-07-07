import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getAtlasMemory } from "@/lib/atlas-memory/queries";

export type UserContext = {
  goals: string[];
  preferences: string[];
  notes: string[];
};

/**
 * Backs the `get_user_context` tool. Returns the user's Atlas Memory —
 * structured, user-editable notes (see Settings → Networking goals) — never
 * an opaque LLM memory blob. The system prompt instructs the model to let
 * active goals bias its suggestions and cite them by name in `rationale`.
 */
export async function getUserContext(
  supabase: SupabaseClient<Database>,
): Promise<UserContext> {
  const entries = await getAtlasMemory(supabase);
  return {
    goals: entries.filter((e) => e.category === "goal").map((e) => e.content),
    preferences: entries.filter((e) => e.category === "preference").map((e) => e.content),
    notes: entries.filter((e) => e.category === "note").map((e) => e.content),
  };
}
