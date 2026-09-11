import { describe, expect, it } from "vitest";
import {
  cameraErrorFromUnknown,
  videoFilenameFor,
} from "@/lib/camera-capture";

describe("camera capture helpers", () => {
  it("picks an extension from the recorder mime type", () => {
    expect(videoFilenameFor("video/webm;codecs=vp8,opus")).toBe(
      "camera-video.webm",
    );
    expect(videoFilenameFor("video/mp4")).toBe("camera-video.mp4");
  });

  it("maps missing hardware to unsupported", () => {
    expect(cameraErrorFromUnknown(new DOMException("missing", "NotFoundError"))).toBe(
      "cameraUnsupported",
    );
  });

  it("maps permission failures to denied", () => {
    expect(
      cameraErrorFromUnknown(new DOMException("blocked", "NotAllowedError")),
    ).toBe("cameraDenied");
  });
});
