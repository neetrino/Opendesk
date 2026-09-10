"use client";

import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { CardStatus } from "@prisma/client";
import { CardSheet } from "@/components/card-sheet";
import type { OptimisticCommentAttachment } from "@/components/comment-form";
import { FireIcon } from "@/components/fire-icon";
import { PaperclipIcon } from "@/components/paperclip-icon";
import { QuickCreateCard } from "@/components/quick-create-card";
import { moveCardAction } from "@/lib/actions";
import { CARD_STATUSES } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";
import {
  isLocalCardId,
  mergeLocalCards,
  pruneConfirmedLocalCards,
  type LocalBoardCard,
} from "@/lib/local-cards";

export type BoardCard = LocalBoardCard;

type KanbanBoardProps = {
  boardId: string;
  cards: BoardCard[];
  locale: string;
  attachmentsEnabled: boolean;
  currentUser: {
    participantId: string;
    displayName: string;
  };
};

type DragPayload = {
  cardId: string;
  fromStatus: CardStatus;
};

type OptimisticUpdate =
  | { kind: "status"; cardId: string; status: CardStatus }
  | { kind: "urgent"; cardId: string; urgent: boolean }
  | {
      kind: "comment-add";
      cardId: string;
      tempId: string;
      body: string;
      authorId: string;
      displayName: string;
      attachments: OptimisticCommentAttachment[];
    }
  | { kind: "comment-rollback"; cardId: string; tempId: string };

