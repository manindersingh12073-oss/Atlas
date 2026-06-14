import Link from "next/link";

/**
 * Fallback shown when the auth callback fails (expired/invalid code).
 * Minimal by design — styling and copy are refined alongside the auth UI later.
 */
export default function AuthCodeError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Sign-in link didn&apos;t work</h1>
      <p className="text-gray-500">
        That link was invalid or has expired. Please try signing in again.
      </p>
      <Link href="/" className="text-blue-600 underline">
        Back to start
      </Link>
    </main>
  );
}
