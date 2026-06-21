"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// ── Color assignment ──────────────────────────────────────────────────────────
// Deterministic from tag name: same name always produces the same color
// regardless of creation order or other tags added/deleted.

const COLOR_PALETTE = [
  "blue", "green", "purple", "orange", "pink", "teal", "indigo", "rose",
] as const;

function colorFromName(name: string): string {
  let h = 0;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLOR_PALETTE[h % COLOR_PALETTE.length];
}

// ── Actions ───────────────────────────────────────────────────────────────────
// Tag actions use revalidatePath (not redirect) so that the people list URL —
// including ?q=, ?sort=, and ?tags= params — is preserved after a mutation.
// The TagPicker closes optimistically before the action fires.

export async function addTagToPerson(
  personId: string,
  tagId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Ignore duplicate-key errors — tag already attached is a no-op.
  await supabase
    .from("person_tags")
    .insert({ person_id: personId, tag_id: tagId, owner_id: user.id });

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
}

export async function removeTagFromPerson(
  personId: string,
  tagId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("person_tags")
    .delete()
    .eq("person_id", personId)
    .eq("tag_id", tagId)
    .eq("owner_id", user.id);

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
}

export async function createAndAddTag(
  personId: string,
  name: string,
): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Find existing tag with the same name (case-insensitive) or create a new one.
  // The unique constraint on (owner_id, lower(name)) means there is at most one match.
  const escapedName = trimmed.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const { data: existing } = await supabase
    .from("tags")
    .select("id")
    .eq("owner_id", user.id)
    .ilike("name", escapedName)
    .maybeSingle();

  let tagId: string;
  if (existing) {
    tagId = existing.id;
  } else {
    const { data: newTag, error } = await supabase
      .from("tags")
      .insert({ owner_id: user.id, name: trimmed, color: colorFromName(trimmed) })
      .select("id")
      .single();
    if (error || !newTag) return;
    tagId = newTag.id;
  }

  // Attach to person; ignore if already attached.
  await supabase
    .from("person_tags")
    .insert({ person_id: personId, tag_id: tagId, owner_id: user.id });

  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
}
