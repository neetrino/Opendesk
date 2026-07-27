"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { addCommentAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type CommentFormProps = {
  boardId: string;
  cardId: string;
  onOptimisticSend: (body: string, tempId: string) => void;
  onOptimisticRollback: (tempId: string) => void;
};

export function CommentForm({
  boardId,
  cardId,
  onOptimisticSend,
  onOptimisticRollback,
}: CommentFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const body = textarea.value.trim();
    if (body.length === 0) {
      return;
    }

    const tempId = `optimistic-${crypto.randomUUID()}`;
    textarea.value = "";
    setError(null);

    const formData = new FormData();
    formData.set("boardId", boardId);
    formData.set("cardId", cardId);
    formData.set("body", body);

    startTransition(async () => {
      onOptimisticSend(body, tempId);
      const response = await addCommentAction(formData);
      if (!response.ok) {
        onOptimisticRollback(tempId);
        setError(response.error);
        textarea.value = body;
        textarea.focus();
      }
    });
  }

  return (
    <form
      id={`comment-form-${cardId}`}
      onSubmit={onSubmit}
      className="comment-form"
    >
      <textarea
        ref={textareaRef}
        name="body"
        required
        rows={2}
        maxLength={2000}
        placeholder={t.comment.placeholder}
        autoComplete="off"
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit">
        {t.comment.send}
      </button>
    </form>
  );
}
