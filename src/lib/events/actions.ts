"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function nullable(formData: FormData, key: string): string | null {
  const val = formData.get(key)?.toString().trim();
  return val || null;
}

export async function createEvent(
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

  const { data, error } = await supabase
    .from("events")
    .insert({
      owner_id: user.id,
      name,
      event_date: nullable(formData, "event_date"),
      location: nullable(formData, "location"),
      description: nullable(formData, "description"),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create event." };

  redirect(`/events/${data.id}`);
}

export async function updateEvent(
  id: string,
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

  const { error } = await supabase
    .from("events")
    .update({
      name,
      event_date: nullable(formData, "event_date"),
      location: nullable(formData, "location"),
      description: nullable(formData, "description"),
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  redirect(`/events/${id}`);
}

export async function deleteEvent(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("events").delete().eq("id", id).eq("owner_id", user.id);

  redirect("/events");
}
