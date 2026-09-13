import { describe, expect, it } from "vitest";
import {
  applyForeignActivity,
  countBoardInbox,
  isUnseenCard,
  lastReadDate,
  markCardsRead,
  parseCardReadState,
  resolveLastReadAt,
  resolveSeededAt,
  seedCardReads,
  getClientCardReads,
  cardReadStorageKey,
  countUnreadComments,
} from "@/lib/card-reads";

const me = "cluserxxxxxxxxxxxxxxxxxxxxxx";
const other = "clotherxxxxxxxxxxxxxxxxxxxx";

describe("card reads", () => {
  it("builds a stable per-board storage key", () => {
    expect(cardReadStorageKey("board-1", "user-1")).toBe(
      "opendesk.cardReads.v1.board-1.user-1",
    );
  });

  it("rejects empty or malformed stored state", () => {
    expect(parseCardReadState(null)).toBeNull();
    expect(parseCardReadState("")).toBeNull();
    expect(parseCardReadState("{")).toBeNull();
    expect(parseCardReadState(JSON.stringify({ version: 2, reads: {} }))).toBe(
      null,
    );
    expect(parseCardReadState(JSON.stringify({ version: 1, reads: [] }))).toBe(
      null,
    );
  });

  it("keeps only valid ISO timestamps", () => {
    const parsed = parseCardReadState(
      JSON.stringify({
        version: 1,
        reads: {
          "card-1": "2026-09-12T10:00:00.000Z",
          "card-2": "not-a-date",
          "card-3": 12,
        },
      }),
    );

    expect(parsed).toEqual({
      version: 1,
      reads: { "card-1": "2026-09-12T10:00:00.000Z" },
    });
  });

  it("seeds existing server cards as already read", () => {
    const readAt = new Date("2026-09-12T12:00:00.000Z");
    const seeded = seedCardReads(
      ["card-1", "local-abc", "card-2"],
      readAt,
    );

    expect(seeded.reads["card-1"]).toBe(readAt.toISOString());
    expect(seeded.reads["card-2"]).toBe(readAt.toISOString());
    expect(seeded.reads["local-abc"]).toBeUndefined();
  });

  it("counts only later comments from other people", () => {
    const lastReadAt = new Date("2026-09-12T10:00:00.000Z");
    const comments = [
      { authorId: other, createdAt: "2026-09-12T09:00:00.000Z" },
      { authorId: other, createdAt: "2026-09-12T11:00:00.000Z" },
      { authorId: me, createdAt: "2026-09-12T11:30:00.000Z" },
    ];

    expect(countUnreadComments(comments, lastReadAt, me)).toBe(1);
    expect(countUnreadComments(comments, null, me)).toBe(2);
    expect(countUnreadComments(comments, lastReadAt, other)).toBe(1);
  });

  it("reads a stored last-read timestamp", () => {
    expect(
      lastReadDate({ "card-1": "2026-09-12T10:00:00.000Z" }, "card-1")?.toISOString(),
    ).toBe("2026-09-12T10:00:00.000Z");
    expect(lastReadDate({ "card-1": "nope" }, "card-1")).toBeNull();
    expect(lastReadDate({}, "card-1")).toBeNull();
  });

  it("uses the first-visit seed for cards that are not loaded yet", () => {
    const seededAt = new Date("2026-09-12T08:00:00.000Z");
    expect(
      resolveLastReadAt(
        { "card-1": "2026-09-12T10:00:00.000Z" },
        "card-1",
        seededAt,
      )?.toISOString(),
    ).toBe("2026-09-12T10:00:00.000Z");
    expect(
      resolveLastReadAt({}, "card-unloaded", seededAt)?.toISOString(),
    ).toBe(seededAt.toISOString());
    expect(
      resolveSeededAt({
        version: 1,
        reads: {
          "card-2": "2026-09-12T12:00:00.000Z",
          "card-1": "2026-09-12T10:00:00.000Z",
        },
      })?.toISOString(),
    ).toBe("2026-09-12T10:00:00.000Z");
  });

  it("returns a stable client snapshot after seeding", () => {
    const first = getClientCardReads("board-stable", "user-stable", ["card-1"]);
    const second = getClientCardReads("board-stable", "user-stable", ["card-1"]);
    expect(second).toBe(first);
    expect(first["card-1"]).toEqual(expect.any(String));
  });

  it("keeps a badge when activity is newer than the last read", () => {
    const lastReadAt = new Date("2026-09-12T10:00:00.000Z");

    expect(
      applyForeignActivity(0, lastReadAt, "2026-09-12T11:00:00.000Z"),
    ).toBe(1);
    expect(
      applyForeignActivity(3, lastReadAt, "2026-09-12T11:00:00.000Z"),
    ).toBe(3);
    expect(
      applyForeignActivity(0, lastReadAt, "2026-09-12T09:00:00.000Z"),
    ).toBe(0);
    expect(applyForeignActivity(0, null, "2026-09-12T11:00:00.000Z")).toBe(1);
    expect(applyForeignActivity(0, lastReadAt, "nope")).toBe(0);
  });

  it("treats later foreign cards as unseen until opened", () => {
    const seededAt = new Date("2026-09-12T08:00:00.000Z");
    const reads = { "card-old": "2026-09-12T08:00:00.000Z" };

    expect(
      isUnseenCard(
        {
          id: "card-new",
          authorId: other,
          createdAt: "2026-09-12T09:00:00.000Z",
        },
        reads,
        seededAt,
        me,
      ),
    ).toBe(true);
    expect(
      isUnseenCard(
        {
          id: "card-new",
          authorId: me,
          createdAt: "2026-09-12T09:00:00.000Z",
        },
        reads,
        seededAt,
        me,
      ),
    ).toBe(false);
    expect(
      isUnseenCard(
        {
          id: "card-old",
          authorId: other,
          createdAt: "2026-09-12T07:00:00.000Z",
        },
        reads,
        seededAt,
        me,
      ),
    ).toBe(false);
    expect(
      isUnseenCard(
        {
          id: "local-abc",
          authorId: other,
          createdAt: "2026-09-12T09:00:00.000Z",
        },
        reads,
        seededAt,
        me,
      ),
    ).toBe(false);
  });

  it("counts new tasks and unread message cards separately", () => {
    const seededAt = new Date("2026-09-12T08:00:00.000Z");
    const reads = { "card-old": "2026-09-12T08:00:00.000Z" };

    expect(
      countBoardInbox(
        [
          {
            id: "card-new",
            authorId: other,
            createdAt: "2026-09-12T09:00:00.000Z",
          },
          {
            id: "card-chat",
            authorId: other,
            createdAt: "2026-09-12T07:00:00.000Z",
            lastForeignCommentAt: "2026-09-12T11:00:00.000Z",
          },
        ],
        reads,
        seededAt,
        me,
      ),
    ).toEqual({ newTasks: 1, newMessages: 1 });
  });

  it("marks every server card read and refreshes the seed", () => {
    const boardId = "board-mark-all";
    const userId = "user-mark-all";
    markCardsRead(
      boardId,
      userId,
      ["card-1", "local-skip", "card-2"],
      new Date("2026-09-13T12:00:00.000Z"),
    );

    const reads = getClientCardReads(boardId, userId, ["card-1", "card-2"]);
    expect(reads["card-1"]).toBe("2026-09-13T12:00:00.000Z");
    expect(reads["card-2"]).toBe("2026-09-13T12:00:00.000Z");
    expect(reads["local-skip"]).toBeUndefined();
  });
});
