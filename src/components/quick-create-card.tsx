"use client";

import { useState, useTransition } from "react";
import type { CardStatus } from "@prisma/client";
import { createCardAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type QuickCreateCardProps = {
  boardId: string;
  status: CardStatus;
};

export function QuickCreateCard({ boardId, status }: QuickCreateCardProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    formData.set("boardId", boardId);
    formData.set("status", status);
    startTransition(async () => {
      const response = await createCardAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setOpen(false);
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
    <form
      action={onSubmit}
      className="quick-add-form animate-rise"
      autoComplete="off"
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input type="hidden" name="status" value={status} />

      <label className="quick-field">
        <span>
          {t.quickAdd.title} <em>*</em>
        </span>
        <input
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
        <button className="button button-save" type="submit" disabled={isPending}>
          {isPending ? t.quickAdd.saving : t.quickAdd.save}
        </button>
        <button
          type="button"
          className="button button-cancel"
          onClick={() => setOpen(false)}
        >
          {t.quickAdd.cancel}
        </button>
      </div>
    </form>
  );
}
