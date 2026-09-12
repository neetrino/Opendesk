import { describe, expect, it } from "vitest";
import { filterBoardsByQuery } from "@/lib/filter-boards";

const boards = [
  { title: "Sprint Q3", slug: "sprint-q3" },
  { title: "Обсуждения проекта", slug: "obsuzhdeniya-proekta" },
  { title: "Նախագիծ", slug: "nakhagits" },
];

describe("filterBoardsByQuery", () => {
  it("returns every board when the query is empty or whitespace", () => {
    expect(filterBoardsByQuery(boards, "")).toEqual(boards);
    expect(filterBoardsByQuery(boards, "   ")).toEqual(boards);
  });

  it("matches title case-insensitively", () => {
    expect(filterBoardsByQuery(boards, "sprint")).toEqual([boards[0]]);
    expect(filterBoardsByQuery(boards, "Q3")).toEqual([boards[0]]);
  });

  it("matches slug when the title does not", () => {
    expect(filterBoardsByQuery(boards, "obsuzhdeniya")).toEqual([boards[1]]);
  });

  it("matches non-latin titles", () => {
    expect(filterBoardsByQuery(boards, "проект")).toEqual([boards[1]]);
    expect(filterBoardsByQuery(boards, "Նախա")).toEqual([boards[2]]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterBoardsByQuery(boards, "missing")).toEqual([]);
  });
});
