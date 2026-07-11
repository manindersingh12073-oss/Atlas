import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo/session";
// This is a write flow, so it follows the same rule as every other
// new/edit/link-*/add-*/capture route: render DemoBlockedPage instead of
// the real form when isDemoMode() is true. Adjust the import path below to
// wherever DemoBlockedPage actually lives in your components tree.
import { DemoBlockedPage } from "@/components/DemoBlockedPage";
import { LinkedInImportForm } from "@/components/linkedin-import/LinkedInImportForm";
import { getPeopleLiteForDuplicateCheck } from "@/lib/linkedin-import/queries";

export default async function LinkedInImportPage() {
  if (await isDemoMode()) {
    return <DemoBlockedPage />;
  }

  const supabase = await createClient();
  const existingPeople = await getPeopleLiteForDuplicateCheck(supabase);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-xl font-semibold">Import from LinkedIn</h1>
      <p className="mt-1 text-sm text-gray-600">
        Bring in connections from your LinkedIn data export. Nothing is added
        until you select people and confirm below.
      </p>
      <div className="mt-6">
        <LinkedInImportForm existingPeople={existingPeople} />
      </div>
    </div>
  );
}
