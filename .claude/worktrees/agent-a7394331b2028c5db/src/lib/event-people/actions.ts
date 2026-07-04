"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function nullable(formData: FormData, key: string): string | null {
  const val = formData.get(key)?.toString().trim();
  return val || null;
}

// ── Existing actions ───────────────────────────────────────────────────────

export async function linkPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const eventId = formData.get("event_id")?.toString();
  const personId = formData.get("person_id")?.toString();

  if (!eventId || !personId) return { error: "A person must be selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const encounterNote =
    formData.get("encounter_note")?.toString().trim() || null;

  const { error } = await supabase.from("event_people").insert({
    event_id: eventId,
    person_id: personId,
    owner_id: user.id,
    encounter_note: encounterNote,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This person is already linked to this event." };
    }
    return { error: error.message };
  }

  redirect(`/events/${eventId}`);
}

export async function linkEvent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const personId = formData.get("person_id")?.toString();
  const eventId = formData.get("event_id")?.toString();

  if (!personId || !eventId) return { error: "An event must be selected." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const encounterNote =
    formData.get("encounter_note")?.toString().trim() || null;

  const { error } = await supabase.from("event_people").insert({
    event_id: eventId,
    person_id: personId,
    owner_id: user.id,
    encounter_note: encounterNote,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This event is already linked to this person." };
    }
    return { error: error.message };
  }

  redirect(`/people/${personId}`);
}

export async function removePersonFromEvent(
  eventId: string,
  personId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("event_people")
    .delete()
    .eq("event_id", eventId)
    .eq("person_id", personId)
    .eq("owner_id", user.id);

  redirect(`/events/${eventId}`);
}

export async function removeEventFromPerson(
  personId: string,
  eventId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("event_people")
    .delete()
    .eq("event_id", eventId)
    .eq("person_id", personId)
    .eq("owner_id", user.id);

  redirect(`/people/${personId}`);
}

export async function updateEncounterNote(
  eventId: string,
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const encounterNote =
    formData.get("encounter_note")?.toString().trim() || null;

  const { error } = await supabase
    .from("event_people")
    .update({ encounter_note: encounterNote })
    .eq("event_id", eventId)
    .eq("person_id", personId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  redirect(`/events/${eventId}`);
}

// ── Atomic create-and-link via Postgres RPC (migration 006) ───────────────
// Both functions use SECURITY INVOKER, so auth.uid() is the calling user
// and RLS applies normally. Postgres wraps each in an implicit transaction.

export async function createPersonAndLink(
  eventId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: personId, error } = await supabase.rpc(
    "create_person_and_link",
    {
      p_event_id: eventId,
      p_name: name,
      p_company: nullable(formData, "company") ?? undefined,
      p_role: nullable(formData, "role") ?? undefined,
      p_linkedin_url: nullable(formData, "linkedin_url") ?? undefined,
      p_email: nullable(formData, "email") ?? undefined,
      p_phone: nullable(formData, "phone") ?? undefined,
      p_notes: nullable(formData, "notes") ?? undefined,
    },
  );

  if (error || !personId) {
    return { error: error?.message ?? "Failed to create person." };
  }

  redirect(`/events/${eventId}`);
}

export async function createEventAndLink(
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: eventId, error } = await supabase.rpc("create_event_and_link", {
    p_person_id: personId,
    p_name: name,
    p_event_date: nullable(formData, "event_date") ?? undefined,
    p_location: nullable(formData, "location") ?? undefined,
    p_description: nullable(formData, "description") ?? undefined,
  });

  if (error || !eventId) {
    return { error: error?.message ?? "Failed to create event." };
  }

  redirect(`/people/${personId}`);
}
