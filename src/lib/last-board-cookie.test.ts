import { describe, expect, it } from "vitest";
import { resolveLastBoardCookieUpdate } from "@/lib/last-board-cookie";

describe("resolveLastBoardCookieUpdate", () => {
  it("rejects a non-board path", () => {
    expect(resolveLastBoardCookieUpdate(undefined, "/boards")).toEqual({
      kind: "invalid",
    });
  });

  it("sets a canonical path when empty", () => {
    expect(
      resolveLastBoardCookieUpdate(undefined, "/b/neutrino/join_123"),
    ).toEqual({
      kind: "set",
      value: "/b/neutrino/join_123",
    });
  });

  it("keeps the cookie when the path is already stored", () => {
    expect(
      resolveLastBoardCookieUpdate(
        "/b/neutrino/join_123",
        "/b/neutrino/join_123",
      ),
    ).toEqual({ kind: "keep" });
  });

  it("updates when the owner opens a different board", () => {
    expect(
      resolveLastBoardCookieUpdate(
        "/b/neutrino/join_123",
        "/b/other/join_456",
      ),
    ).toEqual({
      kind: "set",
      value: "/b/other/join_456",
    });
  });
});
