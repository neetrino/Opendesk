"use server";

import { requireBoardAccess } from "@/lib/board-access";
import { replaceCommentMentions } from "@/lib/comment-persist";
import { visibleParticipantFilter } from "@/lib/participant-activity";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import {
  commentTargetSchema,
  editCommentSchema,
  setCardPinnedCommentSchema,
  toggleCommentReactionSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

async function loadBoardParticipants(boardId: string) {
  return prisma.participant.findMany({
    where: {
      boardId,
      ...visibleParticipantFilter(),
    },
    select: { id: true, displayName: true },
  });
}

export async function editCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = editCommentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    commentId: formData.get("commentId"),
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const comment = await prisma.comment.findFirst({
      where: {
        id: parsed.data.commentId,
        cardId: parsed.data.cardId,
        card: { boardId: parsed.data.boardId },
      },
      select: { id: true, authorId: true, deletedAt: true },
    });
    if (!comment || comment.deletedAt) {
      return { ok: false, error: errors.cardNotFound };
    }
    if (comment.authorId !== access.participantId) {
      return { ok: false, error: errors.unauthorized };
    }

    const participants = await loadBoardParticipants(parsed.data.boardId);
    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: comment.id },
        data: { body: parsed.data.body, editedAt: new Date() },
      });
      await replaceCommentMentions(
        tx,
        comment.id,
        parsed.data.body,
        participants,
      );
    });
    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("editCommentAction failed", error);
    return { ok: false, error: errors.updateComment };
  }
}

export async function deleteCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = commentTargetSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    commentId: formData.get("commentId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const comment = await prisma.comment.findFirst({
      where: {
        id: parsed.data.commentId,
        cardId: parsed.data.cardId,
        card: { boardId: parsed.data.boardId },
      },
      select: { id: true, authorId: true, deletedAt: true },
    });
    if (!comment || comment.deletedAt) {
      return { ok: false, error: errors.cardNotFound };
    }
    if (comment.authorId !== access.participantId) {
      return { ok: false, error: errors.unauthorized };
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: comment.id },
        data: { deletedAt: new Date() },
      });
      await tx.card.updateMany({
        where: {
          id: parsed.data.cardId,
          pinnedCommentId: comment.id,
        },
        data: { pinnedCommentId: null },
      });
    });
    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("deleteCommentAction failed", error);
    return { ok: false, error: errors.deleteComment };
  }
}

export async function toggleCommentReactionAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = toggleCommentReactionSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    commentId: formData.get("commentId"),
    emoji: formData.get("emoji"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const comment = await prisma.comment.findFirst({
      where: {
        id: parsed.data.commentId,
        cardId: parsed.data.cardId,
        card: { boardId: parsed.data.boardId },
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!comment) {
      return { ok: false, error: errors.cardNotFound };
    }

    const existing = await prisma.commentReaction.findUnique({
      where: {
        commentId_participantId_emoji: {
          commentId: comment.id,
          participantId: access.participantId,
          emoji: parsed.data.emoji,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.commentReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.commentReaction.create({
        data: {
          commentId: comment.id,
          participantId: access.participantId,
          emoji: parsed.data.emoji,
        },
      });
    }
    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("toggleCommentReactionAction failed", error);
    return { ok: false, error: errors.updateComment };
  }
}

export async function setCardPinnedCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = setCardPinnedCommentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    commentId: formData.get("commentId"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);
    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
      select: { id: true, pinnedCommentId: true },
    });
    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    if (!parsed.data.commentId) {
      await prisma.card.update({
        where: { id: card.id },
        data: { pinnedCommentId: null },
      });
      await revalidateBoardPath(parsed.data.boardId);
      return { ok: true, data: undefined };
    }

    const comment = await prisma.comment.findFirst({
      where: {
        id: parsed.data.commentId,
        cardId: card.id,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (!comment) {
      return { ok: false, error: errors.cardNotFound };
    }

    await prisma.card.update({
      where: { id: card.id },
      data: { pinnedCommentId: comment.id },
    });
    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("setCardPinnedCommentAction failed", error);
    return { ok: false, error: errors.updateCard };
  }
}
