import { describe, expect, it } from "vitest";
import { findFirstUnreadCommentId } from "@/lib/thread-unread";

const me = "clmexxxxxxxxxxxxxxxxxxxxxxx";
const them = "clthemxxxxxxxxxxxxxxxxxxxxx";

describe("findFirstUnreadCommentId", () => {
  it("points at the first foreign comment after last-read", () => {
    const unread = findFirstUnreadCommentId(
      [
        {
          id: "c1",
          authorId: them,
          createdAt: new Date("2026-09-16T10:00:00.000Z"),
        },
        {
          id: "c2",
          authorId: me,
          createdAt: new Date("2026-09-16T11:00:00.000Z"),
        },
        {
          id: "c3",
          authorId: them,
          createdAt: new Date("2026-09-16T12:00:00.000Z"),
        },
      ],
      new Date("2026-09-16T10:30:00.000Z"),
      me,
    );
    expect(unread).toBe("c3");
  });

  it("returns null without a last-read cursor", () => {
    expect(
      findFirstUnreadCommentId(
        [{ id: "c1", authorId: them, createdAt: new Date() }],
        null,
        me,
      ),
    ).toBeNull();
  });
});
