import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";

/**
 * Supabase client for use on the SERVER — Server Components, Route Handlers,
 * and Server Actions. Each request gets its own client bound to that request's
 * cookies, so the user's session is read correctly per-request.
 *
 * Always create a fresh client per request (do not cache at module scope):
 * cookies() is request-scoped.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
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
            // is not allowed. This is safe to ignore because the proxy
            // (src/proxy.ts) refreshes the session and writes cookies on
            // every request.
          }
        },
      },
    },
  );
}
