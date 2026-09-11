"use client";

import {
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { CardStatus } from "@prisma/client";
import { BoardDock } from "@/components/board-dock";
import { CardSheet } from "@/components/card-sheet";
import type { OptimisticCommentAttachment } from "@/components/comment-form";
import { FireIcon } from "@/components/fire-icon";
import { PaperclipIcon } from "@/components/paperclip-icon";
import type { BoardParticipant } from "@/components/participants-panel";
import { createCardAction, moveCardAction } from "@/lib/actions";
import { CARD_STATUSES } from "@/lib/constants";
import { displayInitials } from "@/lib/initials";
import { useI18n } from "@/i18n/provider";
import {
  buildLocalBoardCard,
  isLocalCardId,
  mergeLocalCards,
  pruneConfirmedLocalCards,
  toBoardCardFromCreated,
  type LocalBoardCard,
} from "@/lib/local-cards";

export type BoardCard = LocalBoardCard;

type KanbanBoardProps = {
  boardId: string;
  boardTitle: string;
  cards: BoardCard[];
  locale: string;
  attachmentsEnabled: boolean;
  slug: string;
  joinToken: string;
  participants: BoardParticipant[];
  currentUser: {
    participantId: string;
    displayName: string;
  };
  isOwner: boolean;
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
  boardTitle,
  cards,
  locale,
  attachmentsEnabled,
  slug,
  joinToken,
  participants,
  currentUser,
  isOwner,
}: KanbanBoardProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [draftCard, setDraftCard] = useState<BoardCard | null>(null);
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
      : (optimisticCards.find((card) => card.id === selectedCardId) ??
        (draftCard?.id === selectedCardId ? draftCard : null));
  const selectedIsDraft =
    draftCard !== null && selectedCardId === draftCard.id;

  function startCreate(status: CardStatus): void {
    const draft = buildLocalBoardCard({
      boardId,
      status,
      title: "",
      urgent: false,
      author: currentUser,
    });
    setBoardError(null);
    setDraftCard(draft);
    setSelectedCardId(draft.id);
  }

  function closeSheet(): void {
    setSelectedCardId(null);
    setDraftCard(null);
  }

  async function commitDraft(
    title: string,
    urgent: boolean,
  ): Promise<string | null> {
    if (!draftCard) {
      return t.errors.createCard;
    }

    const localCard: BoardCard = {
      ...draftCard,
      title,
      urgent,
      updatedAt: new Date(),
    };
    setBoardError(null);
    setLocalCards((current) => [...current, localCard]);
    setDraftCard(null);

    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("status", localCard.status);
    formData.set("title", title);
    formData.set("urgent", urgent ? "true" : "false");

    const response = await createCardAction(formData);
    if (!response.ok) {
      setLocalCards((current) =>
        current.filter((item) => item.id !== localCard.id),
      );
      setDraftCard(localCard);
      setBoardError(response.error);
      return response.error;
    }

    const confirmed = toBoardCardFromCreated(response.data, currentUser);
    setLocalCards((current) =>
      current.map((item) => (item.id === localCard.id ? confirmed : item)),
    );
    setSelectedCardId((current) =>
      current === localCard.id ? confirmed.id : current,
    );
    return null;
  }

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
              aria-pressed={activeStatus === status}
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
              aria-label={t.columns[status]}
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
                <div className={`board-stage-tab stage-${status} is-active`}>
                  <h2 className="board-stage-label">{t.columns[status]}</h2>
                  <span className="board-stage-count">
                    {columnCards.length}
                  </span>
                </div>
              </header>

              <button
                type="button"
                className="quick-add-trigger"
                onClick={() => startCreate(status)}
              >
                {t.quickAdd.trigger}
              </button>

              <div className="column-stack">
                {columnCards.length === 0 ? (
                  <p className="column-empty">{t.board.emptyColumn}</p>
                ) : null}
                {columnCards.map((card) => {
                  const isLocal = isLocalCardId(card.id);

                  return (
                    <article
                      key={card.id}
                      className={`card-tile${card.urgent ? " is-urgent" : ""}${isLocal ? " is-syncing" : ""}`}
                      draggable={!isLocal}
                      onDragStart={(event) =>
                        onDragStart(event, card.id, card.status)
                      }
                      onClick={() => {
                        onCardClick(card.id);
                      }}
                    >
                      <div className="card-meta">
                        <span className="author">
                          <span className="card-avatar" aria-hidden="true">
                            {displayInitials(card.author.displayName)}
                          </span>
                          {card.author.displayName}
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
                        </span>
                      </div>
                      <h3 className="card-title">{card.title}</h3>
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

      <BoardDock
        boardTitle={boardTitle}
        slug={slug}
        joinToken={joinToken}
        participants={participants}
        locale={locale}
        displayName={currentUser.displayName}
        isOwner={isOwner}
        onStartCreate={() => startCreate(activeStatus)}
      />

      {selectedCard ? (
        <CardSheet
          boardId={boardId}
          card={selectedCard}
          locale={locale}
          currentUserId={currentUser.participantId}
          attachmentsEnabled={attachmentsEnabled}
          isDraft={selectedIsDraft}
          onClose={closeSheet}
          onDraftCommit={commitDraft}
          onStatusChange={(cardId, status) => {
            setOptimisticCards({ kind: "status", cardId, status });
          }}
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
