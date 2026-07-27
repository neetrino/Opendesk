import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const JOIN_WINDOW_MS = 60_000;
const JOIN_LIMIT = 20;
const MUTATION_WINDOW_MS = 60_000;
const MUTATION_LIMIT = 60;

export function proxy(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const path = request.nextUrl.pathname;
  const isLegacyJoin =
    path.startsWith("/invite/") || path.startsWith("/join/");
  const isSlugJoin = /^\/b\/[^/]+\/[^/]+$/.test(path);
  const isBoardMutation =
    request.method === "POST" && path.startsWith("/b/");

  if (isLegacyJoin || isSlugJoin) {
    const result = checkRateLimit(`invite:${ip}`, JOIN_LIMIT, JOIN_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many attempts. Try again in a minute.", {
        status: 429,
      });
    }
  }

  if (isBoardMutation) {
    const result = checkRateLimit(
      `mutate:${ip}`,
      MUTATION_LIMIT,
      MUTATION_WINDOW_MS,
    );
    if (!result.allowed) {
      return new NextResponse("Too many requests. Try again in a minute.", {
        status: 429,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/invite/:path*", "/join/:path*", "/b/:path*"],
};
