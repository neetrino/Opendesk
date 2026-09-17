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
  useLightboxKeyboardZoom,
  useLightboxTouchGuard,
  useLightboxWheel,
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
  scaleFromZoomProgress,
  zoomAtPoint,
  zoomProgress,
  type LightboxLayout,
  type LightboxZoom,
} from "@/lib/lightbox-zoom";

type Point = { x: number; y: number };

type UseLightboxZoomOptions = {
  stageRef: RefObject<HTMLElement | null>;
  enabled: boolean;
};

/**
 * Pinch, wheel, pan, and 20% stepped zoom for the image lightbox.
 */
export function useLightboxZoom({
  stageRef,
  enabled,
}: UseLightboxZoomOptions) {
  const [zoom, setZoom] = useState<LightboxZoom>(LIGHTBOX_ZOOM_RESET);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [maxScale, setMaxScale] = useState(LIGHTBOX_ZOOM_HARD_CAP);
  const [frame, setFrame] = useState({ width: 0, height: 0, containScale: 1 });
  const [animating, setAnimating] = useState(false);
  const zoomRef = useRef(LIGHTBOX_ZOOM_RESET);
  const naturalRef = useRef({ width: 0, height: 0 });
  const pointersRef = useRef(new Map<number, Point>());
  const pinchRef = useRef<{ lastDist: number } | null>(null);
  const panOriginRef = useRef<Point | null>(null);
  const movedRef = useRef(false);
  const suppressClickRef = useRef(false);

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

  const markLive = useCallback(() => {
    setAnimating(false);
  }, []);

  const applySteppedScale = useCallback(
    (nextScale: number, focusX: number, focusY: number) => {
      const layout = readLayout();
      if (!layout) {
        return;
      }
      setAnimating(true);
      const current = zoomRef.current;
      const next = zoomAtPoint({ current, nextScale, focusX, focusY });
      commit(
        current.scale <= 1.05 ? alignZoomToTop(next, layout) : next,
        layout,
      );
    },
    [commit, readLayout],
  );

  const zoomIn = useCallback(() => {
    const layout = readLayout();
    if (!layout) {
      return;
    }
    applySteppedScale(
      nextScaleUp(zoomRef.current.scale, layout.maxScale),
      0,
      0,
    );
  }, [applySteppedScale, readLayout]);

  const zoomOut = useCallback(() => {
    const layout = readLayout();
    if (!layout) {
      return;
    }
    applySteppedScale(
      nextScaleDown(zoomRef.current.scale, layout.maxScale),
      0,
      0,
    );
  }, [applySteppedScale, readLayout]);

  const setProgress = useCallback(
    (progress: number, live = false) => {
      const layout = readLayout();
      if (!layout) {
        return;
      }
      if (live) {
        markLive();
      }
      const nextScale = scaleFromZoomProgress(progress, layout.maxScale);
      const current = zoomRef.current;
      const next = zoomAtPoint({
        current,
        nextScale,
        focusX: 0,
        focusY: 0,
      });
      if (!live) {
        setAnimating(true);
      }
      commit(
        current.scale <= 1.05 ? alignZoomToTop(next, layout) : next,
        layout,
      );
    },
    [commit, markLive, readLayout],
  );

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
      movedRef.current = false;
      if (pointersRef.current.size >= 2) {
        event.currentTarget.setPointerCapture(event.pointerId);
      }
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
        markLive();
      }
    },
    [enabled, markLive],
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
        markLive();
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
      const before = zoomRef.current;
      applyLightboxPan(
        event,
        previous,
        panOriginRef.current,
        movedRef,
        suppressClickRef,
        before,
        layout,
        commit,
      );
      if (movedRef.current) {
        markLive();
        if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      }
    },
    [commit, enabled, markLive, readLayout],
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
      const wrap = event.currentTarget.querySelector(".media-lightbox-zoom");
      const onPhoto =
        wrap instanceof HTMLElement &&
        isClientPointInRect(event.clientX, event.clientY, wrap.getBoundingClientRect());
      if (onPhoto) {
        event.stopPropagation();
        const layout = readLayout();
        if (!layout || !stageRef.current) {
          return;
        }
        const focus = {
          clientX: event.clientX,
          clientY: event.clientY,
        };
        const rect = stageRef.current.getBoundingClientRect();
        applySteppedScale(
          nextScaleUp(zoomRef.current.scale, layout.maxScale),
          focus.clientX - (rect.left + rect.width / 2),
          focus.clientY - (rect.top + rect.height / 2),
        );
        return;
      }
      if (zoomRef.current.scale > 1.05) {
        event.stopPropagation();
      }
    },
    [applySteppedScale, readLayout, stageRef],
  );

  useLightboxWheel(
    stageRef,
    enabled,
    zoomRef,
    readLayout,
    commit,
    markLive,
    applySteppedScale,
  );
  useLightboxKeyboardZoom(enabled, zoomIn, zoomOut);
  useLightboxTouchGuard(enabled, zoomRef);

  return {
    zoom,
    frame,
    natural,
    animating,
    progress: zoomProgress(zoom.scale, maxScale),
    canZoomIn: natural.width > 0 && zoom.scale < maxScale - 0.02,
    canZoomOut: zoom.scale > 1.02,
    zoomIn,
    zoomOut,
    setProgress,
    setNaturalSize,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onStageClick,
    clearAnimating: markLive,
  };
}

function isClientPointInRect(
  clientX: number,
  clientY: number,
  rect: DOMRect,
): boolean {
  return (
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}
