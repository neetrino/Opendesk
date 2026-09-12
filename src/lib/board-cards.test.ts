import { describe, expect, it } from "vitest";
import {
  afterCardCursor,
  columnDisplayCount,
  encodeCardCursor,
  parseBoardCard,
  parseCardCursor,
  serializeBoardCard,
} from "@/lib/board-card-view";
import type { LocalBoardCard } from "@/lib/local-cards";

const cardId = "clcardxxxxxxxxxxxxxxxxxxxxx";
const boardId = "clboardxxxxxxxxxxxxxxxxxxxx";
const authorId = "clauthorxxxxxxxxxxxxxxxxxxx";

const card: LocalBoardCard = {
  id: cardId,
  boardId,
  authorId,
  status: "new",
  title: "Need copy",
  urgent: false,
  position: 3,
  createdAt: new Date("2026-09-12T10:00:00.000Z"),
  updatedAt: new Date("2026-09-12T10:00:00.000Z"),
  commentCount: 4,
  attachmentCount: 1,
  author: {
    id: authorId,
    boardId,
    displayName: "Anna",
    createdAt: new Date("2026-09-12T09:00:00.000Z"),
  },
};

describe("board cards", () => {
  it("encodes and parses a column cursor", () => {
    const encoded = encodeCardCursor({ position: 12, id: cardId });
    expect(encoded).toBe(`12:${cardId}`);
    expect(parseCardCursor(encoded)).toEqual({ position: 12, id: cardId });
    expect(parseCardCursor("nope")).toBeNull();
    expect(parseCardCursor("12:not-a-cuid")).toBeNull();
  });

  it("builds a stable after-cursor filter", () => {
    expect(afterCardCursor({ position: 3, id: cardId })).toEqual({
      OR: [
        { position: { gt: 3 } },
        { AND: [{ position: 3 }, { id: { gt: cardId } }] },
      ],
    });
  });

  it("round-trips a list card without chat bodies", () => {
    const parsed = parseBoardCard(serializeBoardCard(card));
    expect(parsed).toEqual(card);
    expect(
      parsed && "comments" in parsed ? parsed.comments : undefined,
    ).toBeUndefined();
  });

  it("keeps unloaded cards in the column count across local moves", () => {
    const source = new Map<string, "new" | "done">([
      ["server-1", "new"],
      ["server-2", "new"],
    ]);
    const visible = [
      { id: "server-1", status: "done" as const },
      { id: "local-1", status: "new" as const },
    ];

    expect(columnDisplayCount("new", 12, source, visible)).toBe(12);
    expect(columnDisplayCount("done", 3, source, visible)).toBe(4);
  });
});
