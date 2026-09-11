import { describe, expect, it } from "vitest";
import {
  destinationLeavesPage,
  isEdgeBackSwipe,
  overlayHash,
  overlayHref,
  parseOverlayHash,
  shouldBlockBrowserBack,
  shouldPopOverlayEntry,
  stripOverlayHash,
} from "@/lib/overlay-history";

describe("overlay history", () => {
  it("builds a distinct hash URL so iOS does not skip the overlay", () => {
    expect(overlayHref("https://app.local/b/site/token", "camera")).toBe(
      "/b/site/token#opendesk-camera",
    );
    expect(parseOverlayHash("#opendesk-media")).toBe("media");
    expect(parseOverlayHash("")).toBeNull();
    expect(overlayHash("card")).toBe("opendesk-card");
  });

  it("pops only the overlay that still owns the hash", () => {
    expect(shouldPopOverlayEntry(true, "#opendesk-camera", "camera")).toBe(true);
    expect(shouldPopOverlayEntry(true, "#opendesk-card", "camera")).toBe(false);
    expect(shouldPopOverlayEntry(false, "#opendesk-camera", "camera")).toBe(
      false,
    );
  });

  it("treats a jump to the boards list as leaving the page", () => {
    expect(
      destinationLeavesPage(
        "https://app.local/b/site/token#opendesk-camera",
        "https://app.local/boards",
      ),
    ).toBe(true);
    expect(
      destinationLeavesPage(
        "https://app.local/b/site/token#opendesk-camera",
        "https://app.local/b/site/token#opendesk-card",
      ),
    ).toBe(false);
    expect(
      stripOverlayHash("https://app.local/b/site/token#opendesk-camera"),
    ).toBe("/b/site/token");
  });

  it("recognizes a right swipe from the left edge", () => {
    expect(
      shouldBlockBrowserBack({
        startX: 8,
        startY: 240,
        currentX: 28,
        currentY: 242,
      }),
    ).toBe(true);
    expect(
      isEdgeBackSwipe({
        startX: 8,
        startY: 240,
        endX: 80,
        endY: 248,
      }),
    ).toBe(true);
    expect(
      isEdgeBackSwipe({
        startX: 8,
        startY: 20,
        endX: 80,
        endY: 24,
      }),
    ).toBe(false);
  });
});
