import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * OAuth / magic-link callback.
 *
 * After a user authenticates with Supabase (Google, email magic link, etc.),
 * Supabase redirects the browser back to this route with a `?code=...` param.
 * We exchange that code for a session (which sets the auth cookies), then send
 * the user on to their intended destination.
 *
 * This is auth *plumbing*, not a feature — the login UI that initiates the flow
 * is built in a later phase. It lives here now so the redirect URL is stable.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // Only allow relative, single-slash paths to prevent open redirects.
  const requested = searchParams.get("next");
  const next =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // No code, or the exchange failed.
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
