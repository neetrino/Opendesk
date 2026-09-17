"use client";

import {
  useEffect,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  LIGHTBOX_PAN_THRESHOLD_PX,
  LIGHTBOX_TOGGLE_IGNORE_MS,
  LIGHTBOX_ZOOM_WHEEL,
  clampScale,
  panZoom,
  pointerDistance,
  pointerMidpoint,
  stageFocus,
  toggleLightboxScale,
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

export function toggleLightboxAtPoint(
  clientX: number,
  clientY: number,
  stage: HTMLElement | null,
  current: LightboxZoom,
  lastToggleAtRef: { current: number },
  readLayout: () => LightboxLayout | null,
  commit: (next: LightboxZoom, layout: LightboxLayout) => void,
): void {
  const now = Date.now();
  if (now - lastToggleAtRef.current < LIGHTBOX_TOGGLE_IGNORE_MS) {
    return;
  }
  lastToggleAtRef.current = now;
  const layout = readLayout();
  if (!layout || !stage) {
    return;
  }
  const focus = stageFocus(clientX, clientY, stage.getBoundingClientRect());
  const nextScale = toggleLightboxScale(
    current.scale,
    layout.maxScale,
    layout.readableScale,
  );
  commit(zoomAtPoint({ current, nextScale, ...focus }), layout);
}

export function useLightboxWheelZoom(
  stageRef: RefObject<HTMLElement | null>,
  enabled: boolean,
  zoomRef: RefObject<LightboxZoom>,
  readLayout: () => LightboxLayout | null,
  commit: (next: LightboxZoom, layout: LightboxLayout | null) => void,
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
      const factor =
        event.deltaY > 0 ? 1 / LIGHTBOX_ZOOM_WHEEL : LIGHTBOX_ZOOM_WHEEL;
      const focus = stageFocus(
        event.clientX,
        event.clientY,
        target.getBoundingClientRect(),
      );
      commit(
        zoomAtPoint({
          current: zoomRef.current,
          nextScale: zoomRef.current.scale * factor,
          ...focus,
        }),
        layout,
      );
    }
    stage.addEventListener("wheel", onWheel, { passive: false });
    return () => stage.removeEventListener("wheel", onWheel);
  }, [commit, enabled, readLayout, stageRef, zoomRef]);
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
