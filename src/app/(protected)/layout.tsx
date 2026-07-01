import { Suspense } from "react";

import { redirect } from "next/navigation";

import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { TopNav } from "@/components/layout/TopNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Toast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <TopNav userEmail={user.email ?? ""} />
      <div className="flex-1">{children}</div>
      <CommandPalette />
      <KeyboardShortcuts />
      {/* Toast requires Suspense because it reads useSearchParams */}
      <Suspense fallback={null}>
        <Toast />
      </Suspense>
    </div>
  );
}
