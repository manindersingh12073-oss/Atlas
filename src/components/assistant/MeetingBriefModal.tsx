"use client";

import { useEffect, useRef } from "react";

import { AIButton } from "@/components/ui/ai/AIButton";
import { AIHeader } from "@/components/ui/ai/AIHeader";
import { AIResponseCard } from "@/components/ui/ai/AIResponseCard";
import { summarizeAnswerForHistory } from "@/lib/assistant/answerText";
import { MeetingBriefCard } from "./MeetingBriefCard";
import { useAskAtlas } from "./useAskAtlas";

type MeetingBriefModalProps = {
  personId: string;
  personName: string;
  open: boolean;
  onClose: () => void;
};

/**
 * Meeting Brief's dedicated, flagship experience — its own overlay (not
 * routed through AskAtlasPalette) so it has room for the full sectioned
 * layout. Still calls the identical /api/assistant/chat endpoint + the
 * "meeting-brief" action — no separate backend.
 */
export function MeetingBriefModal({ personId, personName, open, onClose }: MeetingBriefModalProps) {
  const { exchanges, sendTemplate, reset } = useAskAtlas();
  const requested = useRef(false);

  useEffect(() => {
    if (!open) {
      requested.current = false;
      reset();
      return;
    }
    if (requested.current) return;
    requested.current = true;
    sendTemplate("meeting-brief", { personName }, { personId });
  }, [open, personId, personName, sendTemplate, reset]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const exchange = exchanges[0];
  const answer = exchange?.answer;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Meeting brief for ${personName}`}
        className="atlas-dropdown max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-t-2 border-gray-200 border-t-teal-400 bg-white p-6 shadow-2xl dark:border-[#30363d] dark:border-t-teal-500 dark:bg-[#161b22]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <AIHeader title="Meeting Brief" badge />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-[#1c2230]"
          >
            ✕
          </button>
        </div>

        {!answer && !exchange?.error && (
          <div className="space-y-3">
            {exchange?.toolStatus.map((t) => (
              <p key={t.id} className="text-xs text-gray-500 dark:text-[#8b949e]">
                {t.done ? "✓" : "…"} {t.label}
              </p>
            ))}
            {exchange?.streamingSummary ? (
              <p className="text-sm text-gray-800 dark:text-[#e6edf3]">{exchange.streamingSummary}</p>
            ) : (
              <p className="text-xs text-teal-600 dark:text-teal-300">Preparing your meeting brief…</p>
            )}
            <div className="space-y-2">
              <div className="atlas-ai-shimmer h-4 w-2/3 rounded" />
              <div className="atlas-ai-shimmer h-3 w-full rounded" />
              <div className="atlas-ai-shimmer h-3 w-5/6 rounded" />
            </div>
          </div>
        )}

        {exchange?.error && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-[#4d1f1f] dark:bg-[#2a1717] dark:text-red-400">
            {exchange.error}
          </p>
        )}

        {answer && (
          <>
            <AIResponseCard>
              <MeetingBriefCard answer={answer} />
            </AIResponseCard>
            <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4 dark:border-[#30363d]">
              <AIButton
                type="button"
                variant="outline"
                onClick={() => navigator.clipboard.writeText(summarizeAnswerForHistory(answer))}
              >
                Copy brief
              </AIButton>
              <AIButton
                type="button"
                variant="outline"
                onClick={() => {
                  requested.current = false;
                  reset();
                  sendTemplate("meeting-brief", { personName }, { personId });
                  requested.current = true;
                }}
              >
                Regenerate
              </AIButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
