"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CommentForm, type OptimisticCommentAttachment } from "@/components/comment-form";
import { FireIcon } from "@/components/fire-icon";
import { PencilIcon } from "@/components/pencil-icon";
import { ThreadList } from "@/components/thread-list";
import {
  setCardUrgentAction,
  updateCardContentAction,
} from "@/lib/actions";
import type { LocalBoardCard } from "@/lib/local-cards";
import { useI18n } from "@/i18n/provider";

export type SheetCard = LocalBoardCard;

type CardSheetProps = {
  boardId: string;
  card: SheetCard;
  locale: string;
  attachmentsEnabled: boolean;
  onClose: () => void;
  onUrgentChange: (cardId: string, urgent: boolean) => void;
  onCommentSend: (
    body: string,
    tempId: string,
    attachments: OptimisticCommentAttachment[],
  ) => void;
  onCommentRollback: (tempId: string) => void;
};

export function CardSheet({
  boardId,
  card,
  locale,
  attachmentsEnabled,
  onClose,
  onUrgentChange,
  onCommentSend,
  onCommentRollback,
}: CardSheetProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [cardId, setCardId] = useState(card.id);
  const [title, setTitle] = useState(card.title);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  if (card.id !== cardId) {
    setCardId(card.id);
    setTitle(card.title);
    setError(null);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    const thread = threadRef.current;
    if (!thread) {
      return;
    }
    thread.scrollTop = thread.scrollHeight;
  }, [card.id, card.comments.length]);

  function toggleUrgent(): void {
    const nextUrgent = !card.urgent;
    setError(null);
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", card.id);
    formData.set("urgent", nextUrgent ? "true" : "false");

    startTransition(async () => {
      onUrgentChange(card.id, nextUrgent);
      const response = await setCardUrgentAction(formData);
      if (!response.ok) {
        onUrgentChange(card.id, !nextUrgent);
        setError(response.error);
      }
    });
  }

  function saveTitle(): void {
    const nextTitle = title.trim();
    if (nextTitle.length < 2 || nextTitle === card.title) {
      if (nextTitle.length < 2) {
        setTitle(card.title);
      }
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", card.id);
    formData.set("title", nextTitle);
    startTransition(async () => {
      const response = await updateCardContentAction(formData);
      if (!response.ok) {
        setError(response.error);
      }
    });
  }

  return (
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label={t.cardPage.close}
        onClick={onClose}
      />
      <aside
        className={`card-sheet${card.urgent ? " is-urgent" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`card-sheet-title-${card.id}`}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <label className="sheet-title-bar">
            <span className="visually-hidden">{t.cardPage.editTitle}</span>
            <input
              id={`card-sheet-title-${card.id}`}
              className="sheet-title-input"
              value={title}
              maxLength={120}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
            />
            <PencilIcon className="sheet-title-edit" size={16} />
          </label>
          <div className="sheet-actions">
            <button
              type="button"
              className={
                card.urgent
                  ? "sheet-icon-btn sheet-urgent is-on"
                  : "sheet-icon-btn sheet-urgent"
              }
              onClick={toggleUrgent}
              disabled={isPending}
              aria-pressed={card.urgent}
              aria-label={
                card.urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent
              }
              title={
                card.urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent
              }
            >
              <FireIcon size={18} />
            </button>
            <button
              type="button"
              className="sheet-icon-btn sheet-close"
              onClick={onClose}
              aria-label={t.cardPage.close}
            >
              ×
            </button>
          </div>
        </header>
        {error ? <p className="form-error sheet-title-error">{error}</p> : null}

        <div className="sheet-discussion">
          <div className="thread" ref={threadRef}>
            <ThreadList comments={card.comments} locale={locale} />
          </div>
          <div className="sheet-composer">
            <CommentForm
              boardId={boardId}
              cardId={card.id}
              enabled={attachmentsEnabled}
              onOptimisticSend={onCommentSend}
              onOptimisticRollback={onCommentRollback}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}
