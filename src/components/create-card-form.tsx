"use client";

import { useState, useTransition } from "react";
import { createCardAction } from "@/lib/actions";

type CreateCardFormProps = {
  boardId: string;
};

export function CreateCardForm({ boardId }: CreateCardFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  function onSubmit(formData: FormData): void {
    setError(null);
    formData.set("boardId", boardId);
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
        className="button button-ghost"
        onClick={() => setOpen(true)}
      >
        + Новая карточка
      </button>
    );
  }

  return (
    <form action={onSubmit} className="card-composer animate-rise">
      <input type="hidden" name="boardId" value={boardId} />
      <div className="type-toggle">
        <label>
          <input type="radio" name="type" value="question" defaultChecked />
          Вопрос
        </label>
        <label>
          <input type="radio" name="type" value="task" />
          Задача
        </label>
      </div>
      <input
        name="title"
        required
        minLength={2}
        maxLength={120}
        placeholder="Заголовок"
      />
      <textarea
        name="description"
        rows={3}
        maxLength={4000}
        placeholder="Описание (необязательно)"
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="composer-actions">
        <button className="button" type="submit" disabled={isPending}>
          {isPending ? "Сохраняем…" : "Создать"}
        </button>
        <button
          type="button"
          className="button button-ghost"
          onClick={() => setOpen(false)}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
