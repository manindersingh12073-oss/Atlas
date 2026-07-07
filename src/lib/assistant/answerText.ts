import type { AtlasAnswer } from "./context/answerSchema";

/**
 * Compresses a structured AtlasAnswer into plain text for session-only
 * conversation history — so a follow-up question ("Draft a message to her")
 * has context, without needing to replay the full structured payload.
 */
export function summarizeAnswerForHistory(answer: AtlasAnswer): string {
  const parts: string[] = [answer.summary];
  if (answer.facts?.length) {
    parts.push(...answer.facts.map((f) => `- ${f.text}`));
  }
  if (answer.suggestions?.length) {
    parts.push(...answer.suggestions.map((s) => `Suggestion: ${s.text}`));
  }
  return parts.join("\n");
}
