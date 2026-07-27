"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { setSessionCookie, requireBoardSession } from "@/lib/session";
import { createInviteToken } from "@/lib/tokens";
import {
  addCommentSchema,
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  moveCardSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

export async function createBoardAction(
  formData: FormData,
): Promise<ActionResult<{ boardId: string; inviteTokens: string[] }>> {
  const parsed = createBoardSchema.safeParse({
    title: formData.get("title"),
    organizerName: formData.get("organizerName"),
    inviteCount: formData.get("inviteCount") ?? 5,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  try {
    const tokens = Array.from({ length: parsed.data.inviteCount }, () =>
      createInviteToken(),
    );

    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        invites: {
          create: tokens.map((token) => ({ token })),
        },
        participants: {
          create: {
            displayName: parsed.data.organizerName,
          },
        },
      },
      include: {
        participants: true,
      },
    });

    const organizer = board.participants[0];
    if (!organizer) {
      return { ok: false, error: "Не удалось создать организатора" };
    }

    await setSessionCookie({
      boardId: board.id,
      participantId: organizer.id,
      displayName: organizer.displayName,
    });

    return {
      ok: true,
      data: { boardId: board.id, inviteTokens: tokens },
    };
  } catch (error) {
    logger.error("createBoardAction failed", error);
    return { ok: false, error: "Не удалось создать доску" };
  }
}

export async function claimInviteAction(formData: FormData): Promise<void> {
  const parsed = claimInviteSchema.safeParse({
    token: formData.get("token"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Ошибка валидации");
  }

  const invite = await prisma.invite.findUnique({
    where: { token: parsed.data.token },
  });

  if (!invite) {
    throw new Error("Приглашение не найдено");
  }

  if (invite.claimedAt || invite.participantId) {
    throw new Error("Это приглашение уже использовано");
  }

  const participant = await prisma.$transaction(async (tx) => {
    const created = await tx.participant.create({
      data: {
        boardId: invite.boardId,
        displayName: parsed.data.displayName,
      },
    });

    await tx.invite.update({
      where: { id: invite.id },
      data: {
        claimedAt: new Date(),
        participantId: created.id,
      },
    });

    return created;
  });

  await setSessionCookie({
    boardId: invite.boardId,
    participantId: participant.id,
    displayName: participant.displayName,
  });

  redirect(`/b/${invite.boardId}`);
}

export async function createCardAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = createCardSchema.safeParse({
    boardId: formData.get("boardId"),
    type: formData.get("type"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  try {
    const session = await requireBoardSession(parsed.data.boardId);
    const maxPosition = await prisma.card.aggregate({
      where: { boardId: parsed.data.boardId, status: "new" },
      _max: { position: true },
    });

    await prisma.card.create({
      data: {
        boardId: parsed.data.boardId,
        authorId: session.participantId,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        status: "new",
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Нет доступа к доске" };
    }
    logger.error("createCardAction failed", error);
    return { ok: false, error: "Не удалось создать карточку" };
  }
}

export async function moveCardAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = moveCardSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  try {
    await requireBoardSession(parsed.data.boardId);

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: "Карточка не найдена" };
    }

    const maxPosition = await prisma.card.aggregate({
      where: { boardId: parsed.data.boardId, status: parsed.data.status },
      _max: { position: true },
    });

    await prisma.card.update({
      where: { id: card.id },
      data: {
        status: parsed.data.status,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    revalidatePath(`/b/${parsed.data.boardId}/c/${card.id}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Нет доступа к доске" };
    }
    logger.error("moveCardAction failed", error);
    return { ok: false, error: "Не удалось переместить карточку" };
  }
}

export async function addCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = addCommentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Ошибка валидации" };
  }

  try {
    const session = await requireBoardSession(parsed.data.boardId);

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: "Карточка не найдена" };
    }

    await prisma.comment.create({
      data: {
        cardId: card.id,
        authorId: session.participantId,
        body: parsed.data.body,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}/c/${card.id}`);
    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: "Нет доступа к доске" };
    }
    logger.error("addCommentAction failed", error);
    return { ok: false, error: "Не удалось добавить комментарий" };
  }
}
