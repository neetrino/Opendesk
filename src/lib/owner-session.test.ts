import { createHash, timingSafeEqual } from "node:crypto";
import { describe, expect, it } from "vitest";
import { safeEqualSecret } from "@/lib/owner-session";

describe("safeEqualSecret", () => {
  it("returns true for equal strings", () => {
    expect(safeEqualSecret("owner", "owner")).toBe(true);
  });

  it("returns false for different strings", () => {
    expect(safeEqualSecret("owner", "other")).toBe(false);
  });

  it("returns false for different lengths", () => {
    expect(safeEqualSecret("ab", "abcd")).toBe(false);
  });

  it("matches manual sha256 compare", () => {
    const a = "secret-value";
    const b = "secret-value";
    const ha = createHash("sha256").update(a).digest();
    const hb = createHash("sha256").update(b).digest();
    expect(timingSafeEqual(ha, hb)).toBe(true);
    expect(safeEqualSecret(a, b)).toBe(true);
  });
});
