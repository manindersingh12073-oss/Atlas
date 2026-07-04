"use client";

import { useRouter } from "next/navigation";

import { FEEDBACK_URL } from "@/lib/config";

// Speech-bubble icon — signals "give feedback / share thoughts".
function ChatIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

type Variant = "nav" | "inline";

/**
 * Opens the external feedback form in a new tab and shows a thank-you
 * toast on the current page via the URL-based toast system.
 *
 * variant="nav"    — icon + text, used in TopNav
 * variant="inline" — styled as a link-like button, used in Settings
 *
 * The feedback URL lives in src/lib/config.ts — a single place to swap
 * it when the real form is ready.
 */
export function FeedbackButton({
  variant = "nav",
  onAfterClick,
}: {
  variant?: Variant;
  /** Called after the click handler fires (e.g. to close a mobile menu). */
  onAfterClick?: () => void;
}) {
  const router = useRouter();

  function handleClick() {
    window.open(FEEDBACK_URL, "_blank", "noopener,noreferrer");

    // Append the toast param to the current URL so the existing toast
    // infrastructure shows "Thank you for helping improve Atlas."
    const url = new URL(window.location.href);
    url.searchParams.set("toast", "feedback-thanks");
    router.replace(url.pathname + url.search, { scroll: false });

    onAfterClick?.();
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-[#30363d] dark:text-[#cdd5de] dark:hover:bg-[#1c2230]"
      >
        <ChatIcon />
        Give feedback
      </button>
    );
  }

  // nav variant
  return (
    <button
      type="button"
      onClick={handleClick}
      title="Give feedback"
      className="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-500 dark:text-[#8b949e] dark:hover:bg-[#1c2230] dark:hover:text-[#cdd5de]"
    >
      <ChatIcon />
      <span className="hidden sm:inline">Feedback</span>
    </button>
  );
}
