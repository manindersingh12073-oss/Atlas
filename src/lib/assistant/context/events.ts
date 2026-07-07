import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type EventFullRecord = {
  id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
};

export type EventFull = {
  event: EventFullRecord;
  attendees: { id: string; name: string; company: string | null; role: string | null }[];
};

/**
 * Full context bundle for one event — event fields plus attendee list.
 * Mirrors the query pattern already used by the event detail page.
 */
export async function getEventFull(
  supabase: SupabaseClient<Database>,
  eventId: string,
): Promise<EventFull | null> {
  const [eventResult, attendeesResult] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date, location, description, created_at")
      .eq("id", eventId)
      .maybeSingle(),
    supabase
      .from("event_people")
      .select("people(id, name, company, role)")
      .eq("event_id", eventId),
  ]);

  const event = eventResult.data as EventFullRecord | null;
  if (!event) return null;

  type Row = { people: { id: string; name: string; company: string | null; role: string | null } | null };

  const attendees = ((attendeesResult.data ?? []) as Row[])
    .map((r) => r.people)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return { event, attendees };
}
