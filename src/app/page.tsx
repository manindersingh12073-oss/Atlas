import Link from "next/link";

/**
 * Public landing page. The real landing experience is built in a later phase.
 */
export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Atlas</h1>
      <p className="text-gray-500">Never forget who you met again.</p>
      <Link
        href="/login"
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Sign in
      </Link>
    </main>
  );
}
