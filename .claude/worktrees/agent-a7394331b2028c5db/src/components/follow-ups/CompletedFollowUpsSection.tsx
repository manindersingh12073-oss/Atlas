"use client";

import { useState } from "react";

import Link from "next/link";

import { UncompleteFollowUpButton } from "@/components/follow-ups/UncompleteFollowUpButton";

type DoneFollowUpItem = {
  id: string;
  due_date: string;
  note: string | null;
  completed_at: string | null;
  people: { id: string; name: string } | null;
  uncompleteAction: () => Promise<void>;
};

type Groups = {
  today: DoneFollowUpItem[];
  thisWeek: DoneFollowUpItem[];
  earlier: DoneFollowUpItem[];
};

function groupByCompletedAt(items: DoneFollowUpItem[]): Groups {
  const now = new Date();
  // Midnight local time today — used as group boundary.
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // 7 days before today (exclusive of today).
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: DoneFollowUpItem[] = [];
  const thisWeek: DoneFollowUpItem[] = [];
  const earlier: DoneFollowUpItem[] = [];

  for (const item of items) {
    const completedDate = item.completed_at ? new Date(item.completed_at) : null;
    if (!completedDate || completedDate >= todayStart) {
      today.push(item);
    } else if (completedDate >= weekStart) {
      thisWeek.push(item);
    } else {
      earlier.push(item);
    }
  }

  return { today, thisWeek, earlier };
}

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

function GroupList({ items }: { items: DoneFollowUpItem[] }) {
  return (
    <ul className="divide-y divide-gray-100 rounded border border-gray-200">
      {items.map((f) => (
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
    </ul>
  );
}

export function CompletedFollowUpsSection({
  items,
}: {
  items: DoneFollowUpItem[];
}) {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const groups = groupByCompletedAt(items);

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
        <div className="mt-3 space-y-4">
          {groups.today.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Completed today
              </p>
              <GroupList items={groups.today} />
            </div>
          )}

          {groups.thisWeek.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Completed this week
              </p>
              <GroupList items={groups.thisWeek} />
            </div>
          )}

          {groups.earlier.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Completed earlier
              </p>
              <GroupList items={groups.earlier} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
