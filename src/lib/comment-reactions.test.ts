import { describe, expect, it } from "vitest";
import { toggleLocalReaction } from "@/lib/comment-reactions";

describe("toggleLocalReaction", () => {
  it("adds, then removes a solo reaction", () => {
    const added = toggleLocalReaction([], "question");
    expect(added).toEqual([
      { emoji: "question", count: 1, reactedByMe: true },
    ]);
    expect(toggleLocalReaction(added, "question")).toEqual([]);
  });
});
