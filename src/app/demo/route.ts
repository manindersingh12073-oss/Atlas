import { NextResponse, type NextRequest } from "next/server";

import { DEMO_COOKIE } from "@/lib/demo/session";

/**
 * Entry point for Demo Mode. No account, no auth — just marks the browser as
 * a demo visitor and drops it straight into the normal authenticated app.
 * Every other Atlas route stays exactly where it is; only the data source
 * changes (see src/lib/demo/queries.ts and the isDemoMode() checks it feeds).
 */
export async function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  response.cookies.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return response;
}
