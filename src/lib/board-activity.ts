import { z } from "zod";

export const BOARD_ACTIVITY_POLL_MS = 8_000;

export const boardActivityCardSchema = z.object({
  id: z.string().cuid(),
  lastForeignCommentAt: z.string().min(1),
});

export const boardActivityResponseSchema = z.object({
  cards: z.array(boardActivityCardSchema),
});

export type BoardActivityCard = z.infer<typeof boardActivityCardSchema>;

export type BoardActivityMap = Record<string, BoardActivityCard>;

export function activitySignature(cards: BoardActivityCard[]): string {
  return cards
    .map((card) => `${card.id}:${card.lastForeignCommentAt}`)
    .sort()
    .join("|");
}

export function toBoardActivityMap(
  cards: BoardActivityCard[],
): BoardActivityMap {
  const next: BoardActivityMap = {};
  for (const card of cards) {
    next[card.id] = card;
  }
  return next;
}
