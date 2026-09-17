"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
  type DragEvent,
} from "react";
import type { CardStatus } from "@prisma/client";
import { BoardDock } from "@/components/board-dock";
import { useRegisterBoardInboxControl } from "@/components/board-inbox-control";
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
import {
  applyCardMove,
  compareCardsByPosition,
  writeMovePlacement,
  type MovePlacement,
} from "@/lib/card-position";
import { applyForeignActivity, isUnseenCard, resolveLastReadAt } from "@/lib/card-reads";
import { CARD_STATUSES } from "@/lib/constants";
import { BoardAvatar } from "@/components/board-avatar";
import {
  buildLocalBoardCard,
  isLocalCardId,
  mergeVisibleCards,
  pruneConfirmedHeldCards,
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
    avatarKey: string | null;
  };
  isOwner: boolean;
};

type DragPayload = {
  cardId: string;
  fromStatus: CardStatus;
};

type DropTarget = {
  status: CardStatus;
  placement: MovePlacement;
};

function sameDropTarget(
  left: DropTarget | null,
  right: DropTarget,
): boolean {
  if (!left || left.status !== right.status) {
    return false;
  }
  if (left.placement.kind === "start" || right.placement.kind === "start") {
    return left.placement.kind === "start" && right.placement.kind === "start";
  }
  return (
    left.placement.kind === right.placement.kind &&
    left.placement.cardId === right.placement.cardId
  );
}

function dropLineBefore(
  dropTarget: DropTarget | null,
  status: CardStatus,
  cardId: string,
): boolean {
  return (
    dropTarget?.status === status &&
    dropTarget.placement.kind === "before" &&
    dropTarget.placement.cardId === cardId
  );
}

function dropLineAfter(
  dropTarget: DropTarget | null,
  status: CardStatus,
  cardId: string,
): boolean {
  return (
    dropTarget?.status === status &&
    dropTarget.placement.kind === "after" &&
    dropTarget.placement.cardId === cardId
  );
}

type OptimisticUpdate =
  | {
      kind: "move";
      cardId: string;
      status: CardStatus;
      placement: MovePlacement;
    }
  | {
      kind: "status";
      cardId: string;
      status: CardStatus;
      position?: number;
    };

function replaceHeldCard(current: BoardCard[], next: BoardCard): BoardCard[] {
  return [...current.filter((card) => card.id !== next.id), next];
}

