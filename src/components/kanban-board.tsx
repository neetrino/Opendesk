"use client";

import {
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { CardStatus } from "@prisma/client";
import { BoardDock } from "@/components/board-dock";
import { BoardSearchMobileBar, useBoardSearch } from "@/components/board-search";
import { CardSheet } from "@/components/card-sheet";
import { FireIcon } from "@/components/fire-icon";
import { LoadMoreSentinel } from "@/components/load-more-sentinel";
import { PaperclipIcon } from "@/components/paperclip-icon";
import type { BoardParticipant } from "@/components/participants-panel";
import { createCardAction, moveCardAction } from "@/lib/actions";
import {
  columnDisplayCount,
  type BoardColumnPages,
} from "@/lib/board-card-view";
import { applyForeignActivity, resolveLastReadAt } from "@/lib/card-reads";
import { CARD_STATUSES } from "@/lib/constants";
import { displayInitials } from "@/lib/initials";
import {
  buildLocalBoardCard,
  isLocalCardId,
  mergeVisibleCards,
  pruneConfirmedLocalCards,
  toBoardCardFromCreated,
  type LocalBoardCard,
} from "@/lib/local-cards";
import { useBoardActivity } from "@/lib/use-board-activity";
import { useCardReads } from "@/lib/use-card-reads";
import { useColumnPages } from "@/lib/use-column-pages";
import { filterCardsByQuery } from "@/lib/filter-cards";
import { useI18n } from "@/i18n/provider";

export type BoardCard = LocalBoardCard;

type KanbanBoardProps = {
  boardId: string;
  boardTitle: string;
  cards: BoardCard[];
  columnPages: BoardColumnPages;
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
  | { kind: "comment-count"; cardId: string; delta: number };

export function KanbanBoard({
  boardId,
  boardTitle,
  cards,
  columnPages,
  locale,
  attachmentsEnabled,
  slug,
  joinToken,
  participants,
  currentUser,
  isOwner,
}: KanbanBoardProps) {
  const { t } = useI18n();
  const { query } = useBoardSearch();
  const [isPending, startTransition] = useTransition();
  const [dragOverStatus, setDragOverStatus] = useState<CardStatus | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [draftCard, setDraftCard] = useState<BoardCard | null>(null);
  const [activeStatus, setActiveStatus] = useState<CardStatus>("new");
  const [boardError, setBoardError] = useState<string | null>(null);
  const [localCards, setLocalCards] = useState<BoardCard[]>([]);
  const [heldCards, setHeldCards] = useState<BoardCard[]>([]);
  const dragPayload = useRef<DragPayload | null>(null);
  const suppressClick = useRef(false);
  const { extraCards, hasMore, loadMore } = useColumnPages(
    boardId,
    columnPages,
  );
  const knownServerCards = mergeVisibleCards(cards, extraCards, [], []);
  const pendingLocalCards = pruneConfirmedLocalCards(
    knownServerCards,
    localCards,
  );
  const pendingHeldCards = pruneConfirmedLocalCards(
    knownServerCards,
    heldCards,
  );
  const { reads, seededAt, markCardRead } = useCardReads(
    boardId,
    currentUser.participantId,
    knownServerCards.map((card) => card.id),
  );
  const activity = useBoardActivity(boardId);
  const sourceById = new Map(
    knownServerCards.map((card) => [card.id, card.status]),
  );

  const [optimisticCards, setOptimisticCards] = useOptimistic(
    mergeVisibleCards(
      cards,
      extraCards,
      pendingHeldCards,
      pendingLocalCards,
    ),
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

      return current.map((card) =>
        card.id === update.cardId
          ? {
              ...card,
              commentCount: Math.max(0, card.commentCount + update.delta),
            }
          : card,
      );
    },
  );

  const isSearching = query.trim().length > 0;
  const visibleCards = useMemo(
    () => filterCardsByQuery(optimisticCards, query),
    [optimisticCards, query],
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

  function unreadCountFor(card: BoardCard): number {
    if (isLocalCardId(card.id) || selectedCardId === card.id || reads === null) {
      return 0;
    }

    const lastReadAt = resolveLastReadAt(reads, card.id, seededAt);
    return applyForeignActivity(
      0,
      lastReadAt,
      activity[card.id]?.lastForeignCommentAt,
    );
  }

  function closeSheet(): void {
    if (selectedCardId !== null && !isLocalCardId(selectedCardId)) {
      markCardRead(selectedCardId);
    }
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

    const moved = optimisticCards.find((card) => card.id === cardId);
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
        return;
      }

      if (moved) {
        setHeldCards((current) => [
          ...current.filter((card) => card.id !== cardId),
          { ...moved, status },
        ]);
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

      <BoardSearchMobileBar />

      <nav className="board-stage-nav" aria-label={t.board.stagesNav}>
        {CARD_STATUSES.map((status) => {
          const columnCards = visibleCards.filter(
            (card) => card.status === status,
          );
          const columnCount = isSearching
            ? columnCards.length
            : columnDisplayCount(
                status,
                columnPages[status].totalCount,
                sourceById,
                optimisticCards,
              );
          const unreadInColumn = columnCards.some(
            (card) => unreadCountFor(card) > 0,
          );

          return (
            <button
              key={status}
              type="button"
              aria-pressed={activeStatus === status}
              className={
                activeStatus === status
                  ? `board-stage-tab stage-${status} is-active${unreadInColumn ? " has-unread" : ""}`
                  : `board-stage-tab stage-${status}${unreadInColumn ? " has-unread" : ""}`
              }
              onClick={() => setActiveStatus(status)}
            >
              <span className="board-stage-label">{t.columns[status]}</span>
              <span className="board-stage-count">{columnCount}</span>
            </button>
          );
        })}
      </nav>

      <div
        className={`board-grid focus-${activeStatus}${isPending ? " is-moving" : ""}`}
      >
        {CARD_STATUSES.map((status) => {
          const columnCards = visibleCards.filter(
            (card) => card.status === status,
          );
          const columnCount = isSearching
            ? columnCards.length
            : columnDisplayCount(
                status,
                columnPages[status].totalCount,
                sourceById,
                optimisticCards,
              );
          const isFocused = activeStatus === status;
          const unreadInColumn = columnCards.some(
            (card) => unreadCountFor(card) > 0,
          );

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
                <div
                  className={`board-stage-tab stage-${status} is-active${unreadInColumn ? " has-unread" : ""}`}
                >
                  <h2 className="board-stage-label">{t.columns[status]}</h2>
                  <span className="board-stage-count">
                    {columnCount}
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
                  <p className="column-empty">
                    {isSearching ? t.board.searchEmpty : t.board.emptyColumn}
                  </p>
                ) : null}
                {columnCards.map((card) => {
                  const isLocal = isLocalCardId(card.id);
                  const unreadCount = unreadCountFor(card);

                  return (
                    <article
                      key={card.id}
                      className={`card-tile${card.urgent ? " is-urgent" : ""}${isLocal ? " is-syncing" : ""}${unreadCount > 0 ? " is-unread" : ""}`}
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
                          {unreadCount > 0 ? (
                            <span
                              className="unread-badge"
                              aria-label={t.board.unreadAria.replace(
                                "{n}",
                                String(unreadCount),
                              )}
                            >
                              {unreadCount}
                            </span>
                          ) : null}
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
                          card.commentCount > 0 || card.attachmentCount > 0
                            ? "card-foot"
                            : "card-foot is-empty"
                        }
                      >
                        {card.attachmentCount > 0 ? (
                          <span className="card-foot-media">
                            <PaperclipIcon size={11} />
                            {card.attachmentCount}
                          </span>
                        ) : null}
                        {card.commentCount > 0
                          ? t.board.replies.replace(
                              "{n}",
                              String(card.commentCount),
                            )
                          : card.attachmentCount > 0
                            ? null
                            : "\u00a0"}
                      </p>
                    </article>
                  );
                })}
                <LoadMoreSentinel
                  active={hasMore(status)}
                  onVisible={() => {
                    loadMore(status);
                  }}
                />
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
          currentUserName={currentUser.displayName}
          onStatusChange={(cardId, status) => {
            setOptimisticCards({ kind: "status", cardId, status });
            const moved = optimisticCards.find((card) => card.id === cardId);
            if (moved) {
              setHeldCards((current) => [
                ...current.filter((card) => card.id !== cardId),
                { ...moved, status },
              ]);
            }
          }}
          onUrgentChange={(cardId, urgent) => {
            setOptimisticCards({ kind: "urgent", cardId, urgent });
          }}
          onCommentSend={() => {
            setOptimisticCards({
              kind: "comment-count",
              cardId: selectedCard.id,
              delta: 1,
            });
          }}
          onCommentRollback={() => {
            setOptimisticCards({
              kind: "comment-count",
              cardId: selectedCard.id,
              delta: -1,
            });
          }}
        />
      ) : null}
    </>
  );
}
