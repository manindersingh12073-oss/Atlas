import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { getPersonFollowUps, type FollowUpStatus } from "@/lib/follow-ups/queries";
import {
  getDisplayLabel,
  getPersonRelationships,
  type RelationshipType,
} from "@/lib/relationships/queries";
import { getPersonTags } from "@/lib/tags/queries";

// Lazy, on-demand detail for a single graph node. Fetched only when a person or
// event node is clicked (company/tag panels are derived client-side from the
// already-loaded graph). Reuses the existing person query helpers — no
// duplicated queries.

export type PersonNodeDetail = {
  kind: "person";
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  notes: string | null;
  createdAt: string;
  tags: { id: string; name: string; color: string }[];
  events: { id: string; name: string; date: string | null }[];
  relationships: { id: string; label: string; otherId: string | null }[];
  followUps: {
    id: string;
    dueDate: string;
    note: string | null;
    status: FollowUpStatus;
  }[];
};

export type EventNodeDetail = {
  kind: "event";
  id: string;
  name: string;
  date: string | null;
  location: string | null;
  description: string | null;
  attendees: { id: string; name: string }[];
};

export type NodeDetail = PersonNodeDetail | EventNodeDetail;

export async function getGraphNodeDetail(
  supabase: SupabaseClient<Database>,
  nodeId: string,
): Promise<NodeDetail | null> {
  const sep = nodeId.indexOf(":");
  if (sep === -1) return null;
  const prefix = nodeId.slice(0, sep);
  const id = nodeId.slice(sep + 1);

  if (prefix === "person") return getPersonDetail(supabase, id);
  if (prefix === "event") return getEventDetail(supabase, id);
  return null;
}

async function getPersonDetail(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<PersonNodeDetail | null> {
  const [personRes, tags, relationships, followUps, eventsRes] =
    await Promise.all([
      supabase
        .from("people")
        .select("id, name, company, role, notes, created_at")
        .eq("id", id)
        .single(),
      getPersonTags(supabase, id),
      getPersonRelationships(supabase, id),
      getPersonFollowUps(supabase, id),
      supabase
        .from("event_people")
        .select("events(id, name, event_date)")
        .eq("person_id", id),
    ]);

  if (!personRes.data) return null;
  const p = personRes.data;

  const events = (
    (eventsRes.data ?? []) as {
      events: { id: string; name: string; event_date: string | null } | null;
    }[]
  )
    .map((r) => r.events)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => ({ id: e.id, name: e.name, date: e.event_date }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const rels = relationships.map((r) => {
    const isPersonA = r.person_a === id;
    const other = isPersonA ? r.b : r.a;
    return {
      id: r.id,
      label: getDisplayLabel(
        r.type as RelationshipType,
        isPersonA,
        other?.name ?? "someone",
      ),
      otherId: other?.id ?? null,
    };
  });

  return {
    kind: "person",
    id: p.id,
    name: p.name,
    company: p.company,
    role: p.role,
    notes: p.notes,
    createdAt: p.created_at,
    tags,
    events,
    relationships: rels,
    followUps: followUps.map((f) => ({
      id: f.id,
      dueDate: f.due_date,
      note: f.note,
      status: f.status,
    })),
  };
}

async function getEventDetail(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<EventNodeDetail | null> {
  const [eventRes, attendeesRes] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, event_date, location, description")
      .eq("id", id)
      .single(),
    supabase.from("event_people").select("people(id, name)").eq("event_id", id),
  ]);

  if (!eventRes.data) return null;
  const e = eventRes.data;

  const attendees = (
    (attendeesRes.data ?? []) as {
      people: { id: string; name: string } | null;
    }[]
  )
    .map((r) => r.people)
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    kind: "event",
    id: e.id,
    name: e.name,
    date: e.event_date,
    location: e.location,
    description: e.description,
    attendees,
  };
}
