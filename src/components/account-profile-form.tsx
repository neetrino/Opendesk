"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/lib/account-profile-actions";
import { useI18n } from "@/i18n/provider";

export function AccountProfileForm({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const response = await updateProfileAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="create-form">
      <h2 className="create-form-title">{t.accountPage.profileTitle}</h2>
      <label className="field">
        <span>{t.accountPage.nameLabel}</span>
        <input
          name="displayName"
          required
          minLength={1}
          maxLength={40}
          defaultValue={displayName}
          autoComplete="name"
        />
      </label>
      <div className="field">
        <span>{t.accountPage.emailLabel}</span>
        <p className="account-email">{email}</p>
        <p className="muted">{t.accountPage.emailHint}</p>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      {saved ? <p className="muted">{t.accountPage.saved}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.accountPage.saving : t.accountPage.save}
      </button>
    </form>
  );
}
