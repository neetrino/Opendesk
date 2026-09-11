"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  FlipCameraIcon,
  GalleryIcon,
} from "@/components/media-capture-controls";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/attachments";
import { CAMERA_LONG_PRESS_MS } from "@/lib/constants";
import type { CameraCaptureError } from "@/lib/camera-capture";
import { formatVoiceElapsed } from "@/lib/voice-recorder";

export type CameraOverlayLabels = {
  close: string;
  closeAria: string;
  switchCamera: string;
  switchCameraAria: string;
  shutter: string;
  shutterAria: string;
  gallery: string;
  galleryAria: string;
  recording: string;
  unavailable: string;
  fallbackPhoto: string;
  fallbackVideo: string;
};

type CameraCaptureOverlayProps = {
  open: boolean;
  stream: MediaStream | null;
  ready: boolean;
  errorKey: CameraCaptureError | null;
  recording: boolean;
  elapsedMs: number;
  onClose: () => void;
  onFiles: (files: File[]) => void;
  onFlip: () => void;
  onTakePhoto: (video: HTMLVideoElement | null) => Promise<File | null>;
  onStartVideo: () => boolean;
  onStopVideo: () => Promise<File | null>;
  onCancelVideo: () => void;
  labels: CameraOverlayLabels;
  errors: Record<CameraCaptureError, string>;
};

function onHiddenInputChange(
  event: ChangeEvent<HTMLInputElement>,
  onFiles: (files: File[]) => void,
): void {
  const files = event.target.files ? Array.from(event.target.files) : [];
  event.target.value = "";
  if (files.length > 0) {
    onFiles(files);
  }
}

export function CameraCaptureOverlay({
  open,
  stream,
  ready,
  errorKey,
  recording,
  elapsedMs,
  onClose,
  onFiles,
  onFlip,
  onTakePhoto,
  onStartVideo,
  onStopVideo,
  onCancelVideo,
  labels,
  errors,
}: CameraCaptureOverlayProps) {
  const previewRef = useRef<HTMLVideoElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const nativeVideoRef = useRef<HTMLInputElement>(null);
  const pressStartedAt = useRef<number | null>(null);
  const armedTimer = useRef<number | null>(null);
  const startingVideo = useRef(false);
  const [videoArmed, setVideoArmed] = useState(false);

  useEffect(() => {
    const video = previewRef.current;
    if (!video) {
      return;
    }
    video.srcObject = stream;
    if (stream) {
      void video.play();
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open, onClose]);

  function clearArmTimer(): void {
    if (armedTimer.current !== null) {
      window.clearTimeout(armedTimer.current);
      armedTimer.current = null;
    }
  }

  function onShutterPointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (!ready || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pressStartedAt.current = Date.now();
    startingVideo.current = false;
    setVideoArmed(false);
    clearArmTimer();
    armedTimer.current = window.setTimeout(() => {
      startingVideo.current = true;
      setVideoArmed(true);
      onStartVideo();
    }, CAMERA_LONG_PRESS_MS);
  }

  async function finishShutter(
    event: PointerEvent<HTMLButtonElement>,
  ): Promise<void> {
    if (pressStartedAt.current === null) {
      return;
    }
    pressStartedAt.current = null;
    clearArmTimer();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (recording || startingVideo.current || videoArmed) {
      startingVideo.current = false;
      setVideoArmed(false);
      const file = await onStopVideo();
      if (file) {
        onFiles([file]);
      }
      return;
    }
    const file = await onTakePhoto(previewRef.current);
    if (file) {
      onFiles([file]);
    }
  }

  function onShutterPointerCancel(event: PointerEvent<HTMLButtonElement>): void {
    pressStartedAt.current = null;
    startingVideo.current = false;
    clearArmTimer();
    setVideoArmed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    onCancelVideo();
  }

  if (!open || typeof document === "undefined") {
    return null;
  }

  const showFallback = errorKey !== null;
  const status = recording
    ? `${labels.recording} ${formatVoiceElapsed(elapsedMs)}`
    : null;

  return createPortal(
    <div
      className="camera-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={labels.shutter}
    >
      <video
        ref={previewRef}
        className="camera-overlay-video"
        autoPlay
        muted
        playsInline
      />
      {showFallback ? (
        <div className="camera-overlay-fallback">
          <p>{errors[errorKey]}</p>
          <p>{labels.unavailable}</p>
        </div>
      ) : null}
      <div className="camera-overlay-top">
        <button
          type="button"
          className="camera-overlay-icon"
          onClick={onClose}
          aria-label={labels.closeAria}
          title={labels.close}
        >
          ×
        </button>
        {status ? (
          <span className="camera-overlay-timer" aria-live="polite">
            {status}
          </span>
        ) : (
          <span />
        )}
        <button
          type="button"
          className="camera-overlay-icon"
          onClick={onFlip}
          disabled={!ready || recording}
          aria-label={labels.switchCameraAria}
          title={labels.switchCamera}
        >
          <FlipCameraIcon size={20} />
        </button>
      </div>
      <div className="camera-overlay-bottom">
        <input
          ref={galleryRef}
          type="file"
          accept={ATTACHMENT_FILE_ACCEPT}
          multiple
          hidden
          onChange={(event) => onHiddenInputChange(event, onFiles)}
        />
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(event) => onHiddenInputChange(event, onFiles)}
        />
        <input
          ref={nativeVideoRef}
          type="file"
          accept="video/*"
          capture="environment"
          hidden
          onChange={(event) => onHiddenInputChange(event, onFiles)}
        />
        <button
          type="button"
          className="camera-overlay-gallery"
          onClick={() => galleryRef.current?.click()}
          aria-label={labels.galleryAria}
          title={labels.gallery}
        >
          <GalleryIcon size={22} />
        </button>
        {showFallback ? (
          <div className="camera-overlay-native">
            <button
              type="button"
              className="camera-overlay-native-btn"
              onClick={() => photoRef.current?.click()}
            >
              {labels.fallbackPhoto}
            </button>
            <button
              type="button"
              className="camera-overlay-native-btn"
              onClick={() => nativeVideoRef.current?.click()}
            >
              {labels.fallbackVideo}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={
              recording || videoArmed
                ? "camera-overlay-shutter is-recording"
                : "camera-overlay-shutter"
            }
            disabled={!ready}
            aria-label={labels.shutterAria}
            title={labels.shutter}
            onPointerDown={onShutterPointerDown}
            onPointerUp={(event) => {
              void finishShutter(event);
            }}
            onPointerCancel={onShutterPointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          />
        )}
        <span className="camera-overlay-spacer" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
