"use client";

import { useEffect, type MouseEvent } from "react";
import { VoiceNotePlayer } from "@/components/voice-note-player";
import { canPreviewInline } from "@/lib/attachments";

export type MediaItem = {
  id: string;
  filename: string;
  contentType: string;
  kind: "image" | "video" | "audio";
  src: string;
};

type MediaThumbProps = {
  item: MediaItem;
  progress?: number;
  onOpen: () => void;
  onRemove?: () => void;
  openLabel: string;
  removeLabel?: string;
};

export function MediaThumb({
  item,
  progress,
  onOpen,
  onRemove,
  openLabel,
  removeLabel,
}: MediaThumbProps) {
  const previewable = canPreviewInline(item.contentType, item.kind);
  const uploading = progress !== undefined && progress < 100;

  if (item.kind === "audio") {
    return (
      <VoiceNotePlayer
        src={item.src}
        filename={item.filename}
        progress={progress}
      />
    );
  }

  return (
    <div className={uploading ? "media-thumb is-uploading" : "media-thumb"}>
      <button
        type="button"
        className="media-thumb-open"
        onClick={onOpen}
        aria-label={`${openLabel}: ${item.filename}`}
      >
        {previewable && item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.src} alt="" />
        ) : previewable && item.kind === "video" ? (
          <video src={item.src} muted playsInline preload="metadata" />
        ) : (
          <span className="media-thumb-fallback">{item.filename}</span>
        )}
        {item.kind === "video" ? <span className="media-play" /> : null}
      </button>
      {onRemove && removeLabel ? (
        <button
          type="button"
          className="media-thumb-remove"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          ×
        </button>
      ) : null}
      {uploading ? (
        <span className="media-thumb-progress">{progress}%</span>
      ) : null}
    </div>
  );
}

type MediaLightboxProps = {
  item: MediaItem;
  closeLabel: string;
  onClose: () => void;
};

export function MediaLightbox({ item, closeLabel, onClose }: MediaLightboxProps) {
  const previewable = canPreviewInline(item.contentType, item.kind);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  function keepOpen(event: MouseEvent<HTMLElement>): void {
    event.stopPropagation();
  }

  return (
    <div
      className="media-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={item.filename}
      onClick={onClose}
    >
      <div className="media-lightbox-backdrop" aria-hidden="true" />
      <button
        type="button"
        className="media-lightbox-close"
        aria-label={closeLabel}
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      <div className="media-lightbox-frame">
        {previewable && item.kind === "image" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.src} alt={item.filename} onClick={keepOpen} />
        ) : previewable && item.kind === "video" ? (
          <video
            src={item.src}
            controls
            autoPlay
            playsInline
            onClick={keepOpen}
          />
        ) : previewable && item.kind === "audio" ? (
          <div onClick={keepOpen}>
            <VoiceNotePlayer src={item.src} filename={item.filename} />
          </div>
        ) : (
          <a
            className="media-lightbox-link"
            href={item.src}
            target="_blank"
            rel="noreferrer"
            onClick={keepOpen}
          >
            {item.filename}
          </a>
        )}
        <p onClick={keepOpen}>{item.filename}</p>
      </div>
    </div>
  );
}
