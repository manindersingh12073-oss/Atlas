/**
 * Centralised, validated access to environment variables.
 *
 * Reading vars here (instead of scattering `process.env.X!` across the codebase)
 * means a missing/typo'd variable fails loudly at startup with a clear message,
 * rather than surfacing as a confusing runtime error deep in the Supabase client.
 *
 * Only NEXT_PUBLIC_* vars belong here — they are safe in both browser and server
 * bundles. The service-role key is intentionally NOT exposed here; it must only
 * ever be read in trusted server-only code.
 *
 * Note: each `process.env.NEXT_PUBLIC_*` is referenced as a literal so Next.js can
 * statically inline it into the client bundle at build time.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL,
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_SITE_URL:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
