export type CameraCaptureError = "cameraDenied" | "cameraUnsupported";
export type CameraFacing = "environment" | "user";

const VIDEO_MIME_CANDIDATES = [
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

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

export async function requestCameraStream(
  facing: CameraFacing,
): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: true,
    });
  } catch {
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facing } },
      audio: false,
    });
  }
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
