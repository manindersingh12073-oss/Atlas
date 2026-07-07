/** Visible keyboard-shortcut hint shown wherever the Atlas Copilot entry point appears. Hidden on mobile — no physical keyboard. */
export function KbdHint({ combo = "⌘J" }: { combo?: string }) {
  return (
    <kbd className="hidden items-center rounded border border-teal-200 bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-600 sm:inline-flex dark:border-teal-800/50 dark:bg-teal-500/10 dark:text-teal-300">
      {combo}
    </kbd>
  );
}
