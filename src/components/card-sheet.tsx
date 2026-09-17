"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FocusEvent,
  type PointerEvent,
} from "react";
import type { Card, CardStatus } from "@prisma/client";
import { CardDeleteControl } from "@/components/card-delete-control";
import { CardThreadPane } from "@/components/card-thread-pane";
import { CommentForm } from "@/components/comment-form";
import { FireIcon } from "@/components/fire-icon";
import { PencilIcon } from "@/components/pencil-icon";
import type { ThreadReplyTo } from "@/lib/card-comment-view";
import type { MentionParticipant } from "@/lib/comment-mentions";
import {
  moveCardAction,
  setCardUrgentAction,
  updateCardContentAction,
} from "@/lib/actions";
import { CARD_STATUSES, MAX_TITLE_LENGTH } from "@/lib/constants";
import { isLocalCardId, type LocalBoardCard } from "@/lib/local-cards";
import { useCardThread } from "@/lib/use-card-thread";
import { useI18n } from "@/i18n/provider";
import { useHistoryTrap } from "@/lib/use-history-trap";

export type SheetCard = LocalBoardCard;

const MIN_CARD_TITLE_LENGTH = 2;

type CardSheetProps = {
  boardId: string;
  card: SheetCard;
  locale: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string | null;
  participants: MentionParticipant[];
  lastReadAt: Date | null;
  attachmentsEnabled: boolean;
  isOwner: boolean;
  isDraft?: boolean;
  onClose: () => void;
  onDeleted: (cardId: string) => void;
  onDraftCommit?: (title: string, urgent: boolean) => Promise<string | null>;
  onStatusChange: (
    cardId: string,
    status: CardStatus,
    position?: number,
  ) => void;
  onUrgentChange: (cardId: string, urgent: boolean) => void;
  onCommentSend: () => void;
  onCommentRollback: () => void;
  onCreatedCard: (card: Card) => void;
};

