import Link from "next/link";

import { ExportButtons } from "@/components/export/ExportButtons";
import { RestoreSection } from "@/components/settings/RestoreSection";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { FeedbackButton } from "@/components/ui/FeedbackButton";
import { ReplayTourButton } from "@/components/demo/ReplayTourButton";
import { isDemoMode } from "@/lib/demo/session";
import { ATLAS_VERSION } from "@/lib/export/formatters";

export default async function SettingsPage() {
  const isDemo = await isDemoMode();

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

        {isDemo && (
          <div className="mt-8">
            <p className="mb-1 text-base font-medium">Welcome tour</p>
            <p className="mb-3 text-sm text-gray-500">
              Replay the guided checklist introducing Atlas&apos;s main features.
            </p>
            <ReplayTourButton />
          </div>
        )}
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
          {/* Beta notice */}
          <div className="rounded border border-amber-200 bg-amber-50 p-4 dark:border-[#4d3b18] dark:bg-[#2a2217]">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Atlas Beta
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-400">
              Thank you for testing Atlas. Atlas is currently in active
              development and your feedback is incredibly valuable.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-amber-800 dark:text-amber-400">
              Please report bugs, confusing workflows, missing features or
              anything that could make Atlas better.
            </p>
            <div className="mt-3">
              <FeedbackButton variant="inline" />
            </div>
          </div>

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

          {/* Keyboard shortcuts */}
          <div>
            <p className="mb-3 text-base font-medium">Keyboard shortcuts</p>
            <dl className="divide-y divide-gray-100 rounded border border-gray-200 dark:divide-[#30363d]">
              {[
                { keys: ["Ctrl", "K"], mac: true, label: "Open Command Palette" },
                { keys: ["Enter"], label: "Open selected result" },
                { keys: ["Esc"], label: "Close palette" },
                { keys: ["↑", "↓"], label: "Navigate search results" },
                { keys: ["Tab"], label: "Move between controls" },
              ].map(({ keys, mac, label }) => (
                <div
                  key={label}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <span className="text-sm text-gray-600">{label}</span>
                  <span className="flex items-center gap-1">
                    {keys.map((k) => (
                      <kbd
                        key={k}
                        className="inline-flex items-center rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs text-gray-600 dark:border-[#30363d] dark:bg-[#1c2230] dark:text-[#9da7b3]"
                      >
                        {k}
                      </kbd>
                    ))}
                    {mac && (
                      <span className="ml-1 text-xs text-gray-400">(⌘ K on Mac)</span>
                    )}
                  </span>
                </div>
              ))}
            </dl>
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

          {/* Feedback */}
          <div>
            <p className="mb-1 text-base font-medium">Feedback</p>
            <p className="mb-3 text-sm leading-relaxed text-gray-600">
              Share your experience, report bugs or suggest improvements. Every
              piece of feedback helps make Atlas better.
            </p>
            <FeedbackButton variant="inline" />
          </div>

          {/* Credit + version */}
          <div className="border-t border-gray-100 pt-4 dark:border-[#30363d]">
            <p className="text-sm text-gray-500">Built by Maninder.</p>
            <p className="mt-1 text-xs text-gray-400">
              Version {ATLAS_VERSION} Beta
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
