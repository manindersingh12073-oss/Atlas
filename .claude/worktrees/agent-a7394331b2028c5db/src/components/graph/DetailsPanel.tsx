"use client";

import { useEffect, useMemo, useState } from "react";

import Link from "next/link";

import type { GraphNode } from "@/lib/graph/queries";
import type { NodeDetail } from "@/lib/graph/detail";
import { NODE_COLORS } from "@/lib/graph/layout";

// ── Formatting ────────────────────────────────────────────────────────────────
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Small building blocks ───────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

function LinkChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="max-w-full truncate rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50 dark:border-[#30363d] dark:text-[#8b949e] dark:hover:bg-[#1c2230]"
    >
      {label}
    </button>
  );
}

function OpenButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded border border-gray-300 px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:border-[#3d444e] dark:hover:bg-[#1c2230]"
    >
      {children}
    </Link>
  );
}

// ── Panel ───────────────────────────────────────────────────────────────────
export function DetailsPanel({
  node,
  nodeMap,
  adjacency,
  onSelectNode,
  onClose,
}: {
  node: GraphNode | null;
  nodeMap: Map<string, GraphNode>;
  adjacency: Map<string, Set<string>>;
  onSelectNode: (id: string) => void;
  onClose: () => void;
}) {
  // Lazy fetch for person/event (company/tag are derived from the graph).
  const [detail, setDetail] = useState<{ forId: string; data: NodeDetail | null } | null>(
    null,
  );

  const needsFetch = node?.kind === "person" || node?.kind === "event";

  useEffect(() => {
    if (!node || !needsFetch) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/graph/node?id=${encodeURIComponent(node.id)}`);
        const data = res.ok ? ((await res.json()) as NodeDetail) : null;
        if (!cancelled) setDetail({ forId: node.id, data });
      } catch {
        if (!cancelled) setDetail({ forId: node.id, data: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [node, needsFetch]);

  // Company / tag derivations from the already-loaded graph.
  const derived = useMemo(() => {
    if (!node || (node.kind !== "company" && node.kind !== "tag")) return null;
    const neighbourIds = [...(adjacency.get(node.id) ?? [])];
    const people = neighbourIds
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphNode => !!n && n.kind === "person")
      .sort((a, b) => b.degree - a.degree);

    if (node.kind === "tag") return { people, events: [] as GraphNode[] };

    // Company → 2-hop connected events.
    const eventIds = new Set<string>();
    for (const p of people) {
      for (const nb of adjacency.get(p.id) ?? []) {
        if (nodeMap.get(nb)?.kind === "event") eventIds.add(nb);
      }
    }
    const events = [...eventIds]
      .map((id) => nodeMap.get(id))
      .filter((n): n is GraphNode => !!n);
    return { people, events };
  }, [node, adjacency, nodeMap]);

  if (!node) return null;

  const dotColor = NODE_COLORS[node.kind];
  const loading = needsFetch && detail?.forId !== node.id;
  const data = needsFetch && detail?.forId === node.id ? detail.data : null;

  return (
    <div className="mt-4 rounded-xl border border-gray-200 p-4 dark:border-[#30363d]">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: dotColor }} />
          <div>
            <p className="text-base font-semibold">{node.label}</p>
            <p className="text-xs capitalize text-gray-400">{node.kind}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-[#cdd5de]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100 dark:bg-[#1c2230]" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100 dark:bg-[#1c2230]" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100 dark:bg-[#1c2230]" />
        </div>
      )}

      {/* ── Person ───────────────────────────────────────────────────── */}
      {!loading && data?.kind === "person" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {(data.role || data.company) && (
            <Field label="Role & company">
              {[data.role, data.company].filter(Boolean).join(" · ") || "—"}
            </Field>
          )}
          <Field label="Added">{formatDate(data.createdAt)}</Field>
          {data.notes && (
            <div className="sm:col-span-2">
              <Field label="Notes">
                <p className="whitespace-pre-wrap text-gray-600 dark:text-[#8b949e]">
                  {data.notes}
                </p>
              </Field>
            </div>
          )}
          {data.tags.length > 0 && (
            <div className="sm:col-span-2">
              <Field label="Tags">
                <div className="flex flex-wrap gap-1.5">
                  {data.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:border-[#30363d] dark:text-[#8b949e]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              </Field>
            </div>
          )}
          <Field label={`Events attended (${data.events.length})`}>
            {data.events.length === 0 ? (
              <span className="text-gray-400">None</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {data.events.map((e) => (
                  <LinkChip
                    key={e.id}
                    label={e.name}
                    onClick={() => onSelectNode(`event:${e.id}`)}
                  />
                ))}
              </div>
            )}
          </Field>
          <Field label={`Relationships (${data.relationships.length})`}>
            {data.relationships.length === 0 ? (
              <span className="text-gray-400">None</span>
            ) : (
              <ul className="space-y-1 text-gray-600 dark:text-[#8b949e]">
                {data.relationships.map((r) => (
                  <li key={r.id}>
                    {r.otherId ? (
                      <button
                        type="button"
                        onClick={() => onSelectNode(`person:${r.otherId}`)}
                        className="text-left hover:underline"
                      >
                        {r.label}
                      </button>
                    ) : (
                      r.label
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Field>
          {data.followUps.length > 0 && (
            <div className="sm:col-span-2">
              <Field label={`Follow-ups (${data.followUps.length})`}>
                <ul className="space-y-1 text-gray-600 dark:text-[#8b949e]">
                  {data.followUps.map((f) => (
                    <li key={f.id} className="flex items-center gap-2">
                      <span className="tabular-nums">{formatDate(f.dueDate)}</span>
                      {f.status !== "pending" && (
                        <span className="text-xs text-gray-400">({f.status})</span>
                      )}
                      {f.note && <span className="truncate text-xs">{f.note}</span>}
                    </li>
                  ))}
                </ul>
              </Field>
            </div>
          )}
          <div className="sm:col-span-2">
            <OpenButton href={`/people/${data.id}`}>Open full profile →</OpenButton>
          </div>
        </div>
      )}

      {/* ── Event ────────────────────────────────────────────────────── */}
      {!loading && data?.kind === "event" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date">{formatDate(data.date)}</Field>
          <Field label="Location">{data.location || "—"}</Field>
          {data.description && (
            <div className="sm:col-span-2">
              <Field label="Description">
                <p className="whitespace-pre-wrap text-gray-600 dark:text-[#8b949e]">
                  {data.description}
                </p>
              </Field>
            </div>
          )}
          <div className="sm:col-span-2">
            <Field label={`Attendees (${data.attendees.length})`}>
              {data.attendees.length === 0 ? (
                <span className="text-gray-400">None</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {data.attendees.map((a) => (
                    <LinkChip
                      key={a.id}
                      label={a.name}
                      onClick={() => onSelectNode(`person:${a.id}`)}
                    />
                  ))}
                </div>
              )}
            </Field>
          </div>
          <div className="sm:col-span-2">
            <OpenButton href={`/events/${data.id}`}>Open event →</OpenButton>
          </div>
        </div>
      )}

      {/* ── Company ──────────────────────────────────────────────────── */}
      {node.kind === "company" && derived && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="People">{derived.people.length}</Field>
          <Field label={`Connected events (${derived.events.length})`}>
            {derived.events.length === 0 ? (
              <span className="text-gray-400">None</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {derived.events.slice(0, 8).map((e) => (
                  <LinkChip key={e.id} label={e.label} onClick={() => onSelectNode(e.id)} />
                ))}
              </div>
            )}
          </Field>
          <div className="sm:col-span-2">
            <Field label="Top contacts">
              <div className="flex flex-wrap gap-1.5">
                {derived.people.slice(0, 6).map((p) => (
                  <LinkChip key={p.id} label={p.label} onClick={() => onSelectNode(p.id)} />
                ))}
              </div>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <OpenButton href={node.navHref}>Search company →</OpenButton>
          </div>
        </div>
      )}

      {/* ── Tag ──────────────────────────────────────────────────────── */}
      {node.kind === "tag" && derived && (
        <div className="space-y-4">
          <Field label="People">{derived.people.length}</Field>
          <Field label="People using this tag">
            {derived.people.length === 0 ? (
              <span className="text-gray-400">None</span>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {derived.people.map((p) => (
                  <LinkChip key={p.id} label={p.label} onClick={() => onSelectNode(p.id)} />
                ))}
              </div>
            )}
          </Field>
          <OpenButton href={node.navHref}>Filter people by tag →</OpenButton>
        </div>
      )}
    </div>
  );
}
