import type { Card, CardStatus, CardType, Comment, Participant } from "@prisma/client";

export const LOCAL_CARD_ID_PREFIX = "local-";

export type LocalBoardCard = Card & {
  author: Participant;
  comments: Array<Comment & { author: Participant }>;
};

export type LocalCardAuthor = {
  participantId: string;
  displayName: string;
};

type BuildLocalCardInput = {
  boardId: string;
  status: CardStatus;
  type: CardType;
  title: string;
  description: string;
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

export function buildLocalBoardCard(input: BuildLocalCardInput): LocalBoardCard {
  const now = new Date();
  return {
    id: createLocalCardId(),
    boardId: input.boardId,
    authorId: input.author.participantId,
    type: input.type,
    status: input.status,
    title: input.title,
    description: input.description,
    urgent: input.urgent,
    position: Number.MAX_SAFE_INTEGER,
    createdAt: now,
    updatedAt: now,
    author: {
      id: input.author.participantId,
      boardId: input.boardId,
      displayName: input.author.displayName,
      createdAt: now,
    },
    comments: [],
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
      createdAt,
    },
    comments: [],
  };
}
