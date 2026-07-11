import Link from "next/link";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { LinkedInImportForm } from "@/components/linkedin-import/LinkedInImportForm";
import { isDemoMode } from "@/lib/demo/session";
import { getPeopleLiteForDuplicateCheck } from "@/lib/linkedin-import/queries";
import { createClient } from "@/lib/supabase/server";

// A write flow, so it follows the same rule as every other new/edit/link-*/
// add-*/capture route: render DemoBlockedPage instead of the real form when
// isDemoMode() is true.
export default async function LinkedInImportPage() {
  if (await isDemoMode()) return <DemoBlockedPage backHref="/people" backLabel="People" />;

  const supabase = await createClient();
  const existingPeople = await getPeopleLiteForDuplicateCheck(supabase);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-gray-500 hover:underline">
          ← People
        </Link>
      </div>
      <h1 className="mb-1 text-xl font-semibold">Import from LinkedIn</h1>
      <p className="mb-6 text-sm text-gray-600">
        Bring in connections from your LinkedIn data export. Nothing is added
        until you select people and confirm below.
      </p>
      <LinkedInImportForm existingPeople={existingPeople} />
    </main>
  );
}
