import { describe, expect, it } from "vitest";
import {
  databaseUrlNeedsSsl,
  normalizeDatabaseUrl,
} from "@/lib/database-url";

describe("normalizeDatabaseUrl", () => {
  it("rewrites sslmode=require to verify-full", () => {
    const url =
      "postgresql://u:p@host/db?sslmode=require&channel_binding=require";
    expect(normalizeDatabaseUrl(url)).toBe(
      "postgresql://u:p@host/db?sslmode=verify-full&channel_binding=require",
    );
  });

  it("leaves verify-full unchanged", () => {
    const url = "postgresql://u:p@host/db?sslmode=verify-full";
    expect(normalizeDatabaseUrl(url)).toBe(url);
  });

  it("detects ssl from neon-style require urls", () => {
    expect(
      databaseUrlNeedsSsl("postgresql://u:p@host/db?sslmode=require"),
    ).toBe(true);
  });
});
