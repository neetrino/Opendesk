import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBoardAccess } from "@/lib/board-access";
import {
  parseCardCursor,
  serializeBoardCard,
} from "@/lib/board-card-view";
import { loadColumnCardPage } from "@/lib/board-cards";
import { parseCardListQuery } from "@/lib/card-query-where";
import { logger } from "@/lib/logger";

const boardIdSchema = z.string().cuid();
const statusSchema = z.enum(["new", "in_progress", "answered", "done"]);

type BoardCardsRouteContext = {
  params: Promise<{ boardId: string }>;
};

export const runtime = "nodejs";

/**
 * Next page of column cards: titles and counts only, no chat bodies.
 */
export async function GET(
  request: Request,
  context: BoardCardsRouteContext,
): Promise<Response> {
  const { boardId } = await context.params;
  const parsedId = boardIdSchema.safeParse(boardId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const parsedStatus = statusSchema.safeParse(url.searchParams.get("status"));
  if (!parsedStatus.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cursorRaw = url.searchParams.get("cursor");
  const cursor = cursorRaw ? parseCardCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const query = parseCardListQuery(url.searchParams);
  if (!query) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireBoardAccess(parsedId.data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const page = await loadColumnCardPage({
      boardId: parsedId.data,
      status: parsedStatus.data,
      cursor,
      query,
      includeCount: !cursor,
    });

    return NextResponse.json(
      {
        cards: page.cards.map(serializeBoardCard),
        nextCursor: page.nextCursor,
        totalCount: page.totalCount,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    logger.error("board cards page failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
