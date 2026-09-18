import type { BoardActivityMap } from "@/lib/board-activity";
import type { AttentionFilter } from "@/lib/card-query";
import {
  hasUnreadForeignComment,
  isUnseenCard,
  resolveLastReadAt,
} from "@/lib/card-reads";
import { CARD_QUERY_MAX_IDS } from "@/lib/constants";

export function matchingAttentionCardIds(
  activity: BoardActivityMap,
  reads: Record<string, string> | null,
  seededAt: Date | null,
  currentUserId: string,
  attention: readonly AttentionFilter[],
): string[] {
  if (attention.length === 0 || reads === null) {
    return [];
  }

  const wantUnread = attention.includes("unread");
  const wantNew = attention.includes("new");
  const ids: string[] = [];

  for (const card of Object.values(activity)) {
    if (ids.length >= CARD_QUERY_MAX_IDS) {
      break;
    }
    const unread =
      wantUnread &&
      hasUnreadForeignComment(
        card.lastForeignCommentAt,
        resolveLastReadAt(reads, card.id, seededAt),
      );
    const isNew =
      wantNew && isUnseenCard(card, reads, seededAt, currentUserId);
    if (unread || isNew) {
      ids.push(card.id);
    }
  }

  return ids;
}
