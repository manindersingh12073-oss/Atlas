import { createClient } from "@/lib/supabase/server";
import { validateBackup } from "@/lib/restore/validator";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let data: unknown;
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ valid: false, errors: ["No file provided."] });
    }
    const text = await file.text();
    data = JSON.parse(text);
  } catch {
    return Response.json({ valid: false, errors: ["The file is not valid JSON."] });
  }

  const result = validateBackup(data);
  return Response.json(result);
}
