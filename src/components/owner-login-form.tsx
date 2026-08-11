"use client";

import { useState, useTransition } from "react";
import { ownerLoginAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

export function OwnerLoginForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await ownerLoginAction(formData);
      if (response && !response.ok) {
        setError(response.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <label className="field">
        <span>{t.loginPage.loginLabel}</span>
        <input
          name="login"
          type="text"
          autoComplete="username"
          required
          maxLength={120}
        />
      </label>
      <label className="field">
        <span>{t.loginPage.passwordLabel}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.loginPage.submitting : t.loginPage.submit}
      </button>
    </form>
  );
}
