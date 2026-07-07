import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import {
  RESPOND_TO_USER_INPUT_SCHEMA,
  RESPOND_TO_USER_TOOL_NAME,
  type AtlasAnswer,
  type Confidence,
} from "./context/answerSchema";
import { ATLAS_CONTEXT_TOOLS, executeTool } from "./context/tools";
import { MAX_TOOL_ITERATIONS } from "./config";
import { buildSystemPrompt } from "./prompt";
import type { AssistantProvider } from "./provider";
import { getAction } from "./registry";
import type {
  AssistantFocus,
  AssistantToolDefinition,
  ChatEvent,
  ChatMessage,
  ProviderToolUse,
  ToolResultForModel,
} from "./types";

const TOOL_LABELS: Record<string, string> = {
  search_network: "Searching your network…",
  get_person_detail: "Reviewing their history…",
  get_event_detail: "Looking up event details…",
  list_reconnection_suggestions: "Finding the best reconnection opportunities…",
  get_network_insights: "Analysing your network…",
  get_user_context: "Checking your goals…",
};

function toolLabel(name: string): string {
  return TOOL_LABELS[name] ?? `Running ${name}…`;
}

const RESPOND_TO_USER_TOOL: AssistantToolDefinition = {
  name: RESPOND_TO_USER_TOOL_NAME,
  description:
    "Deliver your final structured answer to the user. Call this exactly once, as your last action, after gathering everything you need via the other tools.",
  input_schema: RESPOND_TO_USER_INPUT_SCHEMA as unknown as Record<string, unknown>,
};

const ALL_TOOLS: AssistantToolDefinition[] = [...ATLAS_CONTEXT_TOOLS, RESPOND_TO_USER_TOOL];
const RESPOND_ONLY_TOOLS: AssistantToolDefinition[] = [RESPOND_TO_USER_TOOL];

/** Generic fallback when the model omits `followUps` — a small, focus-aware default from the registry rather than nothing. */
function fallbackFollowUps(focus?: AssistantFocus): string[] {
  const ids = focus?.personId
    ? ["meeting-brief", "draft-email", "explain-relationship"]
    : ["who-to-reconnect", "suggest-next-actions"];
  return ids.map((id) => getAction(id)?.label).filter((l): l is string => !!l);
}

/** Defensive validation — the structural guarantees (cited facts, confidence) don't rely solely on the model following the schema description. */
function sanitizeAnswer(raw: unknown, focus?: AssistantFocus): AtlasAnswer {
  const a = (raw ?? {}) as Partial<AtlasAnswer>;
  const evidenceCount = typeof a.evidenceCount === "number" && a.evidenceCount >= 0 ? a.evidenceCount : 0;

  let confidence: Confidence =
    a.confidence === "high" || a.confidence === "medium" || a.confidence === "low" ? a.confidence : "low";

  const facts = Array.isArray(a.facts)
    ? a.facts.filter((f) => f && typeof f.text === "string" && Array.isArray(f.sources) && f.sources.length > 0)
    : undefined;

  // Facts claimed with zero cited evidence can't be presented as high/medium confidence.
  if (evidenceCount === 0 && (facts?.length ?? 0) > 0) confidence = "low";

  const suggestions = Array.isArray(a.suggestions)
    ? a.suggestions.filter(
        (s) =>
          s &&
          typeof s.text === "string" &&
          typeof s.rationale === "string" &&
          (s.confidence === "high" || s.confidence === "medium" || s.confidence === "low"),
      )
    : undefined;

  const modelFollowUps = Array.isArray(a.followUps)
    ? a.followUps.filter((f): f is string => typeof f === "string" && f.trim().length > 0)
    : [];

  return {
    summary:
      typeof a.summary === "string" && a.summary.trim()
        ? a.summary
        : "Atlas doesn't have enough information to answer that.",
    confidence,
    evidenceCount,
    facts,
    suggestions,
    actions: Array.isArray(a.actions) ? a.actions : undefined,
    sources: Array.isArray(a.sources) ? a.sources : undefined,
    followUps: modelFollowUps.length > 0 ? modelFollowUps : fallbackFollowUps(focus),
    meetingBrief: a.meetingBrief,
  };
}

/**
 * Provider-agnostic tool-calling loop. Runs turns against `provider` until
 * the model calls the terminal `respond_to_user` tool (parsed + sanitized
 * into an AtlasAnswer), or the iteration budget is exhausted. Yields
 * `tool-call-start`/`tool-call-end` for live status chips while gathering,
 * then exactly one `answer` event, then `done`.
 */
export async function* runAgentLoop(params: {
  provider: AssistantProvider;
  supabase: SupabaseClient<Database>;
  messages: ChatMessage[];
  focus?: AssistantFocus;
  isDemo?: boolean;
}): AsyncGenerator<ChatEvent> {
  const { provider, supabase, messages, focus, isDemo = false } = params;

  const system = buildSystemPrompt(focus);
  let conversation = provider.createConversation({ system, messages });

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const isLastIteration = iteration === MAX_TOOL_ITERATIONS - 1;
    const toolsForTurn = isLastIteration ? RESPOND_ONLY_TOOLS : ALL_TOOLS;

    const toolUses: ProviderToolUse[] = [];
    const gen = provider.runTurn(conversation, toolsForTurn);
    let step = await gen.next();
    while (!step.done) {
      if (step.value.type === "tool-use") toolUses.push(step.value.toolUse);
      else if (step.value.type === "summary-delta") yield { type: "summary-delta", text: step.value.text };
      step = await gen.next();
    }
    conversation = step.value;

    const respondCall = toolUses.find((t) => t.name === RESPOND_TO_USER_TOOL_NAME);
    if (respondCall) {
      yield { type: "answer", answer: sanitizeAnswer(respondCall.input, focus) };
      yield { type: "done" };
      return;
    }

    if (toolUses.length === 0) {
      yield { type: "error", message: "Ask Atlas didn't produce a response. Please try again." };
      return;
    }

    const results: ToolResultForModel[] = [];
    for (const call of toolUses) {
      yield { type: "tool-call-start", id: call.id, name: call.name, label: toolLabel(call.name) };
      try {
        const output = await executeTool(call.name, call.input, { supabase, isDemo });
        results.push({ toolUseId: call.id, content: JSON.stringify(output) });
      } catch (err) {
        results.push({
          toolUseId: call.id,
          content: JSON.stringify({ error: err instanceof Error ? err.message : "Tool failed." }),
          isError: true,
        });
      }
      yield { type: "tool-call-end", id: call.id };
    }

    conversation = provider.appendToolResults(conversation, results);
  }

  yield {
    type: "error",
    message: "Ask Atlas took too long gathering context. Please try a more specific question.",
  };
}
