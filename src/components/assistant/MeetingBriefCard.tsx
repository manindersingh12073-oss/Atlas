"use client";

import { ConfidenceBadge } from "./ConfidenceBadge";
import { SourcesList } from "./SourcesList";
import { SuggestedActions } from "./SuggestedActions";
import type { AtlasAnswer } from "@/lib/assistant/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-teal-100/60 py-4 last:border-b-0 dark:border-teal-900/30">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-[#656d76]">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-gray-700 dark:text-[#cdd5de]">
          · {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * The flagship, richly-sectioned rendering used only when answer.meetingBrief
 * is present — structured to feel like opening a personalised briefing
 * document rather than reading a chat response. Section order: Overview,
 * Timeline, Previous conversations, Conversation starters, Outstanding
 * promises, Shared connections, Suggested introductions, Recommended
 * follow-up, Suggested goals, then Suggested Actions and Sources.
 */
export function MeetingBriefCard({ answer }: { answer: AtlasAnswer }) {
  const brief = answer.meetingBrief;
  if (!brief) return null;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[#e6edf3]">{brief.whoTheyAre}</h2>
        <ConfidenceBadge confidence={answer.confidence} evidenceCount={answer.evidenceCount} />
      </div>

      {(brief.company || brief.role || brief.whereYouMet) && (
        <Section title="Overview">
          <div className="space-y-1 text-sm text-gray-700 dark:text-[#cdd5de]">
            {(brief.company || brief.role) && <p>{[brief.role, brief.company].filter(Boolean).join(" at ")}</p>}
            {brief.whereYouMet && <p className="text-gray-500 dark:text-[#8b949e]">{brief.whereYouMet}</p>}
          </div>
        </Section>
      )}

      {brief.timeline && brief.timeline.length > 0 && (
        <Section title="Timeline">
          <BulletList items={brief.timeline} />
        </Section>
      )}

      {brief.previousConversations && brief.previousConversations.length > 0 && (
        <Section title="Previous conversations">
          <BulletList items={brief.previousConversations} />
        </Section>
      )}

      <Section title="Conversation starters">
        <BulletList items={brief.conversationStarters} />
      </Section>

      {brief.outstandingFollowUps && brief.outstandingFollowUps.length > 0 && (
        <Section title="Outstanding promises">
          <BulletList items={brief.outstandingFollowUps} />
        </Section>
      )}

      {brief.sharedConnections && brief.sharedConnections.length > 0 && (
        <Section title="Shared connections">
          <BulletList items={brief.sharedConnections} />
        </Section>
      )}

      {brief.suggestedIntroductions && brief.suggestedIntroductions.length > 0 && (
        <Section title="Suggested introductions">
          <BulletList items={brief.suggestedIntroductions} />
        </Section>
      )}

      {brief.recommendedFollowUp && (
        <Section title="Recommended follow-up">
          <p className="rounded-md border border-teal-200 bg-teal-50/60 px-3 py-2 text-sm text-teal-800 dark:border-teal-800/50 dark:bg-teal-500/10 dark:text-teal-200">
            {brief.recommendedFollowUp}
          </p>
        </Section>
      )}

      <Section title="Suggested goals for the meeting">
        <BulletList items={brief.suggestedGoals} />
      </Section>

      <div className="border-b border-teal-100/60 py-4 dark:border-teal-900/30">
        <SuggestedActions actions={answer.actions} />
      </div>

      <Section title="Sources">
        <SourcesList facts={answer.facts} sources={answer.sources} />
      </Section>
    </div>
  );
}
