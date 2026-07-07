"use client";

import { useEffect, useState } from "react";

import { AIButton } from "@/components/ui/ai/AIButton";
import { AIResponseCard } from "@/components/ui/ai/AIResponseCard";
import { AISparkleIcon } from "@/components/ui/ai/AISparkleIcon";
import { getAction } from "@/lib/assistant/registry";
import { useDemoMode } from "@/lib/demo/context";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcesList } from "./SourcesList";
import { SuggestedActions } from "./SuggestedActions";
import type { Exchange } from "./useAskAtlas";

const CONFIDENCE_DOT: Record<string, string> = { high: "text-green-500", medium: "text-amber-500", low: "text-gray-400" };

const GENERIC_LOADING_MESSAGES = ["Thinking…", "Working on it…"];

/** Rotates a contextual loading message (sourced from the action's registry entry) while waiting for the first tool call. */
function LoadingMessage({ templateId }: { templateId?: string }) {
  const messages = (templateId && getAction(templateId)?.loadingMessages) || GENERIC_LOADING_MESSAGES;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), 1200);
    return () => clearInterval(id);
  }, [messages]);

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-teal-600 dark:text-teal-300">{messages[index]}</p>
      <div className="atlas-ai-shimmer h-2 w-1/3 rounded" />
    </div>
  );
}

/**
 * One question/answer exchange: the prompt, live tool-status chips while
 * gathering, and the final structured card. `onFollowUp`, when provided,
 * routes a clicked follow-up chip straight to the caller's own
 * sendMessage/sendTemplate — continuing the same conversation session
 * instead of round-tripping through a fresh window event.
 */
export function AnswerCard({ exchange, onFollowUp }: { exchange: Exchange; onFollowUp?: (text: string) => void }) {
  const { prompt, templateId, toolStatus, streamingSummary, answer, error, loading } = exchange;
  const isDemo = useDemoMode();

  return (
    <div className="border-b border-gray-100 px-4 py-4 last:border-b-0 dark:border-[#30363d]">
      <p className="mb-2 text-sm font-medium text-gray-700 dark:text-[#cdd5de]">{prompt}</p>

      {toolStatus.length > 0 && (loading || !answer) && (
        <ul className="mb-2 space-y-1">
          {toolStatus.map((t) => (
            <li key={t.id} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#8b949e]">
              <span aria-hidden>{t.done ? "✓" : "…"}</span>
              {t.label}
            </li>
          ))}
        </ul>
      )}

      {loading && !answer && streamingSummary && (
        <p className="text-sm text-gray-800 dark:text-[#e6edf3]">{streamingSummary}</p>
      )}

      {loading && !streamingSummary && toolStatus.length === 0 && <LoadingMessage templateId={templateId} />}

      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-[#4d1f1f] dark:bg-[#2a1717] dark:text-red-400">
          {error}
        </p>
      )}

      {answer && (
        <AIResponseCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <AISparkleIcon className="h-3.5 w-3.5" />
                Atlas Copilot
              </span>
              <ConfidenceBadge confidence={answer.confidence} evidenceCount={answer.evidenceCount} />
            </div>

            {isDemo && (
              <p className="text-xs text-teal-600/80 dark:text-teal-400/70">
                Demo response — Atlas Copilot is answering using demo data.
              </p>
            )}

            <p className="text-sm text-gray-800 dark:text-[#e6edf3]">{answer.summary}</p>

            {answer.facts && answer.facts.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#656d76]">Facts</p>
                <SourcesList facts={answer.facts} />
              </div>
            )}

            {answer.suggestions && answer.suggestions.length > 0 && (
              <div className="rounded border border-teal-100 bg-teal-50/60 p-3 dark:border-teal-900/40 dark:bg-teal-500/5">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-300">
                  Suggestions
                </p>
                <ul className="space-y-2">
                  {answer.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-gray-700 dark:text-[#cdd5de]">
                      <div className="flex items-start justify-between gap-2">
                        <span>💡 {s.text}</span>
                        <span className={`shrink-0 text-[11px] font-medium ${CONFIDENCE_DOT[s.confidence]}`}>
                          {s.confidence}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs italic text-gray-500 dark:text-[#8b949e]">{s.rationale}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <SuggestedActions actions={answer.actions} />

            <SourcesList sources={answer.sources} />

            {onFollowUp && answer.followUps && answer.followUps.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {answer.followUps.map((text, i) => (
                  <AIButton key={i} type="button" variant="chip" size="sm" onClick={() => onFollowUp(text)}>
                    {text}
                  </AIButton>
                ))}
              </div>
            )}
          </div>
        </AIResponseCard>
      )}
    </div>
  );
}
