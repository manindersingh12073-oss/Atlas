"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

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
