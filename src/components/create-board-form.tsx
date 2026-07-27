"use client";

import { useState, useTransition } from "react";
import { createBoardAction } from "@/lib/actions";

export function CreateBoardForm() {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    boardId: string;
    inviteTokens: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await createBoardAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult(response.data);
    });
  }

  if (result) {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";

    return (
      <section className="invite-panel animate-rise">
        <p className="eyebrow">Доска готова</p>
        <h2>Разошлите персональные ссылки</h2>
        <p className="muted">
          Каждая ссылка одноразовая. Участник вводит имя и попадает на доску.
        </p>
        <ul className="invite-list">
          {result.inviteTokens.map((token, index) => {
            const url = `${origin}/invite/${token}`;
            return (
              <li key={token}>
                <span className="invite-index">#{index + 1}</span>
                <code>{url}</code>
              </li>
            );
          })}
        </ul>
        <a className="button button-secondary" href={`/b/${result.boardId}`}>
          Открыть доску
        </a>
      </section>
    );
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <label className="field">
        <span>Название доски</span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={80}
          placeholder="Например: Спринт Q3"
          defaultValue="Обсуждения проекта"
        />
      </label>
      <label className="field">
        <span>Ваше имя</span>
        <input
          name="organizerName"
          required
          minLength={1}
          maxLength={40}
          placeholder="Как вас видят на доске"
        />
      </label>
      <label className="field">
        <span>Сколько invite-ссылок</span>
        <input
          name="inviteCount"
          type="number"
          min={1}
          max={20}
          defaultValue={5}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? "Создаём…" : "Создать доску"}
      </button>
    </form>
  );
}
