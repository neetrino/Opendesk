"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CardStatus } from "@prisma/client";
import type { BoardColumnPages } from "@/lib/board-card-view";
import {
  cardListQueryIsActive,
  cardListQueryKey,
  emptyCardListQuery,
  type CardListQuery,
} from "@/lib/card-query";
import { CARD_STATUSES } from "@/lib/constants";
import { fetchColumnPage } from "@/lib/fetch-column-page";
import type { LocalBoardCard } from "@/lib/local-cards";

type QueriedColumn = {
  cards: LocalBoardCard[];
  nextCursor: string | null;
  totalCount: number;
};

type ExtraState = {
  boardId: string;
  queryKey: string;
  extras: Record<CardStatus, LocalBoardCard[]>;
  extraCursors: Record<CardStatus, string | null>;
  queried: Record<CardStatus, QueriedColumn> | null;
};

function emptyExtras(): Record<CardStatus, LocalBoardCard[]> {
  return { new: [], in_progress: [], answered: [], done: [] };
}

function emptyCursors(): Record<CardStatus, string | null> {
  return { new: null, in_progress: null, answered: null, done: null };
}

function emptyQueried(): Record<CardStatus, QueriedColumn> {
  return {
    new: { cards: [], nextCursor: null, totalCount: 0 },
    in_progress: { cards: [], nextCursor: null, totalCount: 0 },
    answered: { cards: [], nextCursor: null, totalCount: 0 },
    done: { cards: [], nextCursor: null, totalCount: 0 },
  };
}

function toColumnPages(
  queried: Record<CardStatus, QueriedColumn>,
): BoardColumnPages {
  return {
    new: {
      nextCursor: queried.new.nextCursor,
      totalCount: queried.new.totalCount,
    },
    in_progress: {
      nextCursor: queried.in_progress.nextCursor,
      totalCount: queried.in_progress.totalCount,
    },
    answered: {
      nextCursor: queried.answered.nextCursor,
      totalCount: queried.answered.totalCount,
    },
    done: {
      nextCursor: queried.done.nextCursor,
      totalCount: queried.done.totalCount,
    },
  };
}

const COLUMN_RETRY_MS = 4_000;

export function useColumnPages(
  boardId: string,
  columns: BoardColumnPages,
  query: CardListQuery,
  pending = false,
): {
  extraCards: LocalBoardCard[];
  queriedCards: LocalBoardCard[] | null;
  queriedColumns: BoardColumnPages | null;
  hasMore: (status: CardStatus) => boolean;
  loadMore: (status: CardStatus) => void;
  isQueryLoading: boolean;
} {
  const active = !pending && cardListQueryIsActive(query);
  const emptyInbox = Boolean(active && query.cardIds && query.cardIds.length === 0);
  const queryKey = pending ? "pending" : active ? cardListQueryKey(query) : "";
  const [state, setState] = useState<ExtraState>({
    boardId,
    queryKey: "",
    extras: emptyExtras(),
    extraCursors: emptyCursors(),
    queried: null,
  });
  const loadingRef = useRef<Record<CardStatus, boolean>>({
    new: false,
    in_progress: false,
    answered: false,
    done: false,
  });
  const retryAfterRef = useRef<Record<CardStatus, number>>({
    new: 0,
    in_progress: 0,
    answered: 0,
    done: 0,
  });
  const matched = state.boardId === boardId && state.queryKey === queryKey;
  const extras = matched ? state.extras : emptyExtras();
  const extraCursors = matched ? state.extraCursors : emptyCursors();
  const queried = emptyInbox
    ? emptyQueried()
    : matched
      ? state.queried
      : null;

  useEffect(() => {
    if (!active || emptyInbox) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const pages = await Promise.all(
          CARD_STATUSES.map((status) =>
            fetchColumnPage(boardId, status, null, query),
          ),
        );
        if (cancelled) {
          return;
        }
        const next = emptyQueried();
        CARD_STATUSES.forEach((status, index) => {
          const page = pages[index];
          if (!page) {
            return;
          }
          next[status] = {
            cards: page.cards,
            nextCursor: page.nextCursor,
            totalCount: page.totalCount ?? page.cards.length,
          };
        });
        setState({
          boardId,
          queryKey,
          extras: emptyExtras(),
          extraCursors: emptyCursors(),
          queried: next,
        });
      } catch {
        if (!cancelled) {
          setState({
            boardId,
            queryKey,
            extras: emptyExtras(),
            extraCursors: emptyCursors(),
            queried: emptyQueried(),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [active, boardId, emptyInbox, query, queryKey]);

  const nextCursorFor = useCallback(
    (status: CardStatus): string | null => {
      if (queried) {
        return extras[status].length > 0
          ? extraCursors[status]
          : queried[status].nextCursor;
      }
      return extras[status].length > 0
        ? extraCursors[status]
        : columns[status].nextCursor;
    },
    [columns, extraCursors, extras, queried],
  );

  const loadMore = useCallback(
    (status: CardStatus): void => {
      const cursor = nextCursorFor(status);
      if (
        !cursor ||
        pending ||
        loadingRef.current[status] ||
        Date.now() < retryAfterRef.current[status]
      ) {
        return;
      }

      loadingRef.current[status] = true;
      const requestQuery = active ? query : emptyCardListQuery();
      void (async () => {
        try {
          const page = await fetchColumnPage(
            boardId,
            status,
            cursor,
            requestQuery,
          );
          setState((current) => {
            if (current.boardId !== boardId || current.queryKey !== queryKey) {
              return current;
            }
            const seen = new Set(
              current.extras[status].map((card) => card.id),
            );
            return {
              ...current,
              extras: {
                ...current.extras,
                [status]: [
                  ...current.extras[status],
                  ...page.cards.filter((card) => !seen.has(card.id)),
                ],
              },
              extraCursors: {
                ...current.extraCursors,
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
    [active, boardId, nextCursorFor, pending, query, queryKey],
  );

  return {
    extraCards: CARD_STATUSES.flatMap((status) => extras[status]),
    queriedCards: queried
      ? CARD_STATUSES.flatMap((status) => queried[status].cards)
      : null,
    queriedColumns: queried ? toColumnPages(queried) : null,
    hasMore: (status) => nextCursorFor(status) !== null,
    loadMore,
    isQueryLoading: pending || (active && !emptyInbox && queried === null),
  };
}
