import Link from "next/link";

import { EventForm } from "@/components/events/EventForm";
import { createEvent } from "@/lib/events/actions";

export default function NewEventPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/events" className="text-sm text-gray-500 hover:underline">
          ← Events
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Add event</h1>
      <EventForm action={createEvent} submitLabel="Add event" />
    </main>
  );
}
