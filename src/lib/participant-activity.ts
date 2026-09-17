import type { Prisma } from "@prisma/client";
import { isBoardAvatarMark } from "@/lib/board-avatars";
import {
  MAX_BOARD_PARTICIPANTS,
  OWNER_PARTICIPANT_NAME,
  PARTICIPANT_ACTIVE_WINDOW_DAYS,
  PARTICIPANT_LAST_SEEN_TOUCH_MS,
} from "@/lib/constants";

export type ParticipantActivity = {
  displayName: string;
  lastSeenAt: Date;
};

export type JoinParticipantDecision = "rejoin" | "create" | "full";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function isAlwaysActiveDisplayName(displayName: string): boolean {
  return (
    displayName.toLocaleLowerCase() ===
    OWNER_PARTICIPANT_NAME.toLocaleLowerCase()
  );
}

export function participantActiveSince(now: Date = new Date()): Date {
  return new Date(
    now.getTime() - PARTICIPANT_ACTIVE_WINDOW_DAYS * MS_PER_DAY,
  );
}

export function isActiveParticipant(
  participant: ParticipantActivity,
  now: Date = new Date(),
): boolean {
  if (isAlwaysActiveDisplayName(participant.displayName)) {
    return true;
  }
  return participant.lastSeenAt.getTime() >= participantActiveSince(now).getTime();
}

/** Nested Participant filter: Owner, recently seen, or an explicit id. */
export function visibleParticipantFilter(
  includeId?: string,
  now: Date = new Date(),
): Prisma.ParticipantWhereInput {
  const clauses: Prisma.ParticipantWhereInput[] = [
    {
      displayName: {
        equals: OWNER_PARTICIPANT_NAME,
        mode: "insensitive",
      },
    },
    { lastSeenAt: { gte: participantActiveSince(now) } },
  ];
  if (includeId) {
    clauses.unshift({ id: includeId });
  }
  return { OR: clauses };
}

export function activeParticipantWhere(
  boardId: string,
  now: Date = new Date(),
): Prisma.ParticipantWhereInput {
  return {
    boardId,
    ...visibleParticipantFilter(undefined, now),
  };
}

export function decideJoinParticipantSlot(
  hasExisting: boolean,
  activeCount: number,
  max = MAX_BOARD_PARTICIPANTS,
): JoinParticipantDecision {
  if (hasExisting) {
    return "rejoin";
  }
  if (activeCount >= max) {
    return "full";
  }
  return "create";
}

export type ReclaimableAvatarHolder = {
  id: string;
  displayName: string;
  lastSeenAt: Date;
  createdAt: Date;
  avatarKey: string | null;
};

/** Oldest idle non-owner sticker, so a new joiner can reuse the mark. */
export function pickReclaimableAvatar(
  people: readonly ReclaimableAvatarHolder[],
  now: Date = new Date(),
): ReclaimableAvatarHolder | null {
  const eligible = people.filter(
    (person) =>
      Boolean(person.avatarKey) &&
      isBoardAvatarMark(person.avatarKey) &&
      !isAlwaysActiveDisplayName(person.displayName) &&
      !isActiveParticipant(person, now),
  );
  eligible.sort((left, right) => {
    const seen = left.lastSeenAt.getTime() - right.lastSeenAt.getTime();
    if (seen !== 0) {
      return seen;
    }
    return left.createdAt.getTime() - right.createdAt.getTime();
  });
  return eligible[0] ?? null;
}

type LastSeenWriter = {
  participant: {
    updateMany: (args: {
      where: { id: string; lastSeenAt: { lt: Date } };
      data: { lastSeenAt: Date };
    }) => Promise<unknown>;
  };
};

/** Write lastSeenAt only when the stored value is older than the throttle. */
export async function touchParticipantLastSeen(
  db: LastSeenWriter,
  participantId: string,
  now: Date = new Date(),
): Promise<void> {
  const staleBefore = new Date(now.getTime() - PARTICIPANT_LAST_SEEN_TOUCH_MS);
  await db.participant.updateMany({
    where: {
      id: participantId,
      lastSeenAt: { lt: staleBefore },
    },
    data: { lastSeenAt: now },
  });
}
