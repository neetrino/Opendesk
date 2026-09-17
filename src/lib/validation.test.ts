import { describe, expect, it } from "vitest";
import { MAX_TITLE_LENGTH } from "@/lib/constants";
import {
  claimInviteSchema,
  createBoardSchema,
  createCardSchema,
  deleteCardSchema,
  joinBoardSchema,
  moveCardSchema,
  setCardUrgentSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts a valid board payload", () => {
    const parsed = createBoardSchema.safeParse({
      title: "Sprint",
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
      title: "a",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a card title at the limit", () => {
    const parsed = createCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      title: "a".repeat(MAX_TITLE_LENGTH),
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects card title longer than the limit", () => {
    const parsed = createCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      title: "a".repeat(MAX_TITLE_LENGTH + 1),
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

  it("accepts a move with an insert anchor", () => {
    const parsed = moveCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      status: "in_progress",
      beforeCardId: "clzzzzzzzzzzzzzzzzzzzzzzzzz",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.beforeCardId).toBe("clzzzzzzzzzzzzzzzzzzzzzzzzz");
    }
  });

  it("rejects a move with both insert anchors", () => {
    const parsed = moveCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      status: "in_progress",
      beforeCardId: "clzzzzzzzzzzzzzzzzzzzzzzzzz",
      afterCardId: "claaaaaaaaaaaaaaaaaaaaaaaaa",
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

  it("accepts a valid card delete payload", () => {
    const parsed = deleteCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects a local card id on delete", () => {
    const parsed = deleteCardSchema.safeParse({
      boardId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      cardId: "local-not-a-cuid",
    });
    expect(parsed.success).toBe(false);
  });
});
