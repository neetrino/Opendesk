import { describe, expect, it } from "vitest";
import {
  databaseUrlNeedsSsl,
  normalizeDatabaseUrl,
  resolveMigrationDatabaseUrl,
  toUnpooledDatabaseUrl,
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

describe("toUnpooledDatabaseUrl", () => {
  it("strips Neon -pooler from the hostname", () => {
    const pooled =
      "postgresql://u:p@ep-withered-water-a20vbdta-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    expect(toUnpooledDatabaseUrl(pooled)).toBe(
      "postgresql://u:p@ep-withered-water-a20vbdta.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    );
  });

  it("leaves an already-direct Neon host unchanged", () => {
    const direct =
      "postgresql://u:p@ep-withered-water-a20vbdta.eu-central-1.aws.neon.tech/neondb?sslmode=require";
    expect(toUnpooledDatabaseUrl(direct)).toBe(direct);
  });

  it("does not rewrite -pooler inside the password", () => {
    const url =
      "postgresql://u:secret-pooler.x@ep-demo-pooler.eu-central-1.aws.neon.tech/db";
    expect(toUnpooledDatabaseUrl(url)).toBe(
      "postgresql://u:secret-pooler.x@ep-demo.eu-central-1.aws.neon.tech/db",
    );
  });
});

describe("resolveMigrationDatabaseUrl", () => {
  it("prefers DIRECT_URL when set", () => {
    expect(
      resolveMigrationDatabaseUrl({
        DIRECT_URL: "postgresql://owner@direct/db",
        DATABASE_URL: "postgresql://app@ep-demo-pooler.neon.tech/db",
      }),
    ).toBe("postgresql://owner@direct/db");
  });

  it("derives an unpooled URL from DATABASE_URL", () => {
    expect(
      resolveMigrationDatabaseUrl({
        DATABASE_URL:
          "postgresql://u:p@ep-demo-pooler.eu-central-1.aws.neon.tech/db",
      }),
    ).toBe("postgresql://u:p@ep-demo.eu-central-1.aws.neon.tech/db");
  });

  it("throws when no database URL is configured", () => {
    expect(() => resolveMigrationDatabaseUrl({})).toThrow("DATABASE_URL is not set");
  });
});
