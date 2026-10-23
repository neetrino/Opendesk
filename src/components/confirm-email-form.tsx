"use client";

import { useState, useTransition } from "react";
import { confirmEmailAction } from "@/lib/account-mail-actions";
import { useI18n } from "@/i18n/provider";

export function ConfirmEmailForm({ token }: { token: string }) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    startTransition(async () => {
      const response = await confirmEmailAction(formData);
      if (response && !response.ok) {
        setError(response.error);
      }
    });
  }

  return (
    <form action={onSubmit}>
      <input type="hidden" name="token" value={token} />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.confirmEmailPage.submitting : t.confirmEmailPage.submit}
      </button>
    </form>
  );
}
