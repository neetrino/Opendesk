"use server";

import type { Card } from "@prisma/client";
import { requireBoardAccess } from "@/lib/board-access";
import { commentExcerpt } from "@/lib/comment-excerpt";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import { createCardFromCommentSchema } from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

export async function createCardFromCommentAction(
  formData: FormData,
): Promise<ActionResult<Card>> {
  const errors = await tErrors();
  const parsed = createCardFromCommentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    commentId: formData.get("commentId"),
    title: formData.get("title"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const source = await prisma.comment.findFirst({
      where: {
        id: parsed.data.commentId,
        cardId: parsed.data.cardId,
        card: { boardId: parsed.data.boardId },
        deletedAt: null,
      },
      select: {
        body: true,
        author: { select: { displayName: true } },
      },
    });
    if (!source) {
      return { ok: false, error: errors.cardNotFound };
    }

    const maxPosition = await prisma.card.aggregate({
      where: { boardId: parsed.data.boardId, status: "new" },
      _max: { position: true },
    });
    const seedBody = `${source.author.displayName}: ${commentExcerpt(source.body)}`;

    const created = await prisma.$transaction(async (tx) => {
      const card = await tx.card.create({
        data: {
          boardId: parsed.data.boardId,
          authorId: access.participantId,
          title: parsed.data.title,
          status: "new",
          urgent: false,
          position: (maxPosition._max.position ?? -1) + 1,
        },
      });
      await tx.comment.create({
        data: {
          cardId: card.id,
          authorId: access.participantId,
          body: seedBody,
        },
      });
      return card;
    });

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: created };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("createCardFromCommentAction failed", error);
    return { ok: false, error: errors.createCard };
  }
}
