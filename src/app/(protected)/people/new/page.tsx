import Link from "next/link";

import { DemoBlockedPage } from "@/components/demo/DemoBlockedPage";
import { PersonForm } from "@/components/people/PersonForm";
import { createPerson } from "@/lib/people/actions";
import { isDemoMode } from "@/lib/demo/session";
import { getCompanySuggestions } from "@/lib/people/queries";
import { createClient } from "@/lib/supabase/server";

type Props = {
  searchParams: Promise<{ name?: string }>;
};

export default async function NewPersonPage({ searchParams }: Props) {
  const { name: prefillName } = await searchParams;

  if (await isDemoMode()) return <DemoBlockedPage backHref="/people" backLabel="People" />;

  const supabase = await createClient();
  const companies = await getCompanySuggestions(supabase);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-gray-500 hover:underline">
          ← People
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Add person</h1>
      <PersonForm
        action={createPerson}
        submitLabel="Add person"
        companies={companies}
        defaultValues={prefillName ? { name: prefillName } : undefined}
      />
    </main>
  );
}
