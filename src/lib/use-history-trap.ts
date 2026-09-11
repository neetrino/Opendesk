"use client";

import { useEffect, useRef } from "react";
import {
  destinationLeavesPage,
  isEdgeBackSwipe,
  isOverlayEdgeStart,
  overlayHref,
  parseOverlayHash,
  shouldBlockBrowserBack,
  shouldPopOverlayEntry,
  stripOverlayHash,
  type OverlayLayerId,
} from "@/lib/overlay-history";

type OverlayRegistration = {
  id: OverlayLayerId;
  onBack: () => void;
};

type NavigateLikeEvent = Event & {
  navigationType?: string;
  canIntercept?: boolean;
  destination?: { url: string };
  intercept?: (options: { handler: () => Promise<void> }) => void;
};

type NavigationLike = {
  addEventListener: (
    type: "navigate",
    listener: (event: NavigateLikeEvent) => void,
  ) => void;
  removeEventListener: (
    type: "navigate",
    listener: (event: NavigateLikeEvent) => void,
  ) => void;
};

const stack: OverlayRegistration[] = [];
let listening = false;

function windowNavigation(): NavigationLike | null {
  const value: unknown = Reflect.get(window, "navigation");
  if (
    typeof value !== "object" ||
    value === null ||
    !("addEventListener" in value) ||
    !("removeEventListener" in value)
  ) {
    return null;
  }
  return value as NavigationLike;
}

function closeTopOverlay(): void {
  const top = stack[stack.length - 1];
  top?.onBack();
}

function onPopState(): void {
  closeTopOverlay();
}

function onNavigate(event: NavigateLikeEvent): void {
  if (event.navigationType !== "traverse" || stack.length === 0) {
    return;
  }
  if (!event.canIntercept || typeof event.intercept !== "function") {
    return;
  }
  const destination = event.destination?.url;
  if (!destination) {
    return;
  }
  if (!destinationLeavesPage(window.location.href, destination)) {
    return;
  }
  event.intercept({
    handler: async () => {
      closeTopOverlay();
    },
  });
}

function bindListeners(): void {
  if (listening) {
    return;
  }
  listening = true;
  window.addEventListener("popstate", onPopState);
  windowNavigation()?.addEventListener("navigate", onNavigate);
}

function unbindListenersIfIdle(): void {
  if (stack.length > 0 || !listening) {
    return;
  }
  listening = false;
  window.removeEventListener("popstate", onPopState);
  windowNavigation()?.removeEventListener("navigate", onNavigate);
}

type UseHistoryTrapOptions = {
  id: OverlayLayerId;
  active: boolean;
  onBack: () => void;
};

/**
 * One history step per overlay. Swipe-back / Android back closes only the
 * top layer. A same-document hash keeps iOS from jumping to /boards.
 */
export function useHistoryTrap({
  id,
  active,
  onBack,
}: UseHistoryTrapOptions): void {
  const onBackRef = useRef(onBack);
  const pushedRef = useRef(false);
  const entryRef = useRef<OverlayRegistration | null>(null);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) {
      return;
    }

    const entry: OverlayRegistration = {
      id,
      onBack: () => onBackRef.current(),
    };
    stack.push(entry);
    entryRef.current = entry;
    bindListeners();

    if (parseOverlayHash(window.location.hash) !== id) {
      window.history.pushState(
        window.history.state,
        "",
        overlayHref(window.location.href, id),
      );
      pushedRef.current = true;
    }

    let startX: number | null = null;
    let startY: number | null = null;

    function isTop(): boolean {
      return stack[stack.length - 1] === entry;
    }

    function onTouchStart(event: TouchEvent): void {
      if (!isTop()) {
        return;
      }
      const touch = event.touches[0];
      if (!touch || !isOverlayEdgeStart(touch.clientX, touch.clientY)) {
        return;
      }
      startX = touch.clientX;
      startY = touch.clientY;
    }

    function onTouchMove(event: TouchEvent): void {
      if (startX === null || startY === null || !isTop()) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      if (
        shouldBlockBrowserBack({
          startX,
          startY,
          currentX: touch.clientX,
          currentY: touch.clientY,
        })
      ) {
        event.preventDefault();
      }
    }

    function onTouchEnd(event: TouchEvent): void {
      if (startX === null || startY === null) {
        return;
      }
      const touch = event.changedTouches[0];
      const started = { startX, startY };
      startX = null;
      startY = null;
      if (!touch || !isTop()) {
        return;
      }
      if (
        isEdgeBackSwipe({
          startX: started.startX,
          startY: started.startY,
          endX: touch.clientX,
          endY: touch.clientY,
        })
      ) {
        onBackRef.current();
      }
    }

    window.addEventListener("touchstart", onTouchStart, {
      passive: true,
      capture: true,
    });
    window.addEventListener("touchmove", onTouchMove, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchend", onTouchEnd, {
      passive: true,
      capture: true,
    });

    return () => {
      window.removeEventListener("touchstart", onTouchStart, true);
      window.removeEventListener("touchmove", onTouchMove, true);
      window.removeEventListener("touchend", onTouchEnd, true);

      const index = stack.lastIndexOf(entry);
      if (index >= 0) {
        stack.splice(index, 1);
      }
      entryRef.current = null;

      if (shouldPopOverlayEntry(pushedRef.current, window.location.hash, id)) {
        const remaining = stack[stack.length - 1];
        const href = remaining
          ? overlayHref(window.location.href, remaining.id)
          : stripOverlayHash(window.location.href);
        window.history.replaceState(window.history.state, "", href);
      }
      pushedRef.current = false;

      unbindListenersIfIdle();
    };
  }, [active, id]);
}
