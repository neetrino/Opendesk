"use client";

import { useEffect, useRef } from "react";

type LoadMoreSentinelProps = {
  active: boolean;
  onVisible: () => void;
};

/**
 * Fires when the sentinel enters the nearest scrollport.
 * Hidden columns (display:none) do not intersect, so they stay idle.
 */
export function LoadMoreSentinel({
  active,
  onVisible,
}: LoadMoreSentinelProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !active) {
      return;
    }

    const root = node.parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onVisible();
        }
      },
      { root, rootMargin: "80px 0px" },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [active, onVisible]);

  return <div ref={ref} className="load-more-sentinel" aria-hidden="true" />;
}
