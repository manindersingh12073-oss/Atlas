"use client";

import dynamic from "next/dynamic";

import type { NetworkGraphData } from "@/lib/graph/queries";

// SSR boundary: React Flow is client-only, so the interactive graph is loaded
// with `ssr: false` behind a skeleton. Keeps the force-layout computation off
// the server too.
const NetworkGraph = dynamic(
  () => import("./NetworkGraph").then((m) => m.NetworkGraph),
  {
    ssr: false,
    loading: () => (
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Network Graph</h2>
        <div className="h-[560px] w-full animate-pulse rounded-xl border border-gray-200 bg-gray-50 dark:bg-[#0f1117] sm:h-[620px]" />
      </section>
    ),
  },
);

export function NetworkGraphSection({ data }: { data: NetworkGraphData }) {
  return <NetworkGraph data={data} />;
}
