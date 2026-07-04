"use client";

import { useState } from "react";

import Link from "next/link";

import { UncompleteFollowUpButton } from "@/components/follow-ups/UncompleteFollowUpButton";
import { ProgressiveList } from "@/components/ui/ProgressiveList";

type DoneFollowUpItem = {
  id: string;
  due_date: string;
  note: string | null;
  completed_at: string | null;
  people: { id: string; name: string } | null;
  uncompleteAction: () => Promise<void>;
};

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCompletedAt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CompletedFollowUpsSection({
  items,
}: {
  items: DoneFollowUpItem[];
}) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm text-gray-400 hover:underline"
      >
        {open ? "Hide completed" : `Show ${items.length} completed`}
      </button>

      {open && (
        <div className="mt-3">
          <ProgressiveList
            storageKey="atlas:pagesize:followups"
            label="completed follow-ups"
            listClassName="divide-y divide-gray-100 rounded border border-gray-200"
            items={items.map((f) => (
              <li key={f.id} className="px-4 py-3 opacity-60">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/people/${f.people?.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {f.people?.name}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
                      <span>Due {formatDate(f.due_date)}</span>
                      {f.completed_at && (
                        <span>Completed {formatCompletedAt(f.completed_at)}</span>
                      )}
                    </div>
                    {f.note && (
                      <p className="mt-0.5 text-xs text-gray-500">{f.note}</p>
                    )}
                  </div>
                  <UncompleteFollowUpButton uncompleteAction={f.uncompleteAction} />
                </div>
              </li>
            ))}
          />
        </div>
      )}
    </div>
  );
}
