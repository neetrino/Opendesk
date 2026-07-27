"use client";

import { useState, useTransition } from "react";
import { joinBoardByTokenAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type JoinBoardFormProps = {
  token: string;
};

export function JoinBoardForm({ token }: JoinBoardFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    formData.set("token", token);
    startTransition(async () => {
      try {
        await joinBoardByTokenAction(formData);
      } catch (err) {
        if (
          err &&
          typeof err === "object" &&
          "digest" in err &&
          typeof err.digest === "string" &&
          err.digest.startsWith("NEXT_REDIRECT")
        ) {
          return;
        }
        const message =
          err instanceof Error ? err.message : t.errors.joinFailed;
        setError(message);
      }
    });
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <input type="hidden" name="token" value={token} />
      <label className="field">
        <span>{t.joinPage.nameLabel}</span>
        <input
          name="displayName"
          required
          minLength={1}
          maxLength={40}
          placeholder={t.joinPage.namePlaceholder}
          autoFocus
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.joinPage.joining : t.joinPage.join}
      </button>
    </form>
  );
}
