import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH } from "@/lib/constants";
import { titleFromCommentBody } from "@/lib/comment-title";

describe("titleFromCommentBody", () => {
  it("uses the first line, trimmed to the title limit", () => {
    expect(titleFromCommentBody("Need a photo\nmore detail", "Photo")).toBe(
      "Need a photo",
    );
    expect(
      titleFromCommentBody(`${"A".repeat(MAX_TITLE_LENGTH + 10)}\nmore detail`, "Photo"),
    ).toBe("A".repeat(MAX_TITLE_LENGTH));
  });

  it("falls back when the body is too short", () => {
    expect(titleFromCommentBody(" ", "Voice note")).toBe("Voice note");
  });
});
