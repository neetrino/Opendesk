import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { rememberOwnerLastBoardPath } from "@/lib/remember-board-visit";

const lastBoardBodySchema = z.object({
  path: z.string().min(1).max(200),
});

export const runtime = "nodejs";

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

/**
 * Persist the owner's last board without a Server Action.
 * A cookie write inside an Action would refresh the RSC tree and drop
 * the client router cache, which made every board visit look like a reload.
 */
export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const parsed = lastBoardBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await rememberOwnerLastBoardPath(parsed.data.path);
    if (result === "unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (result === "invalid") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logger.error("remember last board failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
