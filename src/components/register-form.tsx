"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { registerAccountAction } from "@/lib/account-actions";
import { useI18n } from "@/i18n/provider";

export function RegisterForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await registerAccountAction(formData);
      if (response && !response.ok) {
        setError(response.error);
      }
    });
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <label className="field">
        <span>{t.registerPage.nameLabel}</span>
        <input
          name="displayName"
          required
          minLength={1}
          maxLength={40}
          autoComplete="name"
        />
      </label>
      <label className="field">
        <span>{t.registerPage.emailLabel}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </label>
      <label className="field">
        <span>{t.registerPage.passwordLabel}</span>
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
        {isPending ? t.registerPage.submitting : t.registerPage.submit}
      </button>
      <p className="muted">
        {t.registerPage.hasAccount}{" "}
        <Link href="/login">{t.registerPage.loginCta}</Link>
      </p>
    </form>
  );
}
