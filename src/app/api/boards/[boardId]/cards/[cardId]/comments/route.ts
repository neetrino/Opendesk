import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBoardAccess } from "@/lib/board-access";
import { serializeThreadComment } from "@/lib/card-comment-view";
import { loadCardCommentPage } from "@/lib/card-comments";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().cuid();

type CardCommentsRouteContext = {
  params: Promise<{ boardId: string; cardId: string }>;
};

export const runtime = "nodejs";

/**
 * Newest page of a card thread. Pass `before` to load older messages.
 */
export async function GET(
  request: Request,
  context: CardCommentsRouteContext,
): Promise<Response> {
  const { boardId, cardId } = await context.params;
  const parsedBoardId = idSchema.safeParse(boardId);
  const parsedCardId = idSchema.safeParse(cardId);
  if (!parsedBoardId.success || !parsedCardId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await requireBoardAccess(parsedBoardId.data);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const card = await prisma.card.findFirst({
    where: { id: parsedCardId.data, boardId: parsedBoardId.data },
    select: { id: true },
  });
  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const beforeRaw = new URL(request.url).searchParams.get("before");
  let before: { createdAt: Date; id: string } | null = null;
  if (beforeRaw) {
    const parsedBefore = idSchema.safeParse(beforeRaw);
    if (!parsedBefore.success) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const cursorComment = await prisma.comment.findFirst({
      where: { id: parsedBefore.data, cardId: card.id },
      select: { id: true, createdAt: true },
    });
    if (!cursorComment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    before = cursorComment;
  }

  try {
    const page = await loadCardCommentPage({
      cardId: card.id,
      before,
    });

    return NextResponse.json(
      {
        comments: page.comments.map(serializeThreadComment),
        nextCursor: page.nextCursor,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    logger.error("card comments page failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
