"use client";

import { useRef, useState } from "react";

import type { RestoreSummary } from "@/lib/restore/validator";
import { dispatchDemoBlocked, useDemoMode } from "@/lib/demo/context";

// ── State machine ─────────────────────────────────────────────────────────────

type Stage =
  | { type: "idle" }
  | { type: "validating" }
  | { type: "preview"; summary: RestoreSummary; file: File }
  | { type: "restoring" }
  | { type: "success"; inserted: Record<string, number> }
  | { type: "validation_error"; errors: string[] }
  | { type: "restore_error"; message: string };

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CONFIRMATION_WORD = "RESTORE";

// ── Component ─────────────────────────────────────────────────────────────────

export function RestoreSection() {
  const [stage, setStage] = useState<Stage>({ type: "idle" });
  const [confirmText, setConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDemo = useDemoMode();

  const canRestore =
    stage.type === "preview" && confirmText === CONFIRMATION_WORD;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the file input so the same file can be re-selected after an error.
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (isDemo) {
      dispatchDemoBlocked();
      return;
    }

    setStage({ type: "validating" });
    setConfirmText("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/restore/validate", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as
        | { valid: true; summary: RestoreSummary }
        | { valid: false; errors: string[] };

      if (data.valid) {
        setStage({ type: "preview", summary: data.summary, file });
      } else {
        setStage({ type: "validation_error", errors: data.errors });
      }
    } catch {
      setStage({
        type: "validation_error",
        errors: ["Failed to reach the server. Check your connection and try again."],
      });
    }
  }

  async function handleRestore() {
    if (stage.type !== "preview" || !canRestore) return;

    const { file } = stage;
    setStage({ type: "restoring" });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/restore/execute", {
        method: "POST",
        body: formData,
      });
      const data = (await res.json()) as
        | { success: true; inserted: Record<string, number> }
        | { success: false; stage: string; message?: string; errors?: string[] };

      if (data.success) {
        setStage({ type: "success", inserted: data.inserted });
        setConfirmText("");
      } else {
        const message =
          data.stage === "insert"
            ? (data.message ?? "Restore failed during insert.")
            : data.stage === "delete"
              ? (data.message ?? "Restore failed while deleting existing data.")
              : "Restore failed during validation. No data was changed.";
        setStage({ type: "restore_error", message });
      }
    } catch {
      setStage({
        type: "restore_error",
        message:
          "Connection error during restore. Your account data may be in an incomplete state — try restoring again.",
      });
    }
  }

  function handleCancel() {
    setStage({ type: "idle" });
    setConfirmText("");
  }

  function handleReset() {
    setStage({ type: "idle" });
    setConfirmText("");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section className="mt-8 border-t border-gray-100 pt-8">
      <h2 className="mb-1 text-base font-semibold">Restore data</h2>
      <p className="mb-4 text-sm text-gray-500">
        Load an Atlas Backup (.json) to replace all your current data with the
        contents of the backup.
      </p>

      {/* ── Idle ─────────────────────────────────────────────────────────── */}
      {stage.type === "idle" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Choose atlas-export.json
          </button>
        </>
      )}

      {/* ── Validating ───────────────────────────────────────────────────── */}
      {stage.type === "validating" && (
        <p className="text-sm text-gray-500">Validating backup…</p>
      )}

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      {stage.type === "preview" && (
        <div className="space-y-4">
          {/* Backup metadata */}
          <div className="rounded border border-gray-200 p-4">
            <p className="text-sm font-medium">
              {formatDate(stage.summary.exportedAt) || "Backup file"}
            </p>
            {stage.summary.sourceEmail && (
              <p className="text-xs text-gray-500">{stage.summary.sourceEmail}</p>
            )}
            <ul className="mt-3 space-y-0.5 text-sm">
              <li>
                <span className="tabular-nums text-gray-800">
                  {stage.summary.people.toLocaleString()}
                </span>{" "}
                <span className="text-gray-500">people</span>
              </li>
              <li>
                <span className="tabular-nums text-gray-800">
                  {stage.summary.events.toLocaleString()}
                </span>{" "}
                <span className="text-gray-500">events</span>
              </li>
              <li>
                <span className="tabular-nums text-gray-800">
                  {stage.summary.relationships.toLocaleString()}
                </span>{" "}
                <span className="text-gray-500">relationships</span>
              </li>
              <li>
                <span className="tabular-nums text-gray-800">
                  {stage.summary.follow_ups.toLocaleString()}
                </span>{" "}
                <span className="text-gray-500">follow-ups</span>
              </li>
              <li>
                <span className="tabular-nums text-gray-800">
                  {stage.summary.tags.toLocaleString()}
                </span>{" "}
                <span className="text-gray-500">tags</span>
              </li>
            </ul>
          </div>

          {/* Destructive warning */}
          <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <p className="font-medium">This will permanently delete all your existing Atlas data</p>
            <p className="mt-0.5 text-red-600">
              Every person, event, relationship, follow-up, and tag currently in your account
              will be removed and replaced with this backup. This cannot be undone.
            </p>
          </div>

          {/* Confirmation field */}
          <div>
            <label
              htmlFor="restore-confirm"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Type <span className="font-mono font-semibold">{CONFIRMATION_WORD}</span> to
              confirm:
            </label>
            <input
              id="restore-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRMATION_WORD}
              autoComplete="off"
              className="block w-full max-w-xs rounded border border-gray-300 px-3 py-2 text-sm font-mono focus:border-red-400 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleRestore}
              disabled={!canRestore}
              className="rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Delete and restore
            </button>
          </div>
        </div>
      )}

      {/* ── Restoring — full-page overlay ───────────────────────────────── */}
      {stage.type === "restoring" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 dark:bg-gray-950/95">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Restoring…
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Please do not close this page.
            </p>
          </div>
        </div>
      )}

      {/* ── Success ──────────────────────────────────────────────────────── */}
      {stage.type === "success" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <p className="text-sm font-medium">Restore complete</p>
          </div>
          <ul className="text-sm text-gray-600">
            {Object.entries(stage.inserted).map(([key, count]) => (
              <li key={key}>
                {count.toLocaleString()} {key.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-500 hover:underline"
          >
            Done
          </button>
        </div>
      )}

      {/* ── Validation error ─────────────────────────────────────────────── */}
      {stage.type === "validation_error" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-700">
            This file cannot be restored.
          </p>
          <ul className="space-y-1">
            {stage.errors.map((err, i) => (
              <li key={i} className="text-sm text-red-600">
                · {err}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-gray-500 hover:underline"
          >
            Choose a different file
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Restore error ─────────────────────────────────────────────────── */}
      {stage.type === "restore_error" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-red-700">Restore failed</p>
          <p className="text-sm text-gray-600">{stage.message}</p>
          <button
            type="button"
            onClick={handleReset}
            className="text-sm text-gray-500 hover:underline"
          >
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
