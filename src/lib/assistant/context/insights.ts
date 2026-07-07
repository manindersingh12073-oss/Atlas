import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getDashboardFollowUps } from "@/lib/follow-ups/queries";

export type ReconnectionCandidate = {
  personId: string;
  personName: string;
  company: string | null;
  lastContactDate: string; // YYYY-MM-DD, the most recent event they were linked to
  daysSinceContact: number;
};

export type OverdueFollowUp = {
  personId: string;
  personName: string;
  dueDate: string;
  note: string | null;
};

export type ReconnectionSuggestions = {
  stale: ReconnectionCandidate[]; // people with no recent event, oldest last-contact first
  overdueFollowUps: OverdueFollowUp[];
};

/**
 * Plain, chat-independent function (no LLM involved) — a future scheduled
 * job can call this directly to build a proactive digest without going
 * through Ask Atlas at all. For now it also backs the `list_reconnection_suggestions`
 * tool.
 *
 * "Last contact" is approximated from the most recent `event_date` a person
 * was linked to (grouped in JS, same pattern as `getPersonEventData()`).
 * People are ranked stalest-first; only people with at least one recorded
 * event are considered (no event history yet is a different problem than
 * "went cold").
 */
export async function getReconnectionSuggestions(
  supabase: SupabaseClient<Database>,
  limit = 10,
): Promise<ReconnectionSuggestions> {
  const [linkResult, dashboardFollowUps] = await Promise.all([
    supabase
      .from("event_people")
      .select("person_id, people(id, name, company), events(event_date)"),
    getDashboardFollowUps(supabase),
  ]);

  type Row = {
    person_id: string;
    people: { id: string; name: string; company: string | null } | null;
    events: { event_date: string | null } | null;
  };

  const latestByPerson = new Map<
    string,
    { name: string; company: string | null; lastDate: string }
  >();

  for (const row of (linkResult.data ?? []) as Row[]) {
    const date = row.events?.event_date;
    const person = row.people;
    if (!date || !person) continue;
    const existing = latestByPerson.get(person.id);
    if (!existing || date > existing.lastDate) {
      latestByPerson.set(person.id, { name: person.name, company: person.company, lastDate: date });
    }
  }

  const today = new Date();
  const stale: ReconnectionCandidate[] = [...latestByPerson.entries()]
    .map(([personId, v]) => {
      const [y, m, d] = v.lastDate.split("-").map(Number);
      const days = Math.floor((today.getTime() - new Date(y, m - 1, d).getTime()) / (1000 * 60 * 60 * 24));
      return {
        personId,
        personName: v.name,
        company: v.company,
        lastContactDate: v.lastDate,
        daysSinceContact: days,
      };
    })
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
    .slice(0, limit);

  const overdueFollowUps: OverdueFollowUp[] = dashboardFollowUps.overdue
    .filter((f) => f.people)
    .map((f) => ({
      personId: f.people!.id,
      personName: f.people!.name,
      dueDate: f.due_date,
      note: f.note,
    }));

  return { stale, overdueFollowUps };
}
