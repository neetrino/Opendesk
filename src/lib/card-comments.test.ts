import { describe, expect, it } from "vitest";
import {
  beforeCommentCursor,
  parseThreadComment,
  serializeThreadComment,
  type CardThreadComment,
} from "@/lib/card-comment-view";

const commentId = "clcommentxxxxxxxxxxxxxxxxxx";
const cardId = "clcardxxxxxxxxxxxxxxxxxxxxx";
const authorId = "clauthorxxxxxxxxxxxxxxxxxxx";
const boardId = "clboardxxxxxxxxxxxxxxxxxxxx";

const comment: CardThreadComment = {
  id: commentId,
  cardId,
  authorId,
  body: "Need a photo",
  createdAt: new Date("2026-09-12T11:00:00.000Z"),
  author: {
    id: authorId,
    boardId,
    displayName: "Anna",
    createdAt: new Date("2026-09-12T09:00:00.000Z"),
  },
  attachments: [],
};

describe("card comments", () => {
  it("asks for comments older than the current page", () => {
    const createdAt = new Date("2026-09-12T11:00:00.000Z");
    expect(beforeCommentCursor({ createdAt, id: commentId })).toEqual({
      OR: [
        { createdAt: { lt: createdAt } },
        { AND: [{ createdAt }, { id: { lt: commentId } }] },
      ],
    });
  });

  it("round-trips a thread comment", () => {
    expect(parseThreadComment(serializeThreadComment(comment))).toEqual(comment);
  });
});
