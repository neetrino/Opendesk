import { describe, expect, it } from "vitest";
import type { CardStatus } from "@prisma/client";
import {
  applyCardMove,
  compareCardsByPosition,
  computeMovedCardPosition,
  planDestinationShift,
  resolveMovePlacement,
  writeMovePlacement,
  type PositionedCard,
} from "@/lib/card-position";

function card(
  id: string,
  status: CardStatus,
  position: number,
): PositionedCard {
  return { id, status, position };
}

const column = [
  card("a", "new", 0),
  card("b", "new", 1),
  card("c", "new", 2),
];

describe("card position", () => {
  it("orders by position then id", () => {
    const ordered = [
      card("z", "new", 1),
      card("a", "new", 1),
      card("m", "new", 0),
    ].sort(compareCardsByPosition);

    expect(ordered.map((item) => item.id)).toEqual(["m", "a", "z"]);
  });

  it("treats a column drop as the top of the destination", () => {
    expect(resolveMovePlacement({})).toEqual({ kind: "start" });
    expect(
      computeMovedCardPosition({
        moving: card("x", "done", 4),
        destination: column,
        toStatus: "new",
        placement: { kind: "start" },
      }),
    ).toBe(0);
  });

  it("inserts before or after an existing destination card", () => {
    expect(
      computeMovedCardPosition({
        moving: card("x", "done", 4),
        destination: column,
        toStatus: "new",
        placement: { kind: "before", cardId: "c" },
      }),
    ).toBe(2);
    expect(
      computeMovedCardPosition({
        moving: card("x", "done", 4),
        destination: column,
        toStatus: "new",
        placement: { kind: "after", cardId: "c" },
      }),
    ).toBe(3);
  });

  it("falls back to the top when the drop anchor is missing", () => {
    expect(
      computeMovedCardPosition({
        moving: card("x", "done", 4),
        destination: column,
        toStatus: "new",
        placement: { kind: "before", cardId: "missing" },
      }),
    ).toBe(0);
  });

  it("adjusts same-column targets so the card lands before the anchor", () => {
    expect(
      computeMovedCardPosition({
        moving: card("a", "new", 0),
        destination: column,
        toStatus: "new",
        placement: { kind: "before", cardId: "c" },
      }),
    ).toBe(1);
    expect(
      computeMovedCardPosition({
        moving: card("a", "new", 0),
        destination: column,
        toStatus: "new",
        placement: { kind: "after", cardId: "c" },
      }),
    ).toBe(2);
  });

  it("plans neighbor shifts for cross-column and same-column moves", () => {
    expect(planDestinationShift({ status: "done", position: 4 }, "new", 0)).toEqual({
      kind: "increment",
      from: 0,
    });
    expect(planDestinationShift({ status: "new", position: 0 }, "new", 1)).toEqual({
      kind: "decrement",
      fromExclusive: 0,
      to: 1,
    });
    expect(planDestinationShift({ status: "new", position: 2 }, "new", 0)).toEqual({
      kind: "increment",
      from: 0,
      toExclusive: 2,
    });
    expect(planDestinationShift({ status: "new", position: 1 }, "new", 1)).toEqual({
      kind: "none",
    });
  });

  it("moves a card to the top of another column without reshuffling the rest", () => {
    const cards = [
      ...column,
      card("x", "done", 4),
      card("y", "done", 5),
    ];

    const next = applyCardMove(cards, {
      cardId: "x",
      toStatus: "new",
      placement: { kind: "start" },
    });

    expect(
      next
        .filter((item) => item.status === "new")
        .sort(compareCardsByPosition)
        .map((item) => item.id),
    ).toEqual(["x", "a", "b", "c"]);
    expect(next.find((item) => item.id === "x")).toMatchObject({
      status: "new",
      position: 0,
    });
    expect(next.find((item) => item.id === "a")?.position).toBe(1);
    expect(next.find((item) => item.id === "y")?.position).toBe(5);
  });

  it("keeps a drop between two cards after the move", () => {
    const cards = [...column, card("x", "done", 4)];
    const next = applyCardMove(cards, {
      cardId: "x",
      toStatus: "new",
      placement: { kind: "after", cardId: "a" },
    });

    expect(
      next
        .filter((item) => item.status === "new")
        .sort(compareCardsByPosition)
        .map((item) => item.id),
    ).toEqual(["a", "x", "b", "c"]);
  });

  it("reorders inside the same column", () => {
    const next = applyCardMove(column, {
      cardId: "a",
      toStatus: "new",
      placement: { kind: "after", cardId: "c" },
    });

    expect(
      next.sort(compareCardsByPosition).map((item) => `${item.id}:${item.position}`),
    ).toEqual(["b:0", "c:1", "a:2"]);
  });

  it("writes only the matching placement field", () => {
    const before = new FormData();
    writeMovePlacement(before, { kind: "before", cardId: "clbeforexxxxxxxxxxxxxxxxxxx" });
    expect(before.get("beforeCardId")).toBe("clbeforexxxxxxxxxxxxxxxxxxx");
    expect(before.get("afterCardId")).toBeNull();

    const start = new FormData();
    writeMovePlacement(start, { kind: "start" });
    expect(start.get("beforeCardId")).toBeNull();
    expect(start.get("afterCardId")).toBeNull();
  });
});
