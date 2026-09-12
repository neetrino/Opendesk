"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  activitySignature,
  BOARD_ACTIVITY_POLL_MS,
  boardActivityResponseSchema,
  toBoardActivityMap,
  type BoardActivityMap,
} from "@/lib/board-activity";

export function useBoardActivity(boardId: string): BoardActivityMap {
  const router = useRouter();
  const [activity, setActivity] = useState<BoardActivityMap>({});
  const signatureRef = useRef<string>("");

  useEffect(() => {
    let cancelled = false;

    async function pull(): Promise<void> {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const response = await fetch(`/api/boards/${boardId}/activity`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }

        const parsed = boardActivityResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success || cancelled) {
          return;
        }

        const signature = activitySignature(parsed.data.cards);
        if (signatureRef.current && signatureRef.current !== signature) {
          router.refresh();
        }
        signatureRef.current = signature;
        setActivity(toBoardActivityMap(parsed.data.cards));
      } catch {
        // Next poll retries. Do not surface a board-wide error for a miss.
      }
    }

    void pull();
    const timer = window.setInterval(() => {
      void pull();
    }, BOARD_ACTIVITY_POLL_MS);

    function onVisibility(): void {
      if (document.visibilityState === "visible") {
        void pull();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [boardId, router]);

  return activity;
}
