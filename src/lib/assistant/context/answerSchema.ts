// ── AtlasAnswer — the structured, cited answer shape every Ask Atlas ─────────
// response takes. The model never free-streams prose as its final output; it
// must call the `respond_to_user` tool (schema below) exactly once, which is
// how citations and the facts-vs-suggestions split are made structural
// instead of a prompting hope. See src/lib/assistant/agent.ts for how a call
// to this tool terminates the agent loop.

export type Confidence = "high" | "medium" | "low";

export type AtlasSourceKind =
  | "event"
  | "note"
  | "relationship"
  | "tag"
  | "follow_up"
  | "person";

export type AtlasSource = { label: string; kind: AtlasSourceKind };

export type AtlasFact = { text: string; sources: AtlasSource[] };

export type AtlasSuggestion = {
  text: string;
  rationale: string;
  confidence: Confidence;
};

export type AtlasActionType =
  | "open_person"
  | "open_event"
  | "draft_follow_up"
  | "create_reminder"
  | "open_graph"
  | "save_goal";

export type AtlasAction = {
  label: string;
  actionType: AtlasActionType;
  targetId?: string;
  /** Only present for actionType "save_goal" — the proposed goal text. */
  goalText?: string;
};

export type AtlasMeetingBrief = {
  whoTheyAre: string;
  company?: string;
  role?: string;
  whereYouMet?: string;
  /** Key moments in chronological order — rendered as the brief's Timeline section. */
  timeline?: string[];
  /** Notes/recaps of prior conversations — distinct from the event timeline. */
  previousConversations?: string[];
  sharedConnections?: string[];
  outstandingFollowUps?: string[];
  conversationStarters: string[];
  suggestedIntroductions?: string[];
  /** One concrete, actionable next follow-up — the brief's standalone callout. */
  recommendedFollowUp?: string;
  suggestedGoals: string[];
};

export type AtlasAnswer = {
  summary: string;
  confidence: Confidence;
  /** Number of distinct Atlas records the answer drew on — the "how sure is this" cue. */
  evidenceCount: number;
  facts?: AtlasFact[];
  suggestions?: AtlasSuggestion[];
  actions?: AtlasAction[];
  sources?: AtlasSource[];
  /** 3-5 short, clickable next questions/actions — keeps the conversation going. */
  followUps?: string[];
  /** Present only when the "meeting-brief" template was used. */
  meetingBrief?: AtlasMeetingBrief;
};

// ── JSON Schema for the `respond_to_user` tool's input_schema ────────────────

const sourceSchema = {
  type: "object",
  properties: {
    label: {
      type: "string",
      description:
        "Human-readable citation, e.g. 'CogX London 2026', 'Personal note: interested in NHS AI deployment', 'Introduced by Ali'.",
    },
    kind: {
      type: "string",
      enum: ["event", "note", "relationship", "tag", "follow_up", "person"],
    },
  },
  required: ["label", "kind"],
};

const factSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    sources: {
      type: "array",
      items: sourceSchema,
      minItems: 1,
      description:
        "At least one real Atlas record backing this fact. Never leave empty — if you cannot cite a source, this is a suggestion, not a fact.",
    },
  },
  required: ["text", "sources"],
};

const suggestionSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
    rationale: {
      type: "string",
      description:
        "Why you're suggesting this. If it aligns with one of the user's active Atlas Memory goals, name the goal explicitly.",
    },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
  required: ["text", "rationale", "confidence"],
};

const actionSchema = {
  type: "object",
  properties: {
    label: { type: "string" },
    actionType: {
      type: "string",
      enum: [
        "open_person",
        "open_event",
        "draft_follow_up",
        "create_reminder",
        "open_graph",
        "save_goal",
      ],
    },
    targetId: { type: "string", description: "personId or eventId this action targets, when applicable." },
    goalText: { type: "string", description: "Only for actionType 'save_goal' — the proposed goal text." },
  },
  required: ["label", "actionType"],
};

const meetingBriefSchema = {
  type: "object",
  properties: {
    whoTheyAre: { type: "string" },
    company: { type: "string" },
    role: { type: "string" },
    whereYouMet: { type: "string" },
    timeline: {
      type: "array",
      items: { type: "string" },
      description: "Key moments in chronological order, e.g. 'Met at CogX London 2026', 'Exchanged 2 follow-up emails'.",
    },
    previousConversations: {
      type: "array",
      items: { type: "string" },
      description: "Brief recaps of prior conversations or notes — distinct from the event timeline.",
    },
    sharedConnections: { type: "array", items: { type: "string" } },
    outstandingFollowUps: { type: "array", items: { type: "string" } },
    conversationStarters: { type: "array", items: { type: "string" } },
    suggestedIntroductions: { type: "array", items: { type: "string" } },
    recommendedFollowUp: {
      type: "string",
      description: "One concrete, actionable next follow-up — the single most useful thing to do next.",
    },
    suggestedGoals: { type: "array", items: { type: "string" } },
  },
  required: ["whoTheyAre", "conversationStarters", "suggestedGoals"],
};

export const RESPOND_TO_USER_TOOL_NAME = "respond_to_user";

export const RESPOND_TO_USER_INPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "1-3 sentences. Always present, even when Atlas has no relevant data.",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "Overall confidence in this answer, based on how much real Atlas data backs it.",
    },
    evidenceCount: {
      type: "integer",
      minimum: 0,
      description: "Number of distinct Atlas records (people/events/notes/relationships/tags) this answer drew on.",
    },
    facts: { type: "array", items: factSchema },
    suggestions: { type: "array", items: suggestionSchema },
    actions: { type: "array", items: actionSchema },
    sources: {
      type: "array",
      items: sourceSchema,
      description: "Top-level sources not tied to one specific fact.",
    },
    followUps: {
      type: "array",
      items: { type: "string" },
      description:
        "3-5 short, contextual follow-up questions or actions the user might want next (e.g. 'Draft a follow-up', 'Explain this relationship', 'Who else should I meet?'). Generate these from the specific people/events/context of this answer, not generic filler.",
    },
    meetingBrief: meetingBriefSchema,
  },
  required: ["summary", "confidence", "evidenceCount"],
} as const;
