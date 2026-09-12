"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cardCommentsResponseSchema,
  parseThreadComment,
  type CardThreadComment,
} from "@/lib/card-comment-view";
import type { OptimisticCommentAttachment } from "@/lib/local-cards";

type ThreadPage = {
  cardId: string;
  comments: CardThreadComment[];
  nextCursor: string | null;
  error: string | null;
};

async function fetchCommentPage(
  boardId: string,
  cardId: string,
  before?: string | null,
): Promise<{ comments: CardThreadComment[]; nextCursor: string | null }> {
  const params = new URLSearchParams();
  if (before) {
    params.set("before", before);
  }
  const query = params.toString();
  const response = await fetch(
    `/api/boards/${boardId}/cards/${cardId}/comments${query ? `?${query}` : ""}`,
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("loadComments");
  }

  const parsed = cardCommentsResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("loadComments");
  }

  const comments: CardThreadComment[] = [];
  for (const raw of parsed.data.comments) {
    const comment = parseThreadComment(raw);
    if (comment) {
      comments.push(comment);
    }
  }

  return { comments, nextCursor: parsed.data.nextCursor };
}

export function useCardThread(
  boardId: string,
  cardId: string,
  enabled: boolean,
): {
  comments: CardThreadComment[];
  loading: boolean;
  loadingOlder: boolean;
  error: string | null;
  hasMore: boolean;
  loadOlder: () => Promise<boolean>;
  addOptimistic: (
    body: string,
    tempId: string,
    authorId: string,
    displayName: string,
    attachments: OptimisticCommentAttachment[],
  ) => void;
  rollbackOptimistic: (tempId: string) => void;
} {
  const [page, setPage] = useState<ThreadPage | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const current = enabled && page?.cardId === cardId ? page : null;

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const requestedId = cardId;
    let cancelled = false;

    void (async () => {
      try {
        const next = await fetchCommentPage(boardId, requestedId);
        if (cancelled) {
          return;
        }
        setPage({
          cardId: requestedId,
          comments: next.comments,
          nextCursor: next.nextCursor,
          error: null,
        });
      } catch {
        if (cancelled) {
          return;
        }
        setPage({
          cardId: requestedId,
          comments: [],
          nextCursor: null,
          error: "loadComments",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, cardId, enabled]);

  const loadOlder = useCallback(async (): Promise<boolean> => {
    if (
      !enabled ||
      !current ||
      !current.nextCursor ||
      loadingOlderRef.current
    ) {
      return false;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const next = await fetchCommentPage(
        boardId,
        cardId,
        current.nextCursor,
      );
      setPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        const seen = new Set(existing.comments.map((comment) => comment.id));
        const older = next.comments.filter((comment) => !seen.has(comment.id));
        return {
          ...existing,
          comments: [...older, ...existing.comments],
          nextCursor: next.nextCursor,
        };
      });
      return next.comments.length > 0;
    } catch {
      setPage((existing) =>
        existing && existing.cardId === cardId
          ? { ...existing, error: "loadComments" }
          : existing,
      );
      return false;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [boardId, cardId, current, enabled]);

  const addOptimistic = useCallback(
    (
      body: string,
      tempId: string,
      authorId: string,
      displayName: string,
      attachments: OptimisticCommentAttachment[],
    ): void => {
      const createdAt = new Date();
      const optimistic: CardThreadComment = {
        id: tempId,
        cardId,
        authorId,
        body,
        createdAt,
        author: {
          id: authorId,
          boardId,
          displayName,
          createdAt,
        },
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          contentType: attachment.contentType,
          byteSize: attachment.byteSize,
          kind: attachment.kind,
          createdAt,
          commentId: tempId,
          authorId,
          previewUrl: attachment.previewUrl,
        })),
      };
      setPage((existing) =>
        existing && existing.cardId === cardId
          ? { ...existing, comments: [...existing.comments, optimistic] }
          : existing,
      );
    },
    [boardId, cardId],
  );

  const rollbackOptimistic = useCallback(
    (tempId: string): void => {
      setPage((existing) =>
        existing && existing.cardId === cardId
          ? {
              ...existing,
              comments: existing.comments.filter(
                (comment) => comment.id !== tempId,
              ),
            }
          : existing,
      );
    },
    [cardId],
  );

  return {
    comments: current?.comments ?? [],
    loading: Boolean(enabled && !current),
    loadingOlder,
    error: current?.error ?? null,
    hasMore: current?.nextCursor != null,
    loadOlder,
    addOptimistic,
    rollbackOptimistic,
  };
}
