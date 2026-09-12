"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  CARD_READ_STATE_VERSION,
  emitCardReadsChanged,
  getClientCardReads,
  subscribeClientCardReads,
  writeCardReadState,
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
  markCardRead: (cardId: string, readAt?: Date) => void;
} {
  const cardIdsKey = cardIds.join(",");

  const subscribe = useCallback(
    (onChange: () => void) =>
      subscribeClientCardReads(boardId, participantId, onChange),
    [boardId, participantId],
  );

  const getSnapshot = useCallback(
    (): Record<string, string> =>
      getClientCardReads(boardId, participantId, cardIdsFromKey(cardIdsKey)),
    [boardId, cardIdsKey, participantId],
  );

  const reads = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const markCardRead = useCallback(
    (cardId: string, readAt = new Date()): void => {
      const current = getClientCardReads(
        boardId,
        participantId,
        cardIdsFromKey(cardIdsKey),
      );
      writeCardReadState(boardId, participantId, {
        version: CARD_READ_STATE_VERSION,
        reads: {
          ...current,
          [cardId]: readAt.toISOString(),
        },
      });
      emitCardReadsChanged();
    },
    [boardId, cardIdsKey, participantId],
  );

  return { reads, markCardRead };
}
