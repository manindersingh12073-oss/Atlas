import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";

/**
 * Refreshes the Supabase auth session on every matched request.
 *
 * Server Components cannot write cookies, so without this the user's session
 * token would never get refreshed and would silently expire. The middleware
 * runs before the request is handled, reads the session, and writes refreshed
 * auth cookies onto the outgoing response.
 *
 * IMPORTANT: do not insert logic between `createServerClient` and
 * `supabase.auth.getUser()` — getUser() is what triggers the token refresh.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session and validates the token against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── Route protection (intentionally NOT enforced in Phase 1) ──
  // No protected routes exist yet. When the (protected) route group gains
  // pages, add a redirect here, e.g.:
  //
  //   if (!user && request.nextUrl.pathname.startsWith("/app")) {
  //     const url = request.nextUrl.clone();
  //     url.pathname = "/login";
  //     return NextResponse.redirect(url);
  //   }
  void user;

  return supabaseResponse;
}
