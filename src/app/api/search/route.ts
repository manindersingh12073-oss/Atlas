import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { searchNetwork } from "@/lib/search/queries";

/**
 * Grouped universal search for the dashboard search dropdown.
 * GET /api/search?q=<query> → { people, companies, tags, events }
 *
 * Owner-scoped automatically via RLS on the server Supabase client.
 * Empty query returns empty groups (suggestions are handled client-side).
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchNetwork(supabase, q);

  return NextResponse.json(results);
}
