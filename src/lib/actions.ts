"use server";

import type { Card } from "@prisma/client";
import { redirect } from "next/navigation";
import { nextBoardAvatarKey } from "@/lib/assign-board-avatars";
import { requireBoardAccess } from "@/lib/board-access";
import { resolveMovePlacement } from "@/lib/card-position";
import { moveBoardCard } from "@/lib/move-board-card";
import {
  visibleParticipantFilter,
} from "@/lib/participant-activity";
import { getAccount, requireAccount, setAccountCookie } from "@/lib/account-session";
import { normalizeEmail } from "@/lib/account-link";
import { allocateBoardSlug } from "@/lib/allocate-board-slug";
import { mapZodMessage, tErrors } from "@/lib/i18n-errors";
import {
  AVATAR_POOL_EXHAUSTED,
  joinBoardByName,
} from "@/lib/join-board";
import { buildJoinPath } from "@/lib/join-url";
import { logger } from "@/lib/logger";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { revalidateBoardPath } from "@/lib/revalidate-board";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { createJoinToken } from "@/lib/tokens";
import { replaceCommentMentions, replySnapshot } from "@/lib/comment-persist";
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

export async function createBoardAction(
  formData: FormData,
): Promise<ActionResult<{ boardId: string; joinToken: string; slug: string }>> {
  const errors = await tErrors();

  let account: Awaited<ReturnType<typeof requireAccount>>;
  try {
    account = await requireAccount();
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
    const board = await prisma.$transaction(async (tx) => {
      const created = await tx.board.create({
        data: {
          title: parsed.data.title,
          slug,
          joinToken: createJoinToken(),
          ownerId: account.id,
        },
      });
      const avatarKey = await nextBoardAvatarKey(
        tx,
        created.id,
        `${created.id}:${account.id}`,
      );
      await tx.participant.create({
        data: {
          boardId: created.id,
          displayName: account.displayName,
          userId: account.id,
          avatarKey,
        },
      });
      return created;
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
      board: { select: { slug: true, joinToken: true, disabledAt: true } },
    },
  });

  if (!invite) {
    throw new Error(errors.inviteNotFound);
  }

  if (invite.claimedAt || invite.participantId || invite.board.disabledAt) {
    throw new Error(invite.board.disabledAt ? errors.boardClosed : errors.inviteUsed);
  }

  const account = await getAccount();
  let participant: { id: string; displayName: string };
  try {
    const joined = await joinBoardByName({
      boardId: invite.boardId,
      displayName: parsed.data.displayName,
      accountUserId: account?.id ?? null,
      register: null,
      inviteId: invite.id,
    });
    participant = joined.participant;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "BOARD_FULL" ||
        error.message === AVATAR_POOL_EXHAUSTED)
    ) {
      throw new Error(errors.boardFull);
    }
    if (error instanceof Error && error.message === "NAME_CLAIMED") {
      throw new Error(errors.nameClaimed);
    }
    if (error instanceof Error && error.message === "NAME_TAKEN") {
      throw new Error(errors.nameTaken);
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
    select: { id: true, slug: true, joinToken: true, disabledAt: true },
  });

  if (!board || board.disabledAt) {
    throw new Error(board?.disabledAt ? errors.boardClosed : errors.inviteNotFound);
  }

  const email = normalizeEmail(parsed.data.email);
  const password = parsed.data.password;
  const passwordHash =
    email.length > 0 && password.length > 0 ? await hashPassword(password) : null;

  let participant: { id: string; displayName: string };
  let linkedUser: { id: string; sessionVersion: number } | null = null;
  try {
    const joined = await joinBoardByName({
      boardId: board.id,
      displayName: parsed.data.displayName,
      accountUserId: null,
      register: passwordHash ? { email, passwordHash } : null,
    });
    participant = joined.participant;
    linkedUser = joined.user;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "BOARD_FULL" ||
        error.message === AVATAR_POOL_EXHAUSTED)
    ) {
      throw new Error(errors.boardFull);
    }
    if (error instanceof Error && error.message === "NAME_CLAIMED") {
      throw new Error(errors.nameClaimed);
    }
    if (error instanceof Error && error.message === "EMAIL_TAKEN") {
      throw new Error(errors.emailTaken);
    }
    logger.error("joinBoardByTokenAction failed", error);
    throw new Error(errors.joinFailed);
  }

  await setSessionCookie({
    boardId: board.id,
    participantId: participant.id,
    displayName: participant.displayName,
  });
  if (linkedUser) {
    await setAccountCookie({
      userId: linkedUser.id,
      sessionVersion: linkedUser.sessionVersion,
    });
  }

  redirect(buildJoinPath(board.slug, board.joinToken));
}

