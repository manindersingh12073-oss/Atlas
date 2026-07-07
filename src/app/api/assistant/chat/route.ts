import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { runAgentLoop } from "@/lib/assistant/agent";
import { isAssistantConfigured } from "@/lib/assistant/config";
import { OpenAIProvider } from "@/lib/assistant/providers/openai";
import type { AssistantFocus, ChatEvent, ChatMessage } from "@/lib/assistant/types";
import { DEMO_COOKIE, isDemoMode } from "@/lib/demo/session";
import { createClient } from "@/lib/supabase/server";

// Best-effort in-memory rate limit for the Demo Mode branch only — Demo Mode
// has no signup gate, so this is a public LLM surface once un-gated.
// Authenticated requests are never throttled here. Resets per server
// instance (no Redis) — deliberately simple, matching "no shared-state
// infra exists yet" per the codebase's own Demo Mode notes.
const DEMO_RATE_LIMIT = 20; // requests per rolling hour, per demo cookie
const DEMO_RATE_WINDOW_MS = 60 * 60 * 1000;
const demoRequestLog = new Map<string, { count: number; windowStart: number }>();

function checkDemoRateLimit(demoCookieValue: string): boolean {
  const now = Date.now();
  const entry = demoRequestLog.get(demoCookieValue);
  if (!entry || now - entry.windowStart > DEMO_RATE_WINDOW_MS) {
    demoRequestLog.set(demoCookieValue, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= DEMO_RATE_LIMIT) return false;
  entry.count += 1;
  return true;
}

type ChatRequestBody = {
  messages?: unknown;
  focus?: unknown;
};

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const messages: ChatMessage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return null;
    const role = (item as { role?: unknown }).role;
    if (role !== "user" && role !== "assistant") return null;
    const content = (item as { content?: unknown }).content;
    if (typeof content !== "string") return null;
    messages.push({ role, content });
  }
  return messages;
}

function parseFocus(raw: unknown): AssistantFocus | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const f = raw as Record<string, unknown>;
  const focus: AssistantFocus = {};
  if (typeof f.personId === "string") focus.personId = f.personId;
  if (typeof f.eventId === "string") focus.eventId = f.eventId;
  if (typeof f.clusterContext === "string") focus.clusterContext = f.clusterContext;
  return Object.keys(focus).length > 0 ? focus : undefined;
}

/**
 * POST /api/assistant/chat — the single backend endpoint for every Atlas
 * Copilot surface (global palette, actions, and every contextual
 * AskAtlasButton). Authenticated users get real, owner-scoped Supabase data.
 * Demo Mode visitors (no real session) are also allowed through, routed to
 * the in-memory demo dataset instead (see src/lib/demo/assistant-context.ts)
 * and rate-limited (see above) since this is now a public, unauthenticated
 * LLM surface. Streams newline-delimited JSON `ChatEvent`s:
 * tool-call-start/tool-call-end while gathering context, then one `answer`
 * event, then `done`.
 */
export async function POST(request: Request) {
  if (!isAssistantConfigured()) {
    return NextResponse.json(
      { error: "Atlas Assistant is currently unavailable." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isDemo = !user && (await isDemoMode());

  if (!user && !isDemo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDemo) {
    const cookieStore = await cookies();
    const demoCookieValue = cookieStore.get(DEMO_COOKIE)?.value ?? "anonymous";
    if (!checkDemoRateLimit(demoCookieValue)) {
      return NextResponse.json(
        { error: "Demo rate limit reached. Please try again later." },
        { status: 429 },
      );
    }
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) {
    return NextResponse.json({ error: "messages is required." }, { status: 400 });
  }
  const focus = parseFocus(body.focus);

  const provider = new OpenAIProvider();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: ChatEvent) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        for await (const event of runAgentLoop({ provider, supabase, messages, focus, isDemo })) {
          write(event);
        }
      } catch (err) {
        write({ type: "error", message: err instanceof Error ? err.message : "Ask Atlas failed." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}
