"use client";

import { useState, useTransition } from "react";

import { useRouter } from "next/navigation";

import { AIButton } from "@/components/ui/ai/AIButton";
import { saveGoalSuggestion } from "@/lib/atlas-memory/actions";
import type { AtlasAction } from "@/lib/assistant/types";

function hrefFor(action: AtlasAction): string | null {
  switch (action.actionType) {
    case "open_person":
      return action.targetId ? `/people/${action.targetId}` : null;
    case "open_event":
      return action.targetId ? `/events/${action.targetId}` : null;
    case "draft_follow_up":
    case "create_reminder":
      return action.targetId ? `/people/${action.targetId}/follow-ups/new` : null;
    case "open_graph":
      return "/insights";
    case "save_goal":
      return null;
  }
}

function SaveGoalButton({ action }: { action: AtlasAction }) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  if (saved) {
    return <span className="rounded border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">Saved as goal ✓</span>;
  }

  return (
    <AIButton
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await saveGoalSuggestion(action.goalText ?? action.label);
          setSaved(true);
        })
      }
    >
      {pending ? "Saving…" : action.label}
    </AIButton>
  );
}

/** Renders the `actions` from an AtlasAnswer as buttons wired to real Atlas routes. */
export function SuggestedActions({ actions }: { actions?: AtlasAction[] }) {
  const router = useRouter();
  if (!actions || actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action, i) =>
        action.actionType === "save_goal" ? (
          <SaveGoalButton key={i} action={action} />
        ) : (
          <AIButton
            key={i}
            type="button"
            variant="outline"
            onClick={() => {
              const href = hrefFor(action);
              if (href) router.push(href);
            }}
          >
            {action.label}
          </AIButton>
        ),
      )}
    </div>
  );
}
