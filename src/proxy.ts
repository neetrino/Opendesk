import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OWNER_LAST_BOARD_API_PATH } from "@/lib/constants";
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
  const isOwnerLogin = request.method === "POST" && path === "/login";

  if (isOwnerLogin) {
    const result = checkRateLimit(`owner-login:${ip}`, 10, JOIN_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many attempts. Try again in a minute.", {
        status: 429,
      });
    }
  }

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

  const isAttachmentGet =
    request.method === "GET" && path.startsWith("/api/attachments/");
  if (isAttachmentGet) {
    const result = checkRateLimit(`files:${ip}`, 120, MUTATION_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many requests. Try again in a minute.", {
        status: 429,
      });
    }
  }

  const isBoardActivityGet =
    request.method === "GET" &&
    /^\/api\/boards\/[^/]+\/activity$/.test(path);
  const isBoardCardsGet =
    request.method === "GET" &&
    /^\/api\/boards\/[^/]+\/cards$/.test(path);
  const isCardCommentsGet =
    request.method === "GET" &&
    /^\/api\/boards\/[^/]+\/cards\/[^/]+\/comments$/.test(path);
  if (isBoardActivityGet) {
    const result = checkRateLimit(`activity:${ip}`, 120, MUTATION_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many requests. Try again in a minute.", {
        status: 429,
      });
    }
  }
  if (isBoardCardsGet || isCardCommentsGet) {
    const result = checkRateLimit(`board-pages:${ip}`, 120, MUTATION_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many requests. Try again in a minute.", {
        status: 429,
      });
    }
  }

  const isLastBoardPost =
    request.method === "POST" && path === OWNER_LAST_BOARD_API_PATH;
  if (isLastBoardPost) {
    const result = checkRateLimit(`last-board:${ip}`, 60, MUTATION_WINDOW_MS);
    if (!result.allowed) {
      return new NextResponse("Too many requests. Try again in a minute.", {
        status: 429,
      });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/invite/:path*",
    "/join/:path*",
    "/b/:path*",
    "/login",
    "/api/attachments/:path*",
    "/api/boards/:path*",
    "/api/owner/last-board",
  ],
};
