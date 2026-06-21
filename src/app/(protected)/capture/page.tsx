import Link from "next/link";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { getCapturedToday, getRecentCompanies, getRecentPeople } from "@/lib/capture/queries";
import { getCompanySuggestions } from "@/lib/people/queries";
import { getTagsWithCounts } from "@/lib/tags/queries";
import { createClient } from "@/lib/supabase/server";

// Only relative paths within the app are allowed as returnTo destinations.
function isSafeReturnTo(path: string | undefined): path is string {
  if (!path) return false;
  return (
    path.startsWith("/people/") ||
    path === "/dashboard" ||
    path.startsWith("/events/")
  );
}

type Props = {
  searchParams: Promise<{
    relationshipTarget?: string;
    relationshipType?: string;
    returnTo?: string;
  }>;
};

export default async function CapturePage({ searchParams }: Props) {
  const params = await searchParams;
  const relTarget = params.relationshipTarget;
  const relType = params.relationshipType;
  const returnTo = isSafeReturnTo(params.returnTo) ? params.returnTo : undefined;

  const supabase = await createClient();

  const [capturedToday, allTags, recentCompanies, allCompanies, recentPeople, eventsResult] =
    await Promise.all([
      getCapturedToday(supabase),
      getTagsWithCounts(supabase),
      getRecentCompanies(supabase),
      getCompanySuggestions(supabase),
      getRecentPeople(supabase),
      supabase
        .from("events")
        .select("id, name, event_date")
        .order("event_date", { ascending: false, nullsFirst: false })
        .limit(20),
    ]);

  // Fetch the target person's name so the form can display relationship context.
  let relationshipTargetName: string | undefined;
  if (relTarget) {
    const { data } = await supabase
      .from("people")
      .select("name")
      .eq("id", relTarget)
      .single();
    relationshipTargetName = data?.name ?? undefined;
  }

  return (
    <main className="mx-auto max-w-lg">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <Link
          href={returnTo ?? "/dashboard"}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {returnTo ? "Back" : "Dashboard"}
        </Link>
      </div>
      <CaptureForm
        capturedToday={capturedToday}
        allTags={allTags}
        recentCompanies={recentCompanies}
        allCompanies={allCompanies}
        recentPeople={recentPeople}
        events={(eventsResult.data ?? []) as { id: string; name: string; event_date: string | null }[]}
        defaultEventId={null}
        hideEventSelector={false}
        relationshipTarget={relTarget}
        relationshipType={relType}
        relationshipTargetName={relationshipTargetName}
        returnTo={returnTo}
      />
    </main>
  );
}
