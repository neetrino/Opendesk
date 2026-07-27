import { defaultLocale, type Locale, locales } from "@/i18n/config";
import { en, type Dictionary } from "@/i18n/dictionary";
import { hy } from "@/i18n/hy";
import { ru } from "@/i18n/ru";

const dictionaries: Record<Locale, Dictionary> = {
  en,
  ru,
  hy,
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[defaultLocale];
}
