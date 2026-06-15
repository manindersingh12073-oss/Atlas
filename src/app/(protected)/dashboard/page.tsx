import Link from "next/link";

import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div>
        <h1 className="text-2xl font-semibold">Atlas</h1>
        <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/people"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          People →
        </Link>
        <Link
          href="/events"
          className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Events →
        </Link>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-gray-400 hover:underline"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
