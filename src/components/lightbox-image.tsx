"use client";

import { useEffect, useRef, type PointerEvent, type RefObject } from "react";
import type { useLightboxZoom } from "@/lib/use-lightbox-zoom";

type ZoomControls = ReturnType<typeof useLightboxZoom>;

type LightboxStageProps = {
  src: string;
  filename: string;
  stageRef: RefObject<HTMLDivElement | null>;
  zoom: ZoomControls;
  onError: () => void;
};

export function LightboxStage({
  src,
  filename,
  stageRef,
  zoom,
  onError,
}: LightboxStageProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const setNaturalSize = zoom.setNaturalSize;
  const framed = zoom.frame.width > 0;
  const visualWidth = framed ? zoom.frame.width * zoom.zoom.scale : undefined;
  const visualHeight = framed ? zoom.frame.height * zoom.zoom.scale : undefined;

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete) {
      setNaturalSize(image.naturalWidth, image.naturalHeight);
    }
  }, [src, setNaturalSize]);

  return (
    <div
      ref={stageRef}
      className={[
        "media-lightbox-stage",
        zoom.zoom.scale > 1.01 ? "is-zoomed" : "",
        zoom.canZoomIn ? "" : "is-max",
      ]
        .filter(Boolean)
        .join(" ")}
      onPointerDown={zoom.onPointerDown}
      onPointerMove={zoom.onPointerMove}
      onPointerUp={zoom.onPointerUp}
      onPointerCancel={zoom.onPointerUp}
      onClick={zoom.onStageClick}
    >
      <div
        className={[
          "media-lightbox-zoom",
          framed ? "is-framed" : "",
          zoom.animating ? "is-animating" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: visualWidth,
          height: visualHeight,
          transform: framed
            ? `translate(-50%, -50%) translate(${zoom.zoom.x}px, ${zoom.zoom.y}px)`
            : `translate(${zoom.zoom.x}px, ${zoom.zoom.y}px) scale(${zoom.zoom.scale})`,
        }}
        onTransitionEnd={(event) => {
          if (
            event.target === event.currentTarget &&
            (event.propertyName === "transform" ||
              event.propertyName === "width" ||
              event.propertyName === "height")
          ) {
            zoom.clearAnimating();
          }
        }}
      >
        {/* Signed R2 URLs are not in the next/image loader. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imageRef}
          src={src}
          alt={filename}
          draggable={false}
          style={
            framed
              ? {
                  width: "100%",
                  height: "100%",
                  maxWidth: "none",
                  maxHeight: "none",
                }
              : undefined
          }
          onLoad={(event) => {
            setNaturalSize(
              event.currentTarget.naturalWidth,
              event.currentTarget.naturalHeight,
            );
          }}
          onError={onError}
        />
      </div>
    </div>
  );
}

export function LightboxZoomRail({
  label,
  progress,
  animating,
  onChange,
}: {
  label: string;
  progress: number;
  animating: boolean;
  onChange: (progress: number, live?: boolean) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  function progressFromClientY(clientY: number): number {
    const track = trackRef.current;
    if (!track) {
      return progress;
    }
    const rect = track.getBoundingClientRect();
    if (rect.height <= 0) {
      return progress;
    }
    return Math.min(1, Math.max(0, 1 - (clientY - rect.top) / rect.height));
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>): void {
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    onChange(progressFromClientY(event.clientY), true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>): void {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }
    onChange(progressFromClientY(event.clientY), true);
  }

  return (
    <div
      className={
        animating
          ? "media-lightbox-zoom-rail is-animating"
          : "media-lightbox-zoom-rail"
      }
      onClick={(event) => event.stopPropagation()}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(event) => event.stopPropagation()}
      onPointerCancel={(event) => event.stopPropagation()}
    >
      <div ref={trackRef} className="media-lightbox-zoom-rail-track">
        <span className="media-lightbox-zoom-rail-fill" style={{ height: `${progress * 100}%` }} />
        <span
          className="media-lightbox-zoom-rail-thumb"
          style={{ top: `${(1 - progress) * 100}%` }}
          role="slider"
          aria-label={label}
          aria-orientation="vertical"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
        />
      </div>
    </div>
  );
}

function LightboxZoomTools({
  zoomInLabel,
  zoomOutLabel,
  canZoomIn,
  canZoomOut,
  onZoomIn,
  onZoomOut,
}: {
  zoomInLabel: string;
  zoomOutLabel: string;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="media-lightbox-tool"
        aria-label={zoomOutLabel}
        disabled={!canZoomOut}
        onClick={onZoomOut}
      >
        −
      </button>
      <button
        type="button"
        className="media-lightbox-tool"
        aria-label={zoomInLabel}
        disabled={!canZoomIn}
        onClick={onZoomIn}
      >
        +
      </button>
    </>
  );
}

export function LightboxToolbar({
  closeLabel,
  onClose,
  zoom,
  zoomInLabel,
  zoomOutLabel,
}: {
  closeLabel: string;
  onClose: () => void;
  zoom: ZoomControls | null;
  zoomInLabel: string;
  zoomOutLabel: string;
}) {
  return (
    <div
      className="media-lightbox-tools"
      onClick={(event) => event.stopPropagation()}
    >
      {zoom ? (
        <LightboxZoomTools
          zoomInLabel={zoomInLabel}
          zoomOutLabel={zoomOutLabel}
          canZoomIn={zoom.canZoomIn}
          canZoomOut={zoom.canZoomOut}
          onZoomIn={zoom.zoomIn}
          onZoomOut={zoom.zoomOut}
        />
      ) : null}
      <button
        type="button"
        className="media-lightbox-tool"
        aria-label={closeLabel}
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
