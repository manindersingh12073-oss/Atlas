import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database.types";
import { searchNetwork } from "@/lib/search/queries";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getNetworkGraphData } from "@/lib/graph/queries";
import {
  getEventFullDemo,
  getNetworkInsightsDemo,
  getPersonFullDemo,
  getReconnectionSuggestionsDemo,
  getUserContextDemo,
} from "@/lib/demo/assistant-context";
import { searchNetworkDemo } from "@/lib/demo/queries";
import type { AssistantToolDefinition } from "../types";
import { getEventFull } from "./events";
import { getReconnectionSuggestions } from "./insights";
import { getPersonFull } from "./people";
import { getUserContext } from "./userContext";

/** `isDemo` routes every tool to the in-memory demo dataset instead of Supabase — same branch-once pattern every other Demo Mode surface uses. */
export type ToolContext = { supabase: SupabaseClient<Database>; isDemo: boolean };

// ── Tool schemas ──────────────────────────────────────────────────────────────
// Deliberately few and composable rather than one tool per feature — the
// model chains these to cover most of the product's networking-assistant
// surface (e.g. an introduction path is search_network + get_person_detail,
// not a bespoke tool). See the plan doc for the full rationale.
//
// Typed as the provider-agnostic AssistantToolDefinition (not an SDK-specific
// tool type) — this file has no dependency on which provider is active.

export const ATLAS_CONTEXT_TOOLS: AssistantToolDefinition[] = [
  {
    name: "search_network",
    description:
      "Search the user's Atlas network by free text. Matches people (name, company, role, notes, tags, events, relationships), companies, tags, events, and relationships. Call this first for almost any question about who the user knows.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text search query, e.g. a person's name, a company, an event, or a topic." },
      },
      required: ["query"],
    },
  },
  {
    name: "get_person_detail",
    description:
      "Get everything Atlas knows about one person: contact fields, tags, relationships, follow-ups, events attended, and a full timeline. Call this whenever you need to discuss a specific person by their id (from search_network or the current focus context).",
    input_schema: {
      type: "object",
      properties: {
        personId: { type: "string", description: "The person's Atlas id." },
      },
      required: ["personId"],
    },
  },
  {
    name: "get_event_detail",
    description: "Get an event's fields and full attendee list by its Atlas id.",
    input_schema: {
      type: "object",
      properties: {
        eventId: { type: "string", description: "The event's Atlas id." },
      },
      required: ["eventId"],
    },
  },
  {
    name: "list_reconnection_suggestions",
    description:
      "List people the user hasn't been in contact with recently (based on their most recent shared event), plus any overdue follow-ups. Use this for 'who should I reconnect with' style questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_network_insights",
    description:
      "Get aggregate statistics about the user's whole network: counts, most-represented company/tag, most-connected person/company/event, and largest connected community. Use this for 'what does my network look like' style questions.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_user_context",
    description:
      "Get the user's stated networking goals, preferences, and notes (Atlas Memory — visible and editable in Settings). Call this early in any conversation involving suggestions, so suggestions can be weighted toward active goals and you can cite the goal by name in your rationale.",
    input_schema: { type: "object", properties: {} },
  },
];

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function executeTool(
  name: string,
  input: Record<string, unknown>,
  ctx: ToolContext,
): Promise<unknown> {
  switch (name) {
    case "search_network":
      return ctx.isDemo
        ? searchNetworkDemo(String(input.query ?? ""))
        : searchNetwork(ctx.supabase, String(input.query ?? ""));
    case "get_person_detail": {
      const result = ctx.isDemo
        ? getPersonFullDemo(String(input.personId ?? ""))
        : await getPersonFull(ctx.supabase, String(input.personId ?? ""));
      return result ?? { error: "No person found with that id." };
    }
    case "get_event_detail": {
      const result = ctx.isDemo
        ? getEventFullDemo(String(input.eventId ?? ""))
        : await getEventFull(ctx.supabase, String(input.eventId ?? ""));
      return result ?? { error: "No event found with that id." };
    }
    case "list_reconnection_suggestions":
      return ctx.isDemo ? getReconnectionSuggestionsDemo() : getReconnectionSuggestions(ctx.supabase);
    case "get_network_insights": {
      if (ctx.isDemo) return getNetworkInsightsDemo();
      const [dashboard, graph] = await Promise.all([
        getDashboardData(ctx.supabase),
        getNetworkGraphData(ctx.supabase),
      ]);
      return { ...dashboard, graphStats: graph.stats };
    }
    case "get_user_context":
      return ctx.isDemo ? getUserContextDemo() : getUserContext(ctx.supabase);
    default:
      return { error: `Unknown tool: ${name}` };
  }
}
