import Anthropic from "@anthropic-ai/sdk";

import { ANTHROPIC_MODEL, ASSISTANT_MAX_TOKENS } from "../config";
import type { AssistantProvider, ProviderConversation } from "../provider";
import type {
  AssistantToolDefinition,
  ChatMessage,
  ProviderEvent,
  ToolResultForModel,
} from "../types";

type AnthropicConversation = {
  system: string;
  messages: Anthropic.MessageParam[];
};

let cachedClient: Anthropic | null = null;
function getClient(): Anthropic {
  if (!cachedClient) cachedClient = new Anthropic();
  return cachedClient;
}

/**
 * The only AssistantProvider implementation today. Each "turn" is one
 * non-streaming Messages API call — the model's final output is always a
 * tool call (never free text), so there is nothing to token-stream; the
 * app's own NDJSON stream to the client (see agent.ts / the API route)
 * progresses once per turn instead, which is what drives the live
 * "Searching your network…" tool-status chips.
 */
export class AnthropicProvider implements AssistantProvider {
  createConversation({ system, messages }: { system: string; messages: ChatMessage[] }): ProviderConversation {
    const anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const conversation: AnthropicConversation = { system, messages: anthropicMessages };
    return conversation;
  }

  async *runTurn(
    conversation: ProviderConversation,
    tools: AssistantToolDefinition[],
  ): AsyncGenerator<ProviderEvent, ProviderConversation> {
    const conv = conversation as AnthropicConversation;
    const client = getClient();

    const anthropicTools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    })) as Anthropic.Tool[];

    const message = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: ASSISTANT_MAX_TOKENS,
      system: conv.system,
      messages: conv.messages,
      tools: anthropicTools,
    });

    const toolUseBlocks = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
    );

    for (const block of toolUseBlocks) {
      yield {
        type: "tool-use",
        toolUse: { id: block.id, name: block.name, input: block.input as Record<string, unknown> },
      };
    }

    yield { type: "end" };

    return {
      system: conv.system,
      messages: [...conv.messages, { role: "assistant", content: message.content }],
    };
  }

  appendToolResults(conversation: ProviderConversation, results: ToolResultForModel[]): ProviderConversation {
    const conv = conversation as AnthropicConversation;
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = results.map((r) => ({
      type: "tool_result",
      tool_use_id: r.toolUseId,
      content: r.content,
      is_error: r.isError,
    }));
    return {
      system: conv.system,
      messages: [...conv.messages, { role: "user", content: toolResultBlocks }],
    };
  }
}
