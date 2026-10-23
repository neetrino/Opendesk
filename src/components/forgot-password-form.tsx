"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/lib/account-mail-actions";
import { useI18n } from "@/i18n/provider";

export function ForgotPasswordForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await requestPasswordResetAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setSent(true);
    });
  }

  if (sent) {
    return (
      <>
        <h2 className="create-form-title">{t.forgotPage.sentTitle}</h2>
        <p className="muted">{t.forgotPage.sent}</p>
        <Link className="button" href="/login">
          {t.forgotPage.back}
        </Link>
      </>
    );
  }

  return (
    <form action={onSubmit}>
      <label className="field">
        <span>{t.forgotPage.emailLabel}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.forgotPage.submitting : t.forgotPage.submit}
      </button>
      <p className="muted">
        <Link href="/login">{t.forgotPage.back}</Link>
      </p>
    </form>
  );
}
