# Atlas

The memory layer for professional relationships. Capture the people you meet,
remember the context, and get reminded to follow up.

> **Status:** Phase 1 — project scaffold and authentication architecture only.
> No application features are implemented yet.

## Tech stack

- **Next.js 16** (App Router) + **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Supabase** (Postgres, Auth) via `@supabase/ssr`
- **ESLint** (flat config, `eslint-config-next`)

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in your Supabase values in .env.local

# 3. Run the dev server
npm run dev
```

Open http://localhost:3000.

## Scripts

| Script              | Purpose                              |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the local dev server           |
| `npm run build`     | Production build                     |
| `npm run start`     | Run the production build             |
| `npm run lint`      | Lint with ESLint                     |
| `npm run typecheck` | Type-check with `tsc` (no emit)      |

## Project structure

```
src/
  app/                      # App Router
    (auth)/                 # public auth pages (route group, later)
    (protected)/            # authenticated app pages (route group, later)
    auth/callback/route.ts  # OAuth / magic-link code exchange
    auth/auth-code-error/   # auth failure fallback page
    layout.tsx              # root layout
    page.tsx                # placeholder landing
    globals.css             # Tailwind v4 entry + theme tokens
  components/               # shared UI (empty in Phase 1)
  lib/
    env.ts                  # validated environment variables
    supabase/
      client.ts             # browser Supabase client
      server.ts             # server Supabase client (RSC/actions/routes)
      middleware.ts         # session-refresh helper (used by proxy)
  proxy.ts                  # Next 16 proxy — runs session refresh per request
  types/
    database.types.ts       # generated DB types (placeholder)
```

## Environment variables

See [.env.example](.env.example). The anon key is public by design — security is
enforced by Supabase Row Level Security. The **service-role key is a secret** and
must never be exposed to the browser.
