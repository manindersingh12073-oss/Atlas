import Link from "next/link";

/**
 * The one piece of copy shown for every blocked write in Demo Mode — as a
 * full page (guarded write-destination routes) or inside an overlay modal
 * (same-page actions like delete/complete/tag). See DemoBlockedPage and
 * DemoModeModal.
 */
export function DemoBlockedNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "p-6 text-center" : "mx-auto max-w-sm p-6 text-center"}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
        Demo Mode
      </p>
      <h2 className="mb-2 text-lg font-semibold">This is a read-only demo</h2>
      <p className="mb-6 text-sm leading-relaxed text-gray-500">
        You&apos;re currently exploring Atlas using a read-only demo workspace.
        Create your own Atlas to start building your personal network.
      </p>
      <Link
        href="/demo/exit?next=/login"
        className="inline-flex items-center justify-center rounded-lg border border-gray-800 bg-gray-800 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
      >
        Create my Atlas
      </Link>
    </div>
  );
}
