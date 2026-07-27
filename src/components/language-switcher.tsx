"use client";

import { useTransition } from "react";
import { setLocaleAction } from "@/i18n/actions";
import { localeLabels, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

export function LanguageSwitcher() {
  const { locale } = useI18n();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale): void {
    if (next === locale) {
      return;
    }
    startTransition(async () => {
      await setLocaleAction(next);
    });
  }

  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {locales.map((item) => (
        <button
          key={item}
          type="button"
          className={item === locale ? "lang-btn is-active" : "lang-btn"}
          disabled={isPending}
          onClick={() => onChange(item)}
        >
          {localeLabels[item]}
        </button>
      ))}
    </div>
  );
}