function patchHeldCard(
  current: BoardCard[],
  cardId: string,
  fallback: BoardCard | undefined,
  patch: Partial<BoardCard>,
): BoardCard[] {
  const source = current.find((card) => card.id === cardId) ?? fallback;
  if (!source) {
    return current;
  }
  return replaceHeldCard(current, { ...source, ...patch });
}

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
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [threadOpenedReadAt, setThreadOpenedReadAt] = useState<Date | null>(
    null,
  );
  const [draftCard, setDraftCard] = useState<BoardCard | null>(null);
  const [activeStatus, setActiveStatus] = useState<CardStatus>("new");
  const [boardError, setBoardError] = useState<string | null>(null);
  const [localCards, setLocalCards] = useState<BoardCard[]>([]);
  const [heldCards, setHeldCards] = useState<BoardCard[]>([]);
  const [removedCardIds, setRemovedCardIds] = useState<string[]>([]);
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
  const pendingHeldCards = pruneConfirmedHeldCards(
    knownServerCards,
    heldCards,
  );
  const { reads, seededAt, markCardRead, markAllRead } = useCardReads(
    boardId,
    currentUser.participantId,
    knownServerCards.map((card) => card.id),
  );
  const activity = useBoardActivity(boardId);
  const inboxCardIdsRef = useRef<string[]>([]);
  useEffect(() => {
    inboxCardIdsRef.current = [
      ...knownServerCards.map((card) => card.id),
      ...Object.keys(activity),
    ];
  }, [activity, knownServerCards]);
  const sourceById = new Map(
    knownServerCards.map((card) => [card.id, card.status]),
  );

  const mergedCards = mergeVisibleCards(
    cards,
    extraCards,
    pendingHeldCards,
    pendingLocalCards,
  );
  const sourceCards =
    removedCardIds.length === 0
      ? mergedCards
      : mergedCards.filter((card) => !removedCardIds.includes(card.id));
  const [optimisticCards, setOptimisticCards] = useOptimistic(
    sourceCards,
    (current, update: OptimisticUpdate) => {
      if (update.kind === "move") {
        return applyCardMove(current, {
          cardId: update.cardId,
          toStatus: update.status,
          placement: update.placement,
        });
      }

      if (update.kind === "status") {
        return current.map((card) =>
          card.id === update.cardId
            ? {
                ...card,
                status: update.status,
                ...(update.position === undefined
                  ? {}
                  : { position: update.position }),
              }
            : card,
        );
      }

      return current;
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

  function isNewTask(card: BoardCard): boolean {
    if (isLocalCardId(card.id) || selectedCardId === card.id || reads === null) {
      return false;
    }
    return isUnseenCard(card, reads, seededAt, currentUser.participantId);
  }

  function columnHasNew(
    status: CardStatus,
    columnCards: BoardCard[],
  ): boolean {
    if (columnCards.some((card) => isNewTask(card))) {
      return true;
    }
    if (reads === null) {
      return false;
    }
    const visibleIds = new Set(columnCards.map((card) => card.id));
    return Object.values(activity).some(
      (item) =>
        item.status === status &&
        !visibleIds.has(item.id) &&
        isUnseenCard(item, reads, seededAt, currentUser.participantId),
    );
  }

  const markBoardInboxRead = useCallback((): void => {
    markAllRead([...new Set(inboxCardIdsRef.current)]);
  }, [markAllRead]);

  function closeSheet(): void {
    if (selectedCardId !== null && !isLocalCardId(selectedCardId)) {
      markCardRead(selectedCardId);
    }
    setSelectedCardId(null);
    setDraftCard(null);
  }

  function removeCard(cardId: string): void {
    setRemovedCardIds((current) =>
      current.includes(cardId) ? current : [...current, cardId],
    );
    setLocalCards((current) => current.filter((card) => card.id !== cardId));
    setHeldCards((current) => current.filter((card) => card.id !== cardId));
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

  function setDropTargetIfChanged(next: DropTarget): void {
    setDropTarget((current) =>
      sameDropTarget(current, next) ? current : next,
    );
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

  function onColumnDragOver(
    event: DragEvent<HTMLElement>,
    status: CardStatus,
  ): void {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (event.target instanceof Element && event.target.closest(".card-tile")) {
      return;
    }
    setDropTargetIfChanged({ status, placement: { kind: "start" } });
  }

  function onCardDragOver(
    event: DragEvent<HTMLElement>,
    status: CardStatus,
    cardId: string,
  ): void {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    if (dragPayload.current?.cardId === cardId) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const placement: MovePlacement =
      event.clientY < rect.top + rect.height / 2
        ? { kind: "before", cardId }
        : { kind: "after", cardId };
    setDropTargetIfChanged({ status, placement });
  }

  function onColumnDragLeave(
    event: DragEvent<HTMLElement>,
    status: CardStatus,
  ): void {
    const next = event.relatedTarget;
    if (next instanceof Node && event.currentTarget.contains(next)) {
      return;
    }
    setDropTarget((current) => (current?.status === status ? null : current));
  }

  function onDrop(event: DragEvent<HTMLElement>, status: CardStatus): void {
    event.preventDefault();
    const placement =
      dropTarget?.status === status
        ? dropTarget.placement
        : { kind: "start" as const };
    setDropTarget(null);

    const cardId =
      dragPayload.current?.cardId || event.dataTransfer.getData("text/plain");
    const fromStatus = dragPayload.current?.fromStatus;
    dragPayload.current = null;

    if (!cardId || fromStatus === undefined) {
      return;
    }

    const moved = optimisticCards.find((card) => card.id === cardId);
    if (!moved) {
      return;
    }

    const nextCards = applyCardMove(optimisticCards, {
      cardId,
      toStatus: status,
      placement,
    });
    const nextMoved = nextCards.find((card) => card.id === cardId);
    if (
      !nextMoved ||
      (moved.status === nextMoved.status &&
        moved.position === nextMoved.position)
    ) {
      return;
    }

    setBoardError(null);
    setHeldCards((current) => replaceHeldCard(current, nextMoved));
    startTransition(async () => {
      setOptimisticCards({ kind: "move", cardId, status, placement });
      const formData = new FormData();
      formData.set("boardId", boardId);
      formData.set("cardId", cardId);
      formData.set("status", status);
      writeMovePlacement(formData, placement);
      const result = await moveCardAction(formData);
      if (!result.ok) {
        setHeldCards((current) => replaceHeldCard(current, moved));
        setOptimisticCards({
          kind: "status",
          cardId,
          status: fromStatus,
          position: moved.position,
        });
        setBoardError(result.error);
      }
    });
  }

  function onCardClick(cardId: string): void {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    setThreadOpenedReadAt(resolveLastReadAt(reads, cardId, seededAt));
    setSelectedCardId(cardId);
    if (!isLocalCardId(cardId)) {
      markCardRead(cardId);
    }
  }

  const hasInbox =
    visibleCards.some(
      (card) => isNewTask(card) || unreadCountFor(card) > 0,
    ) ||
    Object.values(activity).some((item) => {
      if (reads === null) {
        return false;
      }
      return (
        isUnseenCard(item, reads, seededAt, currentUser.participantId) ||
        applyForeignActivity(
          0,
          resolveLastReadAt(reads, item.id, seededAt),
          item.lastForeignCommentAt,
        ) > 0
      );
    });

  useRegisterBoardInboxControl(hasInbox, markBoardInboxRead);

  return (
    <>
      {boardError ? <p className="form-error board-move-error">{boardError}</p> : null}

      <BoardSearchMobileBar />

      <nav className="board-stage-nav" aria-label={t.board.stagesNav}>
        {CARD_STATUSES.map((status) => {
          const columnCards = visibleCards
            .filter((card) => card.status === status)
            .sort(compareCardsByPosition);
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
          const newInColumn = columnHasNew(status, columnCards);
          const inboxClass = `${unreadInColumn ? " has-unread" : ""}${newInColumn ? " has-new" : ""}`;

          return (
            <button
              key={status}
              type="button"
              aria-pressed={activeStatus === status}
              className={
                activeStatus === status
                  ? `board-stage-tab stage-${status} is-active${inboxClass}`
                  : `board-stage-tab stage-${status}${inboxClass}`
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
          const columnCards = visibleCards
            .filter((card) => card.status === status)
            .sort(compareCardsByPosition);
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
          const newInColumn = columnHasNew(status, columnCards);

          return (
            <section
              key={status}
              aria-label={t.columns[status]}
              className={
                dropTarget?.status === status
                  ? `board-column column-${status} is-drop-target${isFocused ? " is-focused" : ""}`
                  : `board-column column-${status}${isFocused ? " is-focused" : ""}`
              }
              onDragOver={(event) => onColumnDragOver(event, status)}
              onDragLeave={(event) => onColumnDragLeave(event, status)}
              onDrop={(event) => onDrop(event, status)}
            >
              <header className="column-header">
                <div
                  className={`board-stage-tab stage-${status} is-active${unreadInColumn ? " has-unread" : ""}${newInColumn ? " has-new" : ""}`}
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
                {dropTarget?.status === status &&
                dropTarget.placement.kind === "start" ? (
                  <div className="card-drop-line" aria-hidden="true" />
                ) : null}
                {columnCards.length === 0 ? (
                  <p className="column-empty">
                    {isSearching ? t.board.searchEmpty : t.board.emptyColumn}
                  </p>
                ) : null}
                {columnCards.map((card) => {
                  const isLocal = isLocalCardId(card.id);
                  const unreadCount = unreadCountFor(card);
                  const isNew = isNewTask(card);

                  return (
                    <article
                      key={card.id}
                      className={`card-tile${card.urgent ? " is-urgent" : ""}${isLocal ? " is-syncing" : ""}${unreadCount > 0 ? " is-unread" : ""}${isNew ? " is-new" : ""}`}
                      draggable={!isLocal}
                      onDragStart={(event) =>
                        onDragStart(event, card.id, card.status)
                      }
                      onDragOver={(event) =>
                        onCardDragOver(event, status, card.id)
                      }
                      onDragEnd={() => {
                        setDropTarget(null);
                      }}
                      onClick={() => {
                        onCardClick(card.id);
                      }}
                    >
                      {dropLineBefore(dropTarget, status, card.id) ? (
                        <span className="card-drop-line is-over-card is-before" aria-hidden="true" />
                      ) : null}
                      {dropLineAfter(dropTarget, status, card.id) ? (
                        <span className="card-drop-line is-over-card is-after" aria-hidden="true" />
                      ) : null}
                      <div className="card-meta">
                        <span className="author">
                          <BoardAvatar
                            name={card.author.displayName}
                            mark={card.author.avatarKey}
                          />
                          {card.author.displayName}
                        </span>
                        <span className="card-meta-right">
                          {isNew ? (
                            <span
                              className="new-badge"
                              aria-label={t.board.newTaskAria}
                            >
                              {t.board.newTaskLabel}
                            </span>
                          ) : null}
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
        avatarKey={currentUser.avatarKey}
        isOwner={isOwner}
        onStartCreate={() => startCreate(activeStatus)}
        onMarkAllRead={hasInbox ? markBoardInboxRead : undefined}
      />

      {selectedCard ? (
        <CardSheet
          boardId={boardId}
          card={selectedCard}
          locale={locale}
          currentUserId={currentUser.participantId}
          currentUserName={currentUser.displayName}
          currentUserAvatar={currentUser.avatarKey}
          participants={participants}
          lastReadAt={threadOpenedReadAt}
          attachmentsEnabled={attachmentsEnabled}
          isOwner={isOwner}
          isDraft={selectedIsDraft}
          onClose={closeSheet}
          onDeleted={removeCard}
          onDraftCommit={commitDraft}
          onCreatedCard={(created) => {
            const nextCard = {
              ...toBoardCardFromCreated(created, currentUser),
              commentCount: 1,
            };
            setLocalCards((current) => [
              ...current.filter((item) => item.id !== nextCard.id),
              nextCard,
            ]);
            setThreadOpenedReadAt(new Date());
            setSelectedCardId(nextCard.id);
            markCardRead(nextCard.id);
          }}
          onStatusChange={(cardId, status, position) => {
            if (position === undefined) {
              const nextCards = applyCardMove(optimisticCards, {
                cardId,
                toStatus: status,
                placement: { kind: "start" },
              });
              const moved = nextCards.find((card) => card.id === cardId);
              if (moved) {
                setHeldCards((current) => replaceHeldCard(current, moved));
              }
              return;
            }

            const moved = optimisticCards.find((card) => card.id === cardId);
            if (moved) {
              setHeldCards((current) =>
                replaceHeldCard(current, { ...moved, status, position }),
              );
            }
          }}
          onUrgentChange={(cardId, urgent) => {
            setHeldCards((current) =>
              patchHeldCard(
                current,
                cardId,
                optimisticCards.find((card) => card.id === cardId),
                { urgent },
              ),
            );
          }}
          onCommentSend={() => {
            setHeldCards((current) => {
              const source =
                current.find((card) => card.id === selectedCard.id) ??
                selectedCard;
              return replaceHeldCard(current, {
                ...source,
                commentCount: source.commentCount + 1,
              });
            });
          }}
          onCommentRollback={() => {
            setHeldCards((current) => {
              const source =
                current.find((card) => card.id === selectedCard.id) ??
                selectedCard;
              return replaceHeldCard(current, {
                ...source,
                commentCount: Math.max(0, source.commentCount - 1),
              });
            });
          }}
        />
      ) : null}
    </>
  );
}
