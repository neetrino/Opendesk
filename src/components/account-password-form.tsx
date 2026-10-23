"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "@/lib/account-profile-actions";
import { useI18n } from "@/i18n/provider";

export function AccountPasswordForm() {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  function onSubmit(formData: FormData): void {
    setError(null);
    setChanged(false);
    startTransition(async () => {
      const response = await changePasswordAction(formData);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setChanged(true);
      setFormKey((key) => key + 1);
    });
  }

  return (
    <form key={formKey} action={onSubmit} className="create-form">
      <h2 className="create-form-title">{t.accountPage.passwordTitle}</h2>
      <label className="field">
        <span>{t.accountPage.currentLabel}</span>
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label className="field">
        <span>{t.accountPage.nextLabel}</span>
        <input
          name="nextPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      <label className="field">
        <span>{t.accountPage.confirmLabel}</span>
        <input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {changed ? <p className="muted">{t.accountPage.changed}</p> : null}
      <button className="button" type="submit" disabled={isPending}>
        {isPending ? t.accountPage.changing : t.accountPage.change}
      </button>
    </form>
  );
}
