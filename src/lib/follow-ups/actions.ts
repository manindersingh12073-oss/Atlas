"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function nullable(formData: FormData, key: string): string | null {
  const val = formData.get(key)?.toString().trim();
  return val || null;
}

// ── Snooze date calculation ───────────────────────────────────────────────────
// To add new options (e.g. "1d" | "30d" | "custom"), extend SnoozeOption and
// add a case below. Callers pass the option; no other files need to change.

type SnoozeOption = "7d";

function getSnoozeDate(currentDueDate: string, option: SnoozeOption): string {
  // Parse as local date to avoid UTC day-shift in negative-offset timezones.
  const [year, month, day] = currentDueDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (option) {
    case "7d":
      date.setDate(date.getDate() + 7);
      break;
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function createFollowUp(
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dueDate = formData.get("due_date")?.toString().trim();
  if (!dueDate) return { error: "Due date is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase.from("follow_ups").insert({
    owner_id: user.id,
    person_id: personId,
    due_date: dueDate,
    note: nullable(formData, "note"),
    status: "pending",
  });

  if (error) return { error: error.message };

  redirect(`/people/${personId}`);
}

export async function updateFollowUp(
  id: string,
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const dueDate = formData.get("due_date")?.toString().trim();
  if (!dueDate) return { error: "Due date is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("follow_ups")
    .update({
      due_date: dueDate,
      note: nullable(formData, "note"),
      // status is intentionally not updated here —
      // use completeFollowUp / snoozeFollowUp for status transitions.
    })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };

  redirect(`/people/${personId}`);
}

export async function deleteFollowUp(
  id: string,
  personId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follow_ups")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  redirect(`/people/${personId}`);
}

export async function completeFollowUp(
  id: string,
  personId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follow_ups")
    .update({ status: "done", completed_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  redirect(`/people/${personId}`);
}

export async function snoozeFollowUp(
  id: string,
  personId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("follow_ups")
    .select("due_date")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!existing) redirect(`/people/${personId}`);

  const newDueDate = getSnoozeDate(existing.due_date, "7d");

  await supabase
    .from("follow_ups")
    .update({ status: "snoozed", due_date: newDueDate })
    .eq("id", id)
    .eq("owner_id", user.id);

  redirect(`/people/${personId}`);
}
