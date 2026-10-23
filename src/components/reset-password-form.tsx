"use client";

import { useState, useTransition } from "react";
import { resetPasswordAction } from "@/lib/account-mail-actions";
import { useI18n } from "@/i18n/provider";

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await resetPasswordAction(formData);
      if (response && !response.ok) {
        setError(response.error);
      }
    });
  }

  return (
    <form action={onSubmit}>
      <input type="hidden" name="token" value={token} />
      <label className="field">
        <span>{t.resetPage.passwordLabel}</span>
        <input
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.resetPage.submitting : t.resetPage.submit}
      </button>
    </form>
  );
}
