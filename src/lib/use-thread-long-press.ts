"use client";

import { useRef } from "react";
import type { PointerEvent } from "react";
const LONG_PRESS_MS = 460;
const MOVE_CANCEL_PX = 8;

type PressPoint = {
  x: number;
  y: number;
};

type LongPressHandlers = {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
};

export function useThreadLongPress(
  onFire: () => void,
  enabled: boolean,
): LongPressHandlers {
  const timerRef = useRef(0);
  const originRef = useRef<PressPoint | null>(null);

  function clear(): void {
    window.clearTimeout(timerRef.current);
    timerRef.current = 0;
    originRef.current = null;
  }

  return {
    onPointerDown(event) {
      if (!enabled || event.pointerType !== "touch") {
        return;
      }
      originRef.current = { x: event.clientX, y: event.clientY };
      timerRef.current = window.setTimeout(() => {
        const origin = originRef.current;
        if (!origin) {
          return;
        }
        onFire();
        clear();
      }, LONG_PRESS_MS);
    },
    onPointerMove(event) {
      const origin = originRef.current;
      if (!origin) {
        return;
      }
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (dx * dx + dy * dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) {
        clear();
      }
    },
    onPointerUp: clear,
    onPointerCancel: clear,
  };
}
