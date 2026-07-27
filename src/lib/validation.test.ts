import { describe, expect, it } from "vitest";
import {
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  joinBoardSchema,
  moveCardSchema,
  setCardUrgentSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid board payload", () => {
    const parsed = createBoardSchema.safeParse({
      title: "Sprint",
      organizerName: "Anna",
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

  it("accepts a valid permanent join payload", () => {
    const parsed = joinBoardSchema.safeParse({
      token: "abcdefghijklmnop",
      displayName: "Anna",
    });
    expect(parsed.success).toBe(true);
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

  it("parses urgent false from string correctly", () => {
    const parsed = setCardUrgentSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      urgent: "false",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.urgent).toBe(false);
    }
  });
});
