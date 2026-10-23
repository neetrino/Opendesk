import { describe, expect, it } from "vitest";
import { hasPermission } from "@/lib/platform-permissions";

describe("platform permissions", () => {
  it("gives admins the admin screen and members none of it", () => {
    expect(hasPermission("platform_admin", "admin.users.read")).toBe(true);
    expect(hasPermission("platform_admin", "admin.boards.disable")).toBe(true);
    expect(hasPermission("member", "admin.users.read")).toBe(false);
    expect(hasPermission("member", "admin.users.setRole")).toBe(false);
  });
});
