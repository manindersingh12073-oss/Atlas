import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithGoogle } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Authenticated users never see the login page.
  if (user) redirect("/dashboard");

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-[#e6edf3]"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to home
      </Link>

      <div className="rounded-xl border border-gray-200 p-8 text-center dark:border-[#30363d]">
        <h1 className="text-2xl font-semibold tracking-tight">Atlas</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-[#8b949e]">
          Sign in to continue
        </p>

        <form action={signInWithGoogle} className="mt-6">
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-[#30363d] dark:hover:bg-[#1e2330]"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
