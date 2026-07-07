import { AskAtlasButton } from "@/components/assistant/AskAtlasButton";
import { RecentAIActions } from "@/components/assistant/RecentAIActions";
import { UniversalSearchBar } from "@/components/search/UniversalSearchBar";
import { AISection } from "@/components/ui/ai/AISection";
import type { ReconnectionSuggestions } from "@/lib/assistant/context/insights";
import type { SearchSuggestions } from "@/lib/search/queries";
import { CopilotGreeting } from "./CopilotGreeting";
import { TodaysSuggestions } from "./TodaysSuggestions";

const QUICK_ACTIONS = ["who-to-reconnect", "weekly-briefing", "find-introduction", "suggest-next-actions"];

/**
 * The dashboard's visual centrepiece — not a CRM stat block with an AI
 * feature bolted on, but the "home" of the product. A large merged
 * search+ask input dominates; Quick Actions, Today's Suggestions, and
 * Recent AI actions support it underneath without competing for attention.
 */
export function AtlasCopilotSection({
  firstName,
  searchSuggestions,
  reconnectionSuggestions,
}: {
  firstName: string | null;
  searchSuggestions: SearchSuggestions;
  reconnectionSuggestions: ReconnectionSuggestions;
}) {
  return (
    <AISection title="Atlas Copilot" badge className="p-6">
      <CopilotGreeting firstName={firstName} />

      <UniversalSearchBar variant="copilot" suggestions={searchSuggestions} />

      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((id) => (
          <AskAtlasButton key={id} templateId={id} label={quickActionLabel(id)} variant="chip" />
        ))}
      </div>

      <TodaysSuggestions suggestions={reconnectionSuggestions} />
      <RecentAIActions />
    </AISection>
  );
}

function quickActionLabel(id: string): string {
  switch (id) {
    case "who-to-reconnect":
      return "Who should I reconnect with?";
    case "weekly-briefing":
      return "Weekly briefing";
    case "find-introduction":
      return "Find introductions";
    case "suggest-next-actions":
      return "Suggest next actions";
    default:
      return id;
  }
}
