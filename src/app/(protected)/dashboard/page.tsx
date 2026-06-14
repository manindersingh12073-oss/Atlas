import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

/**
 * TEMPORARY authentication test page. Confirms the session is readable
 * server-side and that logout works. Replaced by the real app in a later phase.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Signed in ✓</h1>
      <p className="text-gray-500">{user?.email}</p>
      <p className="text-xs text-gray-400">Temporary auth test page.</p>

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
