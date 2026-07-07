"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AIButton } from "@/components/ui/ai/AIButton";
import { AIHeader } from "@/components/ui/ai/AIHeader";
import { AnswerCard } from "./AnswerCard";
import { ASK_ATLAS_EVENT, type AskAtlasEventDetail } from "./events";
import { PromptTemplateMenu } from "./PromptTemplateMenu";
import { useAskAtlas } from "./useAskAtlas";

/**
 * Global Ctrl/Cmd+J overlay — the command surface for Atlas Copilot. The
 * default (empty) view is the template menu, not a blank chat box; free-form
 * input is always available below it, but secondary. Every contextual
 * AskAtlasButton across the app opens this same overlay pre-filled and
 * auto-sent via the `atlas:ask-atlas` window event.
 */
export function AskAtlasPalette() {
  const { exchanges, sendMessage, sendTemplate, reset } = useAskAtlas();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const openRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [exchanges]);

  const close = useCallback(() => {
    setOpen(false);
    setInput("");
    reset();
  }, [reset]);

  const openWith = useCallback(
    (detail?: AskAtlasEventDetail) => {
      setOpen(true);
      if (detail?.autoSend) {
        if (detail.templateId)
          sendTemplate(
            detail.templateId,
            {
              personName: detail.personName,
              eventName: detail.eventName,
              attendeeNames: detail.attendeeNames,
              clusterLabel: detail.clusterLabel,
            },
            detail.focus,
          );
        else if (detail.prompt) void sendMessage(detail.prompt, detail.focus);
      }
    },
    [sendMessage, sendTemplate],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        if (openRef.current) close();
        else openWith();
      }
    }
    function onOpenEvent(e: Event) {
      openWith((e as CustomEvent<AskAtlasEventDetail>).detail);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener(ASK_ATLAS_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(ASK_ATLAS_EVENT, onOpenEvent);
    };
  }, [close, openWith]);

  const submit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setInput("");
    void sendMessage(trimmed);
  }, [input, sendMessage]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[10vh]"
      onMouseDown={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atlas Copilot"
        className="atlas-dropdown flex max-h-[75vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-t-2 border-gray-200 border-t-teal-400 bg-white shadow-2xl dark:border-[#30363d] dark:border-t-teal-500 dark:bg-[#161b22]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="border-b border-gray-200 px-4 py-3 dark:border-[#30363d]">
          <AIHeader title="Atlas Copilot" badge />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                } else if (e.key === "Escape") {
                  close();
                }
              }}
              placeholder="Ask Atlas anything…"
              autoComplete="off"
              className="block w-full bg-transparent text-base placeholder:text-gray-400 focus:outline-none"
            />
            <AIButton type="button" variant="solid" size="sm" onClick={submit} disabled={!input.trim()}>
              Ask
            </AIButton>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {exchanges.length === 0 ? (
            <PromptTemplateMenu onSelect={(templateId) => sendTemplate(templateId)} />
          ) : (
            exchanges.map((ex) => <AnswerCard key={ex.id} exchange={ex} onFollowUp={(text) => void sendMessage(text)} />)
          )}
        </div>
      </div>
    </div>
  );
}