export function CardSheet({
  boardId,
  card,
  locale,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  participants,
  lastReadAt,
  attachmentsEnabled,
  isOwner,
  isDraft = false,
  onClose,
  onDeleted,
  onDraftCommit,
  onStatusChange,
  onUrgentChange,
  onCommentSend,
  onCommentRollback,
  onCreatedCard,
}: CardSheetProps) {
  const { t } = useI18n();
  const [isPending, startTransition] = useTransition();
  const [cardId, setCardId] = useState(card.id);
  const [title, setTitle] = useState(card.title);
  const [draftUrgent, setDraftUrgent] = useState(card.urgent);
  const [stageMenuOpen, setStageMenuOpen] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<ThreadReplyTo | null>(null);
  const threadEnabled = !isDraft && !isLocalCardId(card.id);
  const thread = useCardThread(boardId, card.id, threadEnabled);
  const threadRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const stageMenuRef = useRef<HTMLDivElement>(null);
  const createConfirmRef = useRef<HTMLButtonElement>(null);
  const dismissIntentRef = useRef(false);
  const skipCommitRef = useRef(false);
  const commitInFlightRef = useRef(false);
  const urgent = isDraft ? draftUrgent : card.urgent;
  const titleReady = title.trim().length >= MIN_CARD_TITLE_LENGTH;
  const titleAtLimit = title.length >= MAX_TITLE_LENGTH;
  const titleLimitHintId = `card-title-limit-${card.id}`;
  const canDelete =
    isOwner && !isDraft && !isLocalCardId(card.id);

  const requestClose = useCallback((): void => {
    dismissIntentRef.current = false;
    if (leaveConfirm) {
      onClose();
      return;
    }
    if (isDraft && titleReady) {
      skipCommitRef.current = true;
      setLeaveConfirm(true);
      return;
    }
    onClose();
  }, [isDraft, leaveConfirm, onClose, titleReady]);

  useHistoryTrap({
    id: "card",
    active: true,
    onBack: requestClose,
  });

  if (card.id !== cardId) {
    setCardId(card.id);
    setTitle(card.title);
    setDraftUrgent(card.urgent);
    setStageMenuOpen(false);
    setLeaveConfirm(false);
    setError(null);
    setReplyTo(null);
  }

  useEffect(() => {
    if (!isDraft) {
      return;
    }
    titleRef.current?.focus();
  }, [isDraft, card.id]);

  useEffect(() => {
    if (leaveConfirm) {
      createConfirmRef.current?.focus();
    }
  }, [leaveConfirm]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        if (document.querySelector(".confirm-dialog-root")) {
          return;
        }
        if (stageMenuOpen) {
          setStageMenuOpen(false);
          return;
        }
        requestClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [requestClose, stageMenuOpen]);

  useEffect(() => {
    if (!stageMenuOpen) {
      return;
    }

    function onPointerDown(event: globalThis.PointerEvent): void {
      if (
        event.target instanceof Node &&
        !stageMenuRef.current?.contains(event.target)
      ) {
        setStageMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [stageMenuOpen]);

  const newestCommentId = thread.comments[thread.comments.length - 1]?.id;

  useEffect(() => {
    const node = threadRef.current;
    if (!node || thread.loading || thread.loadingOlder) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [card.id, newestCommentId, thread.loading, thread.loadingOlder]);

  async function commitDraft(nextUrgent = draftUrgent): Promise<boolean> {
    if (!isDraft || !onDraftCommit) {
      return true;
    }
    if (commitInFlightRef.current) {
      return false;
    }
    const nextTitle = title.trim();
    if (nextTitle.length < MIN_CARD_TITLE_LENGTH) {
      setError(t.errors.cardTitleShort);
      titleRef.current?.focus();
      return false;
    }

    commitInFlightRef.current = true;
    setError(null);
    const commitError = await onDraftCommit(nextTitle, nextUrgent);
    commitInFlightRef.current = false;
    if (commitError) {
      setError(commitError);
      return false;
    }
    setLeaveConfirm(false);
    return true;
  }

  function markDismissIntent(): void {
    dismissIntentRef.current = true;
  }

  function toggleUrgent(): void {
    if (isDraft) {
      const nextUrgent = !draftUrgent;
      setDraftUrgent(nextUrgent);
      if (titleReady) {
        void commitDraft(nextUrgent);
      }
      return;
    }
    if (isLocalCardId(card.id)) {
      return;
    }

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

  function changeStatus(nextStatus: CardStatus): void {
    if (
      isDraft ||
      isLocalCardId(card.id) ||
      nextStatus === card.status
    ) {
      return;
    }

    const previousStatus = card.status;
    const previousPosition = card.position;
    setError(null);
    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", card.id);
    formData.set("status", nextStatus);

    startTransition(async () => {
      onStatusChange(card.id, nextStatus);
      const response = await moveCardAction(formData);
      if (!response.ok) {
        onStatusChange(card.id, previousStatus, previousPosition);
        setError(response.error);
      }
    });
  }

  function saveTitle(): void {
    const nextTitle = title.trim();
    if (isDraft || isLocalCardId(card.id)) {
      return;
    }
    if (nextTitle.length < MIN_CARD_TITLE_LENGTH || nextTitle === card.title) {
      if (nextTitle.length < MIN_CARD_TITLE_LENGTH) {
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

  function onTitleBlur(event: FocusEvent<HTMLInputElement>): void {
    if (dismissIntentRef.current || skipCommitRef.current || leaveConfirm) {
      dismissIntentRef.current = false;
      skipCommitRef.current = false;
      return;
    }
    const next = event.relatedTarget;
    if (
      next instanceof HTMLElement &&
      (next.closest("[data-sheet-dismiss]") || next.closest(".sheet-urgent"))
    ) {
      return;
    }
    if (isDraft) {
      if (titleReady) {
        void commitDraft();
      }
      return;
    }
    saveTitle();
  }

  function onComposerPointerDown(event: PointerEvent<HTMLDivElement>): void {
    if (!isDraft || leaveConfirm) {
      return;
    }
    if (!titleReady) {
      event.preventDefault();
      setError(t.errors.cardTitleShort);
      titleRef.current?.focus();
      return;
    }
    void commitDraft();
  }

  async function confirmCreateAndClose(): Promise<void> {
    const created = await commitDraft();
    if (created) {
      onClose();
    }
  }

  return (
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        data-sheet-dismiss=""
        aria-label={t.cardPage.close}
        onPointerDown={markDismissIntent}
        onClick={requestClose}
      />
      <aside
        className={`card-sheet${urgent ? " is-urgent" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`card-sheet-title-${card.id}`}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <div className="sheet-title-block">
            <label
              className={isDraft ? "sheet-title-bar is-draft" : "sheet-title-bar"}
            >
              <span className="visually-hidden">{t.cardPage.editTitle}</span>
              <input
                ref={titleRef}
                id={`card-sheet-title-${card.id}`}
                className="sheet-title-input"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                placeholder={isDraft ? t.cardPage.titlePlaceholder : undefined}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                autoFocus={isDraft}
                aria-describedby={titleAtLimit ? titleLimitHintId : undefined}
                onChange={(event) => {
                  setTitle(event.target.value.slice(0, MAX_TITLE_LENGTH));
                  if (leaveConfirm) {
                    setLeaveConfirm(false);
                  }
                }}
                onBlur={onTitleBlur}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
              />
              <PencilIcon className="sheet-title-edit" size={16} />
            </label>
            {titleAtLimit ? (
              <p
                id={titleLimitHintId}
                className="sheet-title-limit-hint"
                role="status"
              >
                {t.cardPage.titleLimitHint}
              </p>
            ) : null}
          </div>
          <div className="sheet-actions">
            {canDelete ? (
              <CardDeleteControl
                boardId={boardId}
                cardId={card.id}
                disabled={isPending}
                onDeleted={() => onDeleted(card.id)}
                onError={setError}
              />
            ) : null}
            <button
              type="button"
              className={
                urgent
                  ? "sheet-icon-btn sheet-urgent is-on"
                  : "sheet-icon-btn sheet-urgent"
              }
              onClick={toggleUrgent}
              disabled={isPending || (!isDraft && isLocalCardId(card.id))}
              aria-pressed={urgent}
              aria-label={
                urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent
              }
              title={
                urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent
              }
            >
              <FireIcon size={18} />
            </button>
            <button
              type="button"
              className="sheet-icon-btn sheet-close"
              data-sheet-dismiss=""
              onPointerDown={markDismissIntent}
              onClick={requestClose}
              aria-label={t.cardPage.close}
            >
              ×
            </button>
          </div>
        </header>
        <div className="sheet-stage-anchor">
          <div
            ref={stageMenuRef}
            className={`sheet-stage-control stage-${card.status}${isPending ? " is-pending" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
            }}
          >
            <button
              type="button"
              className="sheet-stage-trigger"
              disabled={isPending || isDraft || isLocalCardId(card.id)}
              aria-label={t.common.stageAria}
              aria-haspopup="listbox"
              aria-expanded={stageMenuOpen}
              onClick={() => {
                setStageMenuOpen((current) => !current);
              }}
            >
              {t.columns[card.status]}
            </button>
            {stageMenuOpen ? (
              <div
                className="sheet-stage-menu"
                role="listbox"
                aria-label={t.common.stageAria}
              >
                {CARD_STATUSES.map((status) => (
                  <button
                    key={status}
                    type="button"
                    role="option"
                    aria-selected={status === card.status}
                    className={`sheet-stage-option stage-${status}${status === card.status ? " is-active" : ""}`}
                    onClick={() => {
                      setStageMenuOpen(false);
                      changeStatus(status);
                    }}
                  >
                    {t.columns[status]}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        {error ? <p className="form-error sheet-title-error">{error}</p> : null}

        <div className="sheet-discussion">
          {threadEnabled ? (
            <CardThreadPane
              key={card.id}
              boardId={boardId}
              cardId={card.id}
              locale={locale}
              currentUserId={currentUserId}
              participants={participants}
              lastReadAt={lastReadAt}
              thread={thread}
              threadRef={threadRef}
              onReply={setReplyTo}
              onCreatedCard={onCreatedCard}
            />
          ) : (
            <div className="thread">
              <p className="muted thread-empty">{t.cardPage.emptyThread}</p>
            </div>
          )}
          <div className="sheet-composer">
            {leaveConfirm ? (
              <div
                className="sheet-draft-confirm"
                role="alertdialog"
                aria-labelledby={`card-sheet-leave-${card.id}`}
              >
                <p id={`card-sheet-leave-${card.id}`}>
                  {t.cardPage.draftLeavePrompt}
                </p>
                <div className="sheet-draft-confirm-actions">
                  <button
                    type="button"
                    className="button button-cancel"
                    onClick={onClose}
                  >
                    {t.cardPage.draftLeaveDiscard}
                  </button>
                  <button
                    ref={createConfirmRef}
                    type="button"
                    className="button button-save"
                    onClick={() => {
                      void confirmCreateAndClose();
                    }}
                  >
                    {t.cardPage.draftLeaveCreate}
                  </button>
                </div>
              </div>
            ) : (
              <div onPointerDownCapture={onComposerPointerDown}>
                <CommentForm
                  boardId={boardId}
                  cardId={card.id}
                  enabled={attachmentsEnabled}
                  participants={participants}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                  onOptimisticSend={(body, tempId, attachments, reply) => {
                    thread.addOptimistic(
                      body,
                      tempId,
                      currentUserId,
                      currentUserName,
                      currentUserAvatar,
                      attachments,
                      reply,
                    );
                    onCommentSend();
                  }}
                  onOptimisticRollback={(tempId) => {
                    thread.rollbackOptimistic(tempId);
                    onCommentRollback();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
