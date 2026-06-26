import { createClient } from "@/lib/supabase/server";
import { fetchAllUserData } from "@/lib/export/queries";
import { buildJSON } from "@/lib/export/formatters";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await fetchAllUserData(supabase, user.id);
  const json = buildJSON(data, user.email ?? "");

  const date = new Date().toISOString().split("T")[0];

  return new Response(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="atlas-backup-${date}.json"`,
    },
  });
}
