import Link from "next/link";

import { ExportButtons } from "@/components/export/ExportButtons";
import { RestoreSection } from "@/components/settings/RestoreSection";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { ATLAS_VERSION } from "@/lib/export/formatters";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[62rem] p-6 pb-24">
      <h1 className="mb-10 text-2xl font-semibold">Settings</h1>

      {/* ════════════════════════════════════════════════════════════
          APPEARANCE
      ════════════════════════════════════════════════════════════ */}
      <section className="mb-12">
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          Appearance
        </h2>

        <div>
          <p className="mb-1 text-base font-medium">Theme</p>
          <p className="mb-3 text-sm text-gray-500">
            Choose how Atlas looks on this device.
          </p>
          <ThemeSelector />
          <p className="mt-2 text-xs text-gray-400">
            System follows your device&apos;s dark or light mode setting.
          </p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          DATA
      ════════════════════════════════════════════════════════════ */}
      <section className="mb-12">
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          Data
        </h2>

        {/* Export */}
        <div className="mb-10">
          <p className="mb-1 text-base font-medium">Export data</p>
          <p className="mb-4 text-sm text-gray-500">
            Download a complete copy of your Atlas data at any time. Nothing is
            deleted when you export.
          </p>
          <ExportButtons />
        </div>

        {/* Restore */}
        <div>
          <p className="mb-1 text-base font-medium">Restore data</p>
          <p className="mb-4 text-sm text-gray-500">
            Load an Atlas Backup (.json) to replace all your current data with the
            contents of the backup. This is destructive and cannot be undone.
          </p>
          <RestoreSection />
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          ABOUT
      ════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="mb-6 border-b border-gray-200 pb-2 text-sm font-semibold uppercase tracking-widest text-gray-500">
          About
        </h2>

        <div className="space-y-8">
          {/* What is Atlas */}
          <div>
            <p className="mb-2 text-base font-medium">What is Atlas?</p>
            <p className="text-sm leading-relaxed text-gray-600">
              Atlas is a personal networking CRM for professionals. It helps you
              capture the people you meet, the events you attend, and the context
              behind each relationship — and resurfaces that information when it
              matters.
            </p>
          </div>

          {/* Recommended workflow */}
          <div>
            <p className="mb-3 text-base font-medium">Recommended workflow</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {[
                "Conference",
                "→",
                "Capture",
                "→",
                "Review",
                "→",
                "Follow-ups",
                "→",
                "Reconnect",
              ].map((step, i) =>
                step === "→" ? (
                  <span key={i} className="text-gray-300">
                    →
                  </span>
                ) : (
                  <span
                    key={i}
                    className="rounded border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-gray-700"
                  >
                    {step}
                  </span>
                ),
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              Start in Conference Mode at events to capture new contacts quickly.
              Review and enrich profiles afterwards. Set follow-ups so no
              connection goes cold. Reconnect when the time is right.
            </p>
          </div>

          {/* Best practices */}
          <div>
            <p className="mb-3 text-base font-medium">Best practices</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>· Capture people at events, not after. Memory fades quickly.</li>
              <li>· Use tags to group contacts by context (NHS, VC, AI, etc.).</li>
              <li>· Set a follow-up for every meaningful new connection.</li>
              <li>· Review the dashboard weekly to act on pending follow-ups.</li>
              <li>· Use relationships to record how people know each other.</li>
            </ul>
          </div>

          {/* Data ownership */}
          <div>
            <p className="mb-2 text-base font-medium">Your data</p>
            <p className="text-sm leading-relaxed text-gray-600">
              Atlas supports Export and Restore so you always own your data. Use
              Export regularly to keep a local backup, and Restore to recover
              from a backup at any time.
            </p>
          </div>

          {/* Version */}
          <p className="text-sm text-gray-400">Version {ATLAS_VERSION}</p>
        </div>
      </section>
    </main>
  );
}
