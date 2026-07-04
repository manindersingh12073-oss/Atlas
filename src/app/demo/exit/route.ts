import { NextResponse, type NextRequest } from "next/server";

import { DEMO_COOKIE } from "@/lib/demo/session";

// Only relative in-app paths are honoured as a redirect target.
function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/login";
}

/** Leaves Demo Mode: clears the cookie and returns to login (or `next`). */
export async function GET(request: NextRequest) {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  const response = NextResponse.redirect(new URL(next, request.url));
  response.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
