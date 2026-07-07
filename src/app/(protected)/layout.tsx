import { Suspense } from "react";

import { redirect } from "next/navigation";

import { AskAtlasFab } from "@/components/assistant/AskAtlasFab";
import { AskAtlasPalette } from "@/components/assistant/AskAtlasPalette";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { TopNav } from "@/components/layout/TopNav";
import { CommandPalette } from "@/components/search/CommandPalette";
import { Toast } from "@/components/ui/Toast";
import { DemoBanner } from "@/components/demo/DemoBanner";
import { DemoModeModal } from "@/components/demo/DemoModeModal";
import { DemoWelcomeTour } from "@/components/demo/DemoWelcomeTour";
import { DemoModeProvider } from "@/lib/demo/context";
import { isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

export default async function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = !user && (await isDemoMode());

  if (!user && !isDemo) redirect("/login");

  return (
    <DemoModeProvider isDemo={isDemo}>
      <div className="flex min-h-screen flex-col">
        {isDemo && <DemoBanner />}
        <TopNav userEmail={user?.email ?? "Demo visitor"} isDemo={isDemo} />
        <div className="flex-1">{children}</div>
        <CommandPalette />
        {/* Atlas Copilot is available in Demo Mode too — it's a differentiator,
            not a gated extra. The chat API routes Demo Mode requests to the
            demo dataset and rate-limits them (see /api/assistant/chat). */}
        <AskAtlasPalette />
        <AskAtlasFab />
        <KeyboardShortcuts />
        {isDemo && <DemoModeModal />}
        {isDemo && <DemoWelcomeTour />}
        {/* Toast requires Suspense because it reads useSearchParams */}
        <Suspense fallback={null}>
          <Toast />
        </Suspense>
      </div>
    </DemoModeProvider>
  );
}
