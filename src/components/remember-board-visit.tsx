"use client";

import { useEffect } from "react";
import { OWNER_LAST_BOARD_API_PATH } from "@/lib/constants";

type RememberBoardVisitProps = {
  path: string;
};

export function RememberBoardVisit({ path }: RememberBoardVisitProps) {
  useEffect(() => {
    const controller = new AbortController();
    void fetch(OWNER_LAST_BOARD_API_PATH, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      signal: controller.signal,
    }).catch(() => {
      // Navigation abort or a transient miss; the next visit retries.
    });
    return () => controller.abort();
  }, [path]);

  return null;
}
