"use client";

import type { Card } from "@prisma/client";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type RefObject,
} from "react";
import { ThreadList } from "@/components/thread-list";
import type { CardThreadComment, ThreadReplyTo } from "@/lib/card-comment-view";
import {
  deleteCommentAction,
  editCommentAction,
  setCardPinnedCommentAction,
  toggleCommentReactionAction,
} from "@/lib/comment-actions";
import { createCardFromCommentAction } from "@/lib/comment-create-card-action";
import { commentExcerpt } from "@/lib/comment-excerpt";
import type { MentionParticipant } from "@/lib/comment-mentions";
import {
  toggleLocalReaction,
  type CommentReactionEmoji,
} from "@/lib/comment-reactions";
import { titleFromCommentBody } from "@/lib/comment-title";
import { COMMENT_SEARCH_MIN_LENGTH } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";
import type { useCardThread } from "@/lib/use-card-thread";

type CardThreadPaneProps = {
  boardId: string;
  cardId: string;
  locale: string;
  currentUserId: string;
  participants: MentionParticipant[];
  lastReadAt: Date | null;
  thread: ReturnType<typeof useCardThread>;
  threadRef: RefObject<HTMLDivElement | null>;
  onReply: (reply: ThreadReplyTo) => void;
  onCreatedCard: (card: Card) => void;
};

