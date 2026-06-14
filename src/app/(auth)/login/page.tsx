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
    <div className="w-full max-w-sm rounded-xl border border-gray-200 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Atlas</h1>
      <p className="mt-1 text-sm text-gray-500">Sign in to continue</p>

      <form action={signInWithGoogle} className="mt-6">
        <button
          type="submit"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
}
