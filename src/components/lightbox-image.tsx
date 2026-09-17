"use client";

import { useEffect, useRef, type RefObject } from "react";
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

  useEffect(() => {
    const image = imageRef.current;
    if (image?.complete) {
      setNaturalSize(image.naturalWidth, image.naturalHeight);
    }
  }, [src, setNaturalSize]);

  const framed = zoom.natural.width > 0 && zoom.frame.width > 0;
  const cssScale = framed
    ? zoom.frame.containScale * zoom.zoom.scale
    : zoom.zoom.scale;

  return (
    <div
      ref={stageRef}
      className={
        zoom.zoom.scale > 1.01
          ? "media-lightbox-stage is-zoomed"
          : "media-lightbox-stage"
      }
      onPointerDown={zoom.onPointerDown}
      onPointerMove={zoom.onPointerMove}
      onPointerUp={zoom.onPointerUp}
      onPointerCancel={zoom.onPointerUp}
      onClick={zoom.onStageClick}
    >
      <div
        className={framed ? "media-lightbox-zoom is-framed" : "media-lightbox-zoom"}
        style={{
          width: framed ? zoom.natural.width : undefined,
          height: framed ? zoom.natural.height : undefined,
          marginLeft: framed ? -zoom.natural.width / 2 : undefined,
          marginTop: framed ? -zoom.natural.height / 2 : undefined,
          transform: `translate(${zoom.zoom.x}px, ${zoom.zoom.y}px) scale(${cssScale})`,
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
