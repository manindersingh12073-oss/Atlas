import atlasDemoBackup from "../../../public/demo/atlas-demo.json";

// The single source of truth for Demo Mode: an Atlas backup JSON file in the
// exact format produced by /api/export/json and accepted by Atlas Restore
// (see src/lib/restore/validator.ts). Regenerate it with:
//   python tools/generate_demo_data.py --size demo
// then copy the output to public/demo/atlas-demo.json.

export type DemoPerson = {
  id: string;
  owner_id: string;
  name: string;
  company: string | null;
  role: string | null;
  linkedin_url: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type DemoEvent = {
  id: string;
  owner_id: string;
  name: string;
  event_date: string | null;
  location: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type DemoEventPerson = {
  event_id: string;
  person_id: string;
  owner_id: string;
  encounter_note: string | null;
  created_at: string;
};

export type DemoTag = {
  id: string;
  owner_id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type DemoPersonTag = {
  person_id: string;
  tag_id: string;
  owner_id: string;
};

export type DemoFollowUp = {
  id: string;
  owner_id: string;
  person_id: string;
  due_date: string;
  note: string | null;
  status: "pending" | "done" | "snoozed";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DemoRelationship = {
  id: string;
  owner_id: string;
  person_a: string;
  person_b: string;
  type: "met_together" | "introduced_by" | "works_with" | "co_founder" | "friend";
  created_at: string;
};

export type DemoProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

type RawBackup = {
  meta: { schema_version: string; atlas_version: string; export_type: string; exported_at: string; email: string };
  profile: DemoProfile | null;
  people: DemoPerson[];
  events: DemoEvent[];
  event_people: DemoEventPerson[];
  tags: DemoTag[];
  person_tags: DemoPersonTag[];
  follow_ups: DemoFollowUp[];
  relationships: DemoRelationship[];
};

const raw = atlasDemoBackup as unknown as RawBackup;

function buildDataset() {
  const people = raw.people;
  const events = raw.events;
  const eventPeople = raw.event_people;
  const tags = raw.tags;
  const personTags = raw.person_tags;
  const followUps = raw.follow_ups;
  const relationships = raw.relationships;

  const peopleById = new Map(people.map((p) => [p.id, p]));
  const eventsById = new Map(events.map((e) => [e.id, e]));
  const tagsById = new Map(tags.map((t) => [t.id, t]));

  return {
    meta: raw.meta,
    profile: raw.profile,
    people,
    events,
    eventPeople,
    tags,
    personTags,
    followUps,
    relationships,
    peopleById,
    eventsById,
    tagsById,
  };
}

// Computed once per server instance (module-level singleton) — the backup
// file never changes at runtime, so there is nothing to invalidate.
export const demoDataset = buildDataset();
