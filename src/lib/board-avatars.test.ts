import { describe, expect, it } from "vitest";
import {
  BOARD_AVATAR_MARKS,
  hasFreeAvatar,
  pickFreeAvatar,
} from "@/lib/board-avatars";

describe("pickFreeAvatar", () => {
  it("returns the same mark for the same seed when the board is empty", () => {
    expect(pickFreeAvatar("cluser-a", [])).toBe(pickFreeAvatar("cluser-a", []));
  });

  it("gives each person a different mark on one board", () => {
    const taken: string[] = [];
    const assigned = Array.from({ length: 20 }, (_, index) => {
      const mark = pickFreeAvatar(`person-${index}`, taken);
      taken.push(mark);
      return mark;
    });
    expect(new Set(assigned).size).toBe(20);
    expect(assigned.every((mark) => BOARD_AVATAR_MARKS.includes(mark))).toBe(
      true,
    );
  });

  it("reports when the sticker pool is exhausted", () => {
    expect(hasFreeAvatar([])).toBe(true);
    expect(hasFreeAvatar(BOARD_AVATAR_MARKS)).toBe(false);
  });
});
