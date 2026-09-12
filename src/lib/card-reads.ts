import { isLocalCardId } from "@/lib/local-cards";

export const CARD_READ_STATE_VERSION = 1;

export type CardReadState = {
  version: typeof CARD_READ_STATE_VERSION;
  reads: Record<string, string>;
};

export type CommentReadCursor = {
  authorId: string;
  createdAt: Date | string;
};

export function cardReadStorageKey(
  boardId: string,
  participantId: string,
): string {
  return `opendesk.cardReads.v1.${boardId}.${participantId}`;
}

export function parseCardReadState(raw: string | null): CardReadState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as { version?: unknown; reads?: unknown };
    if (record.version !== CARD_READ_STATE_VERSION) {
      return null;
    }
    if (
      !record.reads ||
      typeof record.reads !== "object" ||
      Array.isArray(record.reads)
    ) {
      return null;
    }

    const reads: Record<string, string> = {};
    for (const [cardId, value] of Object.entries(record.reads)) {
      if (typeof value === "string" && Number.isFinite(Date.parse(value))) {
        reads[cardId] = value;
      }
    }

    return { version: CARD_READ_STATE_VERSION, reads };
  } catch {
    return null;
  }
}

export function seedCardReads(
  cardIds: string[],
  readAt: Date,
): CardReadState {
  const iso = readAt.toISOString();
  const reads: Record<string, string> = {};

  for (const cardId of cardIds) {
    if (!isLocalCardId(cardId)) {
      reads[cardId] = iso;
    }
  }

  return { version: CARD_READ_STATE_VERSION, reads };
}

export function commentTimestamp(value: Date | string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

export function lastReadDate(
  reads: Record<string, string> | null,
  cardId: string,
): Date | null {
  if (!reads) {
    return null;
  }
  const raw = reads[cardId];
  if (!raw) {
    return null;
  }
  const time = Date.parse(raw);
  return Number.isFinite(time) ? new Date(time) : null;
}

/**
 * Comments from other people after the viewer last left this card.
 * Own messages never count as unread.
 */
export function countUnreadComments(
  comments: CommentReadCursor[],
  lastReadAt: Date | null,
  currentUserId: string,
): number {
  const lastReadTime = lastReadAt ? lastReadAt.getTime() : null;
  const lastReadValid =
    lastReadTime !== null && Number.isFinite(lastReadTime)
      ? lastReadTime
      : null;

  return comments.filter((comment) => {
    if (comment.authorId === currentUserId) {
      return false;
    }
    const created = commentTimestamp(comment.createdAt);
    if (!Number.isFinite(created)) {
      return false;
    }
    if (lastReadValid === null) {
      return true;
    }
    return created > lastReadValid;
  }).length;
}

/**
 * Activity poll can see a newer foreign comment before RSC props refresh.
 * Keep at least one unread so the badge does not flicker off.
 */
export function applyForeignActivity(
  unreadFromComments: number,
  lastReadAt: Date | null,
  lastForeignCommentAt: string | null | undefined,
): number {
  if (!lastForeignCommentAt) {
    return unreadFromComments;
  }

  const foreignTime = Date.parse(lastForeignCommentAt);
  if (!Number.isFinite(foreignTime)) {
    return unreadFromComments;
  }

  if (lastReadAt === null || foreignTime > lastReadAt.getTime()) {
    return Math.max(unreadFromComments, 1);
  }

  return unreadFromComments;
}

export function readCardReadState(
  boardId: string,
  participantId: string,
): CardReadState | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseCardReadState(
      window.localStorage.getItem(cardReadStorageKey(boardId, participantId)),
    );
  } catch {
    return null;
  }
}

export const CARD_READS_CHANGED_EVENT = "opendesk:card-reads-changed";

const memoryReads = new Map<string, Record<string, string>>();

function memoryKey(boardId: string, participantId: string): string {
  return `${boardId}:${participantId}`;
}

export function writeCardReadState(
  boardId: string,
  participantId: string,
  state: CardReadState,
): void {
  memoryReads.set(memoryKey(boardId, participantId), state.reads);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      cardReadStorageKey(boardId, participantId),
      JSON.stringify(state),
    );
  } catch {
    // Private mode or quota — keep the in-memory map only.
  }
}

function sameReads(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function getClientCardReads(
  boardId: string,
  participantId: string,
  cardIds: string[],
): Record<string, string> {
  const key = memoryKey(boardId, participantId);
  const stored = readCardReadState(boardId, participantId);
  if (stored) {
    const cached = memoryReads.get(key);
    if (cached && sameReads(cached, stored.reads)) {
      return cached;
    }
    memoryReads.set(key, stored.reads);
    return stored.reads;
  }

  const cached = memoryReads.get(key);
  if (cached) {
    return cached;
  }

  const seeded = seedCardReads(cardIds, new Date());
  writeCardReadState(boardId, participantId, seeded);
  return seeded.reads;
}

export function subscribeClientCardReads(
  boardId: string,
  participantId: string,
  onChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const storageKey = cardReadStorageKey(boardId, participantId);

  function onStorage(event: StorageEvent): void {
    if (event.key === storageKey || event.key === null) {
      onChange();
    }
  }

  window.addEventListener("storage", onStorage);
  window.addEventListener(CARD_READS_CHANGED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CARD_READS_CHANGED_EVENT, onChange);
  };
}

export function emitCardReadsChanged(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new Event(CARD_READS_CHANGED_EVENT));
}
