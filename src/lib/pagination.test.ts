import { describe, expect, it } from "vitest";
import { sliceLoadedPage, toIsoDate } from "@/lib/pagination";

describe("pagination", () => {
  it("keeps a full page and reports leftover rows", () => {
    expect(sliceLoadedPage([1, 2, 3], 2)).toEqual({
      items: [1, 2],
      hasMore: true,
    });
  });

  it("returns the original page when it fits", () => {
    expect(sliceLoadedPage(["a", "b"], 10)).toEqual({
      items: ["a", "b"],
      hasMore: false,
    });
  });

  it("serializes dates to ISO", () => {
    const date = new Date("2026-09-12T10:00:00.000Z");
    expect(toIsoDate(date)).toBe("2026-09-12T10:00:00.000Z");
    expect(toIsoDate("2026-09-12T10:00:00.000Z")).toBe(
      "2026-09-12T10:00:00.000Z",
    );
  });
});
