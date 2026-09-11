"use server";

import type { Card } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireBoardAccess } from "@/lib/board-access";
import { MAX_BOARD_PARTICIPANTS } from "@/lib/constants";
import { allocateBoardSlug } from "@/lib/allocate-board-slug";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import { buildJoinPath } from "@/lib/join-url";
import { logger } from "@/lib/logger";
import {
  clearOwnerSessionCookie,
  requireOwnerSession,
  setOwnerSessionCookie,
  verifyOwnerCredentials,
} from "@/lib/owner-session";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { createJoinToken } from "@/lib/tokens";
import {
  persistVerifiedAttachments,
  verifyOwnedUploads,
} from "@/lib/persist-attachments";
import {
  addCommentWithAttachmentsSchema,
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  joinBoardSchema,
  moveCardSchema,
  setCardUrgentSchema,
  updateCardContentSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/types/actions";

const ownerLoginSchema = z.object({
  login: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function ownerLoginAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const parsed = ownerLoginSchema.safeParse({
    login: formData.get("login"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, error: errors.invalidCredentials };
  }

  if (!verifyOwnerCredentials(parsed.data.login, parsed.data.password)) {
    return { ok: false, error: errors.invalidCredentials };
  }

  await clearSessionCookie();
  await setOwnerSessionCookie();
  redirect("/boards");
}

export async function logoutOwnerAction(): Promise<void> {
  await clearSessionCookie();
  await clearOwnerSessionCookie();
  redirect("/login");
}

export async function createBoardAction(
  formData: FormData,
): Promise<ActionResult<{ boardId: string; joinToken: string; slug: string }>> {
  const errors = await tErrors();

  try {
    await requireOwnerSession();
  } catch {
    return { ok: false, error: errors.unauthorized };
  }

  const parsed = createBoardSchema.safeParse({
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const slug = await allocateBoardSlug(parsed.data.title);
    const board = await prisma.board.create({
      data: {
        title: parsed.data.title,
        slug,
        joinToken: createJoinToken(),
      },
    });

    return {
      ok: true,
      data: {
        boardId: board.id,
        joinToken: board.joinToken,
        slug: board.slug,
      },
    };
  } catch (error) {
    logger.error("createBoardAction failed", error);
    return { ok: false, error: errors.createBoard };
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
    include: {
      board: { select: { slug: true, joinToken: true } },
    },
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
      const participantCount = await tx.participant.count({
        where: { boardId: invite.boardId },
      });
      if (participantCount >= MAX_BOARD_PARTICIPANTS) {
        throw new Error("BOARD_FULL");
      }

      const created = await tx.participant.create({
        data: {
          boardId: invite.boardId,
          displayName: parsed.data.displayName,
        },
      });

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
    if (error instanceof Error && error.message === "BOARD_FULL") {
      throw new Error(errors.boardFull);
    }
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

  redirect(buildJoinPath(invite.board.slug, invite.board.joinToken));
}

/**
 * Permanent board link: rejoin existing participant by display name
 * (case-insensitive), or create a new participant when the name is new.
 */
export async function joinBoardByTokenAction(
  formData: FormData,
): Promise<void> {
  const errors = await tErrors();
  const parsed = joinBoardSchema.safeParse({
    token: formData.get("token"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    throw new Error(await mapZodMessage(parsed.error.issues[0]?.message));
  }

  const board = await prisma.board.findUnique({
    where: { joinToken: parsed.data.token },
    select: { id: true, slug: true, joinToken: true },
  });

  if (!board) {
    throw new Error(errors.inviteNotFound);
  }

  let participant: { id: string; displayName: string };
  try {
    participant = await prisma.$transaction(async (tx) => {
      const existing = await tx.participant.findFirst({
        where: {
          boardId: board.id,
          displayName: {
            equals: parsed.data.displayName,
            mode: "insensitive",
          },
        },
        orderBy: { createdAt: "asc" },
      });

      if (existing) {
        return existing;
      }

      const participantCount = await tx.participant.count({
        where: { boardId: board.id },
      });
      if (participantCount >= MAX_BOARD_PARTICIPANTS) {
        throw new Error("BOARD_FULL");
      }

      return tx.participant.create({
        data: {
          boardId: board.id,
          displayName: parsed.data.displayName,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BOARD_FULL") {
      throw new Error(errors.boardFull);
    }
    logger.error("joinBoardByTokenAction failed", error);
    throw new Error(errors.joinFailed);
  }

  await setSessionCookie({
    boardId: board.id,
    participantId: participant.id,
    displayName: participant.displayName,
  });

  redirect(buildJoinPath(board.slug, board.joinToken));
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

export async function createCardAction(
  formData: FormData,
): Promise<ActionResult<Card>> {
  const errors = await tErrors();
  const parsed = createCardSchema.safeParse({
    boardId: formData.get("boardId"),
    status: formData.get("status") ?? "new",
    title: formData.get("title"),
    urgent: formData.get("urgent") ?? false,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const maxPosition = await prisma.card.aggregate({
      where: { boardId: parsed.data.boardId, status: parsed.data.status },
      _max: { position: true },
    });

    const created = await prisma.card.create({
      data: {
        boardId: parsed.data.boardId,
        authorId: access.participantId,
        title: parsed.data.title,
        status: parsed.data.status,
        urgent: parsed.data.urgent,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: created };
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
    await requireBoardAccess(parsed.data.boardId);

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

    await revalidateBoardPath(parsed.data.boardId);
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
    await requireBoardAccess(parsed.data.boardId);
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

    await revalidateBoardPath(parsed.data.boardId);
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
    });

    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    await prisma.card.update({
      where: { id: card.id },
      data: {
        title: parsed.data.title,
      },
    });

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("updateCardContentAction failed", error);
    return { ok: false, error: errors.updateCard };
  }
}

function parseCommentAttachments(raw: FormDataEntryValue | null): unknown {
  if (raw == null || raw === "") {
    return [];
  }
  if (typeof raw !== "string") {
    return null;
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export async function addCommentAction(
  formData: FormData,
): Promise<ActionResult> {
  const errors = await tErrors();
  const attachments = parseCommentAttachments(formData.get("attachments"));
  if (attachments === null) {
    return { ok: false, error: errors.validation };
  }

  const parsed = addCommentWithAttachmentsSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    body: formData.get("body") ?? "",
    attachments,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    const access = await requireBoardAccess(parsed.data.boardId);
    const card = await prisma.card.findFirst({
      where: { id: parsed.data.cardId, boardId: parsed.data.boardId },
    });
    if (!card) {
      return { ok: false, error: errors.cardNotFound };
    }

    const verified = await verifyOwnedUploads(
      parsed.data.boardId,
      card.id,
      parsed.data.attachments,
    );

    await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          cardId: card.id,
          authorId: access.participantId,
          body: parsed.data.body,
        },
      });

      if (verified.length > 0) {
        await persistVerifiedAttachments({
          boardId: parsed.data.boardId,
          cardId: card.id,
          commentId: created.id,
          authorId: access.participantId,
          items: verified,
          db: tx,
        });
      }
    });

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("addCommentAction failed", error);
    return { ok: false, error: errors.addComment };
  }
}
