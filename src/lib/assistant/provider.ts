import type { AssistantToolDefinition, ChatMessage, ProviderEvent, ToolResultForModel } from "./types";

/**
 * Opaque, provider-specific conversation state (e.g. an Anthropic message
 * array with tool_use/tool_result blocks). The agent loop carries this
 * between turns without inspecting it — this is the seam that keeps
 * agent.ts, the context tools, and the UI entirely provider-agnostic.
 */
export type ProviderConversation = unknown;

/**
 * The interface a Claude/OpenAI/Gemini/OpenRouter implementation must
 * satisfy. `providers/openai.ts` is the active implementation;
 * `providers/anthropic.ts` also exists but is currently unused. Adding
 * another provider means implementing this interface — nothing in
 * agent.ts, the context tools, or the UI needs to change.
 */
export interface AssistantProvider {
  /** Starts a new conversation from a system prompt + prior turns. */
  createConversation(params: { system: string; messages: ChatMessage[] }): ProviderConversation;

  /**
   * Runs one model turn (one API round trip). Yields a `tool-use` event for
   * each tool call the model makes this turn, then `end`. The generator's
   * return value is the conversation state with the model's turn appended —
   * callers must carry it forward (it is not mutated in place).
   */
  runTurn(
    conversation: ProviderConversation,
    tools: AssistantToolDefinition[],
  ): AsyncGenerator<ProviderEvent, ProviderConversation>;

  /** Appends tool results for the tool calls from the most recent turn. */
  appendToolResults(
    conversation: ProviderConversation,
    results: ToolResultForModel[],
  ): ProviderConversation;
}
