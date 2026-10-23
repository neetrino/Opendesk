import { describe, expect, it } from "vitest";
import {
  decideAccountDisplayName,
  decideDisableUser,
  decideGuestNameJoin,
  decideRoleChange,
  nextLoginFailure,
  normalizeEmail,
} from "@/lib/account-link";

describe("account linking", () => {
  it("normalizes email", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
  });

  it("lets a guest rejoin only an unclaimed name", () => {
    expect(decideGuestNameJoin(null)).toBe("create");
    expect(decideGuestNameJoin({ userId: null })).toBe("rejoin");
    expect(decideGuestNameJoin({ userId: "user-1" })).toBe("claimed");
  });

  it("does not give an account someone else's seat by name", () => {
    expect(decideAccountDisplayName(null)).toBe("create");
    expect(decideAccountDisplayName({ userId: null })).toBe("taken");
    expect(decideAccountDisplayName({ userId: "user-1" })).toBe("taken");
  });

  it("locks on the 10th failure and resets the counter", () => {
    expect(nextLoginFailure(8)).toEqual({ failedLoginCount: 9, locked: false });
    expect(nextLoginFailure(9)).toEqual({ failedLoginCount: 0, locked: true });
  });
});

describe("admin role guards", () => {
  it("blocks changing your own role and promoting a disabled user", () => {
    expect(
      decideRoleChange({
        actorId: "admin",
        targetId: "admin",
        targetDisabled: false,
        targetRole: "platform_admin",
        nextRole: "member",
        otherActiveAdminCount: 1,
      }),
    ).toBe("self");
    expect(
      decideRoleChange({
        actorId: "admin",
        targetId: "user",
        targetDisabled: true,
        targetRole: "member",
        nextRole: "platform_admin",
        otherActiveAdminCount: 1,
      }),
    ).toBe("disabled");
  });

  it("keeps the last active admin", () => {
    expect(
      decideRoleChange({
        actorId: "admin",
        targetId: "other",
        targetDisabled: false,
        targetRole: "platform_admin",
        nextRole: "member",
        otherActiveAdminCount: 0,
      }),
    ).toBe("last_admin");
    expect(
      decideDisableUser({
        targetRole: "platform_admin",
        disable: true,
        otherActiveAdminCount: 0,
      }),
    ).toBe("last_admin");
    expect(
      decideDisableUser({
        targetRole: "member",
        disable: true,
        otherActiveAdminCount: 0,
      }),
    ).toBe("ok");
  });
});
