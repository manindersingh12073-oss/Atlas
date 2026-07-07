"use client";

import { AIButton, type AIButtonSize, type AIButtonVariant } from "@/components/ui/ai/AIButton";
import type { AssistantFocus } from "@/lib/assistant/types";
import { ASK_ATLAS_EVENT, type AskAtlasEventDetail } from "./events";

type AskAtlasButtonProps = {
  /** A built-in Copilot action id (see src/lib/assistant/registry.ts). */
  templateId?: string;
  /** Raw prompt text — used instead of an action when the prompt needs context an action placeholder can't express (e.g. two people). */
  prompt?: string;
  /** Fills the {personName} placeholder in action prompts. */
  personName?: string;
  /** Fills the {eventName}/{attendeeNames} placeholders (e.g. "summarise-attendees"). */
  eventName?: string;
  attendeeNames?: string[];
  /** Fills the {clusterLabel} placeholder for graph-cluster actions. */
  clusterLabel?: string;
  focus?: AssistantFocus;
  label: string;
  variant?: AIButtonVariant;
  size?: AIButtonSize;
  className?: string;
};

/**
 * The one shared entry point for every contextual "Ask Atlas" action across
 * the app (person page, relationship rows, timeline, graph panels,
 * dashboard). Dispatches a window event that AskAtlasPalette listens for,
 * opening the overlay pre-filled and auto-sent — no bespoke wiring per
 * surface. Renders via AIButton, so variant defaults to the Secondary tier
 * unless a caller explicitly asks for Primary/Tertiary.
 */
export function AskAtlasButton({
  templateId,
  prompt,
  personName,
  eventName,
  attendeeNames,
  clusterLabel,
  focus,
  label,
  variant = "outline",
  size = "sm",
  className,
}: AskAtlasButtonProps) {
  return (
    <AIButton
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        const detail: AskAtlasEventDetail = {
          templateId,
          prompt,
          personName,
          eventName,
          attendeeNames,
          clusterLabel,
          focus,
          autoSend: true,
        };
        window.dispatchEvent(new CustomEvent(ASK_ATLAS_EVENT, { detail }));
      }}
    >
      {label}
    </AIButton>
  );
}
