import type { AssistantFocus } from "@/lib/assistant/types";

/** Window event used by every contextual AskAtlasButton to open AskAtlasPalette pre-filled. Mirrors the atlas:command-palette idiom. */
export const ASK_ATLAS_EVENT = "atlas:ask-atlas";

export type AskAtlasEventDetail = {
  templateId?: string;
  prompt?: string;
  personName?: string;
  eventName?: string;
  attendeeNames?: string[];
  clusterLabel?: string;
  focus?: AssistantFocus;
  autoSend?: boolean;
};
