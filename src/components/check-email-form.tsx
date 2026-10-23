"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { resendVerificationAction } from "@/lib/account-mail-actions";
import { useI18n } from "@/i18n/provider";

export function CheckEmailForm({ email }: { email: string | null }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    setResent(false);
    const address = String(formData.get("email") ?? email ?? "");
    startTransition(async () => {
      const response = await resendVerificationAction(address);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResent(true);
    });
  }

  return (
    <form action={onSubmit}>
      {email ? (
        <input type="hidden" name="email" value={email} />
      ) : (
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
      )}
      {error ? <p className="form-error">{error}</p> : null}
      {resent ? <p className="muted">{t.checkEmailPage.resent}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.checkEmailPage.resending : t.checkEmailPage.resend}
      </button>
      <p className="muted">
        <Link href="/login">{t.checkEmailPage.back}</Link>
      </p>
    </form>
  );
}
