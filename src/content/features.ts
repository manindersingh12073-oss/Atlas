/**
 * Secondary capabilities grid on the landing page — the supporting cast
 * to the primary screenshot tour (see src/content/screenshots.ts), so
 * titles here intentionally avoid repeating Dashboard/Capture/Graph/
 * Insights/Search, which already get their own full section.
 *
 * To add a feature card, append an object to the array below. `icon` is
 * a single emoji — kept dependency-free, no icon library.
 */

export type Feature = {
  icon: string;
  title: string;
  description: string;
};

export const features: Feature[] = [
  {
    icon: "✦",
    title: "Ask Atlas anything about your network.",
    description:
      "Meeting briefs, follow-up drafts, and reconnection suggestions — grounded in what Atlas actually knows about your relationships. See Atlas Copilot above.",
  },
  {
    icon: "🔗",
    title: "Never forget who introduced you.",
    description:
      "Track warm intro paths and how people connect across your network.",
  },
  {
    icon: "🔔",
    title: "Stay in touch, on autopilot.",
    description: "Set a follow-up once. Atlas remembers so you don't have to.",
  },
  {
    icon: "🏷️",
    title: "Organise your way.",
    description:
      "Tag people by context — NHS, VC, AI, founder — anything that matters to you.",
  },
  {
    icon: "📦",
    title: "Your data, always yours.",
    description:
      "Export your entire network anytime, as one JSON file. No lock-in.",
  },
  {
    icon: "📱",
    title: "Works everywhere you do.",
    description:
      "Fully responsive. Capture people from your phone before you've left the venue.",
  },
  {
    icon: "🧭",
    title: "Never add a duplicate.",
    description:
      "Atlas flags people you may have already met, in real time, as you type.",
  },
];
