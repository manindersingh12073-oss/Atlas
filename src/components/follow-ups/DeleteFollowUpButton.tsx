"use client";

import { useTransition } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { useDemoGuard } from "@/lib/demo/context";

export function DeleteFollowUpButton({
  deleteAction,
}: {
  deleteAction: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const guard = useDemoGuard();

  function handleClick() {
    guard(() => {
      if (!confirm("Delete this follow-up? This cannot be undone.")) return;
      startTransition(() => deleteAction());
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-red-500 hover:underline disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center gap-1">
          <Spinner className="h-3 w-3" />
          Deleting…
        </span>
      ) : (
        "Delete"
      )}
    </button>
  );
}
