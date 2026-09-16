import "server-only";

import { pickFreeAvatar, type BoardAvatarMark } from "@/lib/board-avatars";
import { prisma } from "@/lib/prisma";

type AvatarReader = {
  participant: {
    findMany: (args: {
      where: { boardId: string; avatarKey: { not: null } };
      select: { avatarKey: true };
    }) => Promise<Array<{ avatarKey: string | null }>>;
  };
};

export async function nextBoardAvatarKey(
  db: AvatarReader,
  boardId: string,
  seed: string,
): Promise<BoardAvatarMark> {
  const rows = await db.participant.findMany({
    where: { boardId, avatarKey: { not: null } },
    select: { avatarKey: true },
  });
  return pickFreeAvatar(
    seed,
    rows.flatMap((row) => (row.avatarKey ? [row.avatarKey] : [])),
  );
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

export async function loadBoardParticipantIdentities(boardId: string) {
  return prisma.participant.findMany({
    where: { boardId },
    orderBy: { createdAt: "asc" },
    select: boardParticipantIdentitySelect,
  });
}

export async function ensureBoardAvatars(boardId: string): Promise<void> {
  const people = await prisma.participant.findMany({
    where: { boardId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, avatarKey: true },
  });
  const taken = new Set(
    people.flatMap((row) => (row.avatarKey ? [row.avatarKey] : [])),
  );
  for (const person of people) {
    if (person.avatarKey) {
      continue;
    }
    const mark = pickFreeAvatar(person.id, taken);
    taken.add(mark);
    await prisma.participant.update({
      where: { id: person.id },
      data: { avatarKey: mark },
    });
  }
}
