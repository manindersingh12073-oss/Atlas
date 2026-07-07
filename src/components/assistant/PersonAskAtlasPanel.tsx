"use client";

import { useState } from "react";

import { AIButton } from "@/components/ui/ai/AIButton";
import { AISection } from "@/components/ui/ai/AISection";
import { COPILOT_ACTIONS } from "@/lib/assistant/registry";
import { AnswerCard } from "./AnswerCard";
import { MeetingBriefButton } from "./MeetingBriefButton";
import { useAskAtlas } from "./useAskAtlas";

const FOLLOW_UP_TEMPLATES = COPILOT_ACTIONS.filter((t) => t.category === "follow-up");

/**
 * The one Ask Atlas entry point that stays inline on the page rather than
 * opening the global overlay — every person page gets this section.
 * MeetingBriefButton keeps its Primary (solid) default so it reads as the
 * heaviest of the four actions here, matching its flagship status.
 */
export function PersonAskAtlasPanel({ personId, personName }: { personId: string; personName: string }) {
  const { exchanges, sendTemplate, sendMessage } = useAskAtlas();
  const [followUpMenuOpen, setFollowUpMenuOpen] = useState(false);

  const focus = { personId };

  return (
    <AISection title="Atlas Copilot" badge className="mt-6">
      <div className="flex flex-wrap items-start gap-2">
        <AIButton
          type="button"
          variant="outline"
          onClick={() => sendTemplate("summarise-relationship", { personName }, focus)}
        >
          Summarise
        </AIButton>
        <MeetingBriefButton personId={personId} personName={personName} />
        <div className="relative">
          <AIButton type="button" variant="outline" onClick={() => setFollowUpMenuOpen((v) => !v)}>
            Draft Follow-up ▾
          </AIButton>
          {followUpMenuOpen && (
            <div className="atlas-dropdown absolute left-0 top-full z-10 mt-1 w-56 overflow-hidden rounded border border-gray-200 bg-white py-1 shadow-lg dark:border-[#30363d] dark:bg-[#161b22]">
              {FOLLOW_UP_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    sendTemplate(t.id, { personName }, focus);
                    setFollowUpMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-teal-50 dark:hover:bg-teal-500/10"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <AIButton
          type="button"
          variant="outline"
          onClick={() => sendTemplate("conversation-starters", { personName }, focus)}
        >
          Suggest conversation topics
        </AIButton>
      </div>

      {exchanges.length > 0 && (
        <div className="mt-3 divide-y divide-gray-100 rounded border border-gray-200 dark:divide-[#30363d]">
          {exchanges.map((ex) => (
            <AnswerCard key={ex.id} exchange={ex} onFollowUp={(text) => void sendMessage(text)} />
          ))}
        </div>
      )}
    </AISection>
  );
}
