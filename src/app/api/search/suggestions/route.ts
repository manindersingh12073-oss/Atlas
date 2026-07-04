import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getSearchSuggestions } from "@/lib/search/queries";
import { isDemoMode } from "@/lib/demo/session";
import { getSearchSuggestionsDemo } from "@/lib/demo/queries";

/**
 * Empty-state suggestions for the command palette (recent events, popular
 * tags, top companies). Fetched lazily the first time the palette opens.
 * Owner-scoped via RLS.
 */
export async function GET() {
  if (await isDemoMode()) {
    return NextResponse.json(getSearchSuggestionsDemo());
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await getSearchSuggestions(supabase);
  return NextResponse.json(suggestions);
}
