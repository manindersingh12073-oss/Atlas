"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { RelationshipType } from "@/lib/relationships/queries";

export async function addRelationship(
  personAId: string,
  personBId: string,
  type: RelationshipType,
  redirectTo: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Cast: person_relationships is not in generated types until db:types is re-run post-migration.
  // Ignore 23505 (duplicate) — relationship already exists, which is fine.
  await (supabase as any).from("person_relationships").insert({
    owner_id: user.id,
    person_a: personAId,
    person_b: personBId,
    type,
  });

  revalidatePath(`/people/${personAId}`);
  revalidatePath(`/people/${personBId}`);
  revalidatePath("/people");
}

export async function removeRelationship(
  id: string,
  personAId: string,
  personBId: string,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await (supabase as any)
    .from("person_relationships")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  revalidatePath(`/people/${personAId}`);
  revalidatePath(`/people/${personBId}`);
  revalidatePath("/people");
}