export function KanbanBoard({
  boardId,
  cards,
  locale,
  attachmentsEnabled,
  currentUser,
}: KanbanBoardProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState<CardStatus>("new");
  const [boardError, setBoardError] = useState<string | null>(null);
  const [localCards, setLocalCards] = useState<BoardCard[]>([]);
  const dragPayload = useRef<DragPayload | null>(null);
  const suppressClick = useRef(false);
  const pendingLocalCards = pruneConfirmedLocalCards(cards, localCards);

  const [optimisticCards, setOptimisticCards] = useOptimistic(
    mergeLocalCards(cards, pendingLocalCards),
    (current, update: OptimisticUpdate) => {
      if (update.kind === "status") {
        return current.map((card) =>
          card.id === update.cardId
            ? { ...card, status: update.status }
            : card,
        );
      }

      if (update.kind === "urgent") {
        return current.map((card) =>
          card.id === update.cardId
            ? { ...card, urgent: update.urgent }
            : card,
        );
      }

      if (update.kind === "comment-add") {
        const optimisticComment: BoardCard["comments"][number] = {
          id: update.tempId,
          cardId: update.cardId,
          authorId: update.authorId,
          body: update.body,
          createdAt: new Date(),
          author: {
            id: update.authorId,
            boardId,
            displayName: update.displayName,
            createdAt: new Date(),
          },
          attachments: update.attachments.map((attachment) => ({
            id: attachment.id,
            filename: attachment.filename,
            contentType: attachment.contentType,
            byteSize: attachment.byteSize,
            kind: attachment.kind,
            createdAt: new Date(),
            commentId: update.tempId,
            authorId: update.authorId,
            previewUrl: attachment.previewUrl,
          })),
        };

        return current.map((card) =>
          card.id === update.cardId
            ? { ...card, comments: [...card.comments, optimisticComment] }
            : card,
        );
      }

      return current.map((card) =>
        card.id === update.cardId
          ? {
              ...card,
              comments: card.comments.filter(
                (comment) => comment.id !== update.tempId,
              ),
            }
          : card,
      );
    },
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

    if (!cardId || fromStatus === undefined || fromStatus === status) {
      return;
    }

    setBoardError(null);
    startTransition(async () => {
      setOptimisticCards({ kind: "status", cardId, status });
      const formData = new FormData();
      formData.set("boardId", boardId);
      formData.set("cardId", cardId);
      formData.set("status", status);
      const result = await moveCardAction(formData);
      if (!result.ok) {
        setOptimisticCards({ kind: "status", cardId, status: fromStatus });
        setBoardError(result.error);
      }
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
      {boardError ? <p className="form-error board-move-error">{boardError}</p> : null}

      <nav className="board-stage-nav" aria-label={t.board.stagesNav}>
        {CARD_STATUSES.map((status) => {
          const count = optimisticCards.filter(
            (card) => card.status === status,
          ).length;

          return (
            <button
              key={status}
              type="button"
              className={
                activeStatus === status
                  ? `board-stage-tab stage-${status} is-active`
                  : `board-stage-tab stage-${status}`
              }
              onClick={() => setActiveStatus(status)}
            >
              <span className="board-stage-label">{t.columns[status]}</span>
              <span className="board-stage-count">{count}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={`board-grid focus-${activeStatus}${isPending ? " is-moving" : ""}`}
      >
        {CARD_STATUSES.map((status) => {
          const columnCards = optimisticCards.filter(
            (card) => card.status === status,
          );
          const isFocused = activeStatus === status;

          return (
            <section
              key={status}
              className={
                dragOverStatus === status
                  ? `board-column column-${status} is-drop-target${isFocused ? " is-focused" : ""}`
                  : `board-column column-${status}${isFocused ? " is-focused" : ""}`
              }
              onDragOver={(event) => onDragOver(event, status)}
              onDragLeave={onDragLeave}
              onDrop={(event) => onDrop(event, status)}
            >
              <header className="column-header">
                <h2>{t.columns[status]}</h2>
                <span className="count">{columnCards.length}</span>
              </header>

              <QuickCreateCard
                boardId={boardId}
                status={status}
                currentUser={currentUser}
                onLocalCreate={(card) => {
                  setBoardError(null);
                  setLocalCards((current) => [...current, card]);
                }}
                onLocalConfirm={(tempId, card) => {
                  setLocalCards((current) =>
                    current.map((item) => (item.id === tempId ? card : item)),
                  );
                }}
                onLocalRollback={(tempId, error) => {
                  setLocalCards((current) =>
                    current.filter((item) => item.id !== tempId),
                  );
                  setBoardError(error);
                }}
              />

              <div className="column-stack">
                {columnCards.map((card) => {
                  const isLocal = isLocalCardId(card.id);

                  return (
                    <article
                      key={card.id}
                      className={`card-tile ${card.type}${card.urgent ? " is-urgent" : ""}${isLocal ? " is-syncing" : ""}`}
                      draggable={!isLocal}
                      onDragStart={(event) =>
                        onDragStart(event, card.id, card.status)
                      }
                      onClick={() => {
                        if (!isLocal) {
                          onCardClick(card.id);
                        }
                      }}
                    >
                      <div className="card-meta">
                        <span className="type-pill">
                          {t.cardTypes[card.type]}
                        </span>
                        <span className="card-meta-right">
                          {card.urgent ? (
                            <span
                              className="fire-badge"
                              title={t.quickAdd.urgent}
                            >
                              <FireIcon size={15} />
                            </span>
                          ) : null}
                          <span className="author">{card.author.displayName}</span>
                        </span>
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
                      <p
                        className={
                          card.comments.length > 0 || card.attachments.length > 0
                            ? "card-foot"
                            : "card-foot is-empty"
                        }
                      >
                        {card.attachments.length > 0 ? (
                          <span className="card-foot-media">
                            <PaperclipIcon size={11} />
                            {card.attachments.length}
                          </span>
                        ) : null}
                        {card.comments.length > 0
                          ? t.board.replies.replace(
                              "{n}",
                              String(card.comments.length),
                            )
                          : card.attachments.length > 0
                            ? null
                            : "\u00a0"}
                      </p>
                    </article>
                  );
                })}
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
          attachmentsEnabled={attachmentsEnabled}
          onClose={() => setSelectedCardId(null)}
          onUrgentChange={(cardId, urgent) => {
            setOptimisticCards({ kind: "urgent", cardId, urgent });
          }}
          onCommentSend={(body, tempId, attachments) => {
            setOptimisticCards({
              kind: "comment-add",
              cardId: selectedCard.id,
              tempId,
              body,
              authorId: currentUser.participantId,
              displayName: currentUser.displayName,
              attachments,
            });
          }}
          onCommentRollback={(tempId) => {
            setOptimisticCards({
              kind: "comment-rollback",
              cardId: selectedCard.id,
              tempId,
            });
          }}
        />
      ) : null}
    </>
  );
}
