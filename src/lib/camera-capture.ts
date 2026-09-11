export type CameraCaptureError = "cameraDenied" | "cameraUnsupported";
export type CameraFacing = "environment" | "user";
export type CameraStreamQuality = "hd" | "basic";

/** Field-chat target. Native 4K is unnecessary and often rejected. */
export const CAMERA_VIDEO_IDEAL_WIDTH = 1920;
export const CAMERA_VIDEO_IDEAL_HEIGHT = 1080;
export const CAMERA_VIDEO_IDEAL_FRAME_RATE = 30;
/** ~5 Mbps keeps a 2-minute 1080p clip under the 200 MB attachment cap. */
export const CAMERA_VIDEO_BITS_PER_SECOND = 5_000_000;
export const CAMERA_AUDIO_BITS_PER_SECOND = 128_000;

const VIDEO_MIME_CANDIDATES = [
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

const STREAM_ATTEMPTS: ReadonlyArray<{
  quality: CameraStreamQuality;
  audio: boolean;
}> = [
  { quality: "hd", audio: true },
  { quality: "hd", audio: false },
  { quality: "basic", audio: true },
  { quality: "basic", audio: false },
];

export function isCameraCaptureSupported(): boolean {
  return (
    typeof MediaRecorder !== "undefined" &&
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

export function pickVideoMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") {
    return undefined;
  }
  for (const type of VIDEO_MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

export function videoFilenameFor(mimeType: string): string {
  const normalized = mimeType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (normalized === "video/mp4") {
    return "camera-video.mp4";
  }
  return "camera-video.webm";
}

export function cameraErrorFromUnknown(error: unknown): CameraCaptureError {
  if (error instanceof DOMException) {
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "cameraUnsupported";
    }
  }
  return "cameraDenied";
}

export function releaseMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => {
    track.stop();
  });
}

export function cameraStreamConstraints(
  facing: CameraFacing,
  options: { audio: boolean; quality: CameraStreamQuality },
): MediaStreamConstraints {
  const video: MediaTrackConstraints = {
    facingMode: { ideal: facing },
  };
  if (options.quality === "hd") {
    video.width = { ideal: CAMERA_VIDEO_IDEAL_WIDTH };
    video.height = { ideal: CAMERA_VIDEO_IDEAL_HEIGHT };
    video.frameRate = { ideal: CAMERA_VIDEO_IDEAL_FRAME_RATE };
  }
  return {
    video,
    audio: options.audio,
  };
}

export function mediaRecorderOptions(
  mimeType: string | undefined,
): MediaRecorderOptions {
  const options: MediaRecorderOptions = {
    videoBitsPerSecond: CAMERA_VIDEO_BITS_PER_SECOND,
    audioBitsPerSecond: CAMERA_AUDIO_BITS_PER_SECOND,
  };
  if (mimeType) {
    options.mimeType = mimeType;
  }
  return options;
}

export function createVideoRecorder(stream: MediaStream): MediaRecorder {
  const mimeType = pickVideoMimeType();
  try {
    return new MediaRecorder(stream, mediaRecorderOptions(mimeType));
  } catch {
    try {
      return mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
    } catch {
      return new MediaRecorder(stream);
    }
  }
}

/**
 * Ask the granted track for 1080p. Failures keep the live stream.
 */
export async function enhanceCameraStream(stream: MediaStream): Promise<void> {
  const track = stream.getVideoTracks()[0];
  if (!track) {
    return;
  }

  try {
    await track.applyConstraints({
      width: { ideal: CAMERA_VIDEO_IDEAL_WIDTH },
      height: { ideal: CAMERA_VIDEO_IDEAL_HEIGHT },
      frameRate: { ideal: CAMERA_VIDEO_IDEAL_FRAME_RATE },
    });
  } catch {
    // Keep the stream already granted.
  }
}

/**
 * Prefer a 1080p rear camera with audio. Fall back to a basic stream
 * rather than leaving the overlay on a tiny default preview.
 */
export async function requestCameraStream(
  facing: CameraFacing,
): Promise<MediaStream> {
  let lastError: unknown;
  for (const attempt of STREAM_ATTEMPTS) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        cameraStreamConstraints(facing, attempt),
      );
      await enhanceCameraStream(stream);
      return stream;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new DOMException("camera unavailable", "NotFoundError");
}

export async function snapshotVideoFrame(
  video: HTMLVideoElement,
  quality = 0.92,
): Promise<File | null> {
  const width = video.videoWidth;
  const height = video.videoHeight;
  if (width === 0 || height === 0) {
    return null;
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", quality);
  });
  if (!blob || blob.size === 0) {
    return null;
  }
  return new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
}