export function CardThreadPane({
  boardId,
  cardId,
  locale,
  currentUserId,
  participants,
  lastReadAt,
  thread,
  threadRef,
  onReply,
  onCreatedCard,
}: CardThreadPaneProps) {
  const { t } = useI18n();
  const [, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CardThreadComment[] | null>(null);
  const searchTimer = useRef<number | null>(null);
  const searchSeq = useRef(0);

  useEffect(() => {
    return () => {
      if (searchTimer.current) {
        window.clearTimeout(searchTimer.current);
      }
      searchSeq.current += 1;
    };
  }, []);

  function runSearch(nextQuery: string): void {
    setQuery(nextQuery);
    if (searchTimer.current) {
      window.clearTimeout(searchTimer.current);
    }
    const trimmed = nextQuery.trim();
    if (trimmed.length < COMMENT_SEARCH_MIN_LENGTH) {
      searchSeq.current += 1;
      setHits(null);
      return;
    }
    searchTimer.current = window.setTimeout(() => {
      const seq = ++searchSeq.current;
      void thread.search(trimmed).then((results) => {
        if (seq === searchSeq.current) {
          setHits(results);
        }
      });
    }, 280);
  }

  function scrollToRendered(commentId: string): boolean {
    const node = threadRef.current?.querySelector(
      `#thread-comment-${commentId}`,
    );
    if (node instanceof HTMLElement) {
      node.scrollIntoView({ block: "center" });
      return true;
    }
    return false;
  }

  async function revealComment(commentId: string): Promise<void> {
    searchSeq.current += 1;
    setQuery("");
    setHits(null);
    const found = await thread.loadUntilComment(commentId);
    if (!found) {
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToRendered(commentId);
      });
    });
  }

  function findComment(commentId: string): CardThreadComment | undefined {
    return (
      hits?.find((item) => item.id === commentId) ??
      thread.comments.find((item) => item.id === commentId)
    );
  }

  function patchLists(
    commentId: string,
    patch: Partial<CardThreadComment>,
  ): void {
    thread.patchComment(commentId, patch);
    setHits((current) =>
      current
        ? current.map((item) =>
            item.id === commentId ? { ...item, ...patch } : item,
          )
        : current,
    );
    const nextHits = hits?.map((item) =>
      item.id === commentId ? { ...item, ...patch } : item,
    );
    const nextThread = thread.comments.map((item) =>
      item.id === commentId ? { ...item, ...patch } : item,
    );
    thread.syncOpenQuestions([
      ...nextThread,
      ...(nextHits ?? []).filter(
        (item) => !nextThread.some((comment) => comment.id === item.id),
      ),
    ]);
  }

  function targetForm(commentId: string): FormData {
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    formData.set("commentId", commentId);
    return formData;
  }

  function onReact(commentId: string, emoji: CommentReactionEmoji): void {
    const comment = findComment(commentId);
    if (!comment || comment.deleted) {
      return;
    }
    const previous = comment.reactions;
    patchLists(commentId, {
      reactions: toggleLocalReaction(previous, emoji),
    });
    const formData = targetForm(commentId);
    formData.set("emoji", emoji);
    startTransition(async () => {
      const result = await toggleCommentReactionAction(formData);
      if (!result.ok) {
        patchLists(commentId, { reactions: previous });
      }
    });
  }

  function onEdit(comment: CardThreadComment, body: string): void {
    const previous = comment.body;
    const previousEditedAt = comment.editedAt;
    patchLists(comment.id, { body, editedAt: new Date() });
    const formData = targetForm(comment.id);
    formData.set("body", body);
    startTransition(async () => {
      const result = await editCommentAction(formData);
      if (!result.ok) {
        patchLists(comment.id, { body: previous, editedAt: previousEditedAt });
      }
    });
  }

  function onDelete(comment: CardThreadComment): void {
    patchLists(comment.id, {
      deleted: true,
      body: "",
      attachments: [],
      reactions: [],
    });
    if (thread.pinned?.id === comment.id) {
      thread.setPinned(null);
    }
    startTransition(async () => {
      const result = await deleteCommentAction(targetForm(comment.id));
      if (!result.ok) {
        patchLists(comment.id, comment);
      }
    });
  }

  function onPin(comment: CardThreadComment): void {
    const wasPinned = thread.pinned?.id === comment.id;
    const previous = thread.pinned;
    thread.setPinned(
      wasPinned
        ? null
        : {
            id: comment.id,
            authorName: comment.author.displayName,
            excerpt: commentExcerpt(comment.body),
          },
    );
    const formData = targetForm(comment.id);
    if (wasPinned) {
      formData.set("commentId", "");
    }
    startTransition(async () => {
      const result = await setCardPinnedCommentAction(formData);
      if (!result.ok) {
        thread.setPinned(previous);
      }
    });
  }

  function onCreateCard(comment: CardThreadComment): void {
    const fallback =
      comment.attachments[0]?.kind === "audio"
        ? t.cardPage.mediaTitleVoice
        : comment.attachments[0]?.kind === "video"
          ? t.cardPage.mediaTitleVideo
          : t.cardPage.mediaTitlePhoto;
    const formData = targetForm(comment.id);
    formData.set("title", titleFromCommentBody(comment.body, fallback));
    startTransition(async () => {
      const result = await createCardFromCommentAction(formData);
      if (result.ok) {
        onCreatedCard(result.data);
      }
    });
  }

  const visible = hits ?? thread.comments;

  return (
    <>
      <div className="thread-toolbar">
        <input
          className="thread-search"
          value={query}
          onChange={(event) => runSearch(event.target.value)}
          placeholder={t.cardPage.searchThread}
        />
        {thread.pinned ? (
          <button
            type="button"
            className="thread-pin"
            onClick={() => {
              void revealComment(thread.pinned?.id ?? "");
            }}
          >
            <strong>{t.cardPage.pinned}</strong>
            {` · ${thread.pinned.authorName}: ${thread.pinned.excerpt}`}
          </button>
        ) : null}
        {thread.openQuestions.length > 0 ? (
          <div className="thread-questions">
            <span>{t.cardPage.openQuestions}</span>
            {thread.openQuestions.map((question) => (
              <button
                key={question.id}
                type="button"
                className="chip"
                onClick={() => {
                  void revealComment(question.id);
                }}
              >
                {question.excerpt || question.authorName}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        className="thread"
        ref={threadRef}
        onScroll={() => {
          const node = threadRef.current;
          if (!node || hits || !thread.hasMore || thread.loading || thread.loadingOlder) {
            return;
          }
          if (node.scrollTop < 48) {
            void (async () => {
              const previousHeight = node.scrollHeight;
              const previousTop = node.scrollTop;
              const added = await thread.loadOlder();
              if (added) {
                node.scrollTop = node.scrollHeight - previousHeight + previousTop;
              }
            })();
          }
        }}
      >
        {thread.loadingOlder ? (
          <p className="muted thread-loading-older">{t.cardPage.loadingThread}</p>
        ) : null}
        {thread.loading ? (
          <p className="muted thread-empty">{t.cardPage.loadingThread}</p>
        ) : thread.error ? (
          <p className="form-error thread-empty">{t.errors.loadComments}</p>
        ) : hits && hits.length === 0 ? (
          <p className="muted thread-empty">{t.cardPage.searchEmpty}</p>
        ) : (
          <ThreadList
            comments={visible}
            locale={locale}
            currentUserId={currentUserId}
            participants={participants}
            pinnedCommentId={thread.pinned?.id ?? null}
            lastReadAt={hits ? null : lastReadAt}
            onReply={(comment) =>
              onReply({
                id: comment.id,
                authorName: comment.author.displayName,
                excerpt: commentExcerpt(comment.body),
                deleted: comment.deleted,
              })
            }
            onReact={onReact}
            onPin={onPin}
            onEdit={onEdit}
            onDelete={onDelete}
            onCreateCard={onCreateCard}
          />
        )}
      </div>
    </>
  );
}
