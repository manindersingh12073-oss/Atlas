import Link from "next/link";
import { redirect } from "next/navigation";

import { signInWithGoogle } from "@/lib/auth/actions";
import { FEEDBACK_URL } from "@/lib/config";
import { ATLAS_VERSION } from "@/lib/export/formatters";
import { createClient } from "@/lib/supabase/server";

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Sign-in form ──────────────────────────────────────────────────────────────

function SignInButton({
  label = "Start free with Google",
  variant = "primary",
}: {
  label?: string;
  variant?: "primary" | "outline";
}) {
  const base =
    "inline-flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors";
  const styles =
    variant === "primary"
      ? `${base} bg-gray-900 text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100`
      : `${base} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] dark:hover:bg-[#1e2330]`;

  return (
    <form action={signInWithGoogle}>
      <button type="submit" className={styles}>
        <GoogleIcon />
        {label}
      </button>
    </form>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur dark:border-[#30363d] dark:bg-[#0f1117]/90">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Atlas
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-gray-500 md:flex dark:text-[#8b949e]">
          <a
            href="#features"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            Features
          </a>
          <a
            href="#workflow"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            How it works
          </a>
          <span className="cursor-default text-gray-300 dark:text-[#30363d]">
            Pricing
            <span className="ml-1 text-xs text-gray-400 dark:text-[#656d76]">
              (Coming soon)
            </span>
          </span>
          <a
            href={FEEDBACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-gray-900 dark:hover:text-[#e6edf3]"
          >
            Feedback
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium transition-colors hover:bg-gray-50 dark:border-[#30363d] dark:hover:bg-[#1e2330]"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}

// ── Product mockup ────────────────────────────────────────────────────────────

function ProductMockup() {
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* Ambient glow */}
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-blue-500/5 blur-3xl" />

      {/* Browser chrome */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-[#30363d] dark:bg-[#161b22]">
        {/* Traffic lights + URL bar */}
        <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5 dark:border-[#30363d] dark:bg-[#0d1117]">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 rounded border border-gray-200 bg-white px-3 py-0.5 text-center text-xs text-gray-400 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#656d76]">
            atlas.app/people/sarah-chen
          </div>
        </div>

        {/* Atlas top nav */}
        <div className="flex items-center gap-5 border-b border-gray-100 px-4 py-2 text-xs font-medium dark:border-[#30363d]">
          <span className="font-semibold">Atlas</span>
          <span className="text-blue-600 dark:text-blue-400">People</span>
          <span className="text-gray-400 dark:text-[#656d76]">Events</span>
          <span className="text-gray-400 dark:text-[#656d76]">Capture</span>
          <span className="text-gray-400 dark:text-[#656d76]">Insights</span>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-5">
          {/* Main: person profile */}
          <div className="col-span-3 border-r border-gray-100 p-5 dark:border-[#30363d]">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold">Sarah Chen</h3>
                <p className="text-xs text-gray-500 dark:text-[#8b949e]">
                  Research Lead · DeepMind
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-400">
                Follow-up due
              </span>
            </div>

            {/* Tags */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              {[
                { label: "AI", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                { label: "Healthcare", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
                { label: "NHS Digital", cls: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${tag.cls}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Events */}
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-[#e6edf3]">
                Events
              </p>
              <p className="text-xs text-gray-500 dark:text-[#8b949e]">
                · Healthcare AI Summit 2026
              </p>
              <p className="text-xs text-gray-500 dark:text-[#8b949e]">
                · CogX London 2026
              </p>
            </div>

            {/* Timeline */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-700 dark:text-[#e6edf3]">
                Timeline
              </p>
              <div className="space-y-2">
                {[
                  { color: "bg-blue-500", text: "Follow-up: send NHS paper · Thu" },
                  { color: "bg-amber-500", text: "Ali introduced us at Healthcare AI Summit" },
                  { color: "bg-gray-300", text: "Added · 14 Jan 2026" },
                ].map((item) => (
                  <div
                    key={item.text}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.color}`}
                    />
                    <span className="text-xs text-gray-500 dark:text-[#8b949e]">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side: network graph + relationship */}
          <div className="col-span-2 flex flex-col gap-4 p-4">
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600 dark:text-[#8b949e]">
                Network
              </p>
              <svg
                viewBox="0 0 140 120"
                className="w-full"
                aria-hidden="true"
              >
                {/* Edges */}
                <line x1="70" y1="60" x2="35" y2="28" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1.5" />
                <line x1="70" y1="60" x2="108" y2="30" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1.5" />
                <line x1="70" y1="60" x2="28" y2="88" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1.5" />
                <line x1="70" y1="60" x2="112" y2="88" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1.5" />
                <line x1="70" y1="60" x2="70" y2="105" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1.5" />
                <line x1="35" y1="28" x2="108" y2="30" stroke="currentColor" className="text-gray-200 dark:text-[#30363d]" strokeWidth="1" opacity="0.4" />
                {/* Nodes */}
                <circle cx="70" cy="60" r="12" fill="#3b82f6" opacity="0.95" />
                <circle cx="35" cy="28" r="8" fill="#10b981" opacity="0.85" />
                <circle cx="108" cy="30" r="8" fill="#f59e0b" opacity="0.85" />
                <circle cx="28" cy="88" r="7" fill="#3b82f6" opacity="0.75" />
                <circle cx="112" cy="88" r="8" fill="#8b5cf6" opacity="0.8" />
                <circle cx="70" cy="105" r="7" fill="#3b82f6" opacity="0.7" />
                {/* Center label */}
                <text x="70" y="64" textAnchor="middle" fontSize="6" fill="white" fontWeight="700">SC</text>
              </svg>
            </div>

            {/* Relationship */}
            <div className="rounded border border-gray-100 bg-gray-50 p-2.5 text-xs dark:border-[#30363d] dark:bg-[#0d1117]">
              <p className="font-medium text-gray-700 dark:text-[#e6edf3]">
                Relationship
              </p>
              <p className="mt-0.5 text-gray-500 dark:text-[#8b949e]">
                Introduced by Ali Hassan
              </p>
            </div>

            {/* Follow-up pill */}
            <div className="rounded border border-amber-100 bg-amber-50 p-2.5 text-xs dark:border-amber-900/20 dark:bg-amber-900/10">
              <p className="font-medium text-amber-800 dark:text-amber-400">
                Follow-up
              </p>
              <p className="mt-0.5 text-amber-700 dark:text-amber-500">
                Send NHS paper · Due Thu
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── FAQ item ──────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-gray-100 dark:border-[#30363d]">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>{q}</span>
        <svg
          className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-gray-600 dark:text-[#8b949e]">
        {a}
      </p>
    </details>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ scrollBehavior: "smooth" }}
    >
      <LandingNav />

      {/* ══════════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="pb-24 pt-20 text-center">
        <div className="mx-auto max-w-6xl px-6">
          {/* Eyebrow badge */}
          <div className="mb-6 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-500 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#8b949e]">
            Networking memory assistant
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Never forget the people you meet.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-500 dark:text-[#8b949e]">
            Atlas is your networking memory assistant. Capture people the moment
            you leave a conference, remember every conversation, and reconnect at
            exactly the right time.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SignInButton label="Start free with Google" variant="primary" />
            <Link
              href="/demo"
              className="inline-flex items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] dark:hover:bg-[#1e2330]"
            >
              Try Demo
            </Link>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-[#656d76]">
            No account needed — explore a sample network in seconds.
          </p>
          <div className="mt-2">
            <a
              href="#workflow"
              className="inline-flex items-center gap-1 rounded-lg px-5 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-[#8b949e] dark:hover:text-[#e6edf3]"
            >
              See how it works
              <span aria-hidden="true">→</span>
            </a>
          </div>

          {/* Product mockup */}
          <div className="mt-16">
            <ProductMockup />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1 — Problem
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Networking is easy.
            <br />
            Remembering isn&apos;t.
          </h2>
          <p className="mx-auto mb-14 max-w-lg text-center text-gray-500 dark:text-[#8b949e]">
            You meet dozens of people at every event. Faces blur. Names mix.
            Context fades. Atlas fixes that.
          </p>

          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                n: "01",
                emoji: "👥",
                title: "Meet",
                body: "Meet dozens of people at conferences, events, and meetups.",
              },
              {
                n: "02",
                emoji: "📝",
                title: "Capture",
                body: "Save names, notes, context and relationships before you forget.",
              },
              {
                n: "03",
                emoji: "🔁",
                title: "Reconnect",
                body: "Atlas reminds you who they are months later, when it matters.",
              },
            ].map((card) => (
              <div
                key={card.n}
                className="rounded-xl border border-gray-200 bg-white p-6 dark:border-[#30363d] dark:bg-[#161b22]"
              >
                <div className="mb-3 text-2xl">{card.emoji}</div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-[#656d76]">
                  {card.n}
                </p>
                <h3 className="mb-2 text-lg font-semibold">{card.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2 — Conference Workflow
      ══════════════════════════════════════════════════════════════════ */}
      <section id="workflow" className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Conference workflow
          </h2>
          <p className="mx-auto mb-16 max-w-md text-center text-gray-500 dark:text-[#8b949e]">
            From first handshake to lasting relationship.
          </p>

          <div className="mx-auto max-w-2xl">
            {[
              {
                title: "Conference",
                desc: "Attend events, meet people.",
              },
              {
                title: "Open Atlas",
                desc: "Takes seconds. Works on any device.",
              },
              {
                title: "Capture everyone",
                desc: "Name, company, context. One person at a time, before you forget.",
              },
              {
                title: "Atlas organises your network",
                desc: "Tags, relationships, timelines and follow-ups built automatically.",
              },
              {
                title: "Reconnect months later",
                desc: "Atlas resurfaces the right context at the right time.",
              },
            ].map((step, i, arr) => (
              <div key={step.title} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Connector */}
                {i < arr.length - 1 && (
                  <div className="absolute left-[15px] top-9 h-full w-px bg-gray-100 dark:bg-[#30363d]" />
                )}
                {/* Node */}
                <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-xs font-semibold text-blue-600 dark:bg-[#0f1117]">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <p className="font-semibold">{step.title}</p>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-[#8b949e]">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3 — Features
      ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="bg-gray-50 py-24 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to remember everyone.
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-gray-500 dark:text-[#8b949e]">
            Built for professionals who take their network seriously.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: "⚡",
                title: "Conference Capture",
                desc: "Record everyone you meet before context fades. Built for speed — one person, one tap, move on.",
              },
              {
                icon: "🔗",
                title: "Relationship Mapping",
                desc: "Remember who introduced whom. Track warm intro paths and how people connect across your network.",
              },
              {
                icon: "🔔",
                title: "Follow-ups",
                desc: "Set reminders on any connection. Never lose a valuable relationship to silence.",
              },
              {
                icon: "🔍",
                title: "Search",
                desc: "Find anyone instantly. Search by name, company, event, tag, or note.",
              },
              {
                icon: "🕸️",
                title: "Network Graph",
                desc: "Visualise your professional network as an interactive, explorable map.",
              },
              {
                icon: "📊",
                title: "Insights",
                desc: "Understand how your network grows. Spot patterns in who you meet and where.",
              },
              {
                icon: "📦",
                title: "Export & Restore",
                desc: "Download your full network at any time. Your data, always yours.",
              },
              {
                icon: "🏷️",
                title: "Tags",
                desc: "Organise contacts by context: NHS, VC, AI, founder — anything that matters to you.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-gray-200 bg-white p-5 dark:border-[#30363d] dark:bg-[#161b22]"
              >
                <div className="mb-3 text-xl">{f.icon}</div>
                <h3 className="mb-1.5 text-sm font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500 dark:text-[#8b949e]">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4 — Comparison
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Why Atlas?
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Without */}
            <div className="rounded-xl border border-red-100 bg-red-50 p-7 dark:border-red-900/20 dark:bg-red-900/10">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-red-400">
                Without Atlas
              </p>
              <ul className="space-y-3.5">
                {[
                  "\"I know I've met them before...\"",
                  "\"I can't remember where.\"",
                  "\"I forgot to follow up.\"",
                  "\"I lost their business card.\"",
                  "\"I don't know who introduced us.\"",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-red-700 dark:text-red-400"
                  >
                    <span className="mt-0.5 shrink-0 opacity-60">✕</span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            {/* With */}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-7 dark:border-emerald-900/20 dark:bg-emerald-900/10">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                With Atlas
              </p>
              <ul className="space-y-3.5">
                {[
                  "\"I met them at CogX.\"",
                  "\"They work at DeepMind.\"",
                  "\"Ali introduced us.\"",
                  "\"I promised to send a paper.\"",
                  "\"I should reconnect this week.\"",
                ].map((line) => (
                  <li
                    key={line}
                    className="flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-400"
                  >
                    <span className="mt-0.5 shrink-0 text-emerald-500 dark:text-emerald-400">
                      ✓
                    </span>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 5 — Audience
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for professionals who attend conferences.
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-gray-500 dark:text-[#8b949e]">
            Wherever your work takes you, Atlas keeps your network with you.
          </p>

          <div className="flex flex-wrap justify-center gap-2.5">
            {[
              "Healthcare",
              "Medicine",
              "Research",
              "Startups",
              "Investors",
              "Founders",
              "Students",
              "Consultants",
              "Engineers",
              "Scientists",
              "Policy",
              "Law",
            ].map((role) => (
              <span
                key={role}
                className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3]"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 6 — Testimonials
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            What people are saying
          </h2>
          <p className="mx-auto mb-12 max-w-md text-center text-gray-500 dark:text-[#8b949e]">
            Early users who never forget the people they meet.
          </p>

          <div className="grid gap-5 sm:grid-cols-3">
            {/* PLACEHOLDER testimonials — replace all three with real quotes before launch */}
            {[
              {
                quote:
                  "I used to dread the follow-up after conferences. Now I open Atlas on my way home and everything is already organised.",
                name: "Dr. A. Patel",
                role: "Clinical Researcher · Imperial College London",
              },
              {
                quote:
                  "The relationship mapping is brilliant. I can see exactly who introduced me to whom and trace warm intro paths across my whole network.",
                name: "J. Morrison",
                role: "Partner · Seedcamp",
              },
              {
                quote:
                  "I've been looking for something like this for years. Simple, fast, and it actually makes me better at staying in touch.",
                name: "S. Okonkwo",
                role: "Founder · AI Health Startup",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-[#30363d] dark:bg-[#161b22]"
              >
                <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-[#8b949e]">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-gray-400 dark:text-[#656d76]">
                    {t.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 7 — FAQ
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 py-24 dark:bg-[#0d1117]">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions
          </h2>

          <FAQItem
            q="Why not LinkedIn?"
            a="LinkedIn is a public directory optimised for your professional image. Atlas is a private memory assistant optimised for your relationships. You record context, notes, how you met, who introduced you — things LinkedIn was never designed to capture."
          />
          <FAQItem
            q="Does Atlas own my contacts?"
            a="No. Your data is yours. Atlas never shares, sells, or uses your contacts for anything other than showing them back to you. You can export everything at any time."
          />
          <FAQItem
            q="Can I export my data?"
            a="Yes. Atlas has full Export and Restore support. Download a complete JSON backup of your entire network — every person, event, relationship, tag and follow-up — at any time. No vendor lock-in."
          />
          <FAQItem
            q="Does it work on mobile?"
            a="Atlas is fully responsive and works in any mobile browser. Open it on your phone at the end of a conference session and start capturing immediately."
          />
          <FAQItem
            q="Can I use it during conferences?"
            a="Yes — Conference Mode is designed for exactly this. It's a fast-entry flow that lets you add people one after another without navigating away. Save & Next moves you straight to the next capture."
          />
          <FAQItem
            q="Is Atlas free?"
            a="Atlas is free during the beta period. Pricing will be announced before the public launch."
          />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-28 text-center">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-4 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            Start remembering every conversation.
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-gray-500 dark:text-[#8b949e]">
            Join professionals who never forget the people they meet.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <SignInButton label="Start free with Google" variant="primary" />
            <Link
              href="/demo"
              className="inline-flex items-center gap-2.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-[#30363d] dark:bg-[#161b22] dark:text-[#e6edf3] dark:hover:bg-[#1e2330]"
            >
              Try Demo
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400 dark:text-[#656d76]">
            Free during beta. No credit card required.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="border-t border-gray-100 py-8 dark:border-[#30363d]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-sm sm:flex-row">
          <p className="font-semibold">Atlas</p>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-gray-400 dark:text-[#656d76]">
            <Link
              href="/privacy"
              className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
            >
              Terms
            </Link>
            <a
              href={FEEDBACK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-gray-700 dark:hover:text-[#8b949e]"
            >
              Feedback
            </a>
            <span>Version {ATLAS_VERSION} Beta</span>
          </nav>
        </div>
      </footer>
    </div>
  );
}
