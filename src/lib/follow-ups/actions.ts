"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

function nullable(formData: FormData, key: string): string | null {
  const val = formData.get(key)?.toString().trim();
  return val || null;
}

// ── Snooze date calculation ───────────────────────────────────────────────────
// To add new options, extend SnoozeOption and add a case below.
// Callers bind the option at call-site; no other files need to change.

export type SnoozeOption = "1d" | "7d" | "30d";

function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getSnoozeDate(currentDueDate: string, option: SnoozeOption): string {
  if (option === "1d") {
    // "Tomorrow" is always relative to today, not the (possibly overdue) due date.
    const now = new Date();
    return formatLocalDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
  }

  // All other options offset from the current due date. Parse as local date
  // to avoid UTC day-shift in negative-offset timezones.
  const [year, month, day] = currentDueDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  switch (option) {
    case "7d":
      date.setDate(date.getDate() + 7);
      break;
    case "30d":
      date.setDate(date.getDate() + 30);
      break;
  }
  return formatLocalDate(date);
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
  redirectTo: string,
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

  redirect(redirectTo);
}

export async function deleteFollowUp(
  id: string,
  redirectTo: string,
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

  redirect(redirectTo);
}

export async function uncompleteFollowUp(
  id: string,
  redirectTo: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follow_ups")
    .update({ status: "pending", completed_at: null })
    .eq("id", id)
    .eq("owner_id", user.id);

  redirect(redirectTo);
}

export async function completeFollowUp(
  id: string,
  redirectTo: string,
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

  redirect(redirectTo);
}

export async function snoozeFollowUp(
  id: string,
  redirectTo: string,
  option: SnoozeOption,
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

  if (!existing) redirect(redirectTo);

  const newDueDate = getSnoozeDate(existing.due_date, option);

  await supabase
    .from("follow_ups")
    .update({ status: "snoozed", due_date: newDueDate })
    .eq("id", id)
    .eq("owner_id", user.id);

  redirect(redirectTo);
}
