import { describe, expect, it } from "vitest";
import {
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  moveCardSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid board payload", () => {
    const parsed = createBoardSchema.safeParse({
      title: "Спринт",
      organizerName: "Аня",
      inviteCount: "5",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty display name on claim", () => {
    const parsed = claimInviteSchema.safeParse({
      token: "abcdefghijklmnop",
      displayName: "   ",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects short card title", () => {
    const parsed = createCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      type: "question",
      title: "a",
      description: "",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects invalid card status on move", () => {
    const parsed = moveCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      status: "archived",
    });
    expect(parsed.success).toBe(false);
  });
});
