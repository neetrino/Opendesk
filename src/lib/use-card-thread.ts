"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  cardCommentsResponseSchema,
  parseThreadComment,
  parseThreadPreview,
  type CardThreadComment,
  type ThreadCommentPreview,
  type ThreadReplyTo,
} from "@/lib/card-comment-view";
import { commentExcerpt } from "@/lib/comment-excerpt";
import {
  mergeOpenQuestions,
  type QuestionSyncComment,
} from "@/lib/comment-questions";
import type { OptimisticCommentAttachment } from "@/lib/local-cards";

type ThreadPage = {
  cardId: string;
  comments: CardThreadComment[];
  nextCursor: string | null;
  pinned: ThreadCommentPreview | null;
  openQuestions: ThreadCommentPreview[];
  error: string | null;
};

async function fetchCommentPage(
  boardId: string,
  cardId: string,
  before?: string | null,
  query?: string | null,
): Promise<{
  comments: CardThreadComment[];
  nextCursor: string | null;
  pinned: ThreadCommentPreview | null;
  openQuestions: ThreadCommentPreview[];
}> {
  const params = new URLSearchParams();
  if (before) {
    params.set("before", before);
  }
  if (query) {
    params.set("q", query);
  }
  const suffix = params.toString();
  const response = await fetch(
    `/api/boards/${boardId}/cards/${cardId}/comments${suffix ? `?${suffix}` : ""}`,
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

  return {
    comments,
    nextCursor: parsed.data.nextCursor,
    pinned: parseThreadPreview(parsed.data.pinned),
    openQuestions: parsed.data.openQuestions.flatMap((item) => {
      const preview = parseThreadPreview(item);
      return preview ? [preview] : [];
    }),
  };
}

export function useCardThread(
  boardId: string,
  cardId: string,
  enabled: boolean,
): {
  comments: CardThreadComment[];
  pinned: ThreadCommentPreview | null;
  openQuestions: ThreadCommentPreview[];
  loading: boolean;
  loadingOlder: boolean;
  error: string | null;
  hasMore: boolean;
  loadOlder: () => Promise<boolean>;
  loadUntilComment: (commentId: string) => Promise<boolean>;
  search: (query: string) => Promise<CardThreadComment[]>;
  addOptimistic: (
    body: string,
    tempId: string,
    authorId: string,
    displayName: string,
    attachments: OptimisticCommentAttachment[],
    replyTo?: ThreadReplyTo | null,
  ) => void;
  rollbackOptimistic: (tempId: string) => void;
  patchComment: (
    commentId: string,
    patch: Partial<CardThreadComment>,
  ) => void;
  setPinned: (pinned: ThreadCommentPreview | null) => void;
  syncOpenQuestions: (comments: CardThreadComment[]) => void;
} {
  const [page, setPage] = useState<ThreadPage | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const loadingOlderRef = useRef(false);
  const pageRef = useRef<ThreadPage | null>(null);
  const current = enabled && page?.cardId === cardId ? page : null;

  function commitPage(
    updater:
      | ThreadPage
      | null
      | ((existing: ThreadPage | null) => ThreadPage | null),
  ): void {
    const next =
      typeof updater === "function" ? updater(pageRef.current) : updater;
    pageRef.current = next;
    setPage(next);
  }

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
        commitPage({
          cardId: requestedId,
          comments: next.comments,
          nextCursor: next.nextCursor,
          pinned: next.pinned,
          openQuestions: next.openQuestions,
          error: null,
        });
      } catch {
        if (cancelled) {
          return;
        }
        commitPage({
          cardId: requestedId,
          comments: [],
          nextCursor: null,
          pinned: null,
          openQuestions: [],
          error: "loadComments",
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, cardId, enabled]);

  const loadOlder = useCallback(async (): Promise<boolean> => {
    const snapshot = pageRef.current;
    if (
      !enabled ||
      !snapshot ||
      snapshot.cardId !== cardId ||
      !snapshot.nextCursor ||
      loadingOlderRef.current
    ) {
      return false;
    }

    loadingOlderRef.current = true;
    setLoadingOlder(true);
    try {
      const next = await fetchCommentPage(boardId, cardId, snapshot.nextCursor);
      commitPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        const seen = new Set(existing.comments.map((comment) => comment.id));
        const older = next.comments.filter((comment) => !seen.has(comment.id));
        return {
          ...existing,
          comments: [...older, ...existing.comments],
          nextCursor: next.nextCursor,
          pinned: next.pinned,
          openQuestions: next.openQuestions,
        };
      });
      return next.comments.length > 0;
    } catch {
      commitPage((existing) =>
        existing && existing.cardId === cardId
          ? { ...existing, error: "loadComments" }
          : existing,
      );
      return false;
    } finally {
      loadingOlderRef.current = false;
      setLoadingOlder(false);
    }
  }, [boardId, cardId, enabled]);

  const loadUntilComment = useCallback(
    async (commentId: string): Promise<boolean> => {
      if (pageRef.current?.comments.some((comment) => comment.id === commentId)) {
        return true;
      }
      while (pageRef.current?.nextCursor) {
        const added = await loadOlder();
        if (
          pageRef.current?.comments.some((comment) => comment.id === commentId)
        ) {
          return true;
        }
        if (!added) {
          break;
        }
      }
      return (
        pageRef.current?.comments.some((comment) => comment.id === commentId) ??
        false
      );
    },
    [loadOlder],
  );

  const search = useCallback(
    async (query: string): Promise<CardThreadComment[]> => {
      const next = await fetchCommentPage(boardId, cardId, null, query);
      return next.comments;
    },
    [boardId, cardId],
  );

  const addOptimistic = useCallback(
    (
      body: string,
      tempId: string,
      authorId: string,
      displayName: string,
      attachments: OptimisticCommentAttachment[],
      replyTo: ThreadReplyTo | null = null,
    ): void => {
      const createdAt = new Date();
      const optimistic: CardThreadComment = {
        id: tempId,
        cardId,
        authorId,
        body,
        createdAt,
        editedAt: null,
        deleted: false,
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
        replyTo,
        reactions: [],
      };
      commitPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        const comments = [...existing.comments, optimistic];
        return {
          ...existing,
          comments,
          openQuestions: mergeOpenQuestions(
            existing.openQuestions,
            comments.map(toQuestionSync),
          ),
        };
      });
    },
    [boardId, cardId],
  );

  const rollbackOptimistic = useCallback(
    (tempId: string): void => {
      commitPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        const comments = existing.comments.filter(
          (comment) => comment.id !== tempId,
        );
        return {
          ...existing,
          comments,
          openQuestions: mergeOpenQuestions(
            existing.openQuestions,
            comments.map(toQuestionSync),
          ),
        };
      });
    },
    [cardId],
  );

  const patchComment = useCallback(
    (commentId: string, patch: Partial<CardThreadComment>): void => {
      commitPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        const comments = existing.comments.map((comment) =>
          comment.id === commentId ? { ...comment, ...patch } : comment,
        );
        return {
          ...existing,
          comments,
          openQuestions: mergeOpenQuestions(
            existing.openQuestions,
            comments.map(toQuestionSync),
          ),
        };
      });
    },
    [cardId],
  );

  const setPinned = useCallback(
    (pinned: ThreadCommentPreview | null): void => {
      commitPage((existing) =>
        existing && existing.cardId === cardId
          ? { ...existing, pinned }
          : existing,
      );
    },
    [cardId],
  );

  const syncOpenQuestions = useCallback(
    (comments: CardThreadComment[]): void => {
      commitPage((existing) => {
        if (!existing || existing.cardId !== cardId) {
          return existing;
        }
        return {
          ...existing,
          openQuestions: mergeOpenQuestions(
            existing.openQuestions,
            comments.map(toQuestionSync),
          ),
        };
      });
    },
    [cardId],
  );

  return {
    comments: current?.comments ?? [],
    pinned: current?.pinned ?? null,
    openQuestions: current?.openQuestions ?? [],
    loading: Boolean(enabled && !current),
    loadingOlder,
    error: current?.error ?? null,
    hasMore: current?.nextCursor != null,
    loadOlder,
    loadUntilComment,
    search,
    addOptimistic,
    rollbackOptimistic,
    patchComment,
    setPinned,
    syncOpenQuestions,
  };
}

function toQuestionSync(comment: CardThreadComment): QuestionSyncComment {
  return {
    id: comment.id,
    deleted: comment.deleted,
    authorName: comment.author.displayName,
    excerpt: commentExcerpt(comment.body),
    hasQuestion: comment.reactions.some((item) => item.emoji === "question"),
    replyToId: comment.replyTo?.id ?? null,
  };
}
