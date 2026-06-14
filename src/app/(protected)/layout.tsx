import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

/**
 * Server-side guard for all authenticated routes. This is the authoritative
 * check — the proxy redirect is UX only. Anything rendered under (protected)
 * can assume a valid user.
 */
export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return <>{children}</>;
}
