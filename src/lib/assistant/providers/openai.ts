import OpenAI from "openai";

import { ASSISTANT_MAX_TOKENS, OPENAI_MODEL } from "../config";
import { RESPOND_TO_USER_TOOL_NAME } from "../context/answerSchema";
import type { AssistantProvider, ProviderConversation } from "../provider";
import type {
  AssistantToolDefinition,
  ChatMessage,
  ProviderEvent,
  ToolResultForModel,
} from "../types";

type OpenAIConversation = {
  instructions: string;
  input: OpenAI.Responses.ResponseInputItem[];
};

let cachedClient: OpenAI | null = null;
function getClient(): OpenAI {
  if (!cachedClient) cachedClient = new OpenAI();
  return cachedClient;
}

/**
 * Incrementally decodes the "summary" string value out of a growing,
 * possibly-incomplete JSON args buffer (the respond_to_user tool call's
 * arguments as the model streams them token-by-token). Deliberately
 * hand-rolled rather than a full incremental JSON parser — "summary" is
 * almost always among the first keys the model emits, and this only needs
 * to handle one string field, not the whole object.
 *
 * Returns null if the "summary" key/value hasn't started yet. Never throws —
 * any lookahead beyond the buffer's end is treated as "not yet closed" and
 * decoded as far as it can be, which is the whole point: partial text is
 * fine, a crash mid-stream is not.
 */
function extractPartialSummaryText(argsBuffer: string): string | null {
  const keyIndex = argsBuffer.indexOf('"summary"');
  if (keyIndex === -1) return null;
  const colonIndex = argsBuffer.indexOf(":", keyIndex + 9);
  if (colonIndex === -1) return null;
  let i = colonIndex + 1;
  while (i < argsBuffer.length && /\s/.test(argsBuffer[i])) i++;
  if (argsBuffer[i] !== '"') return null;
  i++; // past the opening quote

  let out = "";
  while (i < argsBuffer.length) {
    const ch = argsBuffer[i];
    if (ch === '"') break; // unescaped closing quote — string is complete
    if (ch === "\\") {
      const next = argsBuffer[i + 1];
      if (next === undefined) break; // escape sequence cut off mid-stream
      if (next === "u") {
        const hex = argsBuffer.slice(i + 2, i + 6);
        if (hex.length < 4) break; // \uXXXX split across delta chunks — wait for the rest
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
          i += 2; // malformed escape — skip past "\u" rather than emit garbage
          continue;
        }
        out += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      }
      switch (next) {
        case "n":
          out += "\n";
          break;
        case "t":
          out += "\t";
          break;
        case "r":
          out += "\r";
          break;
        case '"':
        case "\\":
        case "/":
          out += next;
          break;
        default:
          out += next;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * The active AssistantProvider implementation, built on OpenAI's Responses
 * API manual tool-calling loop: each turn's `response.output` is appended to
 * the running `input` array (the same "carry the whole history forward"
 * shape the retired-but-kept AnthropicProvider uses), and tool results go
 * back as `function_call_output` items keyed by `call_id`. `store: false`
 * since Atlas already owns conversation state — no need for OpenAI to
 * retain what may be sensitive personal-network data.
 *
 * Uses the streaming Responses API so the respond_to_user tool call's
 * "summary" field can be surfaced to the client progressively (see
 * extractPartialSummaryText) instead of waiting for the whole turn to
 * finish — the one part of the structured-answer flow that can meaningfully
 * stream, since the final answer is otherwise a single JSON tool call.
 */
export class OpenAIProvider implements AssistantProvider {
  createConversation({ system, messages }: { system: string; messages: ChatMessage[] }): ProviderConversation {
    const input: OpenAI.Responses.ResponseInputItem[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const conversation: OpenAIConversation = { instructions: system, input };
    return conversation;
  }

  async *runTurn(
    conversation: ProviderConversation,
    tools: AssistantToolDefinition[],
  ): AsyncGenerator<ProviderEvent, ProviderConversation> {
    const conv = conversation as OpenAIConversation;
    const client = getClient();

    const openaiTools: OpenAI.Responses.Tool[] = tools.map((t) => ({
      type: "function",
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
      strict: false,
    }));

    let response: OpenAI.Responses.Response;

    try {
      const stream = client.responses.stream({
        model: OPENAI_MODEL,
        instructions: conv.instructions,
        input: conv.input,
        tools: openaiTools,
        max_output_tokens: ASSISTANT_MAX_TOKENS,
        store: false,
      });

      let respondToUserItemId: string | null = null;
      let argsBuffer = "";

      for await (const event of stream) {
        if (event.type === "response.output_item.added" && event.item.type === "function_call") {
          if (event.item.name === RESPOND_TO_USER_TOOL_NAME) respondToUserItemId = event.item.id ?? null;
          continue;
        }
        if (event.type === "response.function_call_arguments.delta" && event.item_id === respondToUserItemId) {
          argsBuffer += event.delta;
          const text = extractPartialSummaryText(argsBuffer);
          if (text) yield { type: "summary-delta", text };
        }
      }

      response = await stream.finalResponse();
    } catch {
      // Streaming failed (network hiccup, SDK/event-shape mismatch) — fall
      // back to the plain non-streaming call rather than losing the turn.
      // The client simply won't see progressive summary text for this turn.
      response = await client.responses.create({
        model: OPENAI_MODEL,
        instructions: conv.instructions,
        input: conv.input,
        tools: openaiTools,
        max_output_tokens: ASSISTANT_MAX_TOKENS,
        store: false,
      });
    }

    const functionCalls = response.output.filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall => item.type === "function_call",
    );

    for (const call of functionCalls) {
      let input: Record<string, unknown> = {};
      try {
        input = JSON.parse(call.arguments) as Record<string, unknown>;
      } catch {
        input = {};
      }
      yield { type: "tool-use", toolUse: { id: call.call_id, name: call.name, input } };
    }

    yield { type: "end" };

    return {
      instructions: conv.instructions,
      input: [...conv.input, ...(response.output as unknown as OpenAI.Responses.ResponseInputItem[])],
    };
  }

  appendToolResults(conversation: ProviderConversation, results: ToolResultForModel[]): ProviderConversation {
    const conv = conversation as OpenAIConversation;
    const outputItems: OpenAI.Responses.ResponseInputItem[] = results.map((r) => ({
      type: "function_call_output",
      call_id: r.toolUseId,
      output: r.content,
    }));
    return { instructions: conv.instructions, input: [...conv.input, ...outputItems] };
  }
}
