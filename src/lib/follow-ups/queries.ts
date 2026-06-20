import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type FollowUpStatus = "pending" | "done" | "snoozed";

export type FollowUp = {
  id: string;
  person_id: string;
  due_date: string;
  note: string | null;
  status: FollowUpStatus;
  completed_at: string | null;
  created_at: string;
};

export type FollowUpWithPerson = FollowUp & {
  people: { id: string; name: string } | null;
};

export type DashboardFollowUps = {
  overdue: FollowUpWithPerson[];
  dueToday: FollowUpWithPerson[];
  upcoming: FollowUpWithPerson[];
};

/**
 * Returns all follow-ups for a person, ordered by due_date ASC.
 * Caller is responsible for splitting active vs done for display.
 */
export async function getPersonFollowUps(
  supabase: SupabaseClient<Database>,
  personId: string,
): Promise<FollowUp[]> {
  const { data } = await supabase
    .from("follow_ups")
    .select("id, person_id, due_date, note, status, completed_at, created_at")
    .eq("person_id", personId)
    .order("due_date", { ascending: true });

  return (data ?? []) as FollowUp[];
}

/**
 * Returns pending and snoozed follow-ups due within the next 14 days
 * (including all overdue items), grouped into overdue / dueToday / upcoming.
 *
 * "Today" is the UTC date at query time — see timezone note in PROJECT_CONTEXT.md.
 * The (owner_id, status, due_date) index on follow_ups serves this query directly.
 */
export async function getDashboardFollowUps(
  supabase: SupabaseClient<Database>,
): Promise<DashboardFollowUps> {
  const today = new Date().toISOString().split("T")[0];
  const in14Days = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data } = await supabase
    .from("follow_ups")
    .select(
      "id, person_id, due_date, note, status, completed_at, created_at, people(id, name)",
    )
    .in("status", ["pending", "snoozed"])
    .lte("due_date", in14Days)
    .order("due_date", { ascending: true });

  const items = (data ?? []) as unknown as FollowUpWithPerson[];

  return {
    overdue: items.filter((f) => f.due_date < today),
    dueToday: items.filter((f) => f.due_date === today),
    upcoming: items.filter((f) => f.due_date > today),
  };
}
