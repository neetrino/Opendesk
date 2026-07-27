"use client";

import { useEffect } from "react";
import type { Card, Comment, Participant } from "@prisma/client";
import { CommentForm } from "@/components/comment-form";
import { MoveCardControls } from "@/components/move-card-controls";
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

  return (
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label={t.cardPage.close}
        onClick={onClose}
      />
      <aside
        className={`card-sheet ${card.type}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`card-sheet-title-${card.id}`}
      >
        <header className="sheet-header">
          <div className="sheet-badges">
            <span className="type-pill">{t.cardTypes[card.type]}</span>
            <span className="sheet-author">{card.author.displayName}</span>
          </div>
          <button
            type="button"
            className="sheet-close"
            onClick={onClose}
            aria-label={t.cardPage.close}
          >
            ×
          </button>
        </header>

        <div className="sheet-scroll">
          <h2 id={`card-sheet-title-${card.id}`} className="sheet-title">
            {card.title}
          </h2>
          <p className="sheet-description">
            {card.description || t.cardPage.noDescription}
          </p>

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
