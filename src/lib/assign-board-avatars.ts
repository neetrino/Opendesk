import "server-only";

import {
  hasFreeAvatar,
  isBoardAvatarMark,
  pickFreeAvatar,
  type BoardAvatarMark,
} from "@/lib/board-avatars";
import {
  pickReclaimableAvatar,
  visibleParticipantFilter,
} from "@/lib/participant-activity";
import { prisma } from "@/lib/prisma";

export const AVATAR_POOL_EXHAUSTED = "AVATAR_POOL_EXHAUSTED";
const AVATAR_CLAIM_ATTEMPTS = 3;

type AvatarStore = {
  participant: {
    findMany: (args: {
      where: {
        boardId: string;
        avatarKey?: { not: null };
      };
      select: {
        id?: true;
        displayName?: true;
        lastSeenAt?: true;
        createdAt?: true;
        avatarKey: true;
      };
    }) => Promise<
      Array<{
        id?: string;
        displayName?: string;
        lastSeenAt?: Date;
        createdAt?: Date;
        avatarKey: string | null;
      }>
    >;
    update: (args: {
      where: { id: string };
      data: { avatarKey: string | null };
    }) => Promise<unknown>;
    updateMany: (args: {
      where: { id: string; avatarKey: string };
      data: { avatarKey: null };
    }) => Promise<{ count: number }>;
  };
};

export async function nextBoardAvatarKey(
  db: AvatarStore,
  boardId: string,
  seed: string,
): Promise<BoardAvatarMark> {
  for (let attempt = 0; attempt < AVATAR_CLAIM_ATTEMPTS; attempt += 1) {
    const taken = await loadTakenAvatarKeys(db, boardId);
    if (hasFreeAvatar(taken)) {
      return pickFreeAvatar(seed, taken);
    }
    const reclaimed = await reclaimInactiveAvatar(db, boardId);
    if (reclaimed === "lost") {
      continue;
    }
    if (reclaimed) {
      return reclaimed;
    }
    break;
  }
  throw new Error(AVATAR_POOL_EXHAUSTED);
}

async function loadTakenAvatarKeys(
  db: AvatarStore,
  boardId: string,
): Promise<string[]> {
  const rows = await db.participant.findMany({
    where: { boardId, avatarKey: { not: null } },
    select: { avatarKey: true },
  });
  return rows.flatMap((row) => (row.avatarKey ? [row.avatarKey] : []));
}

async function reclaimInactiveAvatar(
  db: AvatarStore,
  boardId: string,
): Promise<BoardAvatarMark | "lost" | null> {
  const holders = await db.participant.findMany({
    where: { boardId, avatarKey: { not: null } },
    select: {
      id: true,
      displayName: true,
      lastSeenAt: true,
      createdAt: true,
      avatarKey: true,
    },
  });
  const chosen = pickReclaimableAvatar(
    holders.flatMap((row) =>
      row.id && row.displayName && row.lastSeenAt && row.createdAt
        ? [
            {
              id: row.id,
              displayName: row.displayName,
              lastSeenAt: row.lastSeenAt,
              createdAt: row.createdAt,
              avatarKey: row.avatarKey,
            },
          ]
        : [],
    ),
  );
  if (!chosen || !isBoardAvatarMark(chosen.avatarKey)) {
    return null;
  }
  const released = await db.participant.updateMany({
    where: { id: chosen.id, avatarKey: chosen.avatarKey },
    data: { avatarKey: null },
  });
  return released.count === 1 ? chosen.avatarKey : "lost";
}

export async function assignBoardAvatar(
  boardId: string,
  participantId: string,
): Promise<BoardAvatarMark> {
  const mark = await nextBoardAvatarKey(prisma, boardId, participantId);
  await prisma.participant.update({
    where: { id: participantId },
    data: { avatarKey: mark },
  });
  return mark;
}

export const boardParticipantIdentitySelect = {
  id: true,
  displayName: true,
  avatarKey: true,
  createdAt: true,
} as const;

export async function loadBoardParticipantIdentities(
  boardId: string,
  includeId?: string,
) {
  return prisma.participant.findMany({
    where: {
      boardId,
      ...visibleParticipantFilter(includeId),
    },
    orderBy: { createdAt: "asc" },
    select: boardParticipantIdentitySelect,
  });
}

export async function ensureBoardAvatars(boardId: string): Promise<void> {
  const people = await prisma.participant.findMany({
    where: {
      boardId,
      ...visibleParticipantFilter(),
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, avatarKey: true },
  });
  const takenRows = await prisma.participant.findMany({
    where: { boardId, avatarKey: { not: null } },
    select: { avatarKey: true },
  });
  const taken = new Set(
    takenRows.flatMap((row) => (row.avatarKey ? [row.avatarKey] : [])),
  );
  for (const person of people) {
    if (person.avatarKey) {
      continue;
    }
    const mark = hasFreeAvatar(taken)
      ? pickFreeAvatar(person.id, taken)
      : await nextBoardAvatarKey(prisma, boardId, person.id);
    taken.add(mark);
    await prisma.participant.update({
      where: { id: person.id },
      data: { avatarKey: mark },
    });
  }
}
