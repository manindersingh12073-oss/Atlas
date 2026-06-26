import { Spinner } from "@/components/ui/Spinner";

// Small spinner in the top-right of the header bar (z-50 sits above the sticky nav).
// The current page remains fully visible during navigation — no full-page replacement.
export default function Loading() {
  return (
    <div className="fixed right-5 top-3.5 z-50">
      <Spinner className="h-4 w-4 text-gray-400" />
    </div>
  );
}
