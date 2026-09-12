"use client";

import { useCallback, useRef, useState } from "react";
import type { CardStatus } from "@prisma/client";
import {
  boardCardsResponseSchema,
  parseBoardCard,
  type BoardColumnPages,
} from "@/lib/board-card-view";
import { CARD_STATUSES } from "@/lib/constants";
import type { LocalBoardCard } from "@/lib/local-cards";

type ExtraState = {
  boardId: string;
  extras: Record<CardStatus, LocalBoardCard[]>;
  extraCursors: Record<CardStatus, string | null>;
};

function emptyExtras(): Record<CardStatus, LocalBoardCard[]> {
  return {
    new: [],
    in_progress: [],
    answered: [],
    done: [],
  };
}

function emptyCursors(): Record<CardStatus, string | null> {
  return {
    new: null,
    in_progress: null,
    answered: null,
    done: null,
  };
}

function emptyRetryAt(): Record<CardStatus, number> {
  return {
    new: 0,
    in_progress: 0,
    answered: 0,
    done: 0,
  };
}

const COLUMN_RETRY_MS = 4_000;

async function fetchColumnPage(
  boardId: string,
  status: CardStatus,
  cursor: string,
): Promise<{ cards: LocalBoardCard[]; nextCursor: string | null }> {
  const params = new URLSearchParams({ status, cursor });
  const response = await fetch(`/api/boards/${boardId}/cards?${params}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("loadCards");
  }

  const parsed = boardCardsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("loadCards");
  }

  const cards: LocalBoardCard[] = [];
  for (const raw of parsed.data.cards) {
    const card = parseBoardCard(raw);
    if (card) {
      cards.push(card);
    }
  }

  return { cards, nextCursor: parsed.data.nextCursor };
}

export function useColumnPages(
  boardId: string,
  columns: BoardColumnPages,
): {
  extraCards: LocalBoardCard[];
  hasMore: (status: CardStatus) => boolean;
  loadMore: (status: CardStatus) => void;
} {
  const [state, setState] = useState<ExtraState>({
    boardId,
    extras: emptyExtras(),
    extraCursors: emptyCursors(),
  });
  const loadingRef = useRef<Record<CardStatus, boolean>>({
    new: false,
    in_progress: false,
    answered: false,
    done: false,
  });
  const retryAfterRef = useRef<Record<CardStatus, number>>(emptyRetryAt());
  const extras = state.boardId === boardId ? state.extras : emptyExtras();
  const extraCursors =
    state.boardId === boardId ? state.extraCursors : emptyCursors();

  const nextCursorFor = useCallback(
    (status: CardStatus): string | null => {
      return extras[status].length > 0
        ? extraCursors[status]
        : columns[status].nextCursor;
    },
    [columns, extraCursors, extras],
  );

  const loadMore = useCallback(
    (status: CardStatus): void => {
      const cursor = nextCursorFor(status);
      if (
        !cursor ||
        loadingRef.current[status] ||
        Date.now() < retryAfterRef.current[status]
      ) {
        return;
      }

      loadingRef.current[status] = true;
      void (async () => {
        try {
          const page = await fetchColumnPage(boardId, status, cursor);
          setState((current) => {
            const currentExtras =
              current.boardId === boardId ? current.extras : emptyExtras();
            const seen = new Set(currentExtras[status].map((card) => card.id));
            const appended = page.cards.filter((card) => !seen.has(card.id));
            return {
              boardId,
              extras: {
                ...currentExtras,
                [status]: [...currentExtras[status], ...appended],
              },
              extraCursors: {
                ...(current.boardId === boardId
                  ? current.extraCursors
                  : emptyCursors()),
                [status]: page.nextCursor,
              },
            };
          });
        } catch {
          retryAfterRef.current[status] = Date.now() + COLUMN_RETRY_MS;
        } finally {
          loadingRef.current[status] = false;
        }
      })();
    },
    [boardId, nextCursorFor],
  );

  return {
    extraCards: CARD_STATUSES.flatMap((status) => extras[status]),
    hasMore: (status) => nextCursorFor(status) !== null,
    loadMore,
  };
}
