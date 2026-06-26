import { createClient } from "@/lib/supabase/server";
import { fetchAllUserData } from "@/lib/export/queries";
import { buildZip } from "@/lib/export/formatters";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await fetchAllUserData(supabase, user.id);
  const zip = buildZip(data, user.email ?? "");

  const date = new Date().toISOString().split("T")[0];

  // TypeScript 6 strict Uint8Array generics require an explicit cast here.
  return new Response(zip.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="atlas-export-${date}.zip"`,
    },
  });
}
