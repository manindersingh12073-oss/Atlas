import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";

// Demo Mode has no real Supabase session — visitors are recognised purely by
// this cookie, set by GET /demo and cleared by GET /demo/exit. Any code that
// needs to tell a demo visitor apart from an authenticated user reads it here.
export const DEMO_COOKIE = "atlas_demo";

/**
 * Server-side check (Server Components, Route Handlers, Server Actions).
 *
 * A real Supabase session always takes precedence over the demo cookie: a
 * visitor who tried the demo and then created a real account still carries
 * the `atlas_demo` cookie (it's a 30-day cookie, not cleared just by signing
 * in elsewhere), but must see their own — brand new, empty — account, not
 * the demo dataset. Without this check every page/route below would treat
 * that person as a demo visitor forever.
 */
export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  if (cookieStore.get(DEMO_COOKIE)?.value !== "1") return false;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return !user;
}
