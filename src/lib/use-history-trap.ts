"use client";

import { useEffect, useRef } from "react";
import { hasOverlayMarker, withOverlayMarker } from "@/lib/overlay-history";

type UseHistoryTrapOptions = {
  active: boolean;
  marker: string;
  onBack: () => void;
};

/**
 * While an overlay is open, swipe-back / Android back closes it instead
 * of leaving the page. Closing the overlay pops the extra history entry.
 */
export function useHistoryTrap({
  active,
  marker,
  onBack,
}: UseHistoryTrapOptions): void {
  const onBackRef = useRef(onBack);
  const pushedRef = useRef(false);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) {
      return;
    }

    if (!hasOverlayMarker(window.history.state, marker)) {
      window.history.pushState(
        withOverlayMarker(window.history.state, marker),
        "",
        window.location.href,
      );
      pushedRef.current = true;
    }

    function onPopState(): void {
      pushedRef.current = false;
      onBackRef.current();
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (
        pushedRef.current &&
        hasOverlayMarker(window.history.state, marker)
      ) {
        pushedRef.current = false;
        window.history.back();
      }
    };
  }, [active, marker]);
}
