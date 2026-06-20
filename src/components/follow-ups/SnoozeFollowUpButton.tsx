"use client";

import { useTransition } from "react";

export function SnoozeFollowUpButton({
  snoozeAction,
}: {
  snoozeAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => snoozeAction())}
      disabled={pending}
      className="text-xs text-amber-600 hover:underline disabled:opacity-50"
    >
      {pending ? "Snoozing…" : "Snooze 7d"}
    </button>
  );
}
