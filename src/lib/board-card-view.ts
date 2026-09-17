import type { CardStatus } from "@prisma/client";
import { z } from "zod";
import { LABEL_COLOR_KEYS } from "@/lib/constants";
import type { LocalBoardCard } from "@/lib/local-cards";
import { toIsoDate } from "@/lib/pagination";

export type BoardColumnPageMeta = {
  nextCursor: string | null;
  totalCount: number;
};

export type BoardColumnPages = Record<CardStatus, BoardColumnPageMeta>;

export const boardCardJsonSchema = z.object({
  id: z.string().cuid(),
  boardId: z.string().cuid(),
  authorId: z.string().cuid(),
  status: z.enum(["new", "in_progress", "answered", "done"]),
  title: z.string(),
  urgent: z.boolean(),
  position: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  commentCount: z.number().int().nonnegative(),
  attachmentCount: z.number().int().nonnegative(),
  author: z.object({
    id: z.string().cuid(),
    boardId: z.string().cuid(),
    displayName: z.string(),
    avatarKey: z.string().nullable(),
    createdAt: z.string(),
  }),
  labels: z
    .array(
      z.object({
        id: z.string().cuid(),
        name: z.string(),
        color: z.enum(LABEL_COLOR_KEYS),
        position: z.number().int(),
      }),
    )
    .default([]),
});

export const boardCardsResponseSchema = z.object({
  cards: z.array(boardCardJsonSchema),
  nextCursor: z.string().nullable(),
});

export function encodeCardCursor(card: {
  position: number;
  id: string;
}): string {
  return `${card.position}:${card.id}`;
}

export function parseCardCursor(
  raw: string,
): { position: number; id: string } | null {
  const separator = raw.indexOf(":");
  if (separator <= 0) {
    return null;
  }

  const position = Number(raw.slice(0, separator));
  const id = raw.slice(separator + 1);
  if (!Number.isInteger(position) || position < 0) {
    return null;
  }
  if (!z.string().cuid().safeParse(id).success) {
    return null;
  }
  return { position, id };
}

export function afterCardCursor(cursor: { position: number; id: string }): {
  OR: Array<
    | { position: { gt: number } }
    | { AND: [{ position: number }, { id: { gt: string } }] }
  >;
} {
  return {
    OR: [
      { position: { gt: cursor.position } },
      { AND: [{ position: cursor.position }, { id: { gt: cursor.id } }] },
    ],
  };
}

export function serializeBoardCard(card: LocalBoardCard): z.infer<
  typeof boardCardJsonSchema
> {
  return {
    id: card.id,
    boardId: card.boardId,
    authorId: card.authorId,
    status: card.status,
    title: card.title,
    urgent: card.urgent,
    position: card.position,
    createdAt: toIsoDate(card.createdAt),
    updatedAt: toIsoDate(card.updatedAt),
    commentCount: card.commentCount,
    attachmentCount: card.attachmentCount,
    author: {
      id: card.author.id,
      boardId: card.author.boardId,
      displayName: card.author.displayName,
      avatarKey: card.author.avatarKey,
      createdAt: toIsoDate(card.author.createdAt),
    },
    labels: card.labels,
  };
}

export function parseBoardCard(raw: unknown): LocalBoardCard | null {
  const parsed = boardCardJsonSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }

  const card = parsed.data;
  return {
    ...card,
    pinnedCommentId: null,
    createdAt: new Date(card.createdAt),
    updatedAt: new Date(card.updatedAt),
    author: {
      ...card.author,
      createdAt: new Date(card.author.createdAt),
    },
    labels: card.labels,
  };
}

export function emptyColumnPages(): BoardColumnPages {
  return {
    new: { nextCursor: null, totalCount: 0 },
    in_progress: { nextCursor: null, totalCount: 0 },
    answered: { nextCursor: null, totalCount: 0 },
    done: { nextCursor: null, totalCount: 0 },
  };
}

export function columnDisplayCount(
  status: CardStatus,
  serverCount: number,
  sourceById: ReadonlyMap<string, CardStatus>,
  visible: ReadonlyArray<{ id: string; status: CardStatus }>,
): number {
  let delta = 0;
  for (const card of visible) {
    const source = sourceById.get(card.id);
    if (card.status === status && source !== status) {
      delta += 1;
    }
    if (source === status && card.status !== status) {
      delta -= 1;
    }
  }
  return Math.max(0, serverCount + delta);
}
