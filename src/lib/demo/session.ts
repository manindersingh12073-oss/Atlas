import { cookies } from "next/headers";

// Demo Mode has no real Supabase session — visitors are recognised purely by
// this cookie, set by GET /demo and cleared by GET /demo/exit. Any code that
// needs to tell a demo visitor apart from an authenticated user reads it here.
export const DEMO_COOKIE = "atlas_demo";

/** Server-side check (Server Components, Route Handlers, Server Actions). */
export async function isDemoMode(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_COOKIE)?.value === "1";
}
