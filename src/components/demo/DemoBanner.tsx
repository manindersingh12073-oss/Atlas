import Link from "next/link";

export function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-900 dark:border-[#4d3b18] dark:bg-[#2a2217] dark:text-amber-300">
      You&apos;re exploring <strong>Atlas Demo Mode</strong>. All people, companies and events are fictional.{" "}
      <Link href="/demo/exit?next=/login" className="font-medium underline underline-offset-2">
        Create your own Atlas
      </Link>
    </div>
  );
}
