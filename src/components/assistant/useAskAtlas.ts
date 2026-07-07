"use client";

import { useCallback, useRef, useState } from "react";

import { summarizeAnswerForHistory } from "@/lib/assistant/answerText";
import { recordAction } from "@/lib/assistant/recent-actions";
import { getAction, type TemplateContext } from "@/lib/assistant/registry";
import type { AssistantFocus, AtlasAnswer, ChatEvent, ChatMessage } from "@/lib/assistant/types";

export type ToolStatus = { id: string; label: string; done: boolean };

export type Exchange = {
  id: string;
  prompt: string;
  templateId?: string;
  toolStatus: ToolStatus[];
  /** Progressive "summary" text while the model is still generating its final answer — cleared once `answer` lands. */
  streamingSummary?: string;
  answer?: AtlasAnswer;
  error?: string;
  loading: boolean;
};

function applyEvent(exchanges: Exchange[], exchangeId: string, event: ChatEvent): Exchange[] {
  return exchanges.map((e) => {
    if (e.id !== exchangeId) return e;
    switch (event.type) {
      case "tool-call-start":
        return { ...e, toolStatus: [...e.toolStatus, { id: event.id, label: event.label, done: false }] };
      case "tool-call-end":
        return { ...e, toolStatus: e.toolStatus.map((t) => (t.id === event.id ? { ...t, done: true } : t)) };
      case "summary-delta":
        return { ...e, streamingSummary: event.text };
      case "answer":
        return { ...e, answer: event.answer, streamingSummary: undefined, loading: false };
      case "error":
        return { ...e, error: event.message, loading: false };
      case "done":
        return { ...e, loading: false };
      default:
        return e;
    }
  });
}

/**
 * Session-only Ask Atlas conversation state — no persistence. Reads the
 * NDJSON stream from POST /api/assistant/chat and applies each ChatEvent to
 * the relevant exchange as it arrives, driving the live tool-status chips
 * and the final structured answer card.
 */
export function useAskAtlas() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const historyRef = useRef<ChatMessage[]>([]);
  const seqRef = useRef(0);

  const run = useCallback(
    async (prompt: string, opts?: { templateId?: string; focus?: AssistantFocus }) => {
      const id = `ex-${++seqRef.current}`;
      setExchanges((prev) => [
        ...prev,
        { id, prompt, templateId: opts?.templateId, toolStatus: [], loading: true },
      ]);

      const userMessage: ChatMessage = { role: "user", content: prompt };
      const outgoing = [...historyRef.current, userMessage];
      let finalAnswer: AtlasAnswer | undefined;

      try {
        const res = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: outgoing, focus: opts?.focus }),
        });

        if (!res.ok || !res.body) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setExchanges((prev) =>
            prev.map((e) =>
              e.id === id
                ? { ...e, loading: false, error: body?.error ?? `Ask Atlas failed (${res.status}).` }
                : e,
            ),
          );
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleLine = (line: string) => {
          if (!line.trim()) return;
          let event: ChatEvent;
          try {
            event = JSON.parse(line) as ChatEvent;
          } catch {
            return;
          }
          if (event.type === "answer") finalAnswer = event.answer;
          setExchanges((prev) => applyEvent(prev, id, event));
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) handleLine(line);
        }
        if (buffer.trim()) handleLine(buffer);

        historyRef.current = finalAnswer
          ? [...outgoing, { role: "assistant", content: summarizeAnswerForHistory(finalAnswer) }]
          : outgoing;
      } catch (err) {
        setExchanges((prev) =>
          prev.map((e) =>
            e.id === id
              ? { ...e, loading: false, error: err instanceof Error ? err.message : "Network error." }
              : e,
          ),
        );
      }
    },
    [],
  );

  const sendMessage = useCallback(
    (text: string, focus?: AssistantFocus) => run(text, { focus }),
    [run],
  );

  const sendTemplate = useCallback(
    (templateId: string, ctx?: TemplateContext, focus?: AssistantFocus) => {
      const action = getAction(templateId);
      if (!action) return;
      recordAction({ actionId: action.id, label: action.label, personName: ctx?.personName });
      void run(action.buildPrompt(ctx ?? {}), { templateId, focus });
    },
    [run],
  );

  const reset = useCallback(() => {
    setExchanges([]);
    historyRef.current = [];
  }, []);

  return { exchanges, sendMessage, sendTemplate, reset };
}
