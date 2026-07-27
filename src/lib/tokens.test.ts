import { createInviteToken } from "@/lib/tokens";

describe("createInviteToken", () => {
  it("returns unique non-empty tokens", () => {
    const first = createInviteToken();
    const second = createInviteToken();

    expect(first.length).toBeGreaterThan(10);
    expect(second.length).toBeGreaterThan(10);
    expect(first).not.toBe(second);
  });
});
