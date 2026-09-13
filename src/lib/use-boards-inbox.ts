"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BOARDS_INBOX_POLL_MS,
  boardsInboxResponseSchema,
  type BoardsInboxBoard,
} from "@/lib/board-activity";
import {
  countBoardInbox,
  emptyInboxCounts,
  getClientCardReadState,
  resolveSeededAt,
  subscribeAllCardReads,
  type BoardInboxCounts,
} from "@/lib/card-reads";
import { OWNER_BOARDS_ACTIVITY_API_PATH } from "@/lib/constants";

function countsForBoard(board: BoardsInboxBoard): BoardInboxCounts {
  const state = getClientCardReadState(
    board.id,
    board.participantId,
    board.cards.map((card) => card.id),
  );
  return countBoardInbox(
    board.cards,
    state.reads,
    resolveSeededAt(state),
    board.participantId,
  );
}

export function useBoardsInbox(): {
  countsByBoardId: Record<string, BoardInboxCounts>;
} {
  const [inbox, setInbox] = useState<BoardsInboxBoard[]>([]);
  const [readsTick, setReadsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function pull(): Promise<void> {
      if (document.visibilityState === "hidden") {
        return;
      }

      try {
        const response = await fetch(OWNER_BOARDS_ACTIVITY_API_PATH, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }

        const parsed = boardsInboxResponseSchema.safeParse(
          await response.json(),
        );
        if (!parsed.success || cancelled) {
          return;
        }

        setInbox(parsed.data.boards);
      } catch {
        // Next pull retries. Do not block the board list on a miss.
      }
    }

    void pull();
    const timer = window.setInterval(() => {
      void pull();
    }, BOARDS_INBOX_POLL_MS);

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
  }, []);

  useEffect(() => subscribeAllCardReads(() => {
    setReadsTick((current) => current + 1);
  }), []);

  const countsByBoardId = useMemo(() => {
    void readsTick;
    const next: Record<string, BoardInboxCounts> = {};
    for (const board of inbox) {
      next[board.id] = countsForBoard(board);
    }
    return next;
  }, [inbox, readsTick]);

  return { countsByBoardId };
}

export function inboxCountsFor(
  countsByBoardId: Record<string, BoardInboxCounts>,
  boardId: string,
): BoardInboxCounts {
  return countsByBoardId[boardId] ?? emptyInboxCounts();
}
