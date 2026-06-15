"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string | null };

// Empty string from a form field → null for optional DB columns.
function nullable(formData: FormData, key: string): string | null {
  const val = formData.get(key)?.toString().trim();
  return val || null;
}

export async function createPerson(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data, error } = await supabase
    .from("people")
    .insert({
      owner_id: user.id,
      name,
      company: nullable(formData, "company"),
      role: nullable(formData, "role"),
      linkedin_url: nullable(formData, "linkedin_url"),
      email: nullable(formData, "email"),
      phone: nullable(formData, "phone"),
      notes: nullable(formData, "notes"),
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "Failed to create person." };

  // redirect() must be called outside try/catch — it throws NEXT_REDIRECT internally.
  redirect(`/people/${data.id}`);
}

export async function updatePerson(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get("name")?.toString().trim();
  if (!name) return { error: "Name is required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("people")
    .update({
      name,
      company: nullable(formData, "company"),
      role: nullable(formData, "role"),
      linkedin_url: nullable(formData, "linkedin_url"),
      email: nullable(formData, "email"),
      phone: nullable(formData, "phone"),
      notes: nullable(formData, "notes"),
    })
    .eq("id", id)
    .eq("owner_id", user.id); // belt-and-suspenders on top of RLS

  if (error) return { error: error.message };

  redirect(`/people/${id}`);
}

export async function deletePerson(id: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("people").delete().eq("id", id).eq("owner_id", user.id);

  redirect("/people");
}
