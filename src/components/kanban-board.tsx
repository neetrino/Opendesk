"use client";

import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { Card, CardStatus, Comment, Participant } from "@prisma/client";
import { CardSheet } from "@/components/card-sheet";
import { QuickCreateCard } from "@/components/quick-create-card";
import { moveCardAction } from "@/lib/actions";
import { CARD_STATUSES } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";

type CommentWithAuthor = Comment & { author: Participant };

export type BoardCard = Card & {
  author: Participant;
  comments: CommentWithAuthor[];
};

type KanbanBoardProps = {
  boardId: string;
  cards: BoardCard[];
  locale: string;
};

type DragPayload = {
  cardId: string;
  fromStatus: CardStatus;
};

export function KanbanBoard({ boardId, cards, locale }: KanbanBoardProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const dragPayload = useRef<DragPayload | null>(null);
  const suppressClick = useRef(false);

  const [optimisticCards, setOptimisticCards] = useOptimistic(
    cards,
    (current, update: { cardId: string; status: CardStatus }) =>
      current.map((card) =>
        card.id === update.cardId ? { ...card, status: update.status } : card,
      ),
  );

  const selectedCard =
    selectedCardId === null
      ? null
      : (optimisticCards.find((card) => card.id === selectedCardId) ?? null);

  function onDragStart(
    event: DragEvent<HTMLElement>,
    cardId: string,
    fromStatus: CardStatus,
  ): void {
    suppressClick.current = true;
    dragPayload.current = { cardId, fromStatus };
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", cardId);
  }

  function onDragOver(event: DragEvent<HTMLElement>, status: CardStatus): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  }

  function onDragLeave(): void {
    setDragOverStatus(null);
  }

  function onDrop(event: DragEvent<HTMLElement>, status: CardStatus): void {
    event.preventDefault();
    setDragOverStatus(null);

    const cardId =
      dragPayload.current?.cardId || event.dataTransfer.getData("text/plain");
    const fromStatus = dragPayload.current?.fromStatus;
    dragPayload.current = null;

    if (!cardId || fromStatus === status) {
      return;
    }

    startTransition(async () => {
      setOptimisticCards({ cardId, status });
      const formData = new FormData();
      formData.set("boardId", boardId);
      formData.set("cardId", cardId);
      formData.set("status", status);
      await moveCardAction(formData);
    });
  }

  function onCardClick(cardId: string): void {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setSelectedCardId(cardId);
  }

  return (
    <>
      <div className={`board-grid ${isPending ? "is-moving" : ""}`}>
        {CARD_STATUSES.map((status) => {
          const columnCards = optimisticCards.filter(
            (card) => card.status === status,
          );

          return (
            <section
              key={status}
              className={
                dragOverStatus === status
                  ? "board-column is-drop-target"
                  : "board-column"
              }
              onDragOver={(event) => onDragOver(event, status)}
              onDragLeave={onDragLeave}
              onDrop={(event) => onDrop(event, status)}
            >
              <header className="column-header">
                <h2>
                  {t.columns[status]}
                  <span className="count">{columnCards.length}</span>
                </h2>
              </header>

              <QuickCreateCard boardId={boardId} status={status} />

              <div className="column-stack">
                {columnCards.map((card) => (
                  <article
                    key={card.id}
                    className={`card-tile ${card.type}`}
                    draggable
                    onDragStart={(event) =>
                      onDragStart(event, card.id, card.status)
                    }
                    onClick={() => onCardClick(card.id)}
                  >
                    <div className="card-meta">
                      <span className="type-pill">
                        {t.cardTypes[card.type]}
                      </span>
                      <span className="author">{card.author.displayName}</span>
                    </div>
                    <h3 className="card-title">{card.title}</h3>
                    <p
                      className={
                        card.description
                          ? "card-excerpt"
                          : "card-excerpt is-empty"
                      }
                    >
                      {card.description || "—"}
                    </p>
                    <p className="card-foot">
                      {card.comments.length > 0
                        ? t.board.replies.replace(
                            "{n}",
                            String(card.comments.length),
                          )
                        : "\u00a0"}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {selectedCard ? (
        <CardSheet
          boardId={boardId}
          card={selectedCard}
          locale={locale}
          onClose={() => setSelectedCardId(null)}
        />
      ) : null}
    </>
  );
}
