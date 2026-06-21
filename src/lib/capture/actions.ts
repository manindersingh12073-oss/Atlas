"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

// ── Types ────────────────────────────────────────────────────────────────────

export type CaptureInput = {
  name: string;
  company: string | null;
  eventId: string | null;
  tagIds: string[];
  followUpOption: "1d" | "7d" | "30d" | null;
  metTogetherIds: string[];
};

export type CaptureResult = {
  personId: string | null;
  personName: string | null;
  error: string | null;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeDueDate(option: "1d" | "7d" | "30d"): string {
  const offsets = { "1d": 1, "7d": 7, "30d": 30 };
  const today = new Date();
  const due = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + offsets[option],
  );
  const y = due.getFullYear();
  const m = String(due.getMonth() + 1).padStart(2, "0");
  const d = String(due.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function revalidateCapturePaths(personId: string, eventId: string | null) {
  revalidatePath(`/people/${personId}`);
  revalidatePath("/people");
  revalidatePath("/capture");
  revalidatePath("/dashboard");
  if (eventId) revalidatePath(`/events/${eventId}`);
}

// ── Actions ───────────────────────────────────────────────────────────────────

/**
 * Creates a person and atomically attaches tags, event link, follow-up,
 * and "met together" relationships. Returns the new person ID so the
 * Client Component can handle navigation itself (Save & Next vs Save & View).
 *
 * Sequential inserts — not fully atomic. Person creation is the critical step;
 * the rest are best-effort. This is intentional for conference-speed capture.
 */
export async function captureAndSave(input: CaptureInput): Promise<CaptureResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { personId: null, personName: null, error: "Not authenticated." };

  // 1. Create person
  const { data: newPerson, error: personError } = await supabase
    .from("people")
    .insert({ owner_id: user.id, name: input.name, company: input.company })
    .select("id")
    .single();

  if (personError || !newPerson) {
    return {
      personId: null,
      personName: null,
      error: personError?.message ?? "Failed to create person.",
    };
  }

  const personId = newPerson.id;

  // 2. Attach tags
  if (input.tagIds.length > 0) {
    await supabase.from("person_tags").insert(
      input.tagIds.map((tagId) => ({
        person_id: personId,
        tag_id: tagId,
        owner_id: user.id,
      })),
    );
  }

  // 3. Link to event
  if (input.eventId) {
    await supabase.from("event_people").insert({
      event_id: input.eventId,
      person_id: personId,
      owner_id: user.id,
    });
  }

  // 4. Create follow-up
  if (input.followUpOption) {
    await supabase.from("follow_ups").insert({
      owner_id: user.id,
      person_id: personId,
      due_date: computeDueDate(input.followUpOption),
      status: "pending",
    });
  }

  // 5. Create "met together" relationships
  // Cast: person_relationships is not in generated types until db:types is re-run post-migration.
  const metIds = input.metTogetherIds.filter((id) => id !== personId);
  if (metIds.length > 0) {
    await (supabase as any).from("person_relationships").insert(
      metIds.map((otherId) => ({
        owner_id: user.id,
        person_a: personId,
        person_b: otherId,
        type: "met_together",
      })),
    );
  }

  revalidateCapturePaths(personId, input.eventId);

  return { personId, personName: input.name, error: null };
}

/**
 * Links an existing person to an event, tags, follow-up, and relationships —
 * the same side-effects as captureAndSave but without creating a new person.
 * Called when the user selects "Use existing person" from the duplicate panel.
 */
export async function linkExistingInCapture(
  input: Omit<CaptureInput, "name" | "company"> & { existingPersonId: string },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { existingPersonId, eventId, tagIds, followUpOption, metTogetherIds } = input;

  if (tagIds.length > 0) {
    await supabase.from("person_tags").insert(
      tagIds.map((tagId) => ({
        person_id: existingPersonId,
        tag_id: tagId,
        owner_id: user.id,
      })),
    );
  }

  if (eventId) {
    await supabase.from("event_people").insert({
      event_id: eventId,
      person_id: existingPersonId,
      owner_id: user.id,
    });
  }

  if (followUpOption) {
    await supabase.from("follow_ups").insert({
      owner_id: user.id,
      person_id: existingPersonId,
      due_date: computeDueDate(followUpOption),
      status: "pending",
    });
  }

  const metIds = metTogetherIds.filter((id) => id !== existingPersonId);
  if (metIds.length > 0) {
    await (supabase as any).from("person_relationships").insert(
      metIds.map((otherId) => ({
        owner_id: user.id,
        person_a: existingPersonId,
        person_b: otherId,
        type: "met_together",
      })),
    );
  }

  revalidateCapturePaths(existingPersonId, eventId);

  return { error: null };
}

/**
 * Deletes a person captured this session. Cascade deletes handle all
 * associated event_people, person_tags, follow_ups, and person_relationships rows.
 */
export async function undoCapture(
  personId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", personId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/people");
  revalidatePath("/capture");
  revalidatePath("/dashboard");

  return { error: null };
}
