"use client";

import { useState } from "react";

import { AIButton, type AIButtonSize, type AIButtonVariant } from "@/components/ui/ai/AIButton";
import { MeetingBriefModal } from "./MeetingBriefModal";

type MeetingBriefButtonProps = {
  personId: string;
  personName: string;
  label?: string;
  variant?: AIButtonVariant;
  size?: AIButtonSize;
  className?: string;
};

/**
 * Meeting Brief's trigger — used both prominently in the person page header
 * (next to Edit/Delete) and inside PersonAskAtlasPanel, so the flagship
 * experience is reachable from more than one place without duplicating the
 * modal wiring. Defaults to the Primary tier (solid) since Meeting Brief is
 * the flagship AI action — deliberately heavier than AskAtlasButton's
 * Secondary default.
 */
export function MeetingBriefButton({
  personId,
  personName,
  label = "Meeting Brief",
  variant = "solid",
  size = "sm",
  className,
}: MeetingBriefButtonProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AIButton type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </AIButton>
      <MeetingBriefModal personId={personId} personName={personName} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
