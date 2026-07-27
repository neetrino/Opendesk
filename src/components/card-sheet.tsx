"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Card, Comment, Participant } from "@prisma/client";
import { CommentForm } from "@/components/comment-form";
import { FireIcon } from "@/components/fire-icon";
import { MoveCardControls } from "@/components/move-card-controls";
import {
  setCardUrgentAction,
  updateCardContentAction,
} from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type CommentWithAuthor = Comment & { author: Participant };

export type SheetCard = Card & {
  author: Participant;
  comments: CommentWithAuthor[];
};

type CardSheetProps = {
  boardId: string;
  card: SheetCard;
  locale: string;
  onClose: () => void;
  onUrgentChange: (cardId: string, urgent: boolean) => void;
  onCommentSend: (body: string, tempId: string) => void;
  onCommentRollback: (tempId: string) => void;
};

export function CardSheet({
  boardId,
  card,
  locale,
  onClose,
  onUrgentChange,
  onCommentSend,
  onCommentRollback,
}: CardSheetProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [cardId, setCardId] = useState(card.id);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  if (card.id !== cardId) {
    setCardId(card.id);
    setTitle(card.title);
    setDescription(card.description);
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

  const isDirty =
    title.trim() !== card.title || description !== card.description;

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

  function saveContent(): void {
    setError(null);
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", card.id);
    formData.set("title", title);
    formData.set("description", description);
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
        className={`card-sheet ${card.type}${card.urgent ? " is-urgent" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`card-sheet-title-${card.id}`}
      >
        <header className="sheet-header">
          <div className="sheet-badges">
            <span className="type-pill">{t.cardTypes[card.type]}</span>
            {card.urgent ? (
              <span className="urgent-pill">
                <FireIcon size={13} />
                {t.cardPage.urgentBadge}
              </span>
            ) : null}
            <span className="sheet-author">{card.author.displayName}</span>
          </div>
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

        <div className="sheet-body">
          <div className="sheet-details">
            <label className="sheet-edit-field">
              <span>{t.cardPage.editTitle}</span>
              <input
                id={`card-sheet-title-${card.id}`}
                className="sheet-title-input"
                value={title}
                maxLength={120}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>

            <label className="sheet-edit-field">
              <span>{t.cardPage.editDescription}</span>
              <textarea
                className="sheet-description-input"
                value={description}
                rows={3}
                maxLength={4000}
                placeholder={t.cardPage.noDescription}
                autoComplete="off"
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>

            {error ? <p className="form-error">{error}</p> : null}

            {isDirty ? (
              <button
                type="button"
                className="button button-save sheet-save"
                onClick={saveContent}
                disabled={isPending}
              >
                {isPending ? t.cardPage.savingChanges : t.cardPage.saveChanges}
              </button>
            ) : null}

            <div className="sheet-block">
              <p className="eyebrow">{t.cardPage.stage}</p>
              <MoveCardControls
                boardId={boardId}
                cardId={card.id}
                currentStatus={card.status}
              />
            </div>
          </div>

          <div className="sheet-discussion">
            <h3>{t.cardPage.discussion}</h3>
            <div className="thread" ref={threadRef}>
              {card.comments.length === 0 ? (
                <p className="muted thread-empty">{t.cardPage.emptyThread}</p>
              ) : (
                card.comments.map((comment) => (
                  <div key={comment.id} className="thread-item">
                    <header>
                      <strong>{comment.author.displayName}</strong>
                      <span className="muted">
                        {comment.createdAt.toLocaleString(locale)}
                      </span>
                    </header>
                    <p>{comment.body}</p>
                  </div>
                ))
              )}
            </div>
            <div className="sheet-composer">
              <CommentForm
                boardId={boardId}
                cardId={card.id}
                onOptimisticSend={onCommentSend}
                onOptimisticRollback={onCommentRollback}
              />
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
