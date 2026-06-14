import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";

/**
 * Supabase client for use in the BROWSER (Client Components).
 *
 * Reads/writes the auth session from cookies that the server and middleware
 * keep in sync. Use this only in files marked "use client".
 *
 * Phase 2: parameterise with the generated `Database` type once
 * `src/types/database.types.ts` is generated:
 *   createBrowserClient<Database>(...)
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
