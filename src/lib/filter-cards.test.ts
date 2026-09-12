import { describe, expect, it } from "vitest";
import { filterCardsByQuery } from "@/lib/filter-cards";

const cards = [
  { title: "Fix login timeout", author: { displayName: "Anna" } },
  { title: "Update sprint board", author: { displayName: "Owner" } },
  { title: "Հանդիպում", author: { displayName: "Արամ" } },
];

describe("filterCardsByQuery", () => {
  it("returns every card when the query is empty or whitespace", () => {
    expect(filterCardsByQuery(cards, "")).toEqual(cards);
    expect(filterCardsByQuery(cards, "  ")).toEqual(cards);
  });

  it("matches title case-insensitively", () => {
    expect(filterCardsByQuery(cards, "login")).toEqual([cards[0]]);
    expect(filterCardsByQuery(cards, "SPRINT")).toEqual([cards[1]]);
  });

  it("matches author name", () => {
    expect(filterCardsByQuery(cards, "anna")).toEqual([cards[0]]);
  });

  it("matches non-latin titles", () => {
    expect(filterCardsByQuery(cards, "հանդ")).toEqual([cards[2]]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterCardsByQuery(cards, "missing")).toEqual([]);
  });
});
