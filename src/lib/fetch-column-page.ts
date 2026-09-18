"use client";

import {
  boardCardsResponseSchema,
  parseBoardCard,
} from "@/lib/board-card-view";
import {
  cardListQuerySearchParams,
  type CardListQuery,
} from "@/lib/card-query";
import type { CardStatus } from "@prisma/client";
import type { LocalBoardCard } from "@/lib/local-cards";

export async function fetchColumnPage(
  boardId: string,
  status: CardStatus,
  cursor: string | null,
  query: CardListQuery,
): Promise<{
  cards: LocalBoardCard[];
  nextCursor: string | null;
  totalCount: number | null;
}> {
  const params = cardListQuerySearchParams(query);
  params.set("status", status);
  if (cursor) {
    params.set("cursor", cursor);
  }
  const response = await fetch(`/api/boards/${boardId}/cards?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("loadCards");
  }

  const parsed = boardCardsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("loadCards");
  }

  const cards: LocalBoardCard[] = [];
  for (const raw of parsed.data.cards) {
    const card = parseBoardCard(raw);
    if (card) {
      cards.push(card);
    }
  }

  return {
    cards,
    nextCursor: parsed.data.nextCursor,
    totalCount: parsed.data.totalCount ?? null,
  };
}
