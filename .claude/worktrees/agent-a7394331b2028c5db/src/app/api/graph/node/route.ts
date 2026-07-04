import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getGraphNodeDetail } from "@/lib/graph/detail";

/**
 * Lazy detail for a single graph node (person or event only — company/tag
 * panels are derived client-side from the loaded graph).
 * GET /api/graph/node?id=person:<uuid> | event:<uuid>. Owner-scoped via RLS.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const detail = await getGraphNodeDetail(supabase, id);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(detail);
}
