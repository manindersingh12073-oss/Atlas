import type { AtlasAnswer } from "./context/answerSchema";

export type {
  AtlasAction,
  AtlasActionType,
  AtlasAnswer,
  AtlasFact,
  AtlasMeetingBrief,
  AtlasSource,
  AtlasSourceKind,
  AtlasSuggestion,
  Confidence,
} from "./context/answerSchema";

export type ChatRole = "user" | "assistant";

export type ChatMessage = { role: ChatRole; content: string };

/** What the client is currently focused on, so Ask Atlas has grounding context beyond the raw prompt. */
export type AssistantFocus = {
  personId?: string;
  eventId?: string;
  /** Client-serialized description of a graph cluster/selection — no server tool needed for this. */
  clusterContext?: string;
};

// ── Events streamed from the API route to the client (NDJSON) ───────────────

export type ChatEvent =
  | { type: "tool-call-start"; id: string; name: string; label: string }
  | { type: "tool-call-end"; id: string }
  /** Cumulative (not incremental) — the full "summary" text decoded so far, streamed as the model generates its final answer. Client replaces, doesn't append. */
  | { type: "summary-delta"; text: string }
  | { type: "answer"; answer: AtlasAnswer }
  | { type: "error"; message: string }
  | { type: "done" };

// ── Events yielded by an AssistantProvider (provider-agnostic) ──────────────

export type ProviderToolUse = { id: string; name: string; input: Record<string, unknown> };

export type ProviderEvent =
  | { type: "tool-use"; toolUse: ProviderToolUse }
  | { type: "summary-delta"; text: string }
  | { type: "end" };

export type AssistantToolDefinition = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

export type ToolResultForModel = { toolUseId: string; content: string; isError?: boolean };
