import { describe, expect, it } from "vitest";
import {
  boardFilterChips,
  boardFiltersAreEmpty,
  buildCardListQuery,
  cardListQueryIsActive,
  cardListQuerySearchParams,
  EMPTY_BOARD_FILTERS,
  parseLocalDateInput,
  resolvePeriodRange,
} from "@/lib/card-query";
import {
  cardListWhere,
  cardMatchesListQuery,
  parseCardListQuery,
} from "@/lib/card-query-where";

const labelId = "cllabelxxxxxxxxxxxxxxxxxxxx";
const authorId = "clauthorxxxxxxxxxxxxxxxxxxx";
const cardId = "clcardxxxxxxxxxxxxxxxxxxxxx";
const boardId = "clboardxxxxxxxxxxxxxxxxxxxx";

describe("board card filters", () => {
  it("treats the empty filter as inactive", () => {
    expect(boardFiltersAreEmpty(EMPTY_BOARD_FILTERS)).toBe(true);
    expect(boardFilterChips(EMPTY_BOARD_FILTERS)).toEqual([]);
  });

  it("counts selected labels including unlabeled", () => {
    expect(
      boardFilterChips({
        ...EMPTY_BOARD_FILTERS,
        labelIds: [labelId, "cllabelyyyyyyyyyyyyyyyyyyyy"],
        unlabeled: true,
      }),
    ).toEqual([{ key: "label", count: 3 }]);
  });

  it("resolves today and last 5 local days", () => {
    const now = new Date(2026, 8, 18, 15, 30, 0);
    const today = resolvePeriodRange(
      { ...EMPTY_BOARD_FILTERS, period: "today" },
      now,
    );
    expect(today?.from).toEqual(new Date(2026, 8, 18, 0, 0, 0, 0));
    expect(today?.to).toEqual(new Date(2026, 8, 18, 23, 59, 59, 999));

    const last5 = resolvePeriodRange(
      { ...EMPTY_BOARD_FILTERS, period: "last5" },
      now,
    );
    expect(last5?.from).toEqual(new Date(2026, 8, 14, 0, 0, 0, 0));
    expect(last5?.to).toEqual(new Date(2026, 8, 18, 23, 59, 59, 999));
  });

  it("rejects invalid custom dates", () => {
    expect(parseLocalDateInput("2026-02-31")).toBeNull();
    expect(
      resolvePeriodRange({
        ...EMPTY_BOARD_FILTERS,
        period: "custom",
        customFrom: "2026-09-18",
        customTo: "",
      }),
    ).toBeNull();
  });
});

describe("card list query params", () => {
  it("round-trips search params", () => {
    const query = buildCardListQuery(
      " login ",
      {
        ...EMPTY_BOARD_FILTERS,
        labelIds: [labelId],
        unlabeled: true,
        authorIds: [authorId],
        urgent: true,
        hasFile: true,
      },
      [cardId],
    );
    const parsed = parseCardListQuery(cardListQuerySearchParams(query));
    expect(parsed?.text).toBe("login");
    expect(parsed?.labelIds).toEqual([labelId]);
    expect(parsed?.unlabeled).toBe(true);
    expect(parsed?.authorIds).toEqual([authorId]);
    expect(parsed?.urgent).toBe(true);
    expect(parsed?.hasFile).toBe(true);
    expect(parsed?.cardIds).toEqual([cardId]);
  });

  it("rejects a malformed label id", () => {
    expect(parseCardListQuery(new URLSearchParams("label=nope"))).toBeNull();
  });
});

describe("card list where and match", () => {
  it("nests text, labels, and inbox ids under AND", () => {
    const where = cardListWhere(
      boardId,
      "new",
      {
        text: "site",
        labelIds: [labelId],
        unlabeled: true,
        authorIds: [authorId],
        createdFrom: null,
        createdTo: null,
        urgent: true,
        hasFile: true,
        cardIds: [cardId],
      },
    );
    expect(where).toEqual({
      AND: expect.arrayContaining([
        { boardId },
        { status: "new" },
        { authorId: { in: [authorId] } },
        { urgent: true },
        { attachments: { some: { commentId: null } } },
        { id: { in: [cardId] } },
      ]),
    });
  });

  it("matches a local card against the resolved query", () => {
    const query = buildCardListQuery(
      "site",
      { ...EMPTY_BOARD_FILTERS, labelIds: [labelId], urgent: true },
      null,
    );
    expect(cardListQueryIsActive(query)).toBe(true);
    const card = {
      id: cardId,
      title: "Site visit",
      urgent: true,
      createdAt: new Date("2026-09-18T10:00:00.000Z"),
      attachmentCount: 0,
      author: { id: authorId, displayName: "Lina" },
      labels: [{ id: labelId, name: "Client" }],
    };
    expect(cardMatchesListQuery(card, query)).toBe(true);
    expect(cardMatchesListQuery({ ...card, urgent: false }, query)).toBe(false);
  });
});
