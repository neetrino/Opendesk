"use client";

import { useEffect, useState, useTransition } from "react";
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
};

export function CardSheet({ boardId, card, locale, onClose }: CardSheetProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [cardId, setCardId] = useState(card.id);
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [error, setError] = useState<string | null>(null);

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

  const isDirty =
    title.trim() !== card.title || description !== card.description;

  function toggleUrgent(): void {
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", card.id);
    formData.set("urgent", card.urgent ? "false" : "true");
    startTransition(async () => {
      await setCardUrgentAction(formData);
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
              <FireIcon />
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

        <div className="sheet-scroll">
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
              rows={5}
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

          <div className="sheet-block sheet-discussion">
            <h3>{t.cardPage.discussion}</h3>
            <div className="thread">
              {card.comments.length === 0 ? (
                <p className="muted">{t.cardPage.emptyThread}</p>
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
            <CommentForm boardId={boardId} cardId={card.id} />
          </div>
        </div>
      </aside>
    </div>
  );
}
