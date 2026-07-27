export const locales = ["en", "ru", "hy"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
  en: "EN",
  ru: "RU",
  hy: "HY",
};

export const LOCALE_COOKIE = "opendesk_locale";
