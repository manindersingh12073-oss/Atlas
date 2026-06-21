import Link from "next/link";
import { notFound } from "next/navigation";

import { CaptureForm } from "@/components/capture/CaptureForm";
import { getCapturedToday, getRecentCompanies, getRecentPeople } from "@/lib/capture/queries";
import { getCompanySuggestions } from "@/lib/people/queries";
import { getTagsWithCounts } from "@/lib/tags/queries";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export default async function EventCapturePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [eventResult, capturedToday, allTags, recentCompanies, allCompanies, recentPeople] =
    await Promise.all([
      supabase.from("events").select("id, name").eq("id", id).single(),
      getCapturedToday(supabase),
      getTagsWithCounts(supabase),
      getRecentCompanies(supabase),
      getCompanySuggestions(supabase),
      getRecentPeople(supabase),
    ]);

  if (!eventResult.data) notFound();

  const event = eventResult.data;

  return (
    <main className="mx-auto max-w-lg">
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <Link
          href={`/events/${event.id}`}
          className="text-sm text-gray-500 hover:underline"
        >
          ← {event.name}
        </Link>
      </div>
      <CaptureForm
        capturedToday={capturedToday}
        allTags={allTags}
        recentCompanies={recentCompanies}
        allCompanies={allCompanies}
        recentPeople={recentPeople}
        events={[]}
        defaultEventId={event.id}
        hideEventSelector={true}
        eventName={event.name}
      />
    </main>
  );
}
