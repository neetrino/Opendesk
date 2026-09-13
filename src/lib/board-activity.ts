import { z } from "zod";

export const BOARD_ACTIVITY_POLL_MS = 8_000;
export const BOARDS_INBOX_POLL_MS = 15_000;

export const boardActivityCardSchema = z.object({
  id: z.string().cuid(),
  authorId: z.string().cuid(),
  createdAt: z.string().min(1),
  status: z.enum(["new", "in_progress", "answered", "done"]),
  lastForeignCommentAt: z.string().min(1).optional(),
});

export const boardActivityResponseSchema = z.object({
  cards: z.array(boardActivityCardSchema),
});

export type BoardActivityCard = z.infer<typeof boardActivityCardSchema>;

export type BoardActivityMap = Record<string, BoardActivityCard>;

export function activitySignature(cards: BoardActivityCard[]): string {
  return cards
    .map(
      (card) =>
        `${card.id}:${card.status}:${card.createdAt}:${card.lastForeignCommentAt ?? ""}`,
    )
    .sort()
    .join("|");
}

export const boardsInboxBoardSchema = z.object({
  id: z.string().cuid(),
  participantId: z.string().cuid(),
  cards: z.array(boardActivityCardSchema),
});

export const boardsInboxResponseSchema = z.object({
  boards: z.array(boardsInboxBoardSchema),
});

export type BoardsInboxBoard = z.infer<typeof boardsInboxBoardSchema>;

export function toBoardActivityMap(
  cards: BoardActivityCard[],
): BoardActivityMap {
  const next: BoardActivityMap = {};
  for (const card of cards) {
    next[card.id] = card;
  }
  return next;
}
