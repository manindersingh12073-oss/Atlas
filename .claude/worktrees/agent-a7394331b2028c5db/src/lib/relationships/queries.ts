import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";

export type RelationshipType =
  | "met_together"
  | "introduced_by"
  | "works_with"
  | "co_founder"
  | "friend";

export type PersonRelationship = {
  id: string;
  type: RelationshipType;
  created_at: string;
  person_a: string;
  person_b: string;
  a: { id: string; name: string } | null;
  b: { id: string; name: string } | null;
};

/**
 * Returns all relationships for a person, from either side.
 * Joins both person FKs to people so the display name for each side is available.
 */
export async function getPersonRelationships(
  supabase: SupabaseClient<Database>,
  personId: string,
): Promise<PersonRelationship[]> {
  // Cast: person_relationships is not in generated types until db:types is re-run post-migration.
  const { data } = await (supabase as any)
    .from("person_relationships")
    .select(
      "id, type, created_at, person_a, person_b, a:people!person_a(id, name), b:people!person_b(id, name)",
    )
    .or(`person_a.eq.${personId},person_b.eq.${personId}`)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as PersonRelationship[];
}

/**
 * Returns the display label for a relationship from one person's perspective.
 *
 * Convention: person_a was introduced by person_b (introduced_by is asymmetric).
 * All other types are symmetric — the label is the same from either side.
 *
 * isPersonA = true  → viewing from person_a's page
 * isPersonA = false → viewing from person_b's page
 */
export function getDisplayLabel(
  type: RelationshipType,
  isPersonA: boolean,
  otherName: string,
): string {
  switch (type) {
    case "met_together":
      return `Met together with ${otherName}`;
    case "introduced_by":
      // person_a was introduced by person_b
      return isPersonA
        ? `Introduced by ${otherName}`
        : `Introduced ${otherName}`;
    case "works_with":
      return `Works with ${otherName}`;
    case "co_founder":
      return `Co-founder with ${otherName}`;
    case "friend":
      return `Friends with ${otherName}`;
  }
}

export const RELATIONSHIP_OPTIONS: readonly { value: RelationshipType; label: string }[] = [
  { value: "met_together", label: "Met together" },
  { value: "introduced_by", label: "Introduced by" },
  { value: "works_with", label: "Works with" },
  { value: "co_founder", label: "Co-founder" },
  { value: "friend", label: "Friend" },
] as const;
