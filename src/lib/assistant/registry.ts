// The central Copilot Action Registry — every supported Atlas Copilot action
// (Meeting Brief, Draft Follow-up, Explain Relationship, Explain Graph, Find
// Introduction, Conversation Starters, Weekly Brief, Reconnect Suggestions,
// etc.) is defined here exactly once. UI components consume this registry
// (via getAction / COPILOT_ACTIONS) instead of hardcoding prompt strings —
// this is what makes future additions (LinkedIn enrichment, company
// research, calendar integration...) a one-place change.
//
// Actions only build a prompt string and call the same /api/assistant/chat
// endpoint as free-form chat — no action has its own backend implementation.

export type TemplateCategory = "meeting" | "follow-up" | "networking";

export type TemplateContext = {
  personName?: string;
  eventName?: string;
  attendeeNames?: string[];
  clusterLabel?: string;
};

/** Visual weight when rendered via AskAtlasButton/AIButton — see the design system's tier rule. */
export type ActionTier = "primary" | "secondary" | "tertiary";

export type CopilotAction = {
  id: string;
  label: string;
  category: TemplateCategory;
  /** Shown in the template menu as a one-line hint. */
  description: string;
  tier: ActionTier;
  /** Rotated while waiting for the first tool call — see AnswerCard's loading state. */
  loadingMessages?: string[];
  buildPrompt: (ctx: TemplateContext) => string;
};

const personOrPlaceholder = (ctx: TemplateContext) => ctx.personName ?? "this person";

