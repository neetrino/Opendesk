import { describe, expect, it } from "vitest";
import {
  WEB_APP_NAME,
  buildBoardManifestPath,
  buildWebAppManifest,
  shortAppName,
} from "@/lib/web-app-manifest";

describe("shortAppName", () => {
  it("keeps short names intact", () => {
    expect(shortAppName("OpenDesk")).toBe("OpenDesk");
  });

  it("trims long board titles to the home-screen limit", () => {
    expect(shortAppName("Sprint Q3 discussions")).toBe("Sprint Q3 di");
  });
});

describe("buildBoardManifestPath", () => {
  it("nests the manifest under the join URL", () => {
    expect(buildBoardManifestPath("sprint-q3", "tok_abc")).toBe(
      "/b/sprint-q3/tok_abc/manifest.webmanifest",
    );
  });
});

describe("buildWebAppManifest", () => {
  it("uses the site name and root start URL by default", () => {
    const manifest = buildWebAppManifest({ startUrl: "/" });
    expect(manifest.id).toBe("/");
    expect(manifest.name).toBe(WEB_APP_NAME);
    expect(manifest.short_name).toBe(WEB_APP_NAME);
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.scope).toBe("/");
  });

  it("scopes a board install to that board URL", () => {
    const startUrl = "/b/sprint-q3/tok_abc";
    const manifest = buildWebAppManifest({
      startUrl,
      name: "Sprint Q3",
    });
    expect(manifest.id).toBe(startUrl);
    expect(manifest.name).toBe("Sprint Q3");
    expect(manifest.start_url).toBe(startUrl);
  });
});
