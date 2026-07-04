import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

/**
 * Supabase client for use on the SERVER — Server Components, Route Handlers,
 * and Server Actions. Each request gets its own client bound to that request's
 * cookies. Parameterised with Database for fully typed queries.
 * Re-run `npm run db:types` after any schema migration to keep types current.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component, where setting cookies
            // is not allowed. Safe to ignore — the proxy (src/proxy.ts) handles
            // session refresh and cookie writes on every request.
          }
        },
      },
    },
  );
}
