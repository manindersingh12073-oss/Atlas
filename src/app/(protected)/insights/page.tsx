import { getDashboardData } from "@/lib/dashboard/queries";
import { getNetworkGraphData } from "@/lib/graph/queries";
import { NetworkGraphSection } from "@/components/graph/NetworkGraphSection";
import { AskAtlasButton } from "@/components/assistant/AskAtlasButton";
import { AISection } from "@/components/ui/ai/AISection";
import { isDemoMode } from "@/lib/demo/session";
import { getDashboardDataDemo, getNetworkGraphDataDemo } from "@/lib/demo/queries";
import { createClient } from "@/lib/supabase/server";

// ── Sub-components ────────────────────────────────────────────────────────────

function InsightCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-gray-200 p-4">
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function InsightsPage() {
  const isDemo = await isDemoMode();
  const { insights, graph } = isDemo
    ? { insights: getDashboardDataDemo().insights, graph: getNetworkGraphDataDemo() }
    : await (async () => {
        const supabase = await createClient();
        const [{ insights }, graph] = await Promise.all([
          getDashboardData(supabase),
          getNetworkGraphData(supabase),
        ]);
        return { insights, graph };
      })();

  return (
    <main className="mx-auto max-w-[62rem] p-6">
      <h1 className="mb-6 text-xl font-semibold">Insights</h1>

      <AISection
        title="Atlas Copilot"
        description="Ask about your network's shape, bridges, and reconnections."
        className="mb-8"
      >
        <div className="flex flex-wrap gap-2">
          <AskAtlasButton templateId="explain-graph" label="Explain this graph" variant="outline" />
          <AskAtlasButton templateId="find-bridge-people" label="Find bridge people" variant="outline" />
          <AskAtlasButton templateId="who-to-reconnect" label="Recommend reconnections" variant="outline" />
        </div>
      </AISection>

      {/* ── Network graph (the visual centre of Atlas) ───────────────── */}
      <NetworkGraphSection data={graph} />

      <h2 className="mb-4 text-xl font-semibold">Network Insights</h2>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <InsightCard
          label="Unique companies"
          value={insights.uniqueCompaniesCount}
        />
        <InsightCard label="Tags" value={insights.totalTagsCount} />
        <InsightCard
          label="Completed follow-ups"
          value={insights.completedFollowUpsCount}
        />
      </div>

      <ul className="divide-y divide-gray-100 rounded border border-gray-200">
        {[
          { label: "Most common tag", value: insights.mostCommonTag },
          {
            label: "Most represented company",
            value: insights.mostRepresentedCompany,
          },
          {
            label: "Avg. people per event",
            value:
              insights.avgPeoplePerEvent != null
                ? insights.avgPeoplePerEvent.toFixed(1)
                : null,
          },
        ].map(({ label, value }) => (
          <li
            key={label}
            className="flex items-center justify-between px-4 py-3"
          >
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-sm font-medium">{value ?? "—"}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
