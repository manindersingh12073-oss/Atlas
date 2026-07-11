"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { LinkedInCandidate } from "./types";

// Not shared across modules, matching the rest of the codebase's ActionState
// convention (each actions.ts defines its own locally).
export type ImportActionState = {
  error: string | null;
  importedCount?: number;
};

const LINKEDIN_IMPORT_TAG_NAME = "LinkedIn Import";
const LINKEDIN_IMPORT_TAG_COLOR = "#0A66C2"; // LinkedIn blue — visually distinct in the tag list

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
  candidates: LinkedInCandidate[]
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

  // Find-or-create the "LinkedIn Import" tag once, then tag every imported
  // person — two round trips total, not one per person.
  const { data: existingTag } = await supabase
    .from("tags")
    .select("id")
    .ilike("name", LINKEDIN_IMPORT_TAG_NAME)
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
    // failing the whole import.
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
