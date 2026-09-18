import { describe, expect, it } from "vitest";
import { matchingAttentionCardIds } from "@/lib/attention-card-ids";
import type { BoardActivityMap } from "@/lib/board-activity";

const now = "2026-09-18T12:00:00.000Z";
const later = "2026-09-18T13:00:00.000Z";

const activity: BoardActivityMap = {
  unseen: {
    id: "clcardunseenxxxxxxxxxxxxxxxx",
    authorId: "clauthorotherxxxxxxxxxxxxxxx",
    createdAt: later,
    status: "new",
  },
  unread: {
    id: "clcardunreadxxxxxxxxxxxxxxxx",
    authorId: "clauthorotherxxxxxxxxxxxxxxx",
    createdAt: now,
    status: "in_progress",
    lastForeignCommentAt: later,
  },
  mine: {
    id: "clcardminexxxxxxxxxxxxxxxxxx",
    authorId: "clauthorcurrentxxxxxxxxxxxxx",
    createdAt: later,
    status: "new",
  },
};

describe("matchingAttentionCardIds", () => {
  it("returns unread and new cards, never own new tasks", () => {
    const reads = {
      "clcardunreadxxxxxxxxxxxxxxxx": now,
    };
    const seededAt = new Date(now);

    expect(
      matchingAttentionCardIds(
        activity,
        reads,
        seededAt,
        "clauthorcurrentxxxxxxxxxxxxx",
        ["unread", "new"],
      ).sort(),
    ).toEqual(["clcardunreadxxxxxxxxxxxxxxxx", "clcardunseenxxxxxxxxxxxxxxxx"].sort());
  });

  it("returns nothing until reads exist", () => {
    expect(
      matchingAttentionCardIds(
        activity,
        null,
        new Date(now),
        "clauthorcurrentxxxxxxxxxxxxx",
        ["unread"],
      ),
    ).toEqual([]);
  });
});
