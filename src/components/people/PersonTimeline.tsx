import type { TimelineItem } from "@/lib/people/timeline";

export function PersonTimeline({
  items,
  headerAction,
}: {
  items: TimelineItem[];
  headerAction?: React.ReactNode;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold">History</h2>
        {headerAction}
      </div>
      <ol className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex gap-3">
            <span
              className="mt-0.5 w-5 shrink-0 text-center text-base leading-none"
              aria-hidden
            >
              {item.icon}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800">{item.title}</p>
              {item.detail && (
                <p className="mt-0.5 text-xs text-gray-500">{item.detail}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">{item.displayDate}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
