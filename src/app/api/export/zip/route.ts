import { createClient } from "@/lib/supabase/server";
import { fetchAllUserData } from "@/lib/export/queries";
import { buildZip } from "@/lib/export/formatters";
import { isDemoMode } from "@/lib/demo/session";
import { demoDataset } from "@/lib/demo/dataset";
import { getDemoExportData } from "@/lib/demo/queries";

export async function GET() {
  let data: Awaited<ReturnType<typeof fetchAllUserData>>;
  let email: string;

  if (await isDemoMode()) {
    data = getDemoExportData();
    email = demoDataset.meta.email;
  } else {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    data = await fetchAllUserData(supabase, user.id);
    email = user.email ?? "";
  }

  const zip = buildZip(data, email);

  const date = new Date().toISOString().split("T")[0];

  // TypeScript 6 strict Uint8Array generics require an explicit cast here.
  return new Response(zip.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="atlas-export-${date}.zip"`,
    },
  });
}
