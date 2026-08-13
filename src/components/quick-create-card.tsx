"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import type { CardStatus, CardType } from "@prisma/client";
import { createCardAction } from "@/lib/actions";
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

function readCardType(value: FormDataEntryValue | null): CardType {
  return value === "task" ? "task" : "question";
}

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
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const titleRef = useRef<HTMLInputElement>(null);

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
      type: readCardType(formData.get("type")),
      title,
      description: String(formData.get("description") ?? "").trim(),
      urgent:
        formData.get("urgent") === "on" || formData.get("urgent") === "true",
      author: currentUser,
    });

    formData.set("boardId", boardId);
    formData.set("status", status);
    setError(null);
    onLocalCreate(localCard);
    form.reset();
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
          maxLength={120}
          placeholder={t.quickAdd.titlePlaceholder}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </label>

      <label className="quick-field">
        <span>{t.quickAdd.type}</span>
        <select name="type" defaultValue="question" autoComplete="off">
          <option value="question">{t.cardTypes.question}</option>
          <option value="task">{t.cardTypes.task}</option>
        </select>
      </label>

      <label className="quick-field">
        <span>{t.quickAdd.description}</span>
        <textarea
          name="description"
          rows={2}
          maxLength={4000}
          placeholder={t.quickAdd.descriptionPlaceholder}
          autoComplete="off"
        />
      </label>

      <label className="quick-check">
        <input type="checkbox" name="urgent" />
        <span>{t.quickAdd.urgent}</span>
      </label>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="quick-actions">
        <button className="button button-save" type="submit">
          {t.quickAdd.save}
        </button>
        <button
          type="button"
          className="button button-cancel"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t.quickAdd.cancel}
        </button>
      </div>
    </form>
  );
}
