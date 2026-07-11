"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { LinkedInCandidate } from "./types";

// Not shared across modules, matching the rest of the codebase's ActionState
// convention (each actions.ts defines its own locally).
export type ImportActionState = {
  error: string | null;
  importedCount?: number;
};

const LINKEDIN_IMPORT_TAG_NAME = "LinkedIn Import";
// Must be one of TagChip's palette keys (see src/components/tags/TagChip.tsx),
// which map a colour word to full Tailwind classes; an arbitrary hex would
// silently fall back to blue. "blue" is both a valid key and on-brand.
const LINKEDIN_IMPORT_TAG_COLOR = "blue";

/**
 * Deliberately NOT the (prevState, formData) useActionState signature used
 * elsewhere in the codebase. That pattern fits classic form inputs; this
 * action's payload is a dynamic array of objects built from parsed CSV rows
 * and checkbox state, which doesn't map cleanly onto FormData. It's called
 * directly from the client inside a useTransition, the same way
 * DeletePersonButton calls its bound server action — just with a richer
 * return value than void.
 */
export async function importLinkedInConnections(
  candidates: LinkedInCandidate[],
): Promise<ImportActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!candidates.length) {
    return { error: "No connections selected." };
  }

  // owner_id is always set server-side from getUser(), never from client input.
  const rows = candidates.map((c) => ({
    owner_id: user.id,
    name: c.name,
    company: c.company || null,
    role: c.role || null,
    linkedin_url: c.linkedinUrl || null,
    email: c.email || null,
    notes: c.connectedOn ? `Connected on LinkedIn: ${c.connectedOn}` : null,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from("people")
    .insert(rows)
    .select("id");

  if (insertError || !inserted) {
    return { error: insertError?.message ?? "Failed to import connections." };
  }

  // The people list must reflect the new rows on next navigation.
  revalidatePath("/people");

  // Find-or-create the "LinkedIn Import" tag once, then tag every imported
  // person — two round trips total, not one per person. Same select-then-
  // insert shape as createAndAddTag() in src/lib/tags/actions.ts: scoped by
  // owner_id and escaped, relying on the unique (owner_id, lower(name)) index
  // so there is at most one match.
  const escapedName = LINKEDIN_IMPORT_TAG_NAME.replace(/%/g, "\\%").replace(/_/g, "\\_");
  const { data: existingTag } = await supabase
    .from("tags")
    .select("id")
    .eq("owner_id", user.id)
    .ilike("name", escapedName)
    .maybeSingle();

  let tagId = existingTag?.id ?? null;

  if (!tagId) {
    const { data: newTag, error: tagError } = await supabase
      .from("tags")
      .insert({
        owner_id: user.id,
        name: LINKEDIN_IMPORT_TAG_NAME,
        color: LINKEDIN_IMPORT_TAG_COLOR,
      })
      .select("id")
      .single();

    // People are already imported successfully at this point — tagging is a
    // nice-to-have, so a tag failure reports partial success rather than
    // failing the whole import (same tradeoff captureAndSave makes).
    if (tagError || !newTag) {
      return { error: null, importedCount: inserted.length };
    }
    tagId = newTag.id;
  }

  const personTagRows = inserted.map((p) => ({
    person_id: p.id,
    tag_id: tagId as string,
    owner_id: user.id,
  }));

  await supabase.from("person_tags").insert(personTagRows);

  return { error: null, importedCount: inserted.length };
}
