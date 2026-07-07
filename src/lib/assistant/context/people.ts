import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getPersonFollowUps } from "@/lib/follow-ups/queries";
import { buildTimeline, type TimelineItem } from "@/lib/people/timeline";
import { getDisplayLabel, getPersonRelationships, type PersonRelationship } from "@/lib/relationships/queries";
import { getPersonTags } from "@/lib/tags/queries";

export type PersonFullRecord = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  created_at: string;
};

type EventLink = {
  event_id: string;
  event_name: string;
  event_date: string | null;
  location: string | null;
  encounter_note: string | null;
};

export type PersonFull = {
  person: PersonFullRecord;
  tags: { id: string; name: string }[];
  relationships: { label: string; otherPersonId: string; otherPersonName: string; type: string }[];
  followUps: { id: string; due_date: string; note: string | null; status: string }[];
  events: EventLink[];
  timeline: TimelineItem[];
};

/**
 * Full context bundle for one person — the single tool call an Ask Atlas
 * request needs to answer almost any question about a specific person.
 * Composes existing query functions (tags, relationships, follow-ups) plus
 * one direct `event_people` join, then reuses `buildTimeline()` unchanged —
 * its items already carry exactly the title/detail/date shape Ask Atlas
 * needs for citations.
 */
export async function getPersonFull(
  supabase: SupabaseClient<Database>,
  personId: string,
): Promise<PersonFull | null> {
  const [personResult, eventLinksResult, followUps, tags, relationships] = await Promise.all([
    supabase
      .from("people")
      .select("id, name, company, role, linkedin_url, email, phone, notes, created_at")
      .eq("id", personId)
      .maybeSingle(),
    supabase
      .from("event_people")
      .select("encounter_note, created_at, events(id, name, event_date, location)")
      .eq("person_id", personId),
    getPersonFollowUps(supabase, personId),
    getPersonTags(supabase, personId),
    getPersonRelationships(supabase, personId),
  ]);

  const person = personResult.data as PersonFullRecord | null;
  if (!person) return null;

  type RawLink = {
    encounter_note: string | null;
    created_at: string;
    events: { id: string; name: string; event_date: string | null; location: string | null } | null;
  };

  const rawLinks = (eventLinksResult.data ?? []) as RawLink[];

  const events: EventLink[] = rawLinks
    .filter((l): l is RawLink & { events: NonNullable<RawLink["events"]> } => l.events !== null)
    .map((l) => ({
      event_id: l.events.id,
      event_name: l.events.name,
      event_date: l.events.event_date,
      location: l.events.location,
      encounter_note: l.encounter_note,
    }));

  const timeline = buildTimeline(
    { id: person.id, created_at: person.created_at },
    rawLinks,
    followUps.map((f) => ({ ...f, updated_at: f.created_at })),
    relationships as unknown as Parameters<typeof buildTimeline>[3],
  );

  const relationshipSummaries = relationships.map((rel: PersonRelationship) => {
    const isPersonA = rel.person_a === person.id;
    const other = isPersonA ? rel.b : rel.a;
    return {
      label: getDisplayLabel(rel.type, isPersonA, other?.name ?? ""),
      otherPersonId: other?.id ?? "",
      otherPersonName: other?.name ?? "",
      type: rel.type,
    };
  });

  return {
    person,
    tags: tags.map((t) => ({ id: t.id, name: t.name })),
    relationships: relationshipSummaries,
    followUps: followUps.map((f) => ({ id: f.id, due_date: f.due_date, note: f.note, status: f.status })),
    events,
    timeline,
  };
}
