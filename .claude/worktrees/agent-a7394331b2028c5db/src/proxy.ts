import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16 "proxy" (formerly "middleware"). Runs before matched requests and
 * refreshes the Supabase auth session so server-rendered pages always see a
 * valid token.
 */
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all request paths EXCEPT:
     * - _next/static  (build assets)
     * - _next/image   (image optimizer)
     * - favicon.ico
     * - common static image files
     * This keeps the session-refresh cost off static asset requests.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
