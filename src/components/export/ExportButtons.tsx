"use client";

import { useState } from "react";

type ExportFormat = "json" | "zip";

const MESSAGES: Record<ExportFormat, string> = {
  json: "Preparing your backup…",
  zip: "Building spreadsheet export…",
};

/**
 * Replaces the static <a> links from the original settings page.
 * Uses fetch so we can show a full-page overlay while the server assembles
 * the file — the user never sees the app appear frozen.
 */
export function ExportButtons() {
  const [overlayMessage, setOverlayMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload(format: ExportFormat) {
    setError(null);
    setOverlayMessage(MESSAGES[format]);
    try {
      const res = await fetch(`/api/export/${format}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? `atlas-export.${format}`;

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setOverlayMessage(null);
    }
  }

  return (
    <>
      {/* Full-page overlay while the server assembles the file */}
      {overlayMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-950/95">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {overlayMessage}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Your download will start automatically.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {/* Primary: JSON backup (recommended) */}
        <div className="rounded border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">
                Atlas Backup{" "}
                <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                  Recommended
                </span>
              </p>
              <p className="mt-0.5 text-xs text-gray-500">
                Complete backup as JSON. Use for safekeeping and future restore.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload("json")}
              disabled={!!overlayMessage}
              className="shrink-0 rounded border border-gray-800 bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
            >
              Download .json
            </button>
          </div>
        </div>

        {/* Secondary: ZIP spreadsheet */}
        <div className="rounded border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Spreadsheet Export</p>
              <p className="mt-0.5 text-xs text-gray-500">
                All data as CSVs plus JSON, in a ZIP. Open in Excel or Google
                Sheets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDownload("zip")}
              disabled={!!overlayMessage}
              className="shrink-0 rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Download .zip
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <p className="text-xs text-gray-400">
          Exports include: people, events, event links, relationships,
          follow-ups, tags, and person tags.
        </p>
      </div>
    </>
  );
}
