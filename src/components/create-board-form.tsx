"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBoardAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type CreatedBoard = {
  boardId: string;
  joinToken: string;
};

export function CreateBoardForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [created, setCreated] = useState<CreatedBoard | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  function joinUrl(joinToken: string): string {
    return `${window.location.origin}/join/${joinToken}`;
  }

  async function copyJoinLink(joinToken: string): Promise<void> {
    const url = joinUrl(joinToken);
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage(t.board.copied);
      window.setTimeout(() => setCopyMessage(null), 2000);
    } catch {
      setCopyMessage(url);
    }
  }

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await createBoardAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setCreated(response.data);
      await copyJoinLink(response.data.joinToken);
    });
  }

  if (created) {
    const url = joinUrl(created.joinToken);
    return (
      <div className="create-form animate-rise">
        <p className="eyebrow">{t.boardForm.createdEyebrow}</p>
        <h2 className="save-link-title">{t.boardForm.createdTitle}</h2>
        <p className="muted save-link-lede">{t.boardForm.createdLede}</p>
        <label className="field">
          <span>{t.boardForm.linkLabel}</span>
          <input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            aria-label={t.boardForm.linkLabel}
          />
        </label>
        {copyMessage ? <p className="muted">{copyMessage}</p> : null}
        <div className="save-link-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() => {
              void copyJoinLink(created.joinToken);
            }}
          >
            {t.boardForm.copyLink}
          </button>
          <button
            type="button"
            className="button"
            onClick={() => {
              router.push(`/b/${created.boardId}`);
              router.refresh();
            }}
          >
            {t.boardForm.openBoard}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <label className="field">
        <span>{t.boardForm.title}</span>
        <input
          name="title"
          required
          minLength={2}
          maxLength={80}
          placeholder={t.boardForm.titlePlaceholder}
          defaultValue={t.boardForm.titleDefault}
        />
      </label>
      <label className="field">
        <span>{t.boardForm.yourName}</span>
        <input
          name="organizerName"
          required
          minLength={1}
          maxLength={40}
          placeholder={t.boardForm.namePlaceholder}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.boardForm.creating : t.boardForm.create}
      </button>
    </form>
  );
}
