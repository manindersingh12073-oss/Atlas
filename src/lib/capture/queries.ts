import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

/**
 * People created by the user today (UTC), newest first.
 * Drives the "Captured today" list on the capture page and undo tracking.
 */
export async function getCapturedToday(
  supabase: SupabaseClient<Database>,
): Promise<{ id: string; name: string }[]> {
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("people")
    .select("id, name")
    .gte("created_at", `${today}T00:00:00.000Z`)
    .order("created_at", { ascending: false });

  return data ?? [];
}

/**
 * The N most recently added people. Used to pre-populate RelationshipPicker
 * with likely candidates when standing at a conference.
 */
export async function getRecentPeople(
  supabase: SupabaseClient<Database>,
  limit = 10,
): Promise<{ id: string; name: string; company: string | null }[]> {
  const { data } = await supabase
    .from("people")
    .select("id, name, company")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as { id: string; name: string; company: string | null }[];
}

/**
 * Returns the N most recently used distinct company names.
 * Shown at the top of the company suggestions in capture mode.
 */
export async function getRecentCompanies(
  supabase: SupabaseClient<Database>,
  limit = 6,
): Promise<string[]> {
  const { data } = await supabase
    .from("people")
    .select("company")
    .not("company", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const seen = new Set<string>();
  const result: string[] = [];

  for (const row of data ?? []) {
    if (!row.company) continue;
    const key = row.company.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(row.company);
      if (result.length >= limit) break;
    }
  }

  return result;
}

export type ConferenceStatus = {
  eventId: string | null;
  eventName: string | null;
  capturedCount: number;
  recentCaptures: { id: string; name: string }[];
};

/**
 * Returns the active conference status if people were captured today.
 * Returns null when no one has been captured today.
 * Used to render the "Current conference" block on the dashboard.
 */
export async function getCurrentConference(
  supabase: SupabaseClient<Database>,
): Promise<ConferenceStatus | null> {
  const today = new Date().toISOString().split("T")[0];

  const { data: todayPeople, count } = await supabase
    .from("people")
    .select("id, name", { count: "exact" })
    .gte("created_at", `${today}T00:00:00.000Z`)
    .order("created_at", { ascending: false })
    .limit(3);

  if (!todayPeople || todayPeople.length === 0) return null;

  // Find the most recent event linked to people captured today.
  type EventLink = {
    event_id: string;
    events: { id: string; name: string } | null;
  };

  const { data: eventLinks } = await supabase
    .from("event_people")
    .select("event_id, events(id, name)")
    .in(
      "person_id",
      todayPeople.map((p) => p.id),
    )
    .order("created_at", { ascending: false })
    .limit(1);

  const latestLink = (eventLinks ?? [])[0] as EventLink | undefined;

  return {
    eventId: latestLink?.events?.id ?? null,
    eventName: latestLink?.events?.name ?? null,
    capturedCount: count ?? todayPeople.length,
    recentCaptures: todayPeople,
  };
}
