/**
 * The 4 sub-features shown in the landing page's dedicated Atlas Copilot
 * section (src/components/landing/AtlasCopilotSection.tsx) — same typed
 * pattern as src/content/features.ts. `icon` is a single emoji.
 */

export type CopilotFeature = {
  icon: string;
  title: string;
  description: string;
};

export const copilotFeatures: CopilotFeature[] = [
  {
    icon: "✦",
    title: "Ask Atlas anything.",
    description:
      "Natural-language search across your whole network — who you met, where, and what you discussed, with sources for every answer.",
  },
  {
    icon: "📋",
    title: "Meeting Briefs.",
    description:
      "Walk into every meeting fully prepared: who they are, shared history, conversation starters, and a recommended next step.",
  },
  {
    icon: "✍️",
    title: "Follow-up drafting.",
    description: "A short LinkedIn message, email, or coffee invite — drafted in seconds, referencing what you actually discussed.",
  },
  {
    icon: "🔁",
    title: "Reconnection suggestions.",
    description: "Atlas proactively surfaces who's gone quiet and who's worth reaching out to next — before you have to ask.",
  },
];
