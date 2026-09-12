"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CARD_READ_STATE_VERSION,
  emitCardReadsChanged,
  getClientCardReadState,
  resolveSeededAt,
  subscribeClientCardReads,
  writeCardReadState,
  type CardReadState,
} from "@/lib/card-reads";

function cardIdsFromKey(cardIdsKey: string): string[] {
  return cardIdsKey === "" ? [] : cardIdsKey.split(",");
}

export function useCardReads(
  boardId: string,
  participantId: string,
  cardIds: string[],
): {
  reads: Record<string, string> | null;
  seededAt: Date | null;
  markCardRead: (cardId: string, readAt?: Date) => void;
} {
  const cardIdsKey = cardIds.join(",");

  const subscribe = useCallback(
    (onChange: () => void) =>
      subscribeClientCardReads(boardId, participantId, onChange),
    [boardId, participantId],
  );

  const getSnapshot = useCallback(
    (): CardReadState =>
      getClientCardReadState(
        boardId,
        participantId,
        cardIdsFromKey(cardIdsKey),
      ),
    [boardId, cardIdsKey, participantId],
  );

  const state = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const reads = state?.reads ?? null;
  const seededAt = resolveSeededAt(state);

  const markCardRead = useCallback(
    (cardId: string, readAt = new Date()): void => {
      const current = getClientCardReadState(
        boardId,
        participantId,
        cardIdsFromKey(cardIdsKey),
      );
      writeCardReadState(boardId, participantId, {
        version: CARD_READ_STATE_VERSION,
        seededAt: current.seededAt ?? resolveSeededAt(current)?.toISOString(),
        reads: {
          ...current.reads,
          [cardId]: readAt.toISOString(),
        },
      });
      emitCardReadsChanged();
    },
    [boardId, cardIdsKey, participantId],
  );

  return { reads, seededAt, markCardRead };
}
