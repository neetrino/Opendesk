import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBoardAccess } from "@/lib/board-access";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const boardIdSchema = z.string().cuid();

type BoardActivityRouteContext = {
  params: Promise<{ boardId: string }>;
};

export const runtime = "nodejs";

/**
 * Lightweight comment cursors for unread badges while the board is open.
 * Chat bodies load only when a card is opened.
 */
export async function GET(
  _request: Request,
  context: BoardActivityRouteContext,
): Promise<Response> {
  const { boardId } = await context.params;
  const parsedId = boardIdSchema.safeParse(boardId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let participantId: string;
  try {
    const access = await requireBoardAccess(parsedId.data);
    participantId = access.participantId;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const cards = await prisma.card.findMany({
      where: { boardId: parsedId.data },
      select: {
        id: true,
        comments: {
          where: { authorId: { not: participantId } },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    return NextResponse.json(
      {
        cards: cards.flatMap((card) => {
          const latest = card.comments[0];
          if (!latest) {
            return [];
          }
          return [
            {
              id: card.id,
              lastForeignCommentAt: latest.createdAt.toISOString(),
            },
          ];
        }),
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    logger.error("board activity failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
