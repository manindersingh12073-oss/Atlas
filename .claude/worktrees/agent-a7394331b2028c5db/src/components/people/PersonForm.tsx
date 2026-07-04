"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import type { ActionState } from "@/lib/people/actions";
import { createClient } from "@/lib/supabase/client";

type Props = {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  defaultValues?: {
    name?: string | null;
    company?: string | null;
    role?: string | null;
    linkedin_url?: string | null;
    email?: string | null;
    phone?: string | null;
    notes?: string | null;
  };
  submitLabel?: string;
  companies?: string[];
  /**
   * When editing an existing person, pass their id to exclude them from
   * duplicate suggestions (avoids flagging the person as a duplicate of
   * themselves).
   */
  excludeId?: string;
};

type SimilarPerson = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
};

const inputClass =
  "mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none";

export function PersonForm({
  action,
  defaultValues,
  submitLabel = "Save",
  companies,
  excludeId,
}: Props) {
  const [state, formAction, pending] = useActionState(action, { error: null });
  const [suggestions, setSuggestions] = useState<SimilarPerson[]>([]);
  const nameTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    };
  }, []);

  async function checkForDuplicates(name: string) {
    const trimmed = name.trim();
    if (trimmed.length < 3) {
      setSuggestions([]);
      return;
    }
    const supabase = createClient();
    const escaped = trimmed.replace(/%/g, "\\%").replace(/_/g, "\\_");
    const { data } = await supabase
      .from("people")
      .select("id, name, company, role")
      .ilike("name", `%${escaped}%`)
      .limit(5);

    setSuggestions(
      (data ?? []).filter((p) => p.id !== excludeId),
    );
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (nameTimerRef.current) clearTimeout(nameTimerRef.current);
    nameTimerRef.current = setTimeout(() => checkForDuplicates(value), 300);
  }

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="name">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ""}
          onChange={handleNameChange}
          className={inputClass}
        />
        {suggestions.length > 0 && (
          <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3">
            <p className="mb-2 text-xs font-medium text-amber-800">
              Similar contacts already exist:
            </p>
            <ul className="space-y-2">
              {suggestions.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-sm font-medium">{s.name}</span>
                    {(s.role || s.company) && (
                      <span className="ml-1.5 text-xs text-gray-500">
                        {[s.role, s.company].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/people/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-xs text-blue-600 hover:underline"
                  >
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="company">
          Company
        </label>
        <input
          id="company"
          name="company"
          type="text"
          list={companies && companies.length > 0 ? "company-suggestions" : undefined}
          defaultValue={defaultValues?.company ?? ""}
          className={inputClass}
          autoComplete="off"
        />
        {companies && companies.length > 0 && (
          <datalist id="company-suggestions">
            {companies.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="role">
          Role
        </label>
        <input
          id="role"
          name="role"
          type="text"
          defaultValue={defaultValues?.role ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="linkedin_url">
          LinkedIn URL
        </label>
        <input
          id="linkedin_url"
          name="linkedin_url"
          type="text"
          defaultValue={defaultValues?.linkedin_url ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultValues?.email ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
