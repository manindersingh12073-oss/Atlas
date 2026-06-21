// ── Timeline builder ──────────────────────────────────────────────────────────
// Pure function: takes data already fetched by the person detail page and
// returns a sorted array of TimelineItem ready for rendering.
//
// To add new entry types in future (notes, emails, AI summaries, etc.):
//   1. Extend TimelineItemType with the new value
//   2. Add a new block in buildTimeline() that pushes items
//   3. PersonTimeline renders the result unchanged — no component edits needed

export type TimelineItemType =
  | "person_created"
  | "event_attended"
  | "follow_up_created"
  | "follow_up_completed"
  | "follow_up_rescheduled";

export type TimelineItem = {
  id: string;
  type: TimelineItemType;
  /** ISO string — used only for sort order, not for display. */
  sortKey: string;
  /** Pre-formatted date string shown in the UI. */
  displayDate: string;
  icon: string;
  title: string;
  /** Secondary line below the title. */
  detail?: string;
};

// ── Input shapes ──────────────────────────────────────────────────────────────
// Typed to the fields each query selects. Defined locally so buildTimeline()
// stays self-contained and callers don't need to import from queries files.

type PersonInput = {
  id: string;
  created_at: string;
};

type EventLinkInput = {
  created_at: string; // event_people.created_at — when the link was recorded
  events: {
    id: string;
    name: string;
    event_date: string | null;
    location: string | null;
  } | null;
};

type FollowUpInput = {
  id: string;
  note: string | null;
  status: string;
  due_date: string;
  created_at: string;
  completed_at: string | null;
  updated_at: string;
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function formatLocalDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildTimeline(
  person: PersonInput,
  eventLinks: EventLinkInput[],
  followUps: FollowUpInput[],
): TimelineItem[] {
  const items: TimelineItem[] = [];

  // ── Person created ─────────────────────────────────────────────────────────
  items.push({
    id: `person-${person.id}`,
    type: "person_created",
    sortKey: person.created_at,
    displayDate: formatTimestamp(person.created_at),
    icon: "👤",
    title: "Added to Atlas",
  });

  // ── Events attended ────────────────────────────────────────────────────────
  // Sort key: event_date (when the meeting actually happened) when available,
  // falling back to event_people.created_at (when it was recorded in Atlas).
  for (const link of eventLinks) {
    if (!link.events) continue;
    const { id: eventId, name, event_date, location } = link.events;

    const sortKey = event_date
      ? `${event_date}T00:00:00.000Z`
      : link.created_at;

    const displayDate = event_date
      ? formatLocalDate(event_date)
      : formatTimestamp(link.created_at);

    const detail = [name, location].filter(Boolean).join(" · ");

    items.push({
      id: `event-${eventId}`,
      type: "event_attended",
      sortKey,
      displayDate,
      icon: "📍",
      title: "Met at event",
      detail,
    });
  }

  // ── Follow-ups ─────────────────────────────────────────────────────────────
  for (const fu of followUps) {
    // Created
    items.push({
      id: `followup-created-${fu.id}`,
      type: "follow_up_created",
      sortKey: fu.created_at,
      displayDate: formatTimestamp(fu.created_at),
      icon: "🔔",
      title: "Follow-up created",
      detail: fu.note ?? undefined,
    });

    // Completed
    if (fu.status === "done" && fu.completed_at) {
      items.push({
        id: `followup-completed-${fu.id}`,
        type: "follow_up_completed",
        sortKey: fu.completed_at,
        displayDate: formatTimestamp(fu.completed_at),
        icon: "✓",
        title: "Follow-up completed",
        detail: fu.note ?? undefined,
      });
    }

    // Rescheduled — best-effort: emitted when status is "snoozed".
    // Uses updated_at as the timestamp (set when the snooze action fires).
    // Edge case: if a snoozed follow-up's note is edited afterwards, updated_at
    // reflects the edit rather than the original snooze. Acceptable for v1.
    if (fu.status === "snoozed") {
      items.push({
        id: `followup-rescheduled-${fu.id}`,
        type: "follow_up_rescheduled",
        sortKey: fu.updated_at,
        displayDate: formatTimestamp(fu.updated_at),
        icon: "📅",
        title: "Follow-up rescheduled",
        detail: `Moved to ${formatLocalDate(fu.due_date)}`,
      });
    }
  }

  // Newest first; ISO strings compare correctly with localeCompare.
  return items.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
}
