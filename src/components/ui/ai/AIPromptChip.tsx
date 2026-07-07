import { AIButton } from "./AIButton";

export function AIPromptChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <AIButton type="button" variant="chip" size="sm" onClick={onClick}>
      {label}
    </AIButton>
  );
}
