import { describe, expect, it } from "vitest";
import {
  activitySignature,
  boardActivityResponseSchema,
  toBoardActivityMap,
} from "@/lib/board-activity";

const cardA = {
  id: "clcardaxxxxxxxxxxxxxxxxxxxxx",
  authorId: "clauthorxxxxxxxxxxxxxxxxxxx",
  createdAt: "2026-09-12T09:00:00.000Z",
  status: "new" as const,
  lastForeignCommentAt: "2026-09-12T10:00:00.000Z",
};
const cardB = {
  id: "clcardbxxxxxxxxxxxxxxxxxxxxx",
  authorId: "clauthorxxxxxxxxxxxxxxxxxxx",
  createdAt: "2026-09-12T09:30:00.000Z",
  status: "in_progress" as const,
  lastForeignCommentAt: "2026-09-12T11:00:00.000Z",
};

describe("board activity", () => {
  it("accepts a valid activity payload", () => {
    const parsed = boardActivityResponseSchema.safeParse({
      cards: [cardA, cardB],
    });
    expect(parsed.success).toBe(true);
  });

  it("accepts cards without foreign comments", () => {
    const parsed = boardActivityResponseSchema.safeParse({
      cards: [
        {
          id: cardA.id,
          authorId: cardA.authorId,
          createdAt: cardA.createdAt,
          status: "new",
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an invalid activity payload", () => {
    expect(
      boardActivityResponseSchema.safeParse({ cards: [{ id: "nope" }] })
        .success,
    ).toBe(false);
  });

  it("compares activity independently of card order", () => {
    expect(activitySignature([cardA, cardB])).toBe(
      activitySignature([cardB, cardA]),
    );
    expect(activitySignature([cardA])).not.toBe(activitySignature([cardB]));
  });

  it("indexes cards by id", () => {
    expect(toBoardActivityMap([cardA, cardB])[cardA.id]).toEqual(cardA);
  });
});
