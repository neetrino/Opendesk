"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  requireBoardSession,
  setSessionCookie,
} from "@/lib/session";
import { createInviteToken } from "@/lib/tokens";
import {
  addCommentSchema,
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  createInviteSchema,
  moveCardSchema,
  setCardUrgentSchema,
  updateCardContentSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

export async function createBoardAction(
  formData: FormData,
): Promise<ActionResult<{ boardId: string }>> {
  const errors = await tErrors();
  const parsed = createBoardSchema.safeParse({
    title: formData.get("title"),
    organizerName: formData.get("organizerName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
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
      return { ok: false, error: errors.createOrganizer };
    }

    await setSessionCookie({
      boardId: board.id,
      participantId: organizer.id,
      displayName: organizer.displayName,
    });

    return {
      ok: true,
      data: { boardId: board.id },
    };
  } catch (error) {
    logger.error("createBoardAction failed", error);
    return { ok: false, error: errors.createBoard };
  }
}

export async function createInviteLinkAction(
  boardId: string,
): Promise<ActionResult<{ token: string }>> {
  const errors = await tErrors();
  const parsed = createInviteSchema.safeParse({ boardId });
  if (!parsed.success) {
    return { ok: false, error: errors.invalidBoard };
  }

  try {
    await requireBoardSession(parsed.data.boardId);
    const token = createInviteToken();
    await prisma.invite.create({
      data: {
        boardId: parsed.data.boardId,
        token,
      },
    });
    return { ok: true, data: { token } };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("createInviteLinkAction failed", error);
    return { ok: false, error: errors.createInvite };
  }
}

export async function claimInviteAction(formData: FormData): Promise<void> {
  const errors = await tErrors();
  const parsed = claimInviteSchema.safeParse({
    token: formData.get("token"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    throw new Error(await mapZodMessage(parsed.error.issues[0]?.message));
  }

  const invite = await prisma.invite.findUnique({
    where: { token: parsed.data.token },
  });

  if (!invite) {
    throw new Error(errors.inviteNotFound);
  }

  if (invite.claimedAt || invite.participantId) {
    throw new Error(errors.inviteUsed);
  }

  let participant: { id: string; displayName: string };
  try {
    participant = await prisma.$transaction(async (tx) => {
      const created = await tx.participant.create({
        data: {
          boardId: invite.boardId,
          displayName: parsed.data.displayName,
        },
      });

      // Atomic one-time claim: only the first concurrent winner updates the row.
      const claimed = await tx.invite.updateMany({
        where: {
          id: invite.id,
          claimedAt: null,
          participantId: null,
        },
        data: {
          claimedAt: new Date(),
          participantId: created.id,
        },
      });

      if (claimed.count !== 1) {
        throw new Error("INVITE_CLAIM_CONFLICT");
      }

      return created;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INVITE_CLAIM_CONFLICT") {
      throw new Error(errors.inviteUsed);
    }
    logger.error("claimInviteAction failed", error);
    throw new Error(errors.joinFailed);
  }

  await setSessionCookie({
    boardId: invite.boardId,
    participantId: participant.id,
    displayName: participant.displayName,
  });

  redirect(`/b/${invite.boardId}`);
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

export async function createCardAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = createCardSchema.safeParse({
    boardId: formData.get("boardId"),
    type: formData.get("type"),
    status: formData.get("status") ?? "new",
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    urgent: formData.get("urgent") ?? false,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const session = await requireBoardSession(parsed.data.boardId);
    const maxPosition = await prisma.card.aggregate({
      where: { boardId: parsed.data.boardId, status: parsed.data.status },
      _max: { position: true },
    });

    await prisma.card.create({
      data: {
        boardId: parsed.data.boardId,
        authorId: session.participantId,
        type: parsed.data.type,
        title: parsed.data.title,
        description: parsed.data.description,
        status: parsed.data.status,
        urgent: parsed.data.urgent,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("createCardAction failed", error);
    return { ok: false, error: errors.createCard };
  }
}

export async function moveCardAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = moveCardSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardSession(parsed.data.boardId);

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: errors.cardNotFound };
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
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("moveCardAction failed", error);
    return { ok: false, error: errors.moveCard };
  }
}

export async function setCardUrgentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = setCardUrgentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    urgent: formData.get("urgent"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardSession(parsed.data.boardId);
    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    await prisma.card.update({
      where: { id: card.id },
      data: { urgent: parsed.data.urgent },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("setCardUrgentAction failed", error);
    return { ok: false, error: errors.updateCard };
  }
}

export async function updateCardContentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = updateCardContentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardSession(parsed.data.boardId);
    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    await prisma.card.update({
      where: { id: card.id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("updateCardContentAction failed", error);
    return { ok: false, error: errors.updateCard };
  }
}

export async function addCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = addCommentSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const session = await requireBoardSession(parsed.data.boardId);

    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });

    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    await prisma.comment.create({
      data: {
        cardId: card.id,
        authorId: session.participantId,
        body: parsed.data.body,
      },
    });

    revalidatePath(`/b/${parsed.data.boardId}`);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("addCommentAction failed", error);
    return { ok: false, error: errors.addComment };
  }
}
