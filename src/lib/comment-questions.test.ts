import { describe, expect, it } from "vitest";
import {
  mergeOpenQuestions,
  selectOpenQuestions,
} from "@/lib/comment-questions";

describe("selectOpenQuestions", () => {
  it("keeps a questioned message without a living reply", () => {
    const open = selectOpenQuestions(
      [
        { id: "q1", hasQuestion: true, deleted: false },
        { id: "q2", hasQuestion: true, deleted: false },
      ],
      [{ parentId: "q1", deleted: false }],
    );
    expect(open.map((item) => item.id)).toEqual(["q2"]);
  });

  it("ignores deleted replies and deleted questions", () => {
    const open = selectOpenQuestions(
      [
        { id: "q1", hasQuestion: true, deleted: true },
        { id: "q2", hasQuestion: true, deleted: false },
      ],
      [{ parentId: "q2", deleted: true }],
    );
    expect(open.map((item) => item.id)).toEqual(["q2"]);
  });
});

describe("mergeOpenQuestions", () => {
  it("keeps a server question that is not in the loaded window", () => {
    const merged = mergeOpenQuestions(
      [{ id: "q-old", authorName: "Ada", excerpt: "blocked?" }],
      [
        {
          id: "c1",
          deleted: false,
          authorName: "Ada",
          excerpt: "ok",
          hasQuestion: false,
          replyToId: null,
        },
      ],
    );
    expect(merged.map((item) => item.id)).toEqual(["q-old"]);
  });

  it("closes a loaded question after a reply and opens a new one", () => {
    const merged = mergeOpenQuestions(
      [{ id: "q1", authorName: "Ada", excerpt: "why?" }],
      [
        {
          id: "q1",
          deleted: false,
          authorName: "Ada",
          excerpt: "why?",
          hasQuestion: true,
          replyToId: null,
        },
        {
          id: "r1",
          deleted: false,
          authorName: "Bob",
          excerpt: "because",
          hasQuestion: false,
          replyToId: "q1",
        },
        {
          id: "q2",
          deleted: false,
          authorName: "Ada",
          excerpt: "and this?",
          hasQuestion: true,
          replyToId: null,
        },
      ],
    );
    expect(merged.map((item) => item.id)).toEqual(["q2"]);
  });
});
