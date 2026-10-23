"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { loginAccountAction } from "@/lib/account-actions";
import { resendVerificationAction } from "@/lib/account-mail-actions";
import { useI18n } from "@/i18n/provider";

export function OwnerLoginForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    setResent(false);
    const email = String(formData.get("email") ?? "");
    startTransition(async () => {
      const response = await loginAccountAction(formData);
      if (response && !response.ok) {
        setUnverifiedEmail(response.code === "unverified" ? email : null);
        setError(response.error);
      }
    });
  }

  function onResend(): void {
    if (!unverifiedEmail) {
      return;
    }
    setResent(false);
    startTransition(async () => {
      const response = await resendVerificationAction(unverifiedEmail);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setError(null);
      setResent(true);
    });
  }

  return (
    <form action={onSubmit} className="create-form animate-rise">
      <label className="field">
        <span>{t.loginPage.loginLabel}</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={200}
        />
      </label>
      <label className="field">
        <span>{t.loginPage.passwordLabel}</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {resent ? <p className="muted">{t.loginPage.resent}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.loginPage.submitting : t.loginPage.submit}
      </button>
      {unverifiedEmail ? (
        <button
          className="button-secondary"
          type="button"
          disabled={isPending}
          onClick={onResend}
        >
          {isPending ? t.loginPage.resending : t.loginPage.resend}
        </button>
      ) : null}
      <p className="muted">
        <Link href="/forgot-password">{t.loginPage.forgot}</Link>
      </p>
      <p className="muted">
        {t.loginPage.noAccount}{" "}
        <Link href="/register">{t.loginPage.registerCta}</Link>
      </p>
    </form>
  );
}
