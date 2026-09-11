import { describe, expect, it } from "vitest";
import {
  CAMERA_HISTORY_MARKER,
  hasOverlayMarker,
  withOverlayMarker,
} from "@/lib/overlay-history";

describe("overlay history markers", () => {
  it("keeps the current history state and adds the overlay flag", () => {
    expect(
      withOverlayMarker({ __NA: 12, idx: 1 }, CAMERA_HISTORY_MARKER),
    ).toEqual({
      __NA: 12,
      idx: 1,
      [CAMERA_HISTORY_MARKER]: true,
    });
  });

  it("treats missing or unrelated state as not open", () => {
    expect(hasOverlayMarker(null, CAMERA_HISTORY_MARKER)).toBe(false);
    expect(hasOverlayMarker({ idx: 1 }, CAMERA_HISTORY_MARKER)).toBe(false);
  });

  it("detects the overlay flag", () => {
    expect(
      hasOverlayMarker(
        withOverlayMarker({ idx: 1 }, CAMERA_HISTORY_MARKER),
        CAMERA_HISTORY_MARKER,
      ),
    ).toBe(true);
  });
});
