import Link from "next/link";

import { PersonForm } from "@/components/people/PersonForm";
import { createPerson } from "@/lib/people/actions";

export default function NewPersonPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <Link href="/people" className="text-sm text-gray-500 hover:underline">
          ← People
        </Link>
      </div>
      <h1 className="mb-6 text-xl font-semibold">Add person</h1>
      <PersonForm action={createPerson} submitLabel="Add person" />
    </main>
  );
}
