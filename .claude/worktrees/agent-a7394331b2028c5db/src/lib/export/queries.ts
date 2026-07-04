import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ExportData = {
  profile: ProfileRow | null;
  people: Record<string, unknown>[];
  events: Record<string, unknown>[];
  event_people: Record<string, unknown>[];
  tags: Record<string, unknown>[];
  person_tags: Record<string, unknown>[];
  follow_ups: Record<string, unknown>[];
  relationships: Record<string, unknown>[];
};

/**
 * Fetches every row the user owns across all seven data tables plus their profile.
 * Uses RLS via the standard server client — no service role key is used.
 * owner_id is included in all rows; CSVs strip it at the formatter layer.
 *
 * person_relationships queries use `as any` until db:types is regenerated
 * after the migration is applied.
 */
export async function fetchAllUserData(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ExportData> {
  const [
    profileResult,
    peopleResult,
    eventsResult,
    eventPeopleResult,
    tagsResult,
    personTagsResult,
    followUpsResult,
    relationshipsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, created_at, updated_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("people")
      .select(
        "id, owner_id, name, company, role, linkedin_url, email, phone, notes, created_at, updated_at",
      )
      .order("name"),
    supabase
      .from("events")
      .select(
        "id, owner_id, name, event_date, location, description, created_at, updated_at",
      )
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("event_people")
      .select("event_id, person_id, owner_id, encounter_note, created_at"),
    supabase.from("tags").select("id, owner_id, name, color, created_at"),
    supabase.from("person_tags").select("person_id, tag_id, owner_id"),
    supabase
      .from("follow_ups")
      .select(
        "id, owner_id, person_id, due_date, note, status, completed_at, created_at, updated_at",
      ),
    (supabase as any)
      .from("person_relationships")
      .select("id, owner_id, person_a, person_b, type, created_at"),
  ]);

  return {
    profile: (profileResult.data as ProfileRow | null) ?? null,
    people: (peopleResult.data ?? []) as Record<string, unknown>[],
    events: (eventsResult.data ?? []) as Record<string, unknown>[],
    event_people: (eventPeopleResult.data ?? []) as Record<string, unknown>[],
    tags: (tagsResult.data ?? []) as Record<string, unknown>[],
    person_tags: (personTagsResult.data ?? []) as Record<string, unknown>[],
    follow_ups: (followUpsResult.data ?? []) as Record<string, unknown>[],
    relationships: (relationshipsResult.data ?? []) as Record<string, unknown>[],
  };
}
