import { describe, expect, it } from "vitest";
import {
  CAMERA_AUDIO_BITS_PER_SECOND,
  CAMERA_VIDEO_BITS_PER_SECOND,
  CAMERA_VIDEO_IDEAL_FRAME_RATE,
  CAMERA_VIDEO_IDEAL_HEIGHT,
  CAMERA_VIDEO_IDEAL_WIDTH,
  cameraErrorFromUnknown,
  cameraStreamConstraints,
  mediaRecorderOptions,
  videoFilenameFor,
} from "@/lib/camera-capture";

describe("camera capture helpers", () => {
  it("asks for 1080p when quality is hd", () => {
    expect(
      cameraStreamConstraints("environment", { audio: true, quality: "hd" }),
    ).toEqual({
      audio: true,
      video: {
        facingMode: { ideal: "environment" },
        width: { ideal: CAMERA_VIDEO_IDEAL_WIDTH },
        height: { ideal: CAMERA_VIDEO_IDEAL_HEIGHT },
        frameRate: { ideal: CAMERA_VIDEO_IDEAL_FRAME_RATE },
      },
    });
  });

  it("omits resolution when falling back to a basic stream", () => {
    expect(
      cameraStreamConstraints("user", { audio: false, quality: "basic" }),
    ).toEqual({
      audio: false,
      video: { facingMode: { ideal: "user" } },
    });
  });

  it("sets a field-chat bitrate on the recorder", () => {
    expect(mediaRecorderOptions("video/mp4")).toEqual({
      mimeType: "video/mp4",
      videoBitsPerSecond: CAMERA_VIDEO_BITS_PER_SECOND,
      audioBitsPerSecond: CAMERA_AUDIO_BITS_PER_SECOND,
    });
  });

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
