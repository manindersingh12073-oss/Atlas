import Link from "next/link";

import { signInWithGoogle } from "@/lib/auth/actions";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

const secondaryButtonClasses =
  "inline-flex items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all duration-150 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] dark:hover:bg-[#1e2330]";

export function SignInButton({
  label = "Start free",
  variant = "primary",
}: {
  label?: string;
  variant?: "primary" | "outline";
}) {
  const base =
    "inline-flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150 hover:-translate-y-0.5";
  const styles =
    variant === "primary"
      ? `${base} bg-gray-900 text-white shadow-sm hover:bg-gray-700 hover:shadow-md dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100`
      : secondaryButtonClasses;

  return (
    <form action={signInWithGoogle}>
      <button type="submit" className={styles}>
        <GoogleIcon />
        {label}
      </button>
    </form>
  );
}

// The primary + secondary CTA pair, reused identically in the hero, the
// demo spotlight, and the final CTA so the pairing only needs to change
// in one place.
export function CtaButtonGroup({
  signInLabel = "Start free",
  className = "",
}: {
  signInLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 sm:flex-row ${className}`}
    >
      <SignInButton label={signInLabel} variant="primary" />
      <Link href="/demo" className={secondaryButtonClasses}>
        Try Demo
      </Link>
    </div>
  );
}
