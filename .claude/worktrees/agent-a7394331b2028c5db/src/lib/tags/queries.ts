import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type TagWithCount = Tag & { count: number };

/**
 * Returns all tags owned by the user, ordered by usage count descending,
 * then alphabetically. Two parallel queries merged in JS — same pattern as
 * getEvents() / getPersonEventData().
 */
export async function getTagsWithCounts(
  supabase: SupabaseClient<Database>,
): Promise<TagWithCount[]> {
  const [tagsResult, countsResult] = await Promise.all([
    supabase.from("tags").select("id, name, color"),
    supabase.from("person_tags").select("tag_id"),
  ]);

  const countMap = new Map<string, number>();
  for (const { tag_id } of countsResult.data ?? []) {
    countMap.set(tag_id, (countMap.get(tag_id) ?? 0) + 1);
  }

  return (tagsResult.data ?? [])
    .map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color ?? "blue",
      count: countMap.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/**
 * Returns the tags attached to a single person.
 */
export async function getPersonTags(
  supabase: SupabaseClient<Database>,
  personId: string,
): Promise<Tag[]> {
  const { data } = await supabase
    .from("person_tags")
    .select("tags(id, name, color)")
    .eq("person_id", personId);

  type Row = { tags: { id: string; name: string; color: string | null } | null };

  return ((data ?? []) as Row[])
    .map((r) => r.tags)
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => ({ ...t, color: t.color ?? "blue" }));
}

/**
 * Returns a Map<person_id, Tag[]> for all people owned by the user.
 * One query; used by the people list to show inline tags and drive AND filtering
 * without N+1 queries.
 */
export async function getPersonTagsMap(
  supabase: SupabaseClient<Database>,
): Promise<Map<string, Tag[]>> {
  const { data } = await supabase
    .from("person_tags")
    .select("person_id, tags(id, name, color)");

  type Row = {
    person_id: string;
    tags: { id: string; name: string; color: string | null } | null;
  };

  const map = new Map<string, Tag[]>();
  for (const row of (data ?? []) as Row[]) {
    if (!row.tags) continue;
    const tag: Tag = { ...row.tags, color: row.tags.color ?? "blue" };
    const existing = map.get(row.person_id) ?? [];
    existing.push(tag);
    map.set(row.person_id, existing);
  }

  return map;
}
