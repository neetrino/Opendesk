import { describe, expect, it } from "vitest";
import { buildJoinPath, parseJoinPath } from "@/lib/join-url";

describe("canonical board paths", () => {
  it("round-trips a canonical board path", () => {
    const path = buildJoinPath("neutrino", "join_123");
    expect(parseJoinPath(path)).toEqual({
      slug: "neutrino",
      joinToken: "join_123",
    });
  });

  it("rejects non-board and nested paths", () => {
    expect(parseJoinPath("/boards")).toBeNull();
    expect(parseJoinPath("/b/neutrino")).toBeNull();
    expect(parseJoinPath("/b/neutrino/token/settings")).toBeNull();
  });

  it("rejects malformed URI encoding", () => {
    expect(parseJoinPath("/b/neutrino/%E0%A4%A")).toBeNull();
  });
});
