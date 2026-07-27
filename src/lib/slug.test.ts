import { describe, expect, it } from "vitest";
import { slugifyTitle, withSlugSuffix } from "@/lib/slug";

describe("slugifyTitle", () => {
  it("turns a latin title into a kebab slug", () => {
    expect(slugifyTitle("Sprint Q3")).toBe("sprint-q3");
  });

  it("falls back when title has no letters or digits", () => {
    expect(slugifyTitle("!!!")).toBe("board");
  });

  it("keeps letters from other scripts", () => {
    expect(slugifyTitle("Обсуждения проекта")).toBe("обсуждения-проекта");
  });
});

describe("withSlugSuffix", () => {
  it("appends a uniqueness suffix", () => {
    expect(withSlugSuffix("sprint", "a1b2")).toBe("sprint-a1b2");
  });
});
