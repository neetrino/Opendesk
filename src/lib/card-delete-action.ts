"use server";

import { requireBoardAccess } from "@/lib/board-access";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { deleteStoredObject } from "@/lib/r2";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import { deleteCardSchema } from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

/**
 * Permanently deletes a card and its thread. Owner session only.
 */
export async function deleteCardAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = deleteCardSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    if (!access.isOwner) {
      return { ok: false, error: errors.unauthorized };
    }

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
      select: { id: true },
    });
    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    const attachments = await prisma.attachment.findMany({
      where: { cardId: card.id, boardId: parsed.data.boardId },
      select: { objectKey: true },
    });

    await prisma.$transaction(async (tx) => {
      await tx.card.update({
        where: { id: card.id },
        data: { pinnedCommentId: null },
      });
      await tx.card.delete({ where: { id: card.id } });
    });

    await Promise.all(
      attachments.map((attachment) => deleteStoredObject(attachment.objectKey)),
    );

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("deleteCardAction failed", error);
    return { ok: false, error: errors.deleteCard };
  }
}
