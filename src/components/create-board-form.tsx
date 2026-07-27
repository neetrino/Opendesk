"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBoardAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

export function CreateBoardForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await createBoardAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      router.push(`/b/${response.data.boardId}`);
      router.refresh();
    });
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
