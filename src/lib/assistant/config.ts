// Server-only. Deliberately NOT added to src/lib/env.ts, which is scoped to
// NEXT_PUBLIC_* vars safe for the browser bundle — API keys must never reach
// client code.

// Active provider: OpenAI (src/lib/assistant/providers/openai.ts).
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4";

// Kept for providers/anthropic.ts, which remains in the codebase (unused by
// the active route) behind the same AssistantProvider interface — swapping
// back just means changing the import in the API route.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

export function isAssistantConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/** Bounds every request's tool-calling loop — protects against runaway loops for every caller. */
export const MAX_TOOL_ITERATIONS = 6;

// Generous enough for a full Meeting Brief payload while staying well under
// the ~16k threshold where non-streaming requests risk SDK HTTP timeouts.
export const ASSISTANT_MAX_TOKENS = 8192;
