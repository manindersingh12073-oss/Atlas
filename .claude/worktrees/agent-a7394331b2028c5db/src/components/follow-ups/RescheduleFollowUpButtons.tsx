"use client";

import { useTransition } from "react";

type Props = {
  tomorrowAction: () => Promise<void>;
  sevenDayAction: () => Promise<void>;
  thirtyDayAction: () => Promise<void>;
};

export function RescheduleFollowUpButtons({
  tomorrowAction,
  sevenDayAction,
  thirtyDayAction,
}: Props) {
  const [pendingTomorrow, startTomorrow] = useTransition();
  const [pending7d, start7d] = useTransition();
  const [pending30d, start30d] = useTransition();

  const anyPending = pendingTomorrow || pending7d || pending30d;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => startTomorrow(() => tomorrowAction())}
        disabled={anyPending}
        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
      >
        {pendingTomorrow ? "…" : "Tomorrow"}
      </button>
      <span className="text-xs text-gray-300" aria-hidden>·</span>
      <button
        type="button"
        onClick={() => start7d(() => sevenDayAction())}
        disabled={anyPending}
        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
      >
        {pending7d ? "…" : "+7d"}
      </button>
      <span className="text-xs text-gray-300" aria-hidden>·</span>
      <button
        type="button"
        onClick={() => start30d(() => thirtyDayAction())}
        disabled={anyPending}
        className="text-xs text-amber-600 hover:underline disabled:opacity-50"
      >
        {pending30d ? "…" : "+30d"}
      </button>
    </div>
  );
}
