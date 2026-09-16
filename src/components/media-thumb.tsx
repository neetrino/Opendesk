"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { VoiceNotePlayer } from "@/components/voice-note-player";
import { canPreviewInline } from "@/lib/attachments";
import { useHistoryTrap } from "@/lib/use-history-trap";

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
  const preview = useInlinePreview(item);
  const uploading = progress !== undefined && progress < 100;
  const classes = [
    "media-thumb",
    uploading ? "is-uploading" : "",
    item.kind === "video" ? "is-video" : "",
  ]
    .filter(Boolean)
    .join(" ");

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
    <div className={classes}>
      <button
        type="button"
        className="media-thumb-open"
        onClick={onOpen}
        aria-label={`${openLabel}: ${item.filename}`}
      >
        <InlineMedia item={item} previewable={preview.ready} onError={preview.fail} />
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
  const preview = useInlinePreview(item);

  useHistoryTrap({
    id: "media",
    active: true,
    onBack: onClose,
  });

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
        <LightboxMedia
          item={item}
          previewable={preview.ready}
          onError={preview.fail}
          onKeepOpen={keepOpen}
        />
        <p onClick={keepOpen}>{item.filename}</p>
      </div>
    </div>
  );
}

function useInlinePreview(item: MediaItem): {
  ready: boolean;
  fail: () => void;
} {
  const [failed, setFailed] = useState(false);
  return {
    ready: canPreviewInline(item.contentType, item.kind) && !failed,
    fail: () => setFailed(true),
  };
}

function InlineMedia({
  item,
  previewable,
  onError,
}: {
  item: MediaItem;
  previewable: boolean;
  onError: () => void;
}) {
  if (previewable && item.kind === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.src} alt="" onError={onError} />;
  }
  if (previewable && item.kind === "video") {
    return (
      <video
        src={item.src}
        muted
        playsInline
        preload="metadata"
        onError={onError}
      />
    );
  }
  return <span className="media-thumb-fallback">{item.filename}</span>;
}

function LightboxMedia({
  item,
  previewable,
  onError,
  onKeepOpen,
}: {
  item: MediaItem;
  previewable: boolean;
  onError: () => void;
  onKeepOpen: (event: MouseEvent<HTMLElement>) => void;
}) {
  if (previewable && item.kind === "image") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.src}
        alt={item.filename}
        onClick={onKeepOpen}
        onError={onError}
      />
    );
  }
  if (previewable && item.kind === "video") {
    return (
      <video
        src={item.src}
        controls
        autoPlay
        playsInline
        onClick={onKeepOpen}
        onError={onError}
      />
    );
  }
  if (previewable && item.kind === "audio") {
    return (
      <div onClick={onKeepOpen}>
        <VoiceNotePlayer src={item.src} filename={item.filename} />
      </div>
    );
  }
  return (
    <a
      className="media-lightbox-link"
      href={item.src}
      target="_blank"
      rel="noreferrer"
      onClick={onKeepOpen}
    >
      {item.filename}
    </a>
  );
}
