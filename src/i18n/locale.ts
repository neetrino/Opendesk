import { cookies } from "next/headers";
import {
  defaultLocale,
  LOCALE_COOKIE,
  type Locale,
} from "@/i18n/config";
import { isLocale } from "@/i18n/get-dictionary";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  if (value && isLocale(value)) {
    return value;
  }
  return defaultLocale;
}
