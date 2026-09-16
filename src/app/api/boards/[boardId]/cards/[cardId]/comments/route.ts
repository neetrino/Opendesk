import { NextResponse } from "next/server";
import { z } from "zod";
import { requireBoardAccess } from "@/lib/board-access";
import { serializeThreadComment } from "@/lib/card-comment-view";
import {
  loadCardCommentPage,
  loadCardThreadMeta,
  searchCardComments,
} from "@/lib/card-comments";
import { COMMENT_SEARCH_MIN_LENGTH } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().cuid();

type CardCommentsRouteContext = {
  params: Promise<{ boardId: string; cardId: string }>;
};

export const runtime = "nodejs";

/**
 * Newest page of a card thread. Pass `before` to load older messages,
 * or `q` to search the whole thread.
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

  let viewerId: string;
  try {
    const access = await requireBoardAccess(parsedBoardId.data);
    viewerId = access.participantId;
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

  const params = new URL(request.url).searchParams;
  const query = params.get("q")?.trim() ?? "";
  const beforeRaw = params.get("before");

  try {
    const meta = await loadCardThreadMeta(card.id);
    if (query.length >= COMMENT_SEARCH_MIN_LENGTH) {
      const comments = await searchCardComments({
        cardId: card.id,
        viewerId,
        query,
      });
      return NextResponse.json(
        {
          comments: comments.map(serializeThreadComment),
          nextCursor: null,
          pinned: meta.pinned,
          openQuestions: meta.openQuestions,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

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

    const page = await loadCardCommentPage({
      cardId: card.id,
      viewerId,
      before,
    });

    return NextResponse.json(
      {
        comments: page.comments.map(serializeThreadComment),
        nextCursor: page.nextCursor,
        pinned: meta.pinned,
        openQuestions: meta.openQuestions,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logger.error("card comments page failed", error);
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
}
