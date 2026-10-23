"use client";

import { useState, useTransition } from "react";
import { claimGuestAccountAction } from "@/lib/account-actions";
import { useI18n } from "@/i18n/provider";

export function SaveAccountForm() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await claimGuestAccountAction(formData);
      if (response && !response.ok) {
        setError(response.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        className="button"
        onClick={() => setOpen(true)}
      >
        {t.board.saveAccount}
      </button>
    );
  }

  return (
    <form action={onSubmit} className="save-account-form">
      <p className="muted">{t.board.saveAccountHint}</p>
      <label className="field">
        <span>{t.joinPage.emailLabel}</span>
        <input name="email" type="email" required maxLength={200} autoComplete="email" />
      </label>
      <label className="field">
        <span>{t.joinPage.passwordLabel}</span>
        <input
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={128}
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.board.saveAccountSubmitting : t.board.saveAccountSubmit}
      </button>
    </form>
  );
}
