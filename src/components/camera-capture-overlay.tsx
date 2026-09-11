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
import {
  shutterCancelAction,
  shutterReleaseAction,
  type ShutterPhase,
} from "@/lib/shutter-gesture";
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
  const holdStartedRecording = useRef(false);
  const [videoArmed, setVideoArmed] = useState(false);
  if (!open && videoArmed) {
    setVideoArmed(false);
  }

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
      pressStartedAt.current = null;
      startingVideo.current = false;
      holdStartedRecording.current = false;
      if (armedTimer.current !== null) {
        window.clearTimeout(armedTimer.current);
        armedTimer.current = null;
      }
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onClose();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open, onClose]);

  function shutterPhase(): ShutterPhase {
    if (recording || startingVideo.current || videoArmed) {
      return "recording";
    }
    if (pressStartedAt.current !== null) {
      return "pressing";
    }
    return "idle";
  }

  function clearArmTimer(): void {
    if (armedTimer.current !== null) {
      window.clearTimeout(armedTimer.current);
      armedTimer.current = null;
    }
  }

  function releaseShutterPointer(
    event: PointerEvent<HTMLButtonElement>,
  ): void {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function onShutterPointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (!ready || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    if (shutterPhase() === "recording") {
      pressStartedAt.current = Date.now();
      return;
    }
    pressStartedAt.current = Date.now();
    startingVideo.current = false;
    holdStartedRecording.current = false;
    setVideoArmed(false);
    clearArmTimer();
    armedTimer.current = window.setTimeout(() => {
      const started = onStartVideo();
      if (!started) {
        startingVideo.current = false;
        holdStartedRecording.current = false;
        setVideoArmed(false);
        return;
      }
      startingVideo.current = true;
      holdStartedRecording.current = true;
      setVideoArmed(true);
    }, CAMERA_LONG_PRESS_MS);
  }

  async function finishShutter(
    event: PointerEvent<HTMLButtonElement>,
  ): Promise<void> {
    const phase = shutterPhase();
    const isHoldThatStartedRecording = holdStartedRecording.current;
    const action = shutterReleaseAction({
      phase,
      isHoldThatStartedRecording,
    });
    pressStartedAt.current = null;
    clearArmTimer();
    releaseShutterPointer(event);
    if (action === "keep-recording") {
      holdStartedRecording.current = false;
      return;
    }
    if (action === "stop-video") {
      startingVideo.current = false;
      holdStartedRecording.current = false;
      setVideoArmed(false);
      const file = await onStopVideo();
      if (file) {
        onFiles([file]);
      }
      return;
    }
    if (action !== "take-photo") {
      return;
    }
    const file = await onTakePhoto(previewRef.current);
    if (file) {
      onFiles([file]);
    }
  }

  function onShutterPointerCancel(event: PointerEvent<HTMLButtonElement>): void {
    const action = shutterCancelAction(shutterPhase());
    clearArmTimer();
    releaseShutterPointer(event);
    pressStartedAt.current = null;
    if (action === "keep-recording") {
      holdStartedRecording.current = false;
      return;
    }
    startingVideo.current = false;
    holdStartedRecording.current = false;
    setVideoArmed(false);
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
            onLostPointerCapture={onShutterPointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          />
        )}
        <span className="camera-overlay-spacer" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
