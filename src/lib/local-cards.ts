import type { Card, CardStatus, Participant } from "@prisma/client";
import { sameLabelIds, type BoardLabelView } from "@/lib/labels";

export const LOCAL_CARD_ID_PREFIX = "local-";
export const OPTIMISTIC_COMMENT_ID_PREFIX = "optimistic-";

export function isOptimisticCommentId(commentId: string): boolean {
  return commentId.startsWith(OPTIMISTIC_COMMENT_ID_PREFIX);
}

export type BoardAttachment = {
  id: string;
  filename: string;
  contentType: string;
  byteSize: number;
  kind: "image" | "video" | "audio";
  createdAt: Date;
  commentId: string | null;
  authorId: string;
  previewUrl?: string;
};

export type LocalBoardCard = Card & {
  author: Participant;
  commentCount: number;
  attachmentCount: number;
  labels: BoardLabelView[];
};

export type OptimisticCommentAttachment = Pick<
  BoardAttachment,
  "id" | "filename" | "contentType" | "kind" | "byteSize"
> & {
  previewUrl?: string;
};

export type LocalCardAuthor = {
  participantId: string;
  displayName: string;
  avatarKey: string | null;
};

type BuildLocalCardInput = {
  boardId: string;
  status: CardStatus;
  title: string;
  urgent: boolean;
  author: LocalCardAuthor;
};

export function createLocalCardId(): string {
  return `${LOCAL_CARD_ID_PREFIX}${crypto.randomUUID()}`;
}

export function isLocalCardId(cardId: string): boolean {
  return cardId.startsWith(LOCAL_CARD_ID_PREFIX);
}

export function mergeLocalCards<T extends { id: string }>(
  serverCards: T[],
  localCards: T[],
): T[] {
  const serverIds = new Set(serverCards.map((card) => card.id));
  return [
    ...serverCards,
    ...localCards.filter((card) => !serverIds.has(card.id)),
  ];
}

export function pruneConfirmedLocalCards<T extends { id: string }>(
  serverCards: T[],
  localCards: T[],
): T[] {
  const serverIds = new Set(serverCards.map((card) => card.id));
  const next = localCards.filter((card) => !serverIds.has(card.id));
  return next.length === localCards.length ? localCards : next;
}

export function pruneConfirmedHeldCards<
  T extends {
    id: string;
    status: unknown;
    position: number;
    urgent?: boolean;
    commentCount?: number;
    labels?: { id: string }[];
  },
>(serverCards: T[], heldCards: T[]): T[] {
  if (heldCards.length === 0) {
    return heldCards;
  }

  const serverById = new Map(serverCards.map((card) => [card.id, card]));
  const next = heldCards.filter((held) => {
    const server = serverById.get(held.id);
    if (!server) {
      return true;
    }
    return (
      server.status !== held.status ||
      server.position !== held.position ||
      server.urgent !== held.urgent ||
      server.commentCount !== held.commentCount ||
      !sameLabelIds(server.labels ?? [], held.labels ?? [])
    );
  });
  return next.length === heldCards.length ? heldCards : next;
}

export function overlayHeldCards<T extends { id: string }>(
  cards: T[],
  heldCards: T[],
): T[] {
  if (heldCards.length === 0) {
    return cards;
  }

  const heldById = new Map(heldCards.map((card) => [card.id, card]));
  const seen = new Set<string>();
  const next: T[] = [];

  for (const card of cards) {
    const held = heldById.get(card.id);
    if (held) {
      next.push(held);
      seen.add(card.id);
    } else {
      next.push(card);
    }
  }

  for (const card of heldCards) {
    if (!seen.has(card.id)) {
      next.push(card);
    }
  }

  return next;
}

export function buildLocalBoardCard(input: BuildLocalCardInput): LocalBoardCard {
  const now = new Date();
  return {
    id: createLocalCardId(),
    boardId: input.boardId,
    authorId: input.author.participantId,
    status: input.status,
    title: input.title,
    urgent: input.urgent,
    position: Number.MAX_SAFE_INTEGER,
    pinnedCommentId: null,
    createdAt: now,
    updatedAt: now,
    author: {
      id: input.author.participantId,
      boardId: input.boardId,
      displayName: input.author.displayName,
      avatarKey: input.author.avatarKey,
      createdAt: now,
    },
    commentCount: 0,
    attachmentCount: 0,
    labels: [],
  };
}

export function toBoardCardFromCreated(
  created: Card,
  author: LocalCardAuthor,
): LocalBoardCard {
  const createdAt = new Date(created.createdAt);
  const updatedAt = new Date(created.updatedAt);

  return {
    ...created,
    createdAt,
    updatedAt,
    author: {
      id: author.participantId,
      boardId: created.boardId,
      displayName: author.displayName,
      avatarKey: author.avatarKey,
      createdAt,
    },
    commentCount: 0,
    attachmentCount: 0,
    labels: [],
  };
}

export function mergeVisibleCards<T extends { id: string }>(
  serverCards: T[],
  extraCards: T[],
  heldCards: T[],
  localCards: T[],
): T[] {
  return mergeLocalCards(
    overlayHeldCards(mergeLocalCards(serverCards, extraCards), heldCards),
    localCards,
  );
}
