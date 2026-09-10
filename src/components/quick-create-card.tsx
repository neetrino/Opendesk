"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { CardStatus } from "@prisma/client";
import { FireIcon } from "@/components/fire-icon";
import { createCardAction } from "@/lib/actions";
import { MAX_TITLE_LENGTH } from "@/lib/constants";
import { useI18n } from "@/i18n/provider";
import {
  buildLocalBoardCard,
  toBoardCardFromCreated,
  type LocalBoardCard,
  type LocalCardAuthor,
} from "@/lib/local-cards";

type QuickCreateCardProps = {
  boardId: string;
  status: CardStatus;
  currentUser: LocalCardAuthor;
  onLocalCreate: (card: LocalBoardCard) => void;
  onLocalConfirm: (tempId: string, card: LocalBoardCard) => void;
  onLocalRollback: (tempId: string, error: string) => void;
};

export function QuickCreateCard({
  boardId,
  status,
  currentUser,
  onLocalCreate,
  onLocalConfirm,
  onLocalRollback,
}: QuickCreateCardProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

  function resetForm(): void {
    setUrgent(false);
    setError(null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    if (title.length < 2) {
      return;
    }

    const localCard = buildLocalBoardCard({
      boardId,
      status,
      title,
      urgent,
      author: currentUser,
    });

    formData.set("boardId", boardId);
    formData.set("status", status);
    formData.set("urgent", urgent ? "true" : "false");
    setError(null);
    onLocalCreate(localCard);
    form.reset();
    setUrgent(false);
    titleRef.current?.focus();

    startTransition(async () => {
      const response = await createCardAction(formData);
      if (!response.ok) {
        onLocalRollback(localCard.id, response.error);
        setError(response.error);
        return;
      }

      onLocalConfirm(localCard.id, toBoardCardFromCreated(response.data, currentUser));
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="quick-add-trigger"
        onClick={() => setOpen(true)}
      >
        {t.quickAdd.trigger}
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="quick-add-form animate-rise" autoComplete="off">
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="status" value={status} />

      <label className="quick-field">
        <span>
          {t.quickAdd.title} <em>*</em>
        </span>
        <input
          ref={titleRef}
          name="title"
          required
          minLength={2}
          maxLength={MAX_TITLE_LENGTH}
          placeholder={t.quickAdd.titlePlaceholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="quick-actions">
        <button
          type="button"
          className={
            urgent
              ? "sheet-icon-btn sheet-urgent is-on"
              : "sheet-icon-btn sheet-urgent"
          }
          onClick={() => setUrgent((current) => !current)}
          aria-pressed={urgent}
          aria-label={
            urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent
          }
          title={urgent ? t.cardPage.clearUrgent : t.cardPage.markUrgent}
        >
          <FireIcon size={18} />
        </button>
        <button className="button button-save" type="submit">
          {t.quickAdd.save}
        </button>
        <button
          type="button"
          className="button button-cancel"
          onClick={() => {
            setOpen(false);
            resetForm();
          }}
        >
          {t.quickAdd.cancel}
        </button>
      </div>
    </form>
  );
}
