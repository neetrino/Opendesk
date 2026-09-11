"use client";

import { useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/attachments";
import { CAMERA_LONG_PRESS_MS } from "@/lib/constants";

type CaptureLabels = {
  camera: string;
  cameraAria: string;
  gallery: string;
  galleryAria: string;
};

type MediaCaptureMode = "all" | "gallery" | "camera";

type MediaCaptureControlsProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  labels: CaptureLabels;
  unavailableReason?: string;
  mode?: MediaCaptureMode;
};

function CameraIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 8.5h2.2l1.1-2h8.4l1.1 2h2.2a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-8a1.5 1.5 0 0 1 1.5-1.5Z"
      />
      <circle
        cx="12"
        cy="13.2"
        r="3.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function GalleryIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3.4"
        y="5.4"
        width="17.2"
        height="13.2"
        rx="1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle
        cx="8.6"
        cy="10.1"
        r="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3.8 16.4 4.7-4.4 3.1 2.8 3.2-3.6 5.4 5.2"
      />
    </svg>
  );
}

function MicIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="9"
        y="3.5"
        width="6"
        height="11"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v3.2"
      />
    </svg>
  );
}

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

/**
 * Gallery picker plus one camera control: tap opens a photo, hold then
 * release opens video. The file dialog is opened on pointerup so iOS keeps
 * the user gesture.
 */
export function MediaCaptureControls({
  disabled,
  onFiles,
  labels,
  unavailableReason,
  mode = "all",
}: MediaCaptureControlsProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pressStartedAt = useRef<number | null>(null);
  const armedTimer = useRef<number | null>(null);
  const [videoArmed, setVideoArmed] = useState(false);

  function clearArmTimer(): void {
    if (armedTimer.current !== null) {
      window.clearTimeout(armedTimer.current);
      armedTimer.current = null;
    }
  }

  function onCameraPointerDown(event: PointerEvent<HTMLButtonElement>): void {
    if (disabled) {
      return;
    }
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pressStartedAt.current = Date.now();
    setVideoArmed(false);
    clearArmTimer();
    armedTimer.current = window.setTimeout(() => {
      setVideoArmed(true);
    }, CAMERA_LONG_PRESS_MS);
  }

  function onCameraPointerUp(event: PointerEvent<HTMLButtonElement>): void {
    if (disabled || pressStartedAt.current === null) {
      return;
    }
    const heldMs = Date.now() - pressStartedAt.current;
    pressStartedAt.current = null;
    clearArmTimer();
    setVideoArmed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (heldMs >= CAMERA_LONG_PRESS_MS) {
      videoRef.current?.click();
      return;
    }
    photoRef.current?.click();
  }

  function onCameraPointerCancel(event: PointerEvent<HTMLButtonElement>): void {
    pressStartedAt.current = null;
    clearArmTimer();
    setVideoArmed(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  const showGallery = mode === "all" || mode === "gallery";
  const showCamera = mode === "all" || mode === "camera";

  return (
    <div className="media-capture">
      {showGallery ? (
        <>
          <input
            ref={galleryRef}
            type="file"
            accept={ATTACHMENT_FILE_ACCEPT}
            multiple
            hidden
            disabled={disabled}
            onChange={(event) => onHiddenInputChange(event, onFiles)}
          />
          <button
            type="button"
            className="comment-attach"
            onClick={() => galleryRef.current?.click()}
            disabled={disabled}
            aria-label={labels.galleryAria}
            title={unavailableReason ?? labels.gallery}
          >
            <GalleryIcon size={20} />
          </button>
        </>
      ) : null}
      {showCamera ? (
        <>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            hidden
            disabled={disabled}
            onChange={(event) => onHiddenInputChange(event, onFiles)}
          />
          <input
            ref={videoRef}
            type="file"
            accept="video/*"
            capture="environment"
            hidden
            disabled={disabled}
            onChange={(event) => onHiddenInputChange(event, onFiles)}
          />
          <button
            type="button"
            className={
              videoArmed ? "comment-attach is-video-armed" : "comment-attach"
            }
            disabled={disabled}
            aria-label={labels.cameraAria}
            title={unavailableReason ?? labels.camera}
            onPointerDown={onCameraPointerDown}
            onPointerUp={onCameraPointerUp}
            onPointerCancel={onCameraPointerCancel}
            onContextMenu={(event) => event.preventDefault()}
          >
            <CameraIcon size={20} />
          </button>
        </>
      ) : null}
    </div>
  );
}

export function VoiceMicIcon({ size = 20 }: { size?: number }) {
  return <MicIcon size={size} />;
}
