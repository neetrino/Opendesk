import { describe, expect, it } from "vitest";
import { shutterCancelAction, shutterReleaseAction } from "@/lib/shutter-gesture";

describe("shutter gesture", () => {
  it("takes a photo when the press never armed video", () => {
    expect(
      shutterReleaseAction({
        phase: "pressing",
        isHoldThatStartedRecording: false,
      }),
    ).toBe("take-photo");
  });

  it("keeps recording if the starting hold slips or lifts", () => {
    expect(
      shutterReleaseAction({
        phase: "recording",
        isHoldThatStartedRecording: true,
      }),
    ).toBe("keep-recording");
    expect(shutterCancelAction("recording")).toBe("keep-recording");
  });

  it("stops and saves on the next tap after recording started", () => {
    expect(
      shutterReleaseAction({
        phase: "recording",
        isHoldThatStartedRecording: false,
      }),
    ).toBe("stop-video");
  });

  it("aborts only a press that has not started video", () => {
    expect(shutterCancelAction("pressing")).toBe("abort-press");
    expect(shutterCancelAction("idle")).toBe("abort-press");
  });
});
