import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { validateBackup } from "@/lib/restore/validator";

type Row = Record<string, unknown>;

function remapOwner(rows: Row[], newOwnerId: string): Row[] {
  return rows.map((row) => ({ ...row, owner_id: newOwnerId }));
}

// Strip the generated search_vector column from people rows.
// The export query excludes it, but be defensive in case a backup was hand-edited.
function stripGenerated(rows: Row[]): Row[] {
  return rows.map(({ search_vector: _sv, ...rest }) => rest);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── 1. Parse ──────────────────────────────────────────────────────────────
  let data: unknown;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ success: false, stage: "parse", errors: ["No file provided."] });
    }
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    return Response.json({ success: false, stage: "parse", errors: ["The file is not valid JSON."] });
  }

  // ── 2. Validate (defense in depth — also validated by /validate route) ────
  const validation = validateBackup(data);
  if (!validation.valid) {
    return Response.json({ success: false, stage: "validation", errors: validation.errors });
  }

  const backup = data as Record<string, unknown>;
  const uid = user.id;

  const people = remapOwner(stripGenerated(backup.people as Row[]), uid);
  const events = remapOwner(backup.events as Row[], uid);
  const tags = remapOwner(backup.tags as Row[], uid);
  const followUps = remapOwner(backup.follow_ups as Row[], uid);
  const eventPeople = remapOwner(backup.event_people as Row[], uid);
  const personTags = remapOwner(backup.person_tags as Row[], uid);
  const relationships = remapOwner(backup.relationships as Row[], uid);

  // ── 3. Delete all existing user data ─────────────────────────────────────
  // Delete junctions first to avoid cascade conflicts, then primary entities.
  try {
    await Promise.all([
      (supabase as any).from("person_relationships").delete().eq("owner_id", uid),
      supabase.from("event_people").delete().eq("owner_id", uid),
      supabase.from("person_tags").delete().eq("owner_id", uid),
      supabase.from("follow_ups").delete().eq("owner_id", uid),
    ]);
    await Promise.all([
      supabase.from("people").delete().eq("owner_id", uid),
      supabase.from("events").delete().eq("owner_id", uid),
      supabase.from("tags").delete().eq("owner_id", uid),
    ]);
  } catch (err) {
    return Response.json({
      success: false,
      stage: "delete",
      message: `Failed to delete existing data: ${(err as Error).message}`,
    });
  }

  // ── 4. Insert backup data ─────────────────────────────────────────────────
  // Insertion order respects FK constraints:
  //   Phase A (parallel): tags, people, events  — no inter-entity FKs
  //   Phase B (parallel): follow_ups, person_tags, event_people, relationships
  //                       — all depend on phase A entities
  try {
    // All inserts cast through `as any` because the backup rows are typed as
    // Record<string, unknown>, which Supabase's typed insert overloads reject.
    // RLS still enforces owner_id at the database level.
    const db = supabase as any;

    if (tags.length > 0) {
      const { error } = await db.from("tags").insert(tags);
      if (error) throw new Error(`tags: ${error.message}`);
    }
    if (people.length > 0) {
      const { error } = await db.from("people").insert(people);
      if (error) throw new Error(`people: ${error.message}`);
    }
    if (events.length > 0) {
      const { error } = await db.from("events").insert(events);
      if (error) throw new Error(`events: ${error.message}`);
    }

    // Phase B — all depend on phase A
    if (followUps.length > 0) {
      const { error } = await db.from("follow_ups").insert(followUps);
      if (error) throw new Error(`follow_ups: ${error.message}`);
    }
    if (personTags.length > 0) {
      const { error } = await db.from("person_tags").insert(personTags);
      if (error) throw new Error(`person_tags: ${error.message}`);
    }
    if (eventPeople.length > 0) {
      const { error } = await db.from("event_people").insert(eventPeople);
      if (error) throw new Error(`event_people: ${error.message}`);
    }
    if (relationships.length > 0) {
      const { error } = await db.from("person_relationships").insert(relationships);
      if (error) throw new Error(`relationships: ${error.message}`);
    }
  } catch (err) {
    // The delete already completed. No rollback is attempted — the user still
    // has their backup file and can retry. The handler returns a clear message.
    return Response.json({
      success: false,
      stage: "insert",
      message: `Restore failed during insert (${(err as Error).message}). Your backup file is intact — try again.`,
    });
  }

  // ── 5. Invalidate router cache ────────────────────────────────────────────
  revalidatePath("/", "layout");

  return Response.json({
    success: true,
    inserted: {
      people: people.length,
      events: events.length,
      event_people: eventPeople.length,
      tags: tags.length,
      person_tags: personTags.length,
      follow_ups: followUps.length,
      relationships: relationships.length,
    },
  });
}
