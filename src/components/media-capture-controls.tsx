"use client";

import { useRef, type ChangeEvent } from "react";
import { PaperclipIcon } from "@/components/paperclip-icon";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/attachments";

type CaptureLabels = {
  camera: string;
  cameraAria: string;
  file: string;
  fileAria: string;
};

type MediaCaptureAppearance = "ghost" | "action";

type MediaCaptureControlsProps = {
  disabled: boolean;
  labels: CaptureLabels;
  unavailableReason?: string;
  appearance?: MediaCaptureAppearance;
  className?: string;
  onOpenCamera?: () => void;
  onPickFiles?: (files: File[]) => void;
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

export function GalleryIcon({ size = 20 }: { size?: number }) {
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

export function FlipCameraIcon({ size = 20 }: { size?: number }) {
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
        d="M7 7.5 4.5 10 7 12.5M4.5 10h10a4 4 0 0 1 4 4v.5M17 16.5 19.5 14 17 11.5M19.5 14h-10a4 4 0 0 1-4-4V9.5"
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

function onHiddenFileChange(
  event: ChangeEvent<HTMLInputElement>,
  onPickFiles: ((files: File[]) => void) | undefined,
): void {
  const files = event.target.files ? Array.from(event.target.files) : [];
  event.target.value = "";
  if (files.length > 0) {
    onPickFiles?.(files);
  }
}

/**
 * Mobile layout: in-app camera. Desktop layout: OS file picker.
 * Photo/video accept types stay the same as the camera gallery.
 */
export function MediaCaptureControls({
  disabled,
  labels,
  unavailableReason,
  appearance = "ghost",
  className,
  onOpenCamera,
  onPickFiles,
}: MediaCaptureControlsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const buttonClass =
    appearance === "action" ? "comment-action" : "comment-attach";

  return (
    <div className={className ? `media-capture ${className}` : "media-capture"}>
      <input
        ref={fileRef}
        type="file"
        accept={ATTACHMENT_FILE_ACCEPT}
        multiple
        hidden
        onChange={(event) => onHiddenFileChange(event, onPickFiles)}
      />
      <button
        type="button"
        className={`${buttonClass} media-capture-camera`}
        disabled={disabled}
        aria-label={labels.cameraAria}
        title={unavailableReason ?? labels.camera}
        onClick={() => {
          if (!disabled) {
            onOpenCamera?.();
          }
        }}
      >
        <CameraIcon size={20} />
      </button>
      <button
        type="button"
        className={`${buttonClass} media-capture-file`}
        disabled={disabled}
        aria-label={labels.fileAria}
        title={unavailableReason ?? labels.file}
        onClick={() => {
          if (!disabled) {
            fileRef.current?.click();
          }
        }}
      >
        <PaperclipIcon size={20} />
      </button>
    </div>
  );
}

export function VoiceMicIcon({ size = 20 }: { size?: number }) {
  return <MicIcon size={size} />;
}
