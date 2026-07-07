import type { Confidence } from "@/lib/assistant/types";

const CONFIDENCE_STYLE: Record<Confidence, { dot: string; label: string }> = {
  high: { dot: "🟢", label: "High confidence" },
  medium: { dot: "🟡", label: "Medium confidence" },
  low: { dot: "🔴", label: "Limited data" },
};

/** The at-a-glance explainability/trust cue every AtlasAnswer carries. */
export function ConfidenceBadge({ confidence, evidenceCount }: { confidence: Confidence; evidenceCount: number }) {
  const style = CONFIDENCE_STYLE[confidence];
  const textClass = confidence === "high" ? "text-teal-600 dark:text-teal-300" : "text-gray-500 dark:text-[#8b949e]";
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${textClass}`}>
      <span aria-hidden>{style.dot}</span>
      {style.label}
      {evidenceCount > 0 && ` · ${evidenceCount} Atlas record${evidenceCount === 1 ? "" : "s"}`}
    </span>
  );
}
