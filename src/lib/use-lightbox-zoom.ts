"use client";

import {
  useCallback,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  applyLightboxPan,
  applyLightboxPinch,
  toggleLightboxAtPoint,
  useLightboxKeyboardZoom,
  useLightboxTouchGuard,
  useLightboxWheelZoom,
} from "@/lib/lightbox-zoom-gestures";
import {
  LIGHTBOX_ZOOM_HARD_CAP,
  LIGHTBOX_ZOOM_RESET,
  alignZoomToTop,
  clampPan,
  clampScale,
  nextScaleDown,
  nextScaleUp,
  pointerDistance,
  readLightboxLayout,
  zoomAtPoint,
  type LightboxLayout,
  type LightboxZoom,
} from "@/lib/lightbox-zoom";

type Point = { x: number; y: number };

type UseLightboxZoomOptions = {
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
};

/**
 * Pinch, wheel, pan, and stepped zoom for the image lightbox.
 */
export function useLightboxZoom({
  stageRef,
  enabled,
}: UseLightboxZoomOptions) {
  const [zoom, setZoom] = useState<LightboxZoom>(LIGHTBOX_ZOOM_RESET);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [maxScale, setMaxScale] = useState(LIGHTBOX_ZOOM_HARD_CAP);
  const [frame, setFrame] = useState({ width: 0, height: 0, containScale: 1 });
  const zoomRef = useRef(LIGHTBOX_ZOOM_RESET);
  const naturalRef = useRef({ width: 0, height: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ lastDist: number } | null>(null);
  const panOriginRef = useRef<Point | null>(null);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const lastToggleAtRef = useRef(0);

  const commit = useCallback(
    (next: LightboxZoom, layout: LightboxLayout | null): void => {
      const clamped = layout
        ? clampPan(
            { ...next, scale: clampScale(next.scale, layout.maxScale) },
            layout,
          )
        : next;
      zoomRef.current = clamped;
      setZoom(clamped);
      if (layout) {
        setMaxScale(layout.maxScale);
        const width = naturalRef.current.width;
        setFrame({
          width: layout.displayWidth,
          height: layout.displayHeight,
          containScale: width > 0 ? layout.displayWidth / width : 1,
        });
      }
    },
    [],
  );

  const readLayout = useCallback((): LightboxLayout | null => {
    const stage = stageRef.current;
    const size = naturalRef.current;
    if (!stage || size.width <= 0) {
      return null;
    }
    const rect = stage.getBoundingClientRect();
    return readLightboxLayout(
      rect.width,
      rect.height,
      size.width,
      size.height,
    );
  }, [stageRef]);

  const zoomIn = useCallback(() => {
    const layout = readLayout();
    if (!layout) {
      return;
    }
    const current = zoomRef.current;
    const nextScale = nextScaleUp(
      current.scale,
      layout.maxScale,
      layout.readableScale,
    );
    const next = zoomAtPoint({
      current,
      nextScale,
      focusX: 0,
      focusY: 0,
    });
    commit(
      current.scale <= 1.05 ? alignZoomToTop(next, layout) : next,
      layout,
    );
  }, [commit, readLayout]);

  const zoomOut = useCallback(() => {
    const layout = readLayout();
    if (!layout) {
      return;
    }
    commit(
      {
        ...zoomRef.current,
        scale: nextScaleDown(zoomRef.current.scale, layout.readableScale),
      },
      layout,
    );
  }, [commit, readLayout]);

  const reset = useCallback(() => {
    zoomRef.current = LIGHTBOX_ZOOM_RESET;
    setZoom(LIGHTBOX_ZOOM_RESET);
  }, []);

  const setNaturalSize = useCallback(
    (width: number, height: number) => {
      if (width <= 0 || height <= 0) {
        return;
      }
      const current = naturalRef.current;
      if (current.width === width && current.height === height) {
        return;
      }
      naturalRef.current = { width, height };
      setNatural({ width, height });
      const layout = readLayout();
      if (layout) {
        setMaxScale(layout.maxScale);
        setFrame({
          width: layout.displayWidth,
          height: layout.displayHeight,
          containScale: layout.displayWidth / width,
        });
      }
    },
    [readLayout],
  );

  const onPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      event.currentTarget.setPointerCapture(event.pointerId);
      movedRef.current = false;
      if (pointersRef.current.size === 1) {
        panOriginRef.current = { x: event.clientX, y: event.clientY };
        pinchRef.current = null;
        return;
      }
      const points = [...pointersRef.current.values()];
      const first = points[0];
      const second = points[1];
      if (first && second) {
        pinchRef.current = { lastDist: pointerDistance(first, second) };
        panOriginRef.current = null;
        suppressClickRef.current = true;
      }
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled || !pointersRef.current.has(event.pointerId)) {
        return;
      }
      const previous = pointersRef.current.get(event.pointerId);
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      const layout = readLayout();
      if (!layout || !previous) {
        return;
      }
      if (pointersRef.current.size >= 2 && pinchRef.current) {
        applyLightboxPinch(
          event.currentTarget,
          pointersRef.current,
          pinchRef.current,
          zoomRef.current,
          layout,
          commit,
        );
        movedRef.current = true;
        return;
      }
      applyLightboxPan(
        event,
        previous,
        panOriginRef.current,
        movedRef,
        suppressClickRef,
        zoomRef.current,
        layout,
        commit,
      );
    },
    [commit, enabled, readLayout],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) {
        return;
      }
      pointersRef.current.delete(event.pointerId);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (pointersRef.current.size < 2) {
        pinchRef.current = null;
      }
      if (pointersRef.current.size === 0) {
        panOriginRef.current = null;
      }
    },
    [enabled],
  );

  const onStageClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      if (suppressClickRef.current) {
        event.stopPropagation();
        suppressClickRef.current = false;
        return;
      }
      if (event.target instanceof HTMLImageElement) {
        event.stopPropagation();
        toggleLightboxAtPoint(
          event.clientX,
          event.clientY,
          stageRef.current,
          zoomRef.current,
          lastToggleAtRef,
          readLayout,
          commit,
        );
        return;
      }
      if (zoomRef.current.scale > 1.05) {
        event.stopPropagation();
        reset();
      }
    },
    [commit, readLayout, reset, stageRef],
  );

  useLightboxWheelZoom(stageRef, enabled, zoomRef, readLayout, commit);
  useLightboxKeyboardZoom(enabled, zoomIn, zoomOut);
  useLightboxTouchGuard(enabled, zoomRef);

  return {
    zoom,
    frame,
    natural,
    canZoomIn: natural.width > 0 && zoom.scale < maxScale - 0.02,
    canZoomOut: zoom.scale > 1.02,
    zoomIn,
    zoomOut,
    setNaturalSize,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onStageClick,
  };
}
