"use client";

import { useState, useTransition } from "react";
import { addCommentAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type CommentFormProps = {
  boardId: string;
  cardId: string;
};

export function CommentForm({ boardId, cardId }: CommentFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    startTransition(async () => {
      const response = await addCommentAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      const form = document.getElementById(
        `comment-form-${cardId}`,
      ) as HTMLFormElement | null;
      form?.reset();
    });
  }

  return (
    <form
      id={`comment-form-${cardId}`}
      action={onSubmit}
      className="comment-form"
    >
      <textarea
        name="body"
        required
        rows={3}
        maxLength={2000}
        placeholder={t.comment.placeholder}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.comment.sending : t.comment.send}
      </button>
    </form>
  );
}
