"use client";

import {
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  LIGHTBOX_PAN_THRESHOLD_PX,
  clampScale,
  nextScaleDown,
  nextScaleUp,
  panZoom,
  pointerDistance,
  pointerMidpoint,
  stageFocus,
  zoomAtPoint,
  type LightboxLayout,
  type LightboxZoom,
} from "@/lib/lightbox-zoom";

type Point = { x: number; y: number };

export function applyLightboxPan(
  event: ReactPointerEvent<HTMLElement>,
  previous: Point,
  origin: Point | null,
  movedRef: { current: boolean },
  suppressClickRef: { current: boolean },
  current: LightboxZoom,
  layout: LightboxLayout,
  commit: (next: LightboxZoom, layout: LightboxLayout) => void,
): void {
  if (!origin || current.scale <= 1.01) {
    return;
  }
  if (
    Math.hypot(event.clientX - origin.x, event.clientY - origin.y) >=
    LIGHTBOX_PAN_THRESHOLD_PX
  ) {
    movedRef.current = true;
    suppressClickRef.current = true;
  }
  if (movedRef.current) {
    commit(
      panZoom(current, event.clientX - previous.x, event.clientY - previous.y),
      layout,
    );
  }
}

export function applyLightboxPinch(
  stage: HTMLElement,
  pointers: Map<number, Point>,
  pinch: { lastDist: number },
  current: LightboxZoom,
  layout: LightboxLayout,
  commit: (next: LightboxZoom, layout: LightboxLayout) => void,
): void {
  const points = [...pointers.values()];
  const first = points[0];
  const second = points[1];
  if (!first || !second || pinch.lastDist <= 0) {
    return;
  }
  const dist = pointerDistance(first, second);
  const mid = pointerMidpoint(first, second);
  const focus = stageFocus(mid.x, mid.y, stage.getBoundingClientRect());
  const nextScale = clampScale(
    current.scale * (dist / pinch.lastDist),
    layout.maxScale,
  );
  pinch.lastDist = dist;
  commit(zoomAtPoint({ current, nextScale, ...focus }), layout);
}

export function useLightboxWheel(
  stageRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  zoomRef: RefObject<LightboxZoom>,
  readLayout: () => LightboxLayout | null,
  commit: (next: LightboxZoom, layout: LightboxLayout | null) => void,
  markLive: () => void,
  stepZoom: (nextScale: number, focusX: number, focusY: number) => void,
): void {
  useEffect(() => {
    const stage = stageRef.current;
    if (!enabled || !stage) {
      return;
    }
    function onWheel(event: WheelEvent): void {
      event.preventDefault();
      const layout = readLayout();
      const target = event.currentTarget;
      if (!layout || !(target instanceof HTMLElement)) {
        return;
      }
      const current = zoomRef.current;
      if (current.scale > 1.01) {
        markLive();
        commit(panZoom(current, 0, -event.deltaY), layout);
        return;
      }
      const focus = stageFocus(
        event.clientX,
        event.clientY,
        target.getBoundingClientRect(),
      );
      const nextScale =
        event.deltaY < 0
          ? nextScaleUp(current.scale, layout.maxScale)
          : nextScaleDown(current.scale, layout.maxScale);
      stepZoom(nextScale, focus.focusX, focus.focusY);
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [
    commit,
    enabled,
    markLive,
    readLayout,
    stageRef,
    stepZoom,
    zoomRef,
  ]);
}

export function useLightboxKeyboardZoom(
  enabled: boolean,
  zoomIn: () => void,
  zoomOut: () => void,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoomIn();
      }
      if (event.key === "-" || event.key === "_") {
        event.preventDefault();
        zoomOut();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, zoomIn, zoomOut]);
}

export function useLightboxTouchGuard(
  enabled: boolean,
  zoomRef: RefObject<LightboxZoom>,
): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    function onTouchStart(event: TouchEvent): void {
      if (event.touches.length >= 2 || zoomRef.current.scale > 1) {
        event.stopImmediatePropagation();
      }
    }
    window.addEventListener("touchstart", onTouchStart, {
      capture: true,
      passive: true,
    });
    return () => window.removeEventListener("touchstart", onTouchStart, true);
  }, [enabled, zoomRef]);
}
