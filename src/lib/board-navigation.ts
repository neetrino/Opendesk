import "server-only";

import { cookies } from "next/headers";
import { LAST_BOARD_COOKIE_NAME } from "@/lib/constants";
import { buildJoinPath, parseJoinPath } from "@/lib/join-url";
import { touchParticipantLastSeen } from "@/lib/participant-activity";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export type ParticipantBoardDestination = {
  boardId: string;
  participantId: string;
  displayName: string;
  path: string;
};

/**
 * Resolve the only board available to the current participant. The database
 * lookup prevents a stale or forged navigation hint from becoming access.
 */
export async function getParticipantBoardDestination(): Promise<ParticipantBoardDestination | null> {
  const session = await getSession();
  if (!session) {
    return null;
  }

  const participant = await prisma.participant.findFirst({
    where: {
      id: session.participantId,
      boardId: session.boardId,
    },
    select: {
      id: true,
      displayName: true,
      board: {
        select: {
          id: true,
          slug: true,
          joinToken: true,
        },
      },
    },
  });

  if (!participant) {
    return null;
  }

  await touchParticipantLastSeen(prisma, participant.id);

  return {
    boardId: participant.board.id,
    participantId: participant.id,
    displayName: participant.displayName,
    path: buildJoinPath(participant.board.slug, participant.board.joinToken),
  };
}

/**
 * Resolve an owner's remembered canonical path. This is only a navigation hint:
 * the destination route still validates that the board exists and that the
 * owner session grants access.
 */
export async function getRememberedOwnerBoardPath(): Promise<string | null> {
  const cookieStore = await cookies();
  const rememberedPath = cookieStore.get(LAST_BOARD_COOKIE_NAME)?.value;
  if (!rememberedPath) {
    return null;
  }

  const parsed = parseJoinPath(rememberedPath);
  if (!parsed) {
    return null;
  }

  return buildJoinPath(parsed.slug, parsed.joinToken);
}
