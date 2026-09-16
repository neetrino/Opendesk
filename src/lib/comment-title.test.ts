import { describe, expect, it } from "vitest";
import { titleFromCommentBody } from "@/lib/comment-title";

describe("titleFromCommentBody", () => {
  it("uses the first line, trimmed to 120 chars", () => {
    expect(titleFromCommentBody("Need a photo\nmore detail", "Photo")).toBe(
      "Need a photo",
    );
  });

  it("falls back when the body is too short", () => {
    expect(titleFromCommentBody(" ", "Voice note")).toBe("Voice note");
  });
});
