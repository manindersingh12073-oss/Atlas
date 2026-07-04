import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { env } from "@/lib/env";
import { DEMO_COOKIE } from "@/lib/demo/session";

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

  const { pathname } = request.nextUrl;
  const isPublic =
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/demo");

  // A Demo Mode visitor has no Supabase session at all — the atlas_demo
  // cookie (set by GET /demo, cleared by GET /demo/exit) stands in for one so
  // they can browse the normal protected routes read-only.
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === "1";

  // Unauthenticated user on a protected route → login (unless in Demo Mode).
  if (!user && !isPublic && !isDemo) {
    return redirectPreservingSession(request, supabaseResponse, "/login");
  }

  // Authenticated user on the login or root page → dashboard.
  if (user && (pathname === "/login" || pathname === "/")) {
    return redirectPreservingSession(request, supabaseResponse, "/dashboard");
  }

  return supabaseResponse;
}

/**
 * Redirects while carrying over any auth cookies that getUser() refreshed onto
 * `supabaseResponse`, so the session isn't dropped during the redirect.
 */
function redirectPreservingSession(
  request: NextRequest,
  supabaseResponse: NextResponse,
  pathname: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirectResponse = NextResponse.redirect(url);
  supabaseResponse.cookies
    .getAll()
    .forEach((cookie) => redirectResponse.cookies.set(cookie));
  return redirectResponse;
}
