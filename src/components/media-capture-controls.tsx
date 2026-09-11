"use client";

import { useRef, type ChangeEvent } from "react";
import { ATTACHMENT_FILE_ACCEPT } from "@/lib/attachments";

type CaptureAction = "photo" | "video" | "gallery";

type CaptureLabels = {
  photo: string;
  photoAria: string;
  video: string;
  videoAria: string;
  gallery: string;
  galleryAria: string;
};

type MediaCaptureControlsProps = {
  disabled: boolean;
  onFiles: (files: File[]) => void;
  labels: CaptureLabels;
  unavailableReason?: string;
};

const ACTIONS: readonly {
  id: CaptureAction;
  accept: string;
  capture?: "environment";
  multiple: boolean;
}[] = [
  { id: "photo", accept: "image/*", capture: "environment", multiple: false },
  { id: "video", accept: "video/*", capture: "environment", multiple: false },
  { id: "gallery", accept: ATTACHMENT_FILE_ACCEPT, multiple: true },
];

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

function VideoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="3.2"
        y="6.8"
        width="12.4"
        height="10.4"
        rx="1.6"
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
        d="m15.6 10.4 5.2-2.4v8l-5.2-2.4z"
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

const ACTION_ICON: Record<CaptureAction, typeof CameraIcon> = {
  photo: CameraIcon,
  video: VideoIcon,
  gallery: GalleryIcon,
};

function copyFor(
  action: CaptureAction,
  labels: CaptureLabels,
): { title: string; aria: string } {
  switch (action) {
    case "photo":
      return { title: labels.photo, aria: labels.photoAria };
    case "video":
      return { title: labels.video, aria: labels.videoAria };
    case "gallery":
      return { title: labels.gallery, aria: labels.galleryAria };
  }
}

/**
 * Opens the device camera or gallery through native file inputs.
 * `capture` is honored on phones and ignored in desktop browsers.
 */
export function MediaCaptureControls({
  disabled,
  onFiles,
  labels,
  unavailableReason,
}: MediaCaptureControlsProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const refs = {
    photo: photoRef,
    video: videoRef,
    gallery: galleryRef,
  } as const;

  function onInputChange(event: ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    if (files.length > 0) {
      onFiles(files);
    }
  }

  return (
    <div className="media-capture">
      {ACTIONS.map((action) => {
        const Icon = ACTION_ICON[action.id];
        const { title, aria } = copyFor(action.id, labels);
        return (
          <span key={action.id} className="media-capture-action">
            <input
              ref={refs[action.id]}
              type="file"
              accept={action.accept}
              capture={action.capture}
              multiple={action.multiple}
              hidden
              disabled={disabled}
              onChange={onInputChange}
            />
            <button
              type="button"
              className="comment-attach"
              onClick={() => refs[action.id].current?.click()}
              disabled={disabled}
              aria-label={aria}
              title={unavailableReason ?? title}
            >
              <Icon size={20} />
            </button>
          </span>
        );
      })}
    </div>
  );
}
