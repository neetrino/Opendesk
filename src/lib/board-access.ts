import {
  assignBoardAvatar,
  nextBoardAvatarKey,
} from "@/lib/assign-board-avatars";
import { OWNER_PARTICIPANT_NAME } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { getOwnerSession } from "@/lib/owner-session";
import { getSession, type SessionPayload } from "@/lib/session";

export type BoardAccess = SessionPayload & {
  isOwner: boolean;
};

/** Ensure a stable Owner participant exists for env-owner mutations. */
export async function ensureOwnerParticipant(
  boardId: string,
): Promise<{ id: string; displayName: string; avatarKey: string | null }> {
  const existing = await prisma.participant.findFirst({
    where: {
      boardId,
      displayName: {
        equals: OWNER_PARTICIPANT_NAME,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true, avatarKey: true },
  });

  if (existing) {
    if (existing.avatarKey) {
      return existing;
    }
    const avatarKey = await assignBoardAvatar(boardId, existing.id);
    return { ...existing, avatarKey };
  }

  const avatarKey = await nextBoardAvatarKey(
    prisma,
    boardId,
    `${boardId}:${OWNER_PARTICIPANT_NAME}`,
  );
  return prisma.participant.create({
    data: {
      boardId,
      displayName: OWNER_PARTICIPANT_NAME,
      avatarKey,
    },
    select: { id: true, displayName: true, avatarKey: true },
  });
}

/** Stable Owner participant ids for every board, creating missing rows. */
export async function ensureOwnerParticipantsForBoards(
  boardIds: string[],
): Promise<Map<string, string>> {
  const byBoard = new Map<string, string>();
  if (boardIds.length === 0) {
    return byBoard;
  }

  const existing = await prisma.participant.findMany({
    where: {
      boardId: { in: boardIds },
      displayName: {
        equals: OWNER_PARTICIPANT_NAME,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, boardId: true },
  });

  for (const row of existing) {
    if (!byBoard.has(row.boardId)) {
      byBoard.set(row.boardId, row.id);
    }
  }

  const missing = boardIds.filter((boardId) => !byBoard.has(boardId));
  if (missing.length === 0) {
    return byBoard;
  }

  await prisma.participant.createMany({
    data: missing.map((boardId) => ({
      boardId,
      displayName: OWNER_PARTICIPANT_NAME,
    })),
  });

  const created = await prisma.participant.findMany({
    where: {
      boardId: { in: missing },
      displayName: {
        equals: OWNER_PARTICIPANT_NAME,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, boardId: true },
  });

  for (const row of created) {
    if (!byBoard.has(row.boardId)) {
      byBoard.set(row.boardId, row.id);
    }
  }

  return byBoard;
}

/**
 * Participant session for this board, or env owner (get-or-create Owner participant).
 */
export async function requireBoardAccess(
  boardId: string,
): Promise<BoardAccess> {
  const owner = await getOwnerSession();
  if (owner) {
    const participant = await ensureOwnerParticipant(boardId);
    return {
      boardId,
      participantId: participant.id,
      displayName: participant.displayName,
      isOwner: true,
    };
  }

  const session = await getSession();
  if (!session || session.boardId !== boardId) {
    throw new Error("UNAUTHORIZED");
  }

  return { ...session, isOwner: false };
}

export async function canAccessBoard(boardId: string): Promise<boolean> {
  const owner = await getOwnerSession();
  if (owner) {
    return true;
  }
  const session = await getSession();
  return Boolean(session && session.boardId === boardId);
}
