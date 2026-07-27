"use client";

import { useState, useTransition } from "react";
import { claimInviteAction } from "@/lib/actions";
import { useI18n } from "@/i18n/provider";

type ClaimInviteFormProps = {
  token: string;
};

export function ClaimInviteForm({ token }: ClaimInviteFormProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    formData.set("token", token);
    startTransition(async () => {
      try {
        await claimInviteAction(formData);
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
        <span>{t.invitePage.nameLabel}</span>
        <input
          name="displayName"
          required
          minLength={1}
          maxLength={40}
          placeholder={t.invitePage.namePlaceholder}
          autoFocus
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.invitePage.joining : t.invitePage.join}
      </button>
    </form>
  );
}
