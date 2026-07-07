"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { AtlasMemoryCategory } from "./queries";

export type ActionState = { error: string | null };

const VALID_CATEGORIES: AtlasMemoryCategory[] = ["goal", "preference", "note"];

function parseCategory(value: FormDataEntryValue | null): AtlasMemoryCategory {
  const v = value?.toString();
  return VALID_CATEGORIES.includes(v as AtlasMemoryCategory)
    ? (v as AtlasMemoryCategory)
    : "goal";
}

/**
 * Settings-page form action — the primary, explicit way Atlas Memory entries
 * are created. `owner_id` is always set server-side from `getUser()`.
 */
export async function createAtlasMemory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const content = formData.get("content")?.toString().trim();
  if (!content) return { error: "Content is required." };
  const category = parseCategory(formData.get("category"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await (supabase as any)
    .from("atlas_memory")
    .insert({ owner_id: user.id, category, content });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function updateAtlasMemory(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const content = formData.get("content")?.toString().trim();
  if (!content) return { error: "Content is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await (supabase as any)
    .from("atlas_memory")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}

export async function deleteAtlasMemory(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase as any)
    .from("atlas_memory")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath("/settings");
}

/**
 * Fired only by a user clicking the "Save as goal" suggested action on an
 * Ask Atlas answer — never called by the model itself. The model can only
 * *propose* a goalText via a `save_goal` action in its structured answer;
 * this is the one explicit, user-initiated write that turns it into a real
 * Atlas Memory row, identical in effect to adding it from Settings.
 */
export async function saveGoalSuggestion(content: string): Promise<{ error: string | null }> {
  const trimmed = content.trim();
  if (!trimmed) return { error: "Nothing to save." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await (supabase as any)
    .from("atlas_memory")
    .insert({ owner_id: user.id, category: "goal", content: trimmed });

  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { error: null };
}