export async function joinBoardAsAccountAction(
  formData: FormData,
): Promise<void> {
  const errors = await tErrors();
  const account = await requireAccount();
  const parsed = joinBoardSchema.safeParse({
    token: formData.get("token"),
    displayName: formData.get("displayName"),
    email: "",
    password: "",
  });
  if (!parsed.success) {
    throw new Error(await mapZodMessage(parsed.error.issues[0]?.message));
  }

  const board = await prisma.board.findUnique({
    where: { joinToken: parsed.data.token },
    select: { id: true, slug: true, joinToken: true, disabledAt: true },
  });
  if (!board || board.disabledAt) {
    throw new Error(board?.disabledAt ? errors.boardClosed : errors.inviteNotFound);
  }

  let participant: { id: string; displayName: string };
  try {
    const joined = await joinBoardByName({
      boardId: board.id,
      displayName: parsed.data.displayName,
      accountUserId: account.id,
      register: null,
    });
    participant = joined.participant;
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === "BOARD_FULL" ||
        error.message === AVATAR_POOL_EXHAUSTED)
    ) {
      throw new Error(errors.boardFull);
    }
    if (error instanceof Error && error.message === "NAME_TAKEN") {
      throw new Error(errors.nameTaken);
    }
    logger.error("joinBoardAsAccountAction failed", error);
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
    labelIds: formData.get("labelIds") ?? "",
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

    if (parsed.data.labelIds.length > 0) {
      const labels = await prisma.boardLabel.findMany({
        where: {
          boardId: parsed.data.boardId,
          id: { in: parsed.data.labelIds },
        },
        select: { id: true },
      });
      if (labels.length > 0) {
        await prisma.cardLabel.createMany({
          data: labels.map((label) => ({
            cardId: created.id,
            labelId: label.id,
          })),
        });
      }
    }

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
    beforeCardId: formData.get("beforeCardId") || undefined,
    afterCardId: formData.get("afterCardId") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: await mapZodMessage(parsed.error.issues[0]?.message),
    };
  }

  try {
    await requireBoardAccess(parsed.data.boardId);

    const moved = await moveBoardCard({
      boardId: parsed.data.boardId,
      cardId: parsed.data.cardId,
      status: parsed.data.status,
      placement: resolveMovePlacement(parsed.data),
    });
    if (moved === "not_found") {
      return { ok: false, error: errors.cardNotFound };
    }

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
): Promise<ActionResult<{ commentId: string }>> {
  const errors = await tErrors();
  const attachments = parseCommentAttachments(formData.get("attachments"));
  if (attachments === null) {
    return { ok: false, error: errors.validation };
  }

  const parsed = addCommentWithAttachmentsSchema.safeParse({
    boardId: formData.get("boardId"),
    cardId: formData.get("cardId"),
    body: formData.get("body") ?? "",
    parentId: formData.get("parentId") ?? "",
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

    let reply:
      | ReturnType<typeof replySnapshot>
      | undefined;
    if (parsed.data.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: parsed.data.parentId, cardId: card.id },
        select: {
          id: true,
          body: true,
          deletedAt: true,
          parentAuthorName: true,
          parentExcerpt: true,
          author: { select: { displayName: true } },
        },
      });
      if (!parent) {
        return { ok: false, error: errors.cardNotFound };
      }
      reply = replySnapshot(parent);
    }

    const participants = await prisma.participant.findMany({
      where: {
        boardId: parsed.data.boardId,
        ...visibleParticipantFilter(),
      },
      select: { id: true, displayName: true },
    });

    const commentId = await prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          cardId: card.id,
          authorId: access.participantId,
          body: parsed.data.body,
          parentId: reply?.parentId,
          parentAuthorName: reply?.parentAuthorName,
          parentExcerpt: reply?.parentExcerpt,
        },
      });

      await replaceCommentMentions(
        tx,
        created.id,
        parsed.data.body,
        participants,
      );

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

      return created.id;
    });

    await revalidateBoardPath(parsed.data.boardId);
    return { ok: true, data: { commentId } };
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return { ok: false, error: errors.unauthorized };
    }
    logger.error("addCommentAction failed", error);
    return { ok: false, error: errors.addComment };
  }
}