export const COPILOT_ACTIONS: CopilotAction[] = [
  // ── Meeting ─────────────────────────────────────────────────────────────
  {
    id: "prepare-me",
    label: "Prepare me",
    category: "meeting",
    description: "Full context before you meet someone",
    tier: "secondary",
    loadingMessages: ["Reviewing their history…", "Gathering context…"],
    buildPrompt: (ctx) =>
      `Prepare me to meet ${personOrPlaceholder(ctx)}. Summarise who they are, where we met, our shared connections, and what I should know before talking to them.`,
  },
  {
    id: "conversation-starters",
    label: "Conversation starters",
    category: "meeting",
    description: "Ideas for what to talk about",
    tier: "secondary",
    loadingMessages: ["Thinking of conversation starters…"],
    buildPrompt: (ctx) =>
      `Suggest good conversation starters and topics for my next conversation with ${personOrPlaceholder(ctx)}, based on what Atlas knows about them.`,
  },
  {
    id: "what-did-we-discuss",
    label: "What did we discuss?",
    category: "meeting",
    description: "Recap previous conversations",
    tier: "secondary",
    loadingMessages: ["Reviewing your conversation history…"],
    buildPrompt: (ctx) =>
      `What have ${personOrPlaceholder(ctx)} and I discussed before, according to Atlas?`,
  },
  {
    id: "dont-forget",
    label: "Things to avoid forgetting",
    category: "meeting",
    description: "Outstanding promises and follow-ups",
    tier: "secondary",
    loadingMessages: ["Checking outstanding follow-ups…"],
    buildPrompt: (ctx) =>
      `What outstanding follow-ups, promises, or details should I not forget about ${personOrPlaceholder(ctx)}?`,
  },
  {
    id: "meeting-brief",
    label: "Meeting Brief",
    category: "meeting",
    description: "Full structured brief — who they are, timeline, talking points, goals",
    tier: "primary",
    loadingMessages: [
      "Preparing your meeting brief…",
      "Gathering everything Atlas knows…",
      "Reviewing shared history…",
    ],
    buildPrompt: (ctx) =>
      `Prepare a full meeting brief for ${personOrPlaceholder(ctx)}: who they are, company and role, where we met, a timeline of our history, previous conversations and notes, shared connections, outstanding follow-ups, suggested conversation starters, suggested introductions, one recommended concrete next follow-up, and suggested goals for the meeting.`,
  },
  {
    id: "summarise-history",
    label: "Summarise history",
    category: "meeting",
    description: "Summarise this person's timeline",
    tier: "tertiary",
    loadingMessages: ["Reviewing their history…"],
    buildPrompt: (ctx) => `Summarise the history and timeline of my relationship with ${personOrPlaceholder(ctx)}.`,
  },

  // ── Follow-up ───────────────────────────────────────────────────────────
  {
    id: "draft-linkedin",
    label: "Draft LinkedIn message",
    category: "follow-up",
    description: "A short, personal LinkedIn message",
    tier: "secondary",
    loadingMessages: ["Drafting your message…"],
    buildPrompt: (ctx) =>
      `Draft a short, personal LinkedIn message to ${personOrPlaceholder(ctx)}, referencing where we met and what we discussed.`,
  },
  {
    id: "draft-email",
    label: "Draft email",
    category: "follow-up",
    description: "A follow-up email",
    tier: "secondary",
    loadingMessages: ["Drafting your follow-up…"],
    buildPrompt: (ctx) =>
      `Draft a follow-up email to ${personOrPlaceholder(ctx)}, referencing where we met and what we discussed.`,
  },
  {
    id: "coffee-invitation",
    label: "Coffee invitation",
    category: "follow-up",
    description: "Invite them to catch up",
    tier: "secondary",
    loadingMessages: ["Drafting your invitation…"],
    buildPrompt: (ctx) =>
      `Draft a short, friendly message inviting ${personOrPlaceholder(ctx)} for a coffee or call to catch up.`,
  },
  {
    id: "send-promised-resource",
    label: "Send promised resource",
    category: "follow-up",
    description: "Follow up on something you said you'd send",
    tier: "secondary",
    loadingMessages: ["Checking what you promised…"],
    buildPrompt: (ctx) =>
      `Did I promise to send ${personOrPlaceholder(ctx)} anything? Draft a short message following up on it.`,
  },

  // ── Networking ──────────────────────────────────────────────────────────
  {
    id: "who-to-reconnect",
    label: "Who should I reconnect with?",
    category: "networking",
    description: "Surface dormant relationships worth reviving",
    tier: "tertiary",
    loadingMessages: ["Finding the best reconnection opportunities…"],
    buildPrompt: () =>
      "Who should I reconnect with? Look at people I haven't been in contact with recently and any overdue follow-ups.",
  },
  {
    id: "find-introduction",
    label: "Find introductions",
    category: "networking",
    description: "Find a warm intro path to someone",
    tier: "secondary",
    loadingMessages: ["Searching your network for a path…"],
    buildPrompt: () =>
      "I need an introduction to someone. Search my network and suggest who I know that could help, and the introduction path.",
  },
  {
    id: "explain-relationship",
    label: "Explain this relationship",
    category: "networking",
    description: "Explain how two people are connected",
    tier: "secondary",
    loadingMessages: ["Tracing your connection…"],
    buildPrompt: (ctx) => `Explain my relationship with ${personOrPlaceholder(ctx)} and how we're connected.`,
  },
  {
    id: "suggest-next-actions",
    label: "Suggest next actions",
    category: "networking",
    description: "What should I do next in my network?",
    tier: "tertiary",
    loadingMessages: ["Analysing your network…"],
    buildPrompt: () => "Based on my network, what should I do next? Suggest concrete next actions.",
  },
  {
    id: "weekly-briefing",
    label: "Weekly briefing",
    category: "networking",
    description: "What's happened in your network this week",
    tier: "tertiary",
    loadingMessages: ["Preparing your weekly briefing…"],
    buildPrompt: () =>
      "Give me a weekly briefing of what's happening in my network: recent activity, overdue follow-ups, and who I should prioritise reconnecting with.",
  },
  {
    id: "explain-graph",
    label: "Explain this graph",
    category: "networking",
    description: "A plain-language read of your network's shape",
    tier: "secondary",
    loadingMessages: ["Analysing your network…"],
    buildPrompt: () =>
      "Explain my network graph in plain language: the overall shape, the main clusters or communities, and anything structurally interesting Atlas notices.",
  },
  {
    id: "find-bridge-people",
    label: "Find bridge people",
    category: "networking",
    description: "People who connect otherwise-separate groups",
    tier: "secondary",
    loadingMessages: ["Looking for bridges between communities…"],
    buildPrompt: () =>
      "Identify the 'bridge' people in my network — people who connect two or more otherwise-separate groups or communities — and explain why each one matters.",
  },
  {
    id: "summarise-attendees",
    label: "Summarise attendees",
    category: "networking",
    description: "Summarise who attended an event and suggest introductions",
    tier: "secondary",
    loadingMessages: ["Reviewing attendees…"],
    buildPrompt: (ctx) =>
      `Summarise the people who attended "${ctx.eventName ?? "this event"}" and suggest useful introductions among them: ${(ctx.attendeeNames ?? []).join(", ")}.`,
  },

  // ── Used directly by person-page quick actions, not shown in the menu ──
  {
    id: "summarise-relationship",
    label: "Summarise",
    category: "networking",
    description: "Summarise this relationship",
    tier: "secondary",
    loadingMessages: ["Gathering what Atlas knows…"],
    buildPrompt: (ctx) => `Summarise everything Atlas knows about ${personOrPlaceholder(ctx)}.`,
  },
];

export function getAction(id: string): CopilotAction | undefined {
  return COPILOT_ACTIONS.find((a) => a.id === id);
}

export const ACTION_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: "meeting", label: "Meeting" },
  { value: "follow-up", label: "Follow-up" },
  { value: "networking", label: "Networking" },
];
