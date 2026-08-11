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
): Promise<{ id: string; displayName: string }> {
  const existing = await prisma.participant.findFirst({
    where: {
      boardId,
      displayName: {
        equals: OWNER_PARTICIPANT_NAME,
        mode: "insensitive",
      },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, displayName: true },
  });

  if (existing) {
    return existing;
  }

  return prisma.participant.create({
    data: {
      boardId,
      displayName: OWNER_PARTICIPANT_NAME,
    },
    select: { id: true, displayName: true },
  });
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
