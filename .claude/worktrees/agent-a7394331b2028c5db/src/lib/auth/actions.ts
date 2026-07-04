"use server";

import { redirect } from "next/navigation";

import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Starts the Google OAuth (PKCE) flow. Supabase returns a URL to Google's
 * consent screen; we redirect the browser there. After consent, Google sends
 * the user to /auth/callback, which exchanges the code for a session.
 */
export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "google",
  options: {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/dashboard`,
    queryParams: {
      prompt: "select_account",
    },
  },
});

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  // redirect() throws NEXT_REDIRECT — must be outside any try/catch.
  redirect(data.url);
}

/** Clears the session and returns the user to the login page. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
