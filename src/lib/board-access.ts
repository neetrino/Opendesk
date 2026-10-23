import "server-only";

import { OWNER_PARTICIPANT_NAME } from "@/lib/constants";
import { touchParticipantLastSeen } from "@/lib/participant-activity";
import { prisma } from "@/lib/prisma";
import { getAccount, type AccountContext } from "@/lib/account-session";
import { getSession, type SessionPayload } from "@/lib/session";

export type BoardAccess = SessionPayload & {
  isOwner: boolean;
};

type Seat = {
  id: string;
  displayName: string;
  avatarKey: string | null;
};

/**
 * Seat for this account on this board.
 * The legacy "Owner" guest row is linked only when this account owns the board.
 */
export async function resolveAccountSeat(
  boardId: string,
  account: AccountContext,
  ownerId: string | null,
): Promise<Seat | null> {
  const linked = await prisma.participant.findFirst({
    where: { boardId, userId: account.id },
    select: { id: true, displayName: true, avatarKey: true },
  });
  if (linked) {
    return linked;
  }
  if (ownerId !== account.id) {
    return null;
  }

  const legacy = await prisma.participant.findFirst({
    where: {
      boardId,
      userId: null,
      displayName: { equals: OWNER_PARTICIPANT_NAME, mode: "insensitive" },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, avatarKey: true },
  });
  if (!legacy) {
    return null;
  }

  const claimed = await prisma.participant.updateMany({
    where: { id: legacy.id, userId: null },
    data: { userId: account.id },
  });
  if (claimed.count !== 1) {
    return prisma.participant.findFirst({
      where: { boardId, userId: account.id },
      select: { id: true, displayName: true, avatarKey: true },
    });
  }
  return legacy;
}

/**
 * Account seat on this board, or the guest cookie for this board.
 * `isOwner` is board ownership, not the platform role.
 */
export async function requireBoardAccess(
  boardId: string,
): Promise<BoardAccess> {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, ownerId: true, disabledAt: true },
  });
  if (!board || board.disabledAt) {
    throw new Error("UNAUTHORIZED");
  }

  const account = await getAccount();
  if (account) {
    const seat = await resolveAccountSeat(board.id, account, board.ownerId);
    if (!seat) {
      throw new Error("UNAUTHORIZED");
    }
    await touchParticipantLastSeen(prisma, seat.id);
    return {
      boardId,
      participantId: seat.id,
      displayName: seat.displayName,
      isOwner: board.ownerId === account.id,
    };
  }

  const session = await getSession();
  if (!session || session.boardId !== boardId) {
    throw new Error("UNAUTHORIZED");
  }

  const participant = await prisma.participant.findFirst({
    where: { id: session.participantId, boardId },
    select: { id: true, displayName: true },
  });
  if (!participant) {
    throw new Error("UNAUTHORIZED");
  }

  await touchParticipantLastSeen(prisma, participant.id);
  return {
    boardId,
    participantId: participant.id,
    displayName: participant.displayName,
    isOwner: false,
  };
}

export async function canAccessBoard(boardId: string): Promise<boolean> {
  try {
    await requireBoardAccess(boardId);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return false;
    }
    throw error;
  }
}
