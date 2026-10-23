import "server-only";

import { Prisma } from "@prisma/client";
import {
  AVATAR_POOL_EXHAUSTED,
  nextBoardAvatarKey,
} from "@/lib/assign-board-avatars";
import {
  decideAccountDisplayName,
  decideGuestNameJoin,
} from "@/lib/account-link";
import {
  activeParticipantWhere,
  decideJoinParticipantSlot,
} from "@/lib/participant-activity";
import { prisma } from "@/lib/prisma";

export type JoinedSeat = {
  participant: { id: string; displayName: string };
  user: { id: string; sessionVersion: number } | null;
};

type JoinBoardByNameInput = {
  boardId: string;
  displayName: string;
  /** Logged-in account taking a new seat. Never attaches a stranger's guest row. */
  accountUserId: string | null;
  register: { email: string; passwordHash: string } | null;
  /** One-time invite claimed in the same transaction as the seat. */
  inviteId?: string;
};

export function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

/**
 * Guest rejoin, guest register, or an account's own new seat.
 * Linking uses `userId IS NULL` so two requests cannot take one row.
 */
export async function joinBoardByName(
  input: JoinBoardByNameInput,
): Promise<JoinedSeat> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.participant.findFirst({
        where: {
          boardId: input.boardId,
          displayName: { equals: input.displayName, mode: "insensitive" },
        },
        orderBy: { createdAt: "asc" },
      });

      if (input.accountUserId) {
        const ownSeat = await tx.participant.findFirst({
          where: { boardId: input.boardId, userId: input.accountUserId },
          select: { id: true, displayName: true },
        });
        if (ownSeat) {
          return { participant: ownSeat, user: null };
        }
        if (decideAccountDisplayName(existing ? { userId: existing.userId } : null) === "taken") {
          throw new Error("NAME_TAKEN");
        }
      } else if (decideGuestNameJoin(existing ? { userId: existing.userId } : null) === "claimed") {
        throw new Error("NAME_CLAIMED");
      }

      const rejoining =
        !input.accountUserId &&
        existing !== null &&
        existing.userId === null;

      let participant: { id: string; displayName: string };
      if (rejoining && existing) {
        const avatarKey =
          existing.avatarKey ??
          (await nextBoardAvatarKey(tx, input.boardId, existing.id));
        await tx.participant.update({
          where: { id: existing.id },
          data: { lastSeenAt: new Date(), avatarKey },
        });
        participant = { id: existing.id, displayName: existing.displayName };
      } else {
        const activeCount = await tx.participant.count({
          where: activeParticipantWhere(input.boardId),
        });
        if (decideJoinParticipantSlot(false, activeCount) === "full") {
          throw new Error("BOARD_FULL");
        }
        const avatarKey = await nextBoardAvatarKey(
          tx,
          input.boardId,
          `${input.boardId}:${input.displayName}`,
        );
        const created = await tx.participant.create({
          data: {
            boardId: input.boardId,
            displayName: input.displayName,
            avatarKey,
            userId: input.accountUserId,
          },
          select: { id: true, displayName: true },
        });
        participant = created;
      }

      if (!input.register && !input.inviteId) {
        return { participant, user: null };
      }

      let user: { id: string; sessionVersion: number } | null = null;
      if (input.register) {
        user = await tx.user.create({
          data: {
            email: input.register.email,
            passwordHash: input.register.passwordHash,
            displayName: input.displayName,
            role: "member",
          },
          select: { id: true, sessionVersion: true },
        });
        const linked = await tx.participant.updateMany({
          where: { id: participant.id, userId: null },
          data: { userId: user.id },
        });
        if (linked.count !== 1) {
          throw new Error("NAME_CLAIMED");
        }
      }

      if (input.inviteId) {
        const claimed = await tx.invite.updateMany({
          where: { id: input.inviteId, claimedAt: null, participantId: null },
          data: { claimedAt: new Date(), participantId: participant.id },
        });
        if (claimed.count !== 1) {
          throw new Error("INVITE_CLAIM_CONFLICT");
        }
      }

      return { participant, user };
    });
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new Error(input.register ? "EMAIL_TAKEN" : "NAME_TAKEN");
    }
    throw error;
  }
}

export { AVATAR_POOL_EXHAUSTED };
